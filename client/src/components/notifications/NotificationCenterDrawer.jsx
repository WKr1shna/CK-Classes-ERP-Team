import React, { useState } from 'react'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  SlidersHorizontal,
  Lock,
  User,
  ShieldAlert,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export default function NotificationCenterDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onActionClick
}) {
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Unread' | 'Critical' | 'Approvals'
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'Unread' && n.isRead) return false
    if (activeTab === 'Critical' && n.priority !== 'Critical') return false
    if (activeTab === 'Approvals' && n.category !== 'Approval') return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.targetClass || '').toLowerCase().includes(q)
      )
    }

    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Group notifications by Today, Yesterday, Earlier
  const grouped = {
    Today: filteredNotifications.filter(n => n.group === 'Today'),
    Yesterday: filteredNotifications.filter(n => n.group === 'Yesterday'),
    Earlier: filteredNotifications.filter(n => n.group === 'Earlier')
  }

  return (
    <div className="fixed inset-0 z-[110] flex justify-end select-none print:hidden">
      {/* Backdrop Dimming */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
      />

      {/* Right Slide-Over Notification Center Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="relative w-full sm:w-[480px] lg:w-[520px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-5 w-5 text-brand-blue-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight">
                  Notification Center
                </h3>
                <span className="text-[10px] font-extrabold text-slate-400 block mt-0.5">
                  Real-time Operational Activity & Alerts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-[11px] font-extrabold text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                title="Close Notification Center (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs & Search Toolbar */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[11px] font-extrabold">
              {['All', 'Unread', 'Critical', 'Approvals'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer border shrink-0",
                    activeTab === tab
                      ? "bg-brand-blue-600 text-white border-brand-blue-600 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {tab}
                  {tab === 'Unread' && unreadCount > 0 && (
                    <span className="ml-1 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-36 sm:w-44 h-7">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full w-full pl-7 pr-2 bg-white border border-slate-200 text-[10.5px] font-semibold rounded-lg focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Notification Items List */}
        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar space-y-4 text-left min-h-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Bell className="h-8 w-8 text-slate-300" />
              <span>No notifications match your current filter.</span>
            </div>
          ) : (
            ['Today', 'Yesterday', 'Earlier'].map(groupKey => {
              const list = grouped[groupKey]
              if (!list || list.length === 0) return null

              return (
                <div key={groupKey} className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {groupKey}
                  </span>

                  <div className="space-y-2">
                    {list.map(notif => {
                      let Icon = Info
                      let iconColor = "text-blue-600 bg-blue-50 border-blue-200"
                      if (notif.priority === 'Critical') {
                        Icon = ShieldAlert
                        iconColor = "text-rose-600 bg-rose-50 border-rose-200"
                      } else if (notif.priority === 'Success') {
                        Icon = CheckCircle2
                        iconColor = "text-emerald-600 bg-emerald-50 border-emerald-200"
                      } else if (notif.priority === 'Warning') {
                        Icon = AlertTriangle
                        iconColor = "text-amber-600 bg-amber-50 border-amber-200"
                      }

                      return (
                        <div
                          key={notif.id}
                          onClick={() => onMarkAsRead(notif.id)}
                          className={cn(
                            "p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 cursor-pointer group text-left relative",
                            notif.isRead
                              ? "bg-white border-slate-200/70 opacity-90"
                              : "bg-slate-50 border-brand-blue-200 shadow-2xs hover:border-brand-blue-400"
                          )}
                        >
                          {/* Unread Indicator Dot */}
                          {!notif.isRead && (
                            <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-brand-blue-600 animate-pulse" />
                          )}

                          <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5", iconColor)}>
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-2 pr-4">
                              <h4 className="text-xs font-black text-slate-850 tracking-tight leading-tight truncate group-hover:text-brand-blue-600 transition-colors">
                                {notif.title}
                              </h4>
                              <span className="text-[9.5px] font-bold text-slate-400 shrink-0 font-mono">
                                {notif.timestamp}
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-snug">
                              {notif.description}
                            </p>

                            {/* Meta Tags */}
                            <div className="flex items-center gap-1.5 mt-2 text-[9.5px] font-extrabold flex-wrap">
                              {notif.targetClass && (
                                <span className="bg-brand-blue-50 text-brand-blue-700 px-2 py-0.2 rounded border border-brand-blue-200">
                                  {notif.targetClass}
                                </span>
                              )}
                              <span className={cn(
                                "px-2 py-0.2 rounded border uppercase tracking-wider",
                                notif.priority === 'Critical' ? "bg-rose-100 text-rose-800 border-rose-300 font-black" : "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {notif.priority}
                              </span>
                            </div>

                            {/* Contextual Action Button */}
                            {notif.actionLabel && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onActionClick(notif)
                                }}
                                className="mt-2.5 h-6 px-2.5 rounded-lg bg-white hover:bg-brand-blue-600 hover:text-white border border-slate-200 text-slate-700 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <span>{notif.actionLabel}</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs font-semibold text-slate-500 shrink-0">
          <span>{notifications.length} Total Alerts Logged</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
