/**
 * Base abstract interface for LLM providers
 */
class LLMProvider {
  /**
   * Generate raw text response
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemInstruction]
   * @param {number} [options.temperature]
   * @returns {Promise<{ text: string, raw: any }>}
   */
  async generateText(options) {
    throw new Error('generateText must be implemented by subclass');
  }

  /**
   * Generate structured JSON conforming to a schema
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemInstruction]
   * @param {Object} options.schema
   * @param {number} [options.temperature]
   * @returns {Promise<{ data: any, raw: any }>}
   */
  async generateStructured(options) {
    throw new Error('generateStructured must be implemented by subclass');
  }

  /**
   * Generate with tools (read-only function calling)
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemInstruction]
   * @param {Array<Object>} options.tools
   * @param {Function} options.toolExecutor
   * @param {number} [options.temperature]
   * @returns {Promise<{ data: any, toolCalls: Array<any>, raw: any }>}
   */
  async generateWithTools(options) {
    throw new Error('generateWithTools must be implemented by subclass');
  }
}

module.exports = LLMProvider;
