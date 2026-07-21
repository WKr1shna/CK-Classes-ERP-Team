const BaseAIProvider = require('./BaseAIProvider')
const ApiError = require('../../../utils/ApiError')

class GeminiProvider extends BaseAIProvider {
  constructor() {
    super()
    this.apiKey = process.env.GEMINI_API_KEY
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  }

  async generateResponse(prompt, systemContext = '', options = {}) {
    if (!this.apiKey) {
      throw new ApiError('Gemini API key is not configured on the server.', 500, 'AI_CONFIG_ERROR')
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    }

    if (systemContext && systemContext.trim()) {
      requestBody.systemInstruction = {
        parts: [{ text: systemContext.trim() }]
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || 'Failed to generate response from Gemini.'
        if (response.status === 429 || errorMsg.includes('quota') || errorMsg.includes('Quota exceeded')) {
          throw new ApiError(`Gemini Quota Notice: Free tier limit reached or key project needs free tier enabled. Create a new key via 'Create API key in new project' at https://aistudio.google.com/app/apikey`, 429, 'AI_QUOTA_EXCEEDED')
        }
        throw new ApiError(`Gemini AI Error (${response.status}): ${errorMsg}`, response.status || 500, 'AI_PROVIDER_ERROR')
      }

      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!textResponse) {
        throw new ApiError('No response candidate received from Gemini.', 502, 'AI_RESPONSE_EMPTY')
      }

      return textResponse.trim()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(`Gemini Provider Connection Error: ${error.message}`, 500, 'AI_CONNECTION_ERROR')
    }
  }
}

module.exports = GeminiProvider
