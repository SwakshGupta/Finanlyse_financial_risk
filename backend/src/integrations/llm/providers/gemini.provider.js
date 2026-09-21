const axios = require('axios');
const LLMProvider = require('../provider.interface');
const { validateExplanation, extractJsonFromText } = require('../schemas/explanation.schema');

class GeminiProvider extends LLMProvider {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.modelName = config.model || process.env.LLM_MODEL || 'gemini-3.1-flash-lite';
    this.providerName = 'gemini';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.timeout = config.timeout || 15000;
  }

  /**
   * Helper to perform Gemini API HTTP requests
   */
  async _callApi(payload) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    });

    return response.data;
  }

  async generateText({ prompt, systemInstruction, temperature = 0.2 }) {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
      },
    };

    if (systemInstruction) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const data = await this._callApi(payload);
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';

    return {
      text,
      raw: data,
    };
  }

  async generateStructured({ prompt, systemInstruction, schema, temperature = 0.2 }) {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        response_mime_type: 'application/json',
      },
    };

    if (schema) {
      payload.generationConfig.response_schema = schema;
    }

    if (systemInstruction) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const data = await this._callApi(payload);
    const candidate = data.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini API returned empty response');
    }

    const parsed = extractJsonFromText(rawText);
    if (!parsed) {
      throw new Error(`Failed to parse structured JSON from Gemini response: ${rawText.slice(0, 100)}...`);
    }

    const validation = validateExplanation(parsed);
    if (!validation.valid) {
      throw new Error(`Gemini response failed schema validation: ${validation.errors.join(', ')}`);
    }

    return {
      data: parsed,
      raw: data,
    };
  }

  async generateWithTools({ prompt, systemInstruction, tools, toolExecutor, temperature = 0.2 }) {
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const payload = {
      contents,
      generationConfig: {
        temperature,
      },
    };

    if (systemInstruction) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (tools && tools.length > 0) {
      payload.tools = [
        {
          function_declarations: tools,
        },
      ];
    }

    let responseData = await this._callApi(payload);
    const candidate = responseData.candidates?.[0];
    const firstPart = candidate?.content?.parts?.[0];

    const toolCallsExecuted = [];

    // Check if Gemini invoked a tool
    if (firstPart?.functionCall && typeof toolExecutor === 'function') {
      const { name, args } = firstPart.functionCall;
      let toolResult;
      try {
        toolResult = toolExecutor(name, args);
      } catch (err) {
        toolResult = { error: err.message };
      }

      toolCallsExecuted.push({ name, args, result: toolResult });

      // Add model's function call part to history
      contents.push(candidate.content);

      // Add tool response to history
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name,
              response: { content: toolResult },
            },
          },
        ],
      });

      // Request final structured answer from Gemini
      payload.contents = contents;
      payload.generationConfig.response_mime_type = 'application/json';
      delete payload.tools; // Conclude tool phase

      responseData = await this._callApi(payload);
    }

    const finalCandidate = responseData.candidates?.[0];
    const rawText = finalCandidate?.content?.parts?.[0]?.text;
    const parsed = extractJsonFromText(rawText);

    if (!parsed) {
      throw new Error('Failed to parse final structured response after tool interaction');
    }

    return {
      data: parsed,
      toolCalls: toolCallsExecuted,
      raw: responseData,
    };
  }
}

module.exports = GeminiProvider;
