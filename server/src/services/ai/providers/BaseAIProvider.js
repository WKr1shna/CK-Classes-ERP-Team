/**
 * Abstract Base Class for AI Providers (Gemini, OpenAI, Ollama)
 */
class BaseAIProvider {
  /**
   * Generates a text completion based on prompt and system context
   * @param {string} prompt - User request or query
   * @param {string} systemContext - Context data and instructions
   * @param {object} options - Additional model options (temperature, maxTokens, etc.)
   * @returns {Promise<string>} Generated text response
   */
  async generateResponse(prompt, systemContext = '', options = {}) {
    throw new Error('generateResponse method must be implemented by concrete provider.')
  }
}

module.exports = BaseAIProvider
