const applicationRepository = require('../repositories/application.repository');
const assessmentRepository = require('../repositories/assessment.repository');
const financialRepository = require('../repositories/financial.repository');
const explanationRepository = require('../repositories/explanation.repository');
const LLMFactory = require('../integrations/llm/llm.factory');
const { PROMPT_VERSION, SYSTEM_INSTRUCTION, buildUserPrompt } = require('../integrations/llm/prompts/risk-explanation-v1');
const { GEMINI_EXPLANATION_SCHEMA, validateExplanation } = require('../integrations/llm/schemas/explanation.schema');
const { generateFallbackExplanation } = require('../integrations/llm/fallback.generator');
const { deriveFinancialSummary } = require('../modules/financial/canonical.schema');
const { TOOL_DECLARATIONS, executeTool } = require('../integrations/llm/tools/catalog.tools');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} = require('../utils/errors');

class ExplanationService {
  /**
   * Get the latest explanation for an application
   */
  async getExplanation(applicationId, user) {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError(`Application '${applicationId}' not found`);
    }

    if (user.role === 'APPLICANT' && app.userId !== user.id) {
      throw new ForbiddenError('Unauthorized to access explanations for this application');
    }

    const existing = await explanationRepository.findLatestByApplicationId(applicationId);
    if (!existing) {
      // Check if an assessment exists, if so generate on demand
      const assessment = await assessmentRepository.getLatestByApplicationId(applicationId);
      if (assessment) {
        return this.generateExplanation(applicationId, user);
      }
      throw new NotFoundError(`No explanation found for application '${applicationId}'`);
    }

    return this._formatResponse(existing);
  }

  /**
   * Generate or regenerate an explanation
   */
  async generateExplanation(applicationId, user, options = {}) {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError(`Application '${applicationId}' not found`);
    }

    if (user.role === 'APPLICANT' && app.userId !== user.id) {
      throw new ForbiddenError('Unauthorized to generate explanations for this application');
    }

    const assessment = await assessmentRepository.getLatestByApplicationId(applicationId);
    if (!assessment) {
      throw new ValidationError(`Cannot generate explanation for unassessed application '${applicationId}'. Run assessment first.`);
    }

    // If not forceRegenerate, check if explanation already exists
    if (!options.forceRegenerate) {
      const existing = await explanationRepository.findByAssessmentId(assessment.id);
      if (existing) {
        return this._formatResponse(existing);
      }
    }

    // 1. Gather context data
    const finProfile = await financialRepository.getFinancialProfile(applicationId);
    const transactions = await financialRepository.getTransactions(applicationId);
    const summary = finProfile ? deriveFinancialSummary(finProfile, transactions) : {};

    let factors = assessment.factors;
    if ((!factors || (!factors.positive?.length && !factors.negative?.length)) && assessment.raw_factors) {
      factors = typeof assessment.raw_factors === 'string' ? JSON.parse(assessment.raw_factors) : assessment.raw_factors;
    }

    let dataCoverage = assessment.data_coverage;
    if (typeof dataCoverage === 'string') {
      try { dataCoverage = JSON.parse(dataCoverage); } catch { dataCoverage = {}; }
    }

    // 2. Select LLM provider
    const provider = LLMFactory.getProvider({
      provider: options.provider,
      model: options.model,
    });

    const userPrompt = buildUserPrompt({
      assessment,
      summary,
      factors,
      dataCoverage,
    });

    let explanationData = null;
    let fallbackUsed = false;
    let fallbackReason = null;

    // 3. Invoke LLM Provider with graceful fallback
    try {
      if (provider.providerName === 'gemini') {
        const result = await provider.generateStructured({
          prompt: userPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          schema: GEMINI_EXPLANATION_SCHEMA,
          temperature: 0.2,
        });
        explanationData = result.data;
      } else {
        // MockProvider or test mode
        const result = await provider.generateWithTools({
          prompt: userPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: TOOL_DECLARATIONS,
          toolExecutor: executeTool,
        });
        explanationData = result.data;
      }

      // Re-validate schema adherence
      const val = validateExplanation(explanationData);
      if (!val.valid) {
        throw new Error(`Schema validation failed: ${val.errors.join(', ')}`);
      }
    } catch (err) {
      console.warn(`[ExplanationService] LLM Provider (${provider.providerName}) failed: ${err.message}. Engaging deterministic fallback.`);
      fallbackUsed = true;
      fallbackReason = err.message;
      explanationData = generateFallbackExplanation({
        assessment,
        summary,
        factors,
        dataCoverage,
        reason: err.message,
      });
    }

    // Ensure fallbackUsed is correctly recorded
    if (fallbackUsed) {
      explanationData.fallbackUsed = true;
      explanationData.fallbackReason = fallbackReason;
    } else {
      explanationData.fallbackUsed = false;
    }

    // 4. Persist to PostgreSQL llm_explanations table
    const saved = await explanationRepository.create({
      assessmentId: assessment.id,
      provider: fallbackUsed ? 'fallback' : provider.providerName,
      model: fallbackUsed ? 'deterministic-fallback-v1' : provider.modelName,
      promptVersion: PROMPT_VERSION,
      summary: explanationData.summary,
      fullExplanation: explanationData,
    });

    return this._formatResponse(saved);
  }

  /**
   * Format database record to OpenAPI ExplanationResponse specification
   */
  _formatResponse(record) {
    const full = record.fullExplanation || {};
    return {
      assessmentId: record.assessmentId,
      provider: record.provider,
      model: record.model,
      promptVersion: record.promptVersion,
      summary: record.summary,
      positiveFactors: full.positiveFactors || [],
      riskFactors: full.riskFactors || [],
      dataLimitations: full.dataLimitations || [],
      scenarioComparison: full.scenarioComparison || null,
      disclaimer: full.disclaimer || 'This explanation interprets model outputs and alternative data; it is not a lending decision.',
      generatedAt: record.createdAt,
      fallbackUsed: full.fallbackUsed || false,
    };
  }
}

module.exports = new ExplanationService();
