const BaseAIProvider = require('./BaseAIProvider')
const ApiError = require('../../../utils/ApiError')

class GrokProvider extends BaseAIProvider {
  constructor() {
    super()
    this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
    this.modelName = process.env.GROK_MODEL || 'grok-2-latest'
  }

  async generateResponse(prompt, systemContext = '', options = {}) {
    if (!this.apiKey) {
      throw new ApiError('Grok (xAI) API key is not configured on the server.', 500, 'AI_CONFIG_ERROR')
    }

    const endpoint = 'https://api.x.ai/v1/chat/completions'

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
        const errorDetail = typeof data?.error === 'object' ? data.error.message : (data?.error || data?.detail || data?.message || JSON.stringify(data))
        if (data?.code === 'permission-denied' || errorDetail.includes("doesn't have any credits")) {
          throw new ApiError("xAI Account Notice: Your xAI account has 0 API credits. Please add prepaid credits at https://console.x.ai or switch AI_PROVIDER=gemini for free usage.", 403, 'AI_NO_CREDITS')
        }
        if (errorDetail.includes('Incorrect API key') || data?.code === 'invalid-argument') {
          throw new ApiError('Invalid xAI Grok API key. Please generate an active API key at https://console.x.ai', 401, 'AI_AUTH_ERROR')
        }
        throw new ApiError(`Grok API Error (${response.status}): ${errorDetail}`, response.status || 500, 'AI_PROVIDER_ERROR')
      }

      const textResponse = data?.choices?.[0]?.message?.content
      if (!textResponse) {
        throw new ApiError('No response message received from Grok.', 502, 'AI_RESPONSE_EMPTY')
      }

      return textResponse.trim()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Grok Provider Connection Error: ${error.message}`, 500, 'AI_CONNECTION_ERROR')
    }
  }
}

module.exports = GrokProvider
