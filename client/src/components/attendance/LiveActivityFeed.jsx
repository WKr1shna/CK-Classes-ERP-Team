import React, { useState, useMemo } from 'react'
import {
  Activity,
  ChevronDown,
  CheckCircle2,
  Clock,
  Lock,
  Edit3,
  ShieldAlert,
  User,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export default function LiveActivityFeed({
  sessions = [],
  loading = false,
  onOpenSession
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return sessionStorage.getItem('attendance_activity_feed_expanded') === 'true'
  })

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev
      sessionStorage.setItem('attendance_activity_feed_expanded', String(next))
      return next
    })
  }

  // Generate Activity Stream from Sessions
  const activityList = useMemo(() => {
    if (!sessions || sessions.length === 0) return []

    const events = []

    sessions.forEach(session => {
      const teacherName = session.teacherId
        ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim()
        : 'Teacher'
      const subject = session.subjectId?.name || 'Lecture'
      const cls = session.classId || 'Class'
      const timeStr = session.periodId?.startTime || '09:00 AM'

      if (session.status === 'Submitted') {
        events.push({
          id: `sub-${session._id}`,
          type: 'submitted',
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          title: `Attendance Submitted`,
          description: `${teacherName} recorded attendance for ${cls} (${subject})`,
          time: timeStr,
          session
        })
      } else {
        events.push({
          id: `pend-${session._id}`,
          type: 'pending',
          icon: Clock,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          title: `Attendance Pending`,
          description: `Attendance awaiting submission for ${cls} (${subject})`,
          time: timeStr,
          session
        })
      }

      if (session.isLocked) {
        events.push({
          id: `lock-${session._id}`,
          type: 'locked',
          icon: Lock,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          title: `Session Locked`,
          description: `Attendance finalized and locked for ${cls} (${subject})`,
          time: timeStr,
          session
        })
      }
    })

    return events.slice(0, 10)
  }, [sessions])

  if (loading) return null
  if (activityList.length === 0) return null

  return (
    <div className="shrink-0 print:hidden select-none space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 transition-all">
      {/* Summary Strip Header */}
      <div
        onClick={toggleExpanded}
        className="flex items-center justify-between gap-2 cursor-pointer border-b border-slate-200/60 pb-2 select-none group"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-600 shrink-0" />
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider group-hover:text-brand-blue-600 transition-colors">
            Live Activity Event Stream
          </h3>
          <span className="text-[10px] font-bold text-slate-400">
            ({activityList.length} Events Logged)
          </span>
        </div>

        <button
          type="button"
          className="h-6 w-6 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-500 transition-transform duration-200"
          title={isExpanded ? "Collapse Activity Feed" : "Expand Activity Feed"}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
        </button>
      </div>

      {/* Animated Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden space-y-2 pt-1"
          >
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 text-left pr-1">
              {activityList.map(item => {
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => onOpenSession && onOpenSession(item.session)}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-brand-blue-300 transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("h-7 w-7 rounded-lg border flex items-center justify-center shrink-0", item.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-800 truncate leading-tight group-hover:text-brand-blue-600 transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[9.5px] font-mono font-extrabold text-slate-400 shrink-0">
                            • {item.time}
                          </span>
                        </div>
                        <p className="text-[10.5px] font-semibold text-slate-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-blue-600 transition-colors shrink-0" />
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
