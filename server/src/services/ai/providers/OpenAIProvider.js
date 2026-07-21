const BaseAIProvider = require('./BaseAIProvider')
const ApiError = require('../../../utils/ApiError')

class OpenAIProvider extends BaseAIProvider {
  constructor() {
    super()
    this.apiKey = process.env.OPENAI_API_KEY
    this.modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }

  async generateResponse(prompt, systemContext = '', options = {}) {
    if (!this.apiKey) {
      throw new ApiError('OpenAI API key is not configured on the server.', 500, 'AI_CONFIG_ERROR')
    }

    const endpoint = 'https://api.openai.com/v1/chat/completions'

    const messages = []
    if (systemContext && systemContext.trim()) {
      messages.push({ role: 'system', content: systemContext.trim() })
    }
    messages.push({ role: 'user', content: prompt })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          temperature: options.temperature || 0.7
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || 'Failed to generate response from OpenAI.'
        throw new ApiError(`OpenAI Error: ${errorMsg}`, response.status || 500, 'AI_PROVIDER_ERROR')
      }

      const textResponse = data?.choices?.[0]?.message?.content
      if (!textResponse) {
        throw new ApiError('No response choices received from OpenAI.', 502, 'AI_RESPONSE_EMPTY')
      }

      return textResponse.trim()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`OpenAI Provider Connection Error: ${error.message}`, 500, 'AI_CONNECTION_ERROR')
    }
  }
}

module.exports = OpenAIProvider
