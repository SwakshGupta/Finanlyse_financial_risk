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
  'nonDebtRecurringObligations',
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

    // 5. Construct baseline feature vector (Feature Set V2)
    const baselineFeatures = {
      monthlyIncome: baselineSummary.monthlyIncome || 0,
      monthlyExpenses: baselineSummary.monthlyExpenses || 0,
      monthlyEmi: baselineSummary.monthlyEmi || 0,
      averageBalance: baselineSummary.averageBalance || 0,
      savingsBalance: baselineSummary.savingsBalance || 0,
      cashFlowSurplus: baselineSummary.cashFlowSurplus || 0,
      debtToIncome: baselineSummary.debtToIncome || 0,
      savingsRate: baselineSummary.savingsRate || 0,
      minimumBalanceRatio: baselineSummary.minimumBalanceRatio ?? 0.20,
      incomeStability: baselineSummary.incomeStability ?? 0.85,
      expenseVolatility: baselineSummary.expenseVolatility ?? 0.15,
      transactionRegularity: baselineSummary.transactionRegularity ?? 0.88,
      negativeCashflowMonths: baselineSummary.negativeCashflowMonths ?? 0,
      incomeTrend3m: baselineSummary.incomeTrend3m ?? 0.02,
      utilityPaymentConsistency: baselineSummary.utilityPaymentConsistency ?? 0.90,
      digitalTransactionRatio: baselineSummary.digitalTransactionRatio ?? 0.85,
      failedPaymentCount: baselineSummary.failedPaymentCount || 0,
      nonDebtRecurringObligations: baselineSummary.nonDebtRecurringObligations || 4000,
      recurringObligationAmount: baselineSummary.nonDebtRecurringObligations || 4000,
      existingDebtAmount: baselineSummary.existingDebtAmount || 0,
      observationMonths: baselineSummary.observationMonths || 24,
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

    // Recalculate minimum balance ratio dynamically if average balance or income changed
    if (income > 0) {
      const estimatedMinBal = scenarioFeatures.averageBalance * 0.40;
      scenarioFeatures.minimumBalanceRatio = parseFloat((estimatedMinBal / income).toFixed(4));
    }

    // Recalculate negative cash-flow months: if surplus improves to positive, negative months drop
    if (scenarioFeatures.cashFlowSurplus >= 0 && baselineFeatures.cashFlowSurplus < 0) {
      scenarioFeatures.negativeCashflowMonths = Math.max(0, baselineFeatures.negativeCashflowMonths - 1);
    } else if (scenarioFeatures.cashFlowSurplus < 0 && baselineFeatures.cashFlowSurplus >= 0) {
      scenarioFeatures.negativeCashflowMonths = baselineFeatures.negativeCashflowMonths + 1;
    }

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
      dataCoverage: {
        financialDataAvailable: true,
        bureauDataAvailable: false,
        observationMonths: baselineSummary.observationMonths || 24,
        isScenarioSimulation: true,
        scenarioId,
      },
      explanationStatus: 'NOT_GENERATED',
      assessmentType: 'SCENARIO',
    });

    // 10. Generate Grounded AI What-If Narrative via LLMFactory
    let scenarioNarrative = '';
    const scoreDelta = scenarioMLResult.riskScore - baselineAssessment.score;
    const deltaSign = scoreDelta > 0 ? '+' : '';

    try {
      const provider = LLMFactory.getProvider();
      const prompt = `You are a financial credit risk underwriting engine.
Explain the impact of the following counterfactual what-if scenario for loan application ${applicationId}:
- Baseline Risk Score: ${baselineAssessment.score} (${baselineAssessment.risk_band} risk, default probability: ${(Number(baselineAssessment.default_probability) * 100).toFixed(1)}%)
- Projected Risk Score: ${scenarioMLResult.riskScore} (${scenarioMLResult.riskBand} risk, default probability: ${(scenarioMLResult.defaultProbability * 100).toFixed(1)}%)
- Score Delta: ${deltaSign}${scoreDelta} points
- Primary Changes Applied:
${changedFactors.map((c) => `  * ${c.feature}: from ${c.before} to ${c.after}`).join('\n')}

Provide a concise 2-3 sentence grounded explanation of why the score shifted and the financial stability implication. Do not hallucinate external factors.`;

      const response = await provider.generateText(prompt);
      scenarioNarrative = response.text || '';
    } catch {
      // Deterministic fallback
      if (scoreDelta > 0) {
        scenarioNarrative = `Adjusting your financial profile improves your projected score by +${scoreDelta} points (to ${scenarioMLResult.riskScore}/100) by expanding your disposable cash-flow buffer and lowering credit strain.`;
      } else if (scoreDelta < 0) {
        scenarioNarrative = `This scenario lowers the projected score by ${scoreDelta} points (to ${scenarioMLResult.riskScore}/100) due to higher financial obligations relative to available cash reserves.`;
      } else {
        scenarioNarrative = `The simulated adjustments maintain your baseline score at ${scenarioMLResult.riskScore}/100, leaving your overall risk tier in the ${scenarioMLResult.riskBand} band.`;
      }
    }

    return {
      scenarioId,
      applicationId,
      baseline: {
        riskScore: baselineAssessment.score,
        defaultProbability: parseFloat(baselineAssessment.default_probability),
        riskBand: baselineAssessment.risk_band,
      },
      scenario: {
        riskScore: scenarioMLResult.riskScore,
        defaultProbability: scenarioMLResult.defaultProbability,
        riskBand: scenarioMLResult.riskBand,
        factors: scenarioMLResult.factors,
      },
      baselineScore: baselineAssessment.score,
      projectedScore: scenarioMLResult.riskScore,
      scoreDelta,
      baselineRiskBand: baselineAssessment.risk_band,
      projectedRiskBand: scenarioMLResult.riskBand,
      baselineDefaultProbability: parseFloat(baselineAssessment.default_probability),
      projectedDefaultProbability: scenarioMLResult.defaultProbability,
      changedFactors,
      projectedFactors: scenarioMLResult.factors,
      explanation: scenarioNarrative,
      scenarioNarrative,
      simulatedAt: new Date().toISOString(),
    };
  }
}

module.exports = new WhatIfService();
