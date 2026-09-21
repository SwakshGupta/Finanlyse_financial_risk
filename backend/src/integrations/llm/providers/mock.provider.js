const LLMProvider = require('../provider.interface');
const { generateFallbackExplanation } = require('../fallback.generator');
const { validateExplanation } = require('../schemas/explanation.schema');

class MockProvider extends LLMProvider {
  constructor(config = {}) {
    super();
    this.modelName = config.model || 'mock-explainability-v1';
    this.providerName = 'mock';
  }

  async generateText({ prompt }) {
    return {
      text: `Mock explanation for prompt: ${prompt ? prompt.slice(0, 50) : ''}...`,
      raw: { provider: this.providerName, model: this.modelName },
    };
  }

  async generateStructured({ prompt, systemInstruction, schema }) {
    // Attempt to extract assessment context from prompt if formatted as JSON
    let assessment = { score: 72, riskBand: 'MODERATE', defaultProbability: 0.16 };
    let summary = { cashFlowSurplus: 14500, debtToIncome: 0.28, savingsRate: 0.22, averageBalance: 24000 };
    let factors = { positive: [], negative: [] };
    let dataCoverage = { observationMonths: 6 };

    try {
      const jsonMatch = prompt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.authoritativeRiskResult) {
          assessment = parsed.authoritativeRiskResult;
        }
        if (parsed.financialMetrics) {
          summary = parsed.financialMetrics;
        }
        if (parsed.topPositiveModelDrivers) {
          factors.positive = parsed.topPositiveModelDrivers;
        }
        if (parsed.topNegativeModelDrivers) {
          factors.negative = parsed.topNegativeModelDrivers;
        }
        if (parsed.dataCoverage) {
          dataCoverage = parsed.dataCoverage;
        }
      }
    } catch {
      // Use standard default mock values
    }

    const explanation = generateFallbackExplanation({
      assessment,
      summary,
      factors,
      dataCoverage,
      reason: 'Generated via MockProvider offline test mode',
    });

    // Mark provider
    explanation.fallbackUsed = false; // Intentionally false when mock is chosen explicitly

    const validation = validateExplanation(explanation);
    if (!validation.valid) {
      throw new Error(`MockProvider generated invalid explanation: ${validation.errors.join(', ')}`);
    }

    return {
      data: explanation,
      raw: { provider: this.providerName, model: this.modelName },
    };
  }

  async generateWithTools({ prompt, systemInstruction, tools, toolExecutor }) {
    // In mock mode, if tools are provided, optionally call one tool to test tool flow
    const toolCalls = [];
    if (tools && tools.length > 0 && typeof toolExecutor === 'function') {
      try {
        const res = toolExecutor('getRiskMethodology', {});
        toolCalls.push({ name: 'getRiskMethodology', args: {}, result: res });
      } catch {}
    }

    const structured = await this.generateStructured({ prompt, systemInstruction });
    return {
      data: structured.data,
      toolCalls,
      raw: { provider: this.providerName, model: this.modelName },
    };
  }
}

module.exports = MockProvider;
