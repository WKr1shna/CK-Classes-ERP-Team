const { Queue } = require('bullmq')
const connection = require('./connection')

const emailBulkQueue = new Queue('email-bulk', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
})

emailBulkQueue.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && !process.env.REDIS_URL) {
    return
  }
  console.error('[emailBulkQueue Error]:', err.message)
})

module.exports = emailBulkQueue
