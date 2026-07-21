const BaseAIProvider = require('./BaseAIProvider')
const ApiError = require('../../../utils/ApiError')

class OllamaProvider extends BaseAIProvider {
  constructor() {
    super()
    this.host = process.env.OLLAMA_HOST || 'http://localhost:11434'
    this.modelName = process.env.OLLAMA_MODEL || 'llama3'
  }

  async generateResponse(prompt, systemContext = '', options = {}) {
    const endpoint = `${this.host.replace(/\/$/, '')}/api/chat`

    const messages = []
    if (systemContext && systemContext.trim()) {
      messages.push({ role: 'system', content: systemContext.trim() })
    }
    messages.push({ role: 'user', content: prompt })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          stream: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error || 'Failed to generate response from Ollama.'
        throw new ApiError(`Ollama Error: ${errorMsg}`, response.status || 500, 'AI_PROVIDER_ERROR')
      }

      const textResponse = data?.message?.content
      if (!textResponse) {
        throw new ApiError('No response message received from Ollama.', 502, 'AI_RESPONSE_EMPTY')
      }

      return textResponse.trim()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Ollama Provider Connection Error: ${error.message}`, 500, 'AI_CONNECTION_ERROR')
    }
  }
}

module.exports = OllamaProvider
