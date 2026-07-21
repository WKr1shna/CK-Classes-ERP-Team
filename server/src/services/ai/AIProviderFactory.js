const GeminiProvider = require('./providers/GeminiProvider')
const OpenAIProvider = require('./providers/OpenAIProvider')
const OllamaProvider = require('./providers/OllamaProvider')
const GrokProvider = require('./providers/GrokProvider')
const ApiError = require('../../utils/ApiError')

class AIProviderFactory {
  static getProvider(providerName = process.env.AI_PROVIDER) {
    const selectedProvider = (providerName || 'gemini').toLowerCase().trim()

    switch (selectedProvider) {
      case 'grok':
      case 'xai':
        return new GrokProvider()
      case 'gemini':
        return new GeminiProvider()
      case 'openai':
        return new OpenAIProvider()
      case 'ollama':
        return new OllamaProvider()
      default:
        throw new ApiError(`Unsupported AI Provider: '${selectedProvider}'. Supported providers: grok, gemini, openai, ollama.`, 500, 'AI_CONFIG_ERROR')
    }
  }
}

module.exports = AIProviderFactory
