/**
 * Explanation JSON Schema & Validation
 * Conforms to OpenAPI ExplanationResponse specification
 */

const GEMINI_EXPLANATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'Executive narrative summary of the alternative credit assessment and default risk.',
    },
    positiveFactors: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Key positive financial behaviors mitigating credit risk.',
    },
    riskFactors: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Primary risk drivers or financial vulnerabilities.',
    },
    dataLimitations: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Limitations of observation window and alternative data sources.',
    },
    scenarioComparison: {
      type: 'STRING',
      description: 'Optional comparison against baseline if assessing a scenario.',
    },
    disclaimer: {
      type: 'STRING',
      description: 'Regulatory fair lending and non-binding model interpretation disclaimer.',
    },
  },
  required: ['summary', 'positiveFactors', 'riskFactors', 'dataLimitations', 'disclaimer'],
};

/**
 * Validate that an object strictly conforms to the Explanation schema
 * @param {any} obj
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateExplanation(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valid: false, errors: ['Explanation output must be a non-null object'] };
  }

  if (typeof obj.summary !== 'string' || !obj.summary.trim()) {
    errors.push('Missing or invalid "summary" string');
  }

  if (!Array.isArray(obj.positiveFactors) || obj.positiveFactors.some((s) => typeof s !== 'string')) {
    errors.push('"positiveFactors" must be an array of strings');
  }

  if (!Array.isArray(obj.riskFactors) || obj.riskFactors.some((s) => typeof s !== 'string')) {
    errors.push('"riskFactors" must be an array of strings');
  }

  if (!Array.isArray(obj.dataLimitations) || obj.dataLimitations.some((s) => typeof s !== 'string')) {
    errors.push('"dataLimitations" must be an array of strings');
  }

  if (typeof obj.disclaimer !== 'string' || !obj.disclaimer.trim()) {
    errors.push('Missing or invalid "disclaimer" string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to safely extract JSON from LLM text responses, handling potential markdown code blocks
 */
function extractJsonFromText(rawText) {
  if (typeof rawText !== 'string') {
    return null;
  }

  let cleaned = rawText.trim();
  // Strip ```json ... ``` code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
}

module.exports = {
  GEMINI_EXPLANATION_SCHEMA,
  validateExplanation,
  extractJsonFromText,
};
