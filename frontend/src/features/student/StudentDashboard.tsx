import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, LogOut, Flame, Star, Zap, Lock, CheckCircle, BookOpen, ChevronRight, Trophy, Clock, X, Check, BarChart2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useUnits, useProgress, type UnitWithStatus } from './hooks/useCurriculum'
import {
  useMyUnlockRequests,
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  type UnlockRequest,
  type AppNotification,
} from './hooks/useNotifications'

export default function StudentDashboard() {
  const { profile } = useAuthStore()
  const { data: units, isLoading: unitsLoading } = useUnits()
  const { data: progress } = useProgress()
  const { data: unlockRequests } = useMyUnlockRequests()
  const { data: notifications } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { mutate: markRead } = useMarkNotificationRead()
  const [notifOpen, setNotifOpen] = useState(false)

  const firstName = profile?.displayName?.split(' ')[0] ?? 'Learner'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const openNotifications = () => {
    setNotifOpen(true)
    // Mark all unread as read
    notifications?.filter(n => !n.isRead).forEach(n => markRead(n.id))
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col pb-6">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦁</span>
          <span className="font-display font-bold text-white text-sm tracking-tight">GrammoQuest</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="notification-bell"
            onClick={openNotifications}
            className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <Bell size={18} className="text-zinc-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => auth.signOut()} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
            <LogOut size={18} className="text-zinc-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 max-w-lg mx-auto w-full space-y-5">

        {/* Greeting + Rank */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-zinc-500 text-sm font-medium">{greeting},</p>
          <h1 className="font-display font-black text-2xl text-white">{firstName}! 👋</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-accent-500/20 to-primary-500/20 border border-accent-500/30">
            <Trophy size={12} className="text-accent-400" />
            <span className="text-accent-300 text-xs font-bold">{progress?.rankTitle ?? 'Grammar Rookie'}</span>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2.5"
        >
          <StatCard icon={Zap} label="XP" value={progress?.totalXP ?? 0} color="accent" />
          <StatCard icon={Flame} label="Streak" value={`${progress?.currentStreak ?? 0}d`} color="primary" />
          <StatCard icon={Star} label="Stars" value={progress?.totalStars ?? 0} color="warning" />
        </motion.div>

        {/* XP Progress to next rank */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-game p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-xs font-medium">Progress to next rank</span>
            <Link
              to="/progress"
              className="flex items-center gap-1 text-accent-400 text-xs font-semibold hover:text-accent-300 transition-colors"
            >
              <BarChart2 size={12} /> My Stats
            </Link>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((progress?.totalXP ?? 0) / 500) * 100, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
          {progress?.structureCount ? (
            <p className="text-zinc-500 text-xs mt-2 text-center">
              📝 You can build <span className="text-primary-400 font-semibold">{progress.structureCount}</span> English sentences!
            </p>
          ) : null}
        </motion.div>

        {/* Pending Unlock Banners */}
        {unlockRequests?.filter(req => req.status === 'pending').map(req => {
          const unit = units?.find(u => u.id === req.unitId)
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-game p-4 border-warning-500/40 bg-warning-500/10"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock size={20} className="text-warning-400 shrink-0" />
                <h3 className="font-bold text-white text-sm">Pending Admin Approval</h3>
              </div>
              <p className="text-zinc-400 text-xs">
                You've completed <span className="text-white font-medium">{unit?.title ?? 'a unit'}</span>!{' '}
                Your next unit will unlock after your progress is reviewed by an admin.
              </p>
            </motion.div>
          )
        })}

        {/* Journey Map / Units */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-lg">Your Journey</h2>
            <span className="text-zinc-600 text-xs">{units?.length ?? 0} units</span>
          </div>

          {unitsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="card-game h-24 animate-pulse bg-zinc-800/50" />
              ))}
            </div>
          ) : units?.length === 0 ? (
            <EmptyJourney />
          ) : (
            <div className="space-y-3">
              {units?.map((unit, i) => {
                const pendingReq = unlockRequests?.find(r => r.unitId === unit.id && r.status === 'pending')
                return (
                  <UnitCard key={unit.id} unit={unit} index={i} isPending={!!pendingReq} />
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Daily Mission */}
        {(() => {
          const todayUTC = new Date().toISOString().split('T')[0]
          const isToday = progress?.lastQuizDate === todayUTC
          const count = isToday ? (progress?.quizzesCompletedToday ?? 0) : 0
          const isDone = count >= 1

          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`card-game p-4 border ${isDone ? 'border-success-500/30 bg-success-500/5' : 'border-dashed border-primary-500/30 bg-primary-500/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{isDone ? '🏆' : '🎯'}</div>
                <div className="flex-1">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isDone ? 'text-success-400' : 'text-primary-300'}`}>
                    Daily Mission
                  </p>
                  <p className="text-white text-sm font-semibold">Complete 1 quiz today</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isDone ? 'bg-success-500' : 'bg-primary-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / 1) * 100, 100)}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="text-zinc-600 text-xs">{Math.min(count, 1)}/1</span>
                  </div>
                </div>
                <div className="text-right">
                  {isDone ? (
                    <p className="text-success-400 font-bold text-sm">Done!</p>
                  ) : (
                    <p className="text-primary-400 font-bold text-sm">+50 XP</p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })()}

        {/* Quick Nav */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link to="/leaderboard" className="card-game p-4 flex flex-col items-center gap-2 text-center hover:border-zinc-600 transition-colors group">
            <Trophy size={22} className="text-warning-400 group-hover:scale-110 transition-transform" />
            <span className="text-white text-xs font-bold">Leaderboard</span>
          </Link>
          <Link to="/progress" className="card-game p-4 flex flex-col items-center gap-2 text-center hover:border-zinc-600 transition-colors group">
            <Zap size={22} className="text-accent-400 group-hover:scale-110 transition-transform" />
            <span className="text-white text-xs font-bold">My Progress</span>
          </Link>
        </motion.div>

      </main>

      {/* Notification Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setNotifOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-surface-950 border-l border-zinc-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                <h2 className="font-display font-bold text-white text-base">Notifications</h2>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} className="text-zinc-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!notifications?.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <Bell size={32} className="text-zinc-700 mb-3" />
                    <p className="text-zinc-500 text-sm">No notifications yet</p>
                    <p className="text-zinc-700 text-xs mt-1">You'll hear from your teacher here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {notifications.map(n => (
                      <NotificationRow key={n.id} notif={n} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


// ─── Sub-components ──────────────────────────────────────────────────────────

type StatColor = 'accent' | 'primary' | 'warning'
const statColors: Record<StatColor, string> = {
  accent:  'text-accent-400 bg-accent-500/20',
  primary: 'text-primary-400 bg-primary-500/20',
  warning: 'text-warning-400 bg-warning-500/20',
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number | string, color: StatColor }) {
  return (
    <div className="card-game p-3 text-center">
      <div className={`${statColors[color]} p-2 rounded-xl w-fit mx-auto mb-1.5`}>
        <Icon size={16} className={color === 'accent' ? 'text-accent-400' : color === 'primary' ? 'text-primary-400' : 'text-warning-400'} />
      </div>
      <p className={`font-display font-black text-xl ${color === 'accent' ? 'text-accent-400' : color === 'primary' ? 'text-primary-400' : 'text-warning-400'}`}>
        {value}
      </p>
      <p className="text-zinc-600 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function NotificationRow({ notif }: { notif: AppNotification }) {
  const createdAt = new Date(notif.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className={`px-4 py-3.5 ${!notif.isRead ? 'bg-primary-500/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.isRead ? 'bg-primary-400' : 'bg-zinc-700'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${!notif.isRead ? 'text-white' : 'text-zinc-300'}`}>{notif.title}</p>
          <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
          <p className="text-zinc-600 text-xs mt-1">{createdAt}</p>
        </div>
      </div>
    </div>
  )
}

function UnitCard({ unit, index, isPending }: { unit: UnitWithStatus, index: number, isPending?: boolean }) {
  const isLocked = unit.status === 'locked'
  const isCompleted = unit.status === 'completed'
  const pct = unit.totalChapters > 0 ? (unit.chaptersCompleted / unit.totalChapters) * 100 : 0

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`card-game p-4 flex items-center gap-4 transition-all duration-200
        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-600 cursor-pointer hover:shadow-card'}
        ${isCompleted ? 'border-success-500/30 bg-success-500/5' : ''}
        ${isPending ? 'border-warning-500/30 bg-warning-500/5' : ''}`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0
        ${isLocked ? 'bg-zinc-800' : isPending ? 'bg-warning-500/20' : isCompleted ? 'bg-success-500/20' : 'bg-gradient-to-br from-primary-500/30 to-accent-500/30'}`}>
        {isLocked ? <Lock size={20} className="text-zinc-600" /> :
         isPending ? <Clock size={20} className="text-warning-400" /> :
         isCompleted ? <CheckCircle size={20} className="text-success-400" /> :
         <BookOpen size={20} className="text-primary-400" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-zinc-500 text-xs font-medium">Unit {unit.order}</p>
          {isPending ? (
            <span className="text-xs bg-warning-500/20 text-warning-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><Clock size={10} /> Pending Approval</span>
          ) : isCompleted ? (
            <span className="text-xs bg-success-500/20 text-success-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle size={10} /> Done!</span>
          ) : null}
        </div>
        <h3 className="font-semibold text-white text-sm truncate">{unit.title}</h3>
        {!isLocked && !isPending && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isCompleted ? 'bg-success-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              />
            </div>
            <span className="text-zinc-600 text-xs shrink-0">{unit.chaptersCompleted}/{unit.totalChapters}</span>
          </div>
        )}
      </div>

      {!isLocked && <ChevronRight size={16} className="text-zinc-600 shrink-0" />}
    </motion.div>
  )

  if (isLocked) return content
  return <Link to={`/units/${unit.id}`}>{content}</Link>
}

function EmptyJourney() {
  return (
    <div className="card-game p-8 text-center border-dashed">
      <p className="text-4xl mb-3">🗺️</p>
      <p className="text-zinc-500 text-sm">Your learning journey is being prepared.</p>
      <p className="text-zinc-600 text-xs mt-1">Check back shortly after account activation.</p>
    </div>
  )
}


