// Ensure Mongoose models are registered for population
require('../../models/User')
require('../../models/Student')
require('../../models/Teacher')
require('../../models/Subject')
require('../../models/Announcement')
require('../../models/Homework')
require('../../models/Exam')
require('../../models/StudentFee')

const AIProviderFactory = require('./AIProviderFactory')
const StudentService = require('../StudentService')
const TeacherService = require('../TeacherService')
const HomeworkService = require('../HomeworkService')
const ExamService = require('../ExamService')
const StudentFeeService = require('../StudentFeeService')
const TimetableService = require('../TimetableService')
const AnnouncementService = require('../AnnouncementService')
const AttendanceService = require('../AttendanceService')
const ApiError = require('../../utils/ApiError')

class AIService {
  /**
   * Builds context summary from domain services based on user role and scope
   * @param {Object} user req.user context
   * @returns {Promise<String>} Formatted system context string
   */
  async buildContextForUser(user) {
    const role = (user.role || '').toLowerCase()
    const contextLines = [
      `System Role: You are C.K. ERP AI Assistant, an intelligent institutional AI for C.K. Classes.`,
      `Logged-in User Identity: ${user.firstName || user.email} (${user.email}), Role: ${user.role}.`,
      `Current Date & Time: ${new Date().toISOString()}`,
      `CRITICAL INSTRUCTION: Base your response ONLY on the provided ERP data below. Do NOT hallucinate fake dates, cities, branches, or events. If no records exist in the provided context, state that clearly.`
    ]

    // 1. Fetch Announcements relevant to role
    try {
      if (typeof AnnouncementService.getAllAnnouncements === 'function') {
        const announcementsRes = await AnnouncementService.getAllAnnouncements({ limit: 10 }, user)
        const announcements = announcementsRes.announcements || announcementsRes.data || (Array.isArray(announcementsRes) ? announcementsRes : [])
        if (announcements.length > 0) {
          contextLines.push('\n[Real System Announcements from ERP Database]:')
          announcements.forEach(a => {
            const dateStr = a.publishAt ? new Date(a.publishAt).toLocaleDateString() : 'N/A'
            const audienceStr = Array.isArray(a.audience) ? a.audience.join(', ') : (a.audience || 'All')
            contextLines.push(`- Title: "${a.title}" | Audience: ${audienceStr} | Published: ${dateStr} | Details: ${a.message || a.shortDescription || ''}`)
          })
        } else {
          contextLines.push('\n[Recent Announcements]: No published announcements currently in the ERP system.')
        }
      }
    } catch (e) {
      // Graceful degradation on optional service context
    }

    // 2. Student Role Context
    if (role === 'student' && user.linkedStudent) {
      try {
        const studentProfile = await StudentService.getStudentById(user.linkedStudent)
        if (studentProfile) {
          contextLines.push(`\n[Student Profile]:`)
          contextLines.push(`- ID: ${studentProfile.studentId}, Name: ${studentProfile.firstName} ${studentProfile.lastName}, Class: ${studentProfile.class}, Status: ${studentProfile.status}`)

          // Homework for student's class
          if (studentProfile.class && typeof HomeworkService.getAllHomeworks === 'function') {
            const hwRes = await HomeworkService.getAllHomeworks({ class: studentProfile.class, limit: 10 }, user)
            const hwList = hwRes.homework || hwRes.data || (Array.isArray(hwRes) ? hwRes : [])
            if (hwList.length > 0) {
              contextLines.push(`\n[Assigned Homework]:`)
              hwList.forEach(hw => {
                const dueStr = hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'
                contextLines.push(`- Title: "${hw.title}", Due: ${dueStr}, Status: ${hw.status}, Subject: ${hw.subject?.name || 'General'}`)
              })
            }
          }

          // Student Fees
          if (typeof StudentFeeService.getAllStudentFees === 'function') {
            const feeRes = await StudentFeeService.getAllStudentFees({ studentId: user.linkedStudent, limit: 10 })
            const feeList = feeRes.fees || feeRes.studentFees || (Array.isArray(feeRes) ? feeRes : [])
            if (feeList.length > 0) {
              contextLines.push(`\n[Fee Overview]:`)
              feeList.forEach(f => {
                const dueStr = f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'N/A'
                contextLines.push(`- Total ₹${f.totalFee}, Paid ₹${f.paidAmount}, Due: ${dueStr}, Status: ${f.status}`)
              })
            }
          }
        }
      } catch (e) {
        // Graceful degradation
      }
    }

    // 3. Parent Role Context
    if (role === 'parent' && user.linkedChildren && user.linkedChildren.length > 0) {
      try {
        contextLines.push(`\n[Linked Children Profiles]:`)
        for (const childId of user.linkedChildren) {
          const childProfile = await StudentService.getStudentById(childId)
          if (childProfile) {
            contextLines.push(`- Child Student: ${childProfile.firstName} ${childProfile.lastName} (${childProfile.studentId}), Class: ${childProfile.class}`)
          }
        }
      } catch (e) {
        // Graceful degradation
      }
    }

    // 4. Teacher Role Context
    if (role === 'teacher' && user.linkedTeacher) {
      try {
        const teacherProfile = await TeacherService.getTeacherById(user.linkedTeacher)
        if (teacherProfile) {
          contextLines.push(`\n[Teacher Profile]:`)
          contextLines.push(`- ID: ${teacherProfile.teacherId}, Name: ${teacherProfile.firstName} ${teacherProfile.lastName}, Qualification: ${teacherProfile.qualification}`)
          if (teacherProfile.subjects && teacherProfile.subjects.length > 0) {
            contextLines.push(`- Subjects Taught: ${teacherProfile.subjects.join(', ')}`)
          }
        }
      } catch (e) {
        // Graceful degradation
      }
    }

    // 5. Admin / General Exams Context
    try {
      if (typeof ExamService.getAllExams === 'function') {
        const examsRes = await ExamService.getAllExams({ limit: 5 })
        const examsList = examsRes.exams || examsRes.data || (Array.isArray(examsRes) ? examsRes : [])
        if (examsList.length > 0) {
          contextLines.push(`\n[Scheduled Exams in ERP]:`)
          examsList.forEach(ex => {
            const dateStr = ex.examDate ? new Date(ex.examDate).toLocaleDateString() : 'N/A'
            contextLines.push(`- Exam: "${ex.examName}", Class: ${ex.class}, Date: ${dateStr}, Status: ${ex.status}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    contextLines.push(`\n[Response Rules]: Answer the user's question directly based on the ERP data above. Keep your tone helpful, professional, and concise.`)

    return contextLines.join('\n')
  }

  /**
   * Process AI Query from authenticated user
   * @param {Object} user req.user context
   * @param {String} prompt User's question or prompt
   * @returns {Promise<Object>} Response text and metadata
   */
  async processQuery(user, prompt) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new ApiError('AI query prompt cannot be empty.', 400, 'VALIDATION_ERROR')
    }

    // 1. Build context using Domain Services
    const systemContext = await this.buildContextForUser(user)

    // 2. Obtain provider from Factory
    const provider = AIProviderFactory.getProvider()

    // 3. Execute prompt generation
    const responseText = await provider.generateResponse(prompt.trim(), systemContext)

    return {
      success: true,
      query: prompt.trim(),
      response: responseText,
      provider: process.env.AI_PROVIDER || 'gemini',
      timestamp: new Date()
    }
  }
}

module.exports = new AIService()
