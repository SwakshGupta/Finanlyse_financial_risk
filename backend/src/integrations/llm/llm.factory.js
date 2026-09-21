const MockProvider = require('./providers/mock.provider');
const GeminiProvider = require('./providers/gemini.provider');

class LLMFactory {
  /**
   * Get an initialized LLM Provider instance based on configuration or overrides
   * @param {Object} [options]
   * @param {string} [options.provider] - 'gemini' | 'mock'
   * @param {string} [options.model] - Model name override
   * @param {string} [options.apiKey] - API key override
   * @returns {import('./provider.interface')}
   */
  static getProvider(options = {}) {
    const configuredProvider = options.provider || process.env.LLM_PROVIDER || 'gemini';
    const model = options.model || process.env.LLM_MODEL || 'gemini-3.1-flash-lite';
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

    if (configuredProvider.toLowerCase() === 'mock') {
      return new MockProvider({ model });
    }

    if (configuredProvider.toLowerCase() === 'gemini') {
      if (!apiKey) {
        console.warn('[LLMFactory] GEMINI_API_KEY is not configured; falling back to MockProvider for safety');
        return new MockProvider({ model });
      }
      return new GeminiProvider({ apiKey, model });
    }

    console.warn(`[LLMFactory] Unknown provider '${configuredProvider}'; defaulting to MockProvider`);
    return new MockProvider({ model });
  }
}

module.exports = LLMFactory;
