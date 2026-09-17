import { motion } from 'framer-motion'
import { Bell, LogOut, Flame, Star, Zap, Lock, CheckCircle, BookOpen, ChevronRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useUnits, useProgress, type UnitWithStatus } from './hooks/useCurriculum'

export default function StudentDashboard() {
  const { profile } = useAuthStore()
  const { data: units, isLoading: unitsLoading } = useUnits()
  const { data: progress } = useProgress()

  const firstName = profile?.displayName?.split(' ')[0] ?? 'Learner'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col pb-6">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦁</span>
          <span className="font-display font-bold text-white text-sm tracking-tight">GrammoQuest</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors">
            <Bell size={18} className="text-zinc-400" />
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
            <span className="text-zinc-500 text-xs">{progress?.totalXP ?? 0} / 500 XP</span>
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
              {units?.map((unit, i) => (
                <UnitCard key={unit.id} unit={unit} index={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Daily Mission placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-game p-4 border border-dashed border-primary-500/30 bg-primary-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <p className="text-primary-300 text-xs font-bold uppercase tracking-wider mb-0.5">Daily Mission</p>
              <p className="text-white text-sm font-semibold">Complete 1 quiz today</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-primary-500 rounded-full" />
                </div>
                <span className="text-zinc-600 text-xs">0/1</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-400 font-bold text-sm">+50 XP</p>
            </div>
          </div>
        </motion.div>

      </main>
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

function UnitCard({ unit, index }: { unit: UnitWithStatus, index: number }) {
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
        ${isCompleted ? 'border-success-500/30 bg-success-500/5' : ''}`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0
        ${isLocked ? 'bg-zinc-800' : isCompleted ? 'bg-success-500/20' : 'bg-gradient-to-br from-primary-500/30 to-accent-500/30'}`}>
        {isLocked ? <Lock size={20} className="text-zinc-600" /> :
         isCompleted ? <CheckCircle size={20} className="text-success-400" /> :
         <BookOpen size={20} className="text-primary-400" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-zinc-500 text-xs font-medium">Unit {unit.order}</p>
          {isCompleted && <span className="text-xs bg-success-500/20 text-success-400 px-1.5 py-0.5 rounded-full font-medium">Done!</span>}
        </div>
        <h3 className="font-semibold text-white text-sm truncate">{unit.title}</h3>
        {!isLocked && (
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
