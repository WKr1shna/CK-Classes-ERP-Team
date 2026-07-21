const { Queue } = require('bullmq')
const connection = require('./connection')

const emailTransactionalQueue = new Queue('email-transactional', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
})

emailTransactionalQueue.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && !process.env.REDIS_URL) {
    return
  }
  console.error('[emailTransactionalQueue Error]:', err.message)
})

module.exports = emailTransactionalQueue
