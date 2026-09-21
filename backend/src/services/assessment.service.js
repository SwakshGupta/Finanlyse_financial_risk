const applicationRepository = require('../repositories/application.repository');
const financialRepository = require('../repositories/financial.repository');
const assessmentRepository = require('../repositories/assessment.repository');
const mlClient = require('../integrations/ml/mlClient');
const { deriveFinancialSummary } = require('../modules/financial/canonical.schema');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} = require('../utils/errors');

class AssessmentService {
  /**
   * Run automated risk assessment for an application
   */
  async assessApplication(applicationId, user, options = {}) {
    // 1. Verify application exists and authorize user
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError(`Application '${applicationId}' not found`);
    }

    if (user.role === 'APPLICANT' && app.userId !== user.id) {
      throw new ForbiddenError('Unauthorized to assess this application');
    }

    // 2. Fetch financial profile and transactions
    const finProfile = await financialRepository.getFinancialProfile(applicationId);
    if (!finProfile) {
      throw new ValidationError(
        'Cannot assess application without financial profile. Please submit financial data or synthetic profile first.'
      );
    }

    const transactions = await financialRepository.getTransactions(applicationId);

    // 3. Derive canonical summary metrics
    const summary = deriveFinancialSummary(finProfile, transactions);

    // 4. Build feature vector for ML microservice
    const features = {
      monthlyIncome: summary.monthlyIncome,
      monthlyExpenses: summary.monthlyExpenses,
      monthlyEmi: summary.monthlyEmi,
      averageBalance: summary.averageBalance,
      savingsBalance: summary.savingsBalance,
      cashFlowSurplus: summary.cashFlowSurplus,
      debtToIncome: summary.debtToIncome,
      savingsRate: summary.savingsRate,
      incomeStability: summary.incomeStability,
      expenseVolatility: summary.expenseVolatility,
      transactionRegularity: summary.transactionRegularity,
      failedPaymentCount: summary.failedPaymentCount,
      recurringObligationAmount: summary.monthlyEmi,
      observationMonths: 6,
      bureauHistoryAvailable: false,
      creditHistoryLengthMonths: 0,
    };

    // 5. Invoke Python ML Inference microservice
    const mlResult = await mlClient.predictRisk({
      applicationId,
      features,
    });

    const dataCoverage = {
      financialDataAvailable: true,
      bureauDataAvailable: false,
      observationMonths: 6,
      dataSources: app.dataSources || ['MANUAL_INPUT'],
    };

    // 6. Persist assessment and factors in relational DB
    const saved = await assessmentRepository.saveAssessment({
      applicationId,
      score: mlResult.riskScore,
      defaultProbability: mlResult.defaultProbability,
      riskBand: mlResult.riskBand,
      modelMetadata: mlResult.model,
      factors: mlResult.factors,
      dataCoverage,
      explanationStatus: 'NOT_GENERATED',
      assessmentType: options.assessmentType || 'BASELINE',
    });

    // 7. Update application status to ASSESSED
    await applicationRepository.update(applicationId, { status: 'ASSESSED' });

    // 8. Generate initial explanation if requested
    let explanationStatus = 'NOT_GENERATED';
    if (options.regenerateExplanation) {
      try {
        const explanationService = require('./explanation.service');
        await explanationService.generateExplanation(applicationId, user, {
          forceRegenerate: true,
        });
        explanationStatus = 'GENERATED';
      } catch (err) {
        console.warn('[AssessmentService] Could not generate explanation:', err.message);
      }
    }

    // 9. Return formatted response conforming to OpenAPI RiskAssessmentResponse
    return {
      assessmentId: saved.id,
      applicationId,
      riskScore: mlResult.riskScore,
      defaultProbability: mlResult.defaultProbability,
      riskBand: mlResult.riskBand,
      model: mlResult.model,
      factors: mlResult.factors,
      dataCoverage,
      explanationStatus,
      assessedAt: saved.created_at,
    };
  }

  /**
   * Retrieve the latest risk assessment for an application
   */
  async getAssessment(applicationId, user) {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError(`Application '${applicationId}' not found`);
    }

    if (user.role === 'APPLICANT' && app.userId !== user.id) {
      throw new ForbiddenError('Unauthorized to view this application assessment');
    }

    const assessment = await assessmentRepository.getLatestByApplicationId(applicationId);
    if (!assessment) {
      throw new NotFoundError(`No risk assessment found for application '${applicationId}'`);
    }

    // Parse dataCoverage and raw_factors if stored as JSON/string
    let coverage = assessment.data_coverage;
    if (typeof coverage === 'string') {
      try { coverage = JSON.parse(coverage); } catch { coverage = {}; }
    }
    if (!coverage || Object.keys(coverage).length === 0) {
      coverage = {
        financialDataAvailable: true,
        bureauDataAvailable: false,
        observationMonths: 6,
        dataSources: app.dataSources || ['MANUAL_INPUT'],
      };
    }

    let factors = assessment.factors;
    if ((!factors || (!factors.positive?.length && !factors.negative?.length)) && assessment.raw_factors) {
      factors = typeof assessment.raw_factors === 'string' ? JSON.parse(assessment.raw_factors) : assessment.raw_factors;
    }

    return {
      assessmentId: assessment.id,
      applicationId: assessment.application_id,
      riskScore: assessment.score,
      defaultProbability: parseFloat(assessment.default_probability),
      riskBand: assessment.risk_band,
      model: {
        name: assessment.model_name || 'Logistic Regression Alternative Risk Baseline',
        version: assessment.model_version || 'logistic_regression_v1.0.0',
        featureSetVersion: assessment.feature_set_version || 'feature_set_v1',
        algorithm: assessment.algorithm || 'LOGISTIC_REGRESSION',
        trainingDataType: 'SYNTHETIC',
      },
      factors: factors || { positive: [], negative: [] },
      dataCoverage: coverage,
      explanationStatus: assessment.explanation_status || 'NOT_GENERATED',
      assessedAt: assessment.created_at,
    };
  }
}

module.exports = new AssessmentService();
