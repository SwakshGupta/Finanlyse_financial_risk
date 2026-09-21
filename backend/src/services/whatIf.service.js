const { v4: uuidv4 } = require('uuid');
const applicationRepository = require('../repositories/application.repository');
const assessmentRepository = require('../repositories/assessment.repository');
const financialRepository = require('../repositories/financial.repository');
const mlClient = require('../integrations/ml/mlClient');
const LLMFactory = require('../integrations/llm/llm.factory');
const { deriveFinancialSummary } = require('../modules/financial/canonical.schema');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} = require('../utils/errors');

const ALLOWED_OVERRIDE_FIELDS = new Set([
  'monthlyIncome',
  'monthlyExpenses',
  'monthlyEmi',
  'averageBalance',
  'incomeVolatility',
  'expenseVolatility',
  'transactionRegularity',
  'failedPaymentCount',
]);

class WhatIfService {
  /**
   * Run a what-if counterfactual scenario against an application's baseline assessment
   */
  async runWhatIf(applicationId, user, { overrides = {} }) {
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      throw new ValidationError('overrides must be an object');
    }

    // 1. Strict validation of override fields
    const unknownFields = Object.keys(overrides).filter((k) => !ALLOWED_OVERRIDE_FIELDS.has(k));
    if (unknownFields.length > 0) {
      throw new ValidationError(`Unknown override field(s): ${unknownFields.join(', ')}. Unknown fields are rejected.`);
    }

    // Validate non-negative numbers
    for (const [key, val] of Object.entries(overrides)) {
      if (typeof val !== 'number' || isNaN(val)) {
        throw new ValidationError(`Override '${key}' must be a valid number`);
      }
      if (key !== 'averageBalance' && val < 0) {
        throw new ValidationError(`Override '${key}' cannot be negative`);
      }
      if (key === 'transactionRegularity' && (val < 0 || val > 1)) {
        throw new ValidationError('transactionRegularity must be between 0 and 1');
      }
      if (key === 'failedPaymentCount' && !Number.isInteger(val)) {
        throw new ValidationError('failedPaymentCount must be an integer');
      }
    }

    // 2. Lookup application and authorize
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError(`Application '${applicationId}' not found`);
    }

    if (user.role === 'APPLICANT' && app.userId !== user.id) {
      throw new ForbiddenError('Unauthorized to run scenario analysis on this application');
    }

    // 3. Retrieve baseline assessment
    const baselineAssessment = await assessmentRepository.getLatestByApplicationId(applicationId);
    if (!baselineAssessment) {
      throw new ValidationError(`Cannot run what-if analysis on unassessed application '${applicationId}'. Please run risk assessment first.`);
    }

    // 4. Retrieve baseline financial metrics
    const finProfile = await financialRepository.getFinancialProfile(applicationId);
    const transactions = await financialRepository.getTransactions(applicationId);
    const baselineSummary = finProfile ? deriveFinancialSummary(finProfile, transactions) : {};

    // 5. Construct baseline feature vector
    const baselineFeatures = {
      monthlyIncome: baselineSummary.monthlyIncome || 0,
      monthlyExpenses: baselineSummary.monthlyExpenses || 0,
      monthlyEmi: baselineSummary.monthlyEmi || 0,
      averageBalance: baselineSummary.averageBalance || 0,
      savingsBalance: baselineSummary.savingsBalance || 0,
      cashFlowSurplus: baselineSummary.cashFlowSurplus || 0,
      debtToIncome: baselineSummary.debtToIncome || 0,
      savingsRate: baselineSummary.savingsRate || 0,
      incomeStability: baselineSummary.incomeStability ?? 0.8,
      expenseVolatility: baselineSummary.expenseVolatility ?? 0.2,
      transactionRegularity: baselineSummary.transactionRegularity ?? 0.85,
      failedPaymentCount: baselineSummary.failedPaymentCount || 0,
      recurringObligationAmount: baselineSummary.monthlyEmi || 0,
      observationMonths: 6,
      bureauHistoryAvailable: false,
      creditHistoryLengthMonths: 0,
    };

    // 6. Apply overrides and recalculate dependent financial ratios
    const scenarioFeatures = { ...baselineFeatures, ...overrides };

    const income = scenarioFeatures.monthlyIncome;
    const expenses = scenarioFeatures.monthlyExpenses;
    const emi = scenarioFeatures.monthlyEmi;

    scenarioFeatures.cashFlowSurplus = income - expenses - emi;
    scenarioFeatures.debtToIncome = income > 0 ? parseFloat((emi / income).toFixed(4)) : 0;
    scenarioFeatures.savingsRate = income > 0 ? parseFloat((Math.max(0, scenarioFeatures.cashFlowSurplus) / income).toFixed(4)) : 0;
    scenarioFeatures.recurringObligationAmount = emi;

    // 7. Track changed factors
    const changedFactors = [];
    for (const [key, newVal] of Object.entries(overrides)) {
      const beforeVal = baselineFeatures[key];
      if (beforeVal !== undefined && beforeVal !== newVal) {
        changedFactors.push({
          feature: key,
          before: parseFloat(Number(beforeVal).toFixed(2)),
          after: parseFloat(Number(newVal).toFixed(2)),
        });
      }
    }

    // Add dependent changes if modified
    if (scenarioFeatures.cashFlowSurplus !== baselineFeatures.cashFlowSurplus) {
      changedFactors.push({
        feature: 'cashFlowSurplus',
        before: parseFloat(Number(baselineFeatures.cashFlowSurplus).toFixed(2)),
        after: parseFloat(Number(scenarioFeatures.cashFlowSurplus).toFixed(2)),
      });
    }
    if (scenarioFeatures.debtToIncome !== baselineFeatures.debtToIncome) {
      changedFactors.push({
        feature: 'debtToIncome',
        before: parseFloat(Number(baselineFeatures.debtToIncome).toFixed(4)),
        after: parseFloat(Number(scenarioFeatures.debtToIncome).toFixed(4)),
      });
    }

    // 8. Execute ML microservice re-inference
    const scenarioMLResult = await mlClient.predictRisk({
      applicationId,
      features: scenarioFeatures,
    });

    const scenarioId = `scn_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    // 9. Save scenario assessment to database with assessment_type = 'SCENARIO' (Baseline remains intact!)
    await assessmentRepository.saveAssessment({
      applicationId,
      score: scenarioMLResult.riskScore,
      defaultProbability: scenarioMLResult.defaultProbability,
      riskBand: scenarioMLResult.riskBand,
      modelMetadata: scenarioMLResult.model,
      factors: scenarioMLResult.factors,
      dataCoverage: baselineAssessment.data_coverage || { observationMonths: 6 },
      explanationStatus: 'GENERATED',
      assessmentType: 'SCENARIO',
    });

    // 10. Generate grounded comparative explanation
    const baselineScore = baselineAssessment.score ?? baselineAssessment.riskScore;
    const baselineProb = parseFloat(baselineAssessment.default_probability ?? baselineAssessment.defaultProbability);
    const scenarioScore = scenarioMLResult.riskScore;
    const scenarioProb = scenarioMLResult.defaultProbability;
    const scoreDiff = scenarioScore - baselineScore;
    const probDiffPercent = ((scenarioProb - baselineProb) * 100).toFixed(1);

    const explanation = this._generateScenarioExplanation({
      baselineScore,
      scenarioScore,
      scoreDiff,
      probDiffPercent,
      changedFactors,
      scenarioRiskBand: scenarioMLResult.riskBand,
    });

    return {
      scenarioId,
      baseline: {
        riskScore: baselineScore,
        defaultProbability: baselineProb,
        riskBand: baselineAssessment.risk_band ?? baselineAssessment.riskBand,
      },
      scenario: {
        riskScore: scenarioScore,
        defaultProbability: scenarioProb,
        riskBand: scenarioMLResult.riskBand,
      },
      changedFactors,
      explanation,
    };
  }

  _generateScenarioExplanation({ baselineScore, scenarioScore, scoreDiff, probDiffPercent, changedFactors, scenarioRiskBand }) {
    const direction = scoreDiff > 0 ? 'improved' : scoreDiff < 0 ? 'weakened' : 'remained unchanged';
    const sign = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;

    let narrative = `Under this simulated scenario, the Alternative Risk Score ${direction} from **${baselineScore}** to **${scenarioScore}/100** (${sign} points, ${scenarioRiskBand} Risk), with estimated default probability shifting by **${probDiffPercent}%**.`;

    const changes = changedFactors.map((c) => {
      let unit = '';
      if (c.feature.toLowerCase().includes('income') || c.feature.toLowerCase().includes('surplus') || c.feature.toLowerCase().includes('emi') || c.feature.toLowerCase().includes('balance')) {
        unit = '₹';
      }
      return `**${c.feature}** changed from ${unit}${c.before} to ${unit}${c.after}`;
    });

    if (changes.length > 0) {
      narrative += ` Key drivers: ${changes.join(', ')}.`;
    }

    if (scoreDiff > 0) {
      narrative += ' The reduction in debt commitments or expansion in disposable cash surplus meaningfully strengthens repayment resilience.';
    } else if (scoreDiff < 0) {
      narrative += ' The higher debt burden or reduced cash surplus compresses the liquidity buffer, elevating default vulnerability.';
    } else {
      narrative += ' The adjustments produced negligible variation in model feature weights.';
    }

    return narrative;
  }
}

module.exports = new WhatIfService();
