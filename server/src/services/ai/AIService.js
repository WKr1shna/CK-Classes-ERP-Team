// Ensure Mongoose models are registered for population
const User = require('../../models/User')
const Student = require('../../models/Student')
const Teacher = require('../../models/Teacher')
const Subject = require('../../models/Subject')
const Announcement = require('../../models/Announcement')
const Homework = require('../../models/Homework')
const Exam = require('../../models/Exam')
const StudentFee = require('../../models/StudentFee')

const AIProviderFactory = require('./AIProviderFactory')
const StudentService = require('../StudentService')
const TeacherService = require('../TeacherService')
const SubjectService = require('../SubjectService')
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

    // 0. Fetch Real-time Institutional Statistics & Overview Metrics
    try {
      const [totalStudents, activeStudents, totalTeachers, totalSubjects, totalExams, totalAnnouncements, totalParents] = await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ status: { $regex: /^active$/i } }),
        Teacher.countDocuments(),
        Subject.countDocuments(),
        Exam.countDocuments(),
        Announcement.countDocuments(),
        User.countDocuments({ role: { $regex: /^parent$/i } })
      ])

      contextLines.push('\n[C.K. Classes Institutional Statistics & Overview Metrics]:')
      contextLines.push(`- Total Students Registered in Institute: ${totalStudents} (Active Students: ${activeStudents})`)
      contextLines.push(`- Total Teachers / Faculty Mentors: ${totalTeachers}`)
      contextLines.push(`- Total Parents Registered: ${totalParents}`)
      contextLines.push(`- Total Subjects Offered: ${totalSubjects}`)
      contextLines.push(`- Total Scheduled Exams: ${totalExams}`)
      contextLines.push(`- Total System Announcements: ${totalAnnouncements}`)

      // If Admin, Staff, or Teacher role, also include recent students directory snapshot and subjects
      if (['admin', 'staff', 'teacher', 'superadmin'].includes(role)) {
        try {
          if (typeof StudentService.getAllStudents === 'function') {
            const studentsRes = await StudentService.getAllStudents({ limit: 20 }, user)
            const studentList = studentsRes.students || studentsRes.data || (Array.isArray(studentsRes) ? studentsRes : [])
            if (studentList.length > 0) {
              contextLines.push('\n[Recent Students Snapshot in Directory]:')
              studentList.forEach(st => {
                contextLines.push(`- Student: ${st.firstName} ${st.lastName} | ID: ${st.studentId} | Class/Grade: ${st.class || 'N/A'} | Status: ${st.status || 'Active'}`)
              })
            }
          }
        } catch (e) {
          // Graceful degradation on student list
        }

        try {
          if (typeof TeacherService.getAllTeachers === 'function') {
            const teachersRes = await TeacherService.getAllTeachers({ limit: 20 }, user)
            const teacherList = teachersRes.teachers || teachersRes.data || (Array.isArray(teachersRes) ? teachersRes : [])
            if (teacherList.length > 0) {
              contextLines.push('\n[Faculty Mentors Snapshot]:')
              teacherList.forEach(t => {
                const subjs = Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subjects || 'General')
                contextLines.push(`- Teacher: ${t.firstName} ${t.lastName} | ID: ${t.teacherId} | Qualification: ${t.qualification || 'N/A'} | Subjects: ${subjs}`)
              })
            }
          }
        } catch (e) {
          // Graceful degradation on teacher list
        }

        try {
          if (typeof SubjectService !== 'undefined' && typeof SubjectService.getAllSubjects === 'function') {
            const subjectsRes = await SubjectService.getAllSubjects({ limit: 20 })
            const subjectList = subjectsRes.subjects || subjectsRes.data || (Array.isArray(subjectsRes) ? subjectsRes : [])
            if (subjectList.length > 0) {
              contextLines.push('\n[Academic Subjects Directory]:')
              subjectList.forEach(s => {
                contextLines.push(`- Subject: "${s.name}" | Code: ${s.code || 'N/A'} | Class/Grade: ${s.class || 'All'}`)
              })
            }
          }
        } catch (e) {
          // Graceful degradation
        }
      }
    } catch (e) {
      // Graceful degradation on statistics
    }

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
