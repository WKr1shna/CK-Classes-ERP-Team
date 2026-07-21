import api from './api'

/**
 * AI Integration Service for Frontend
 */
export const queryAI = async (prompt) => {
  const response = await api.post('/ai/query', { prompt })
  return response.data
}

export const getAIStatus = async () => {
  const response = await api.get('/ai/status')
  return response
}

export default {
  queryAI,
  getAIStatus
}
