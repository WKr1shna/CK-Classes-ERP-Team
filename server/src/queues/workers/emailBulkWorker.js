const { Worker } = require('bullmq')
const connection = require('../connection')
const emailService = require('../../services/emailService')

const emailBulkWorker = new Worker(
  'email-bulk',
  async (job) => {
    if (job.data.otp && job.data.purpose) {
      return await emailService.sendOtpEmail(job.data)
    }
    return await emailService.sendEmail(job.data)
  },
  {
    connection,
    concurrency: 3
  }
)

emailBulkWorker.on('failed', (job, err) => {
  console.error(`[emailBulkWorker Failed] Job ID: ${job?.id}, Error: ${err.message}`)
})

emailBulkWorker.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && !process.env.REDIS_URL) {
    return
  }
  console.error('[emailBulkWorker System Error]:', err.message)
})

module.exports = emailBulkWorker
