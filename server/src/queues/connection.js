const IORedis = require('ioredis')

/**
 * Shared IORedis connection for BullMQ queues and workers.
 * Requires maxRetriesPerRequest: null as per BullMQ specs.
 */
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: !process.env.REDIS_URL
})

connection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && !process.env.REDIS_URL) {
    // Suppress local connection refused logs when REDIS_URL is not set in dev
    return
  }
  console.error('[Redis Queue Connection Error]:', err.message)
})

module.exports = connection
