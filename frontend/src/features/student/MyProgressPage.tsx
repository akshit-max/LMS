import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Star, Flame, Trophy, CheckCircle, BookOpen, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProgress } from './hooks/useCurriculum'
import { useUnits } from './hooks/useCurriculum'
import { useMyBadges } from './hooks/useBadges'
import { useAuthStore } from '@/store/authStore'

// Rank progression thresholds — mirrors backend calculateRank
const RANK_THRESHOLDS = [
  { title: 'Grammar Rookie', minXP: 0 },
  { title: 'Grammar Cadet', minXP: 25 },
  { title: 'Grammar Scout', minXP: 75 },
  { title: 'Grammar Knight', minXP: 150 },
  { title: 'Grammar Champion', minXP: 300 },
  { title: 'Grammar Master', minXP: 500 },
  { title: 'Grammar Legend', minXP: 1000 },
  { title: 'Grammar God', minXP: 2000 },
]

function getNextRank(currentXP: number) {
  for (const r of RANK_THRESHOLDS) {
    if (currentXP < r.minXP) return r
  }
  return null // already at max
}

export default function MyProgressPage() {
  const { profile } = useAuthStore()
  const { data: progress, isLoading: progressLoading } = useProgress()
  const { data: units } = useUnits()
  const { data: badges } = useMyBadges()

  const nextRank = progress ? getNextRank(progress.totalXP) : null
  const currentRankXP = progress ? (RANK_THRESHOLDS.find(r => r.title === progress.rankTitle)?.minXP ?? 0) : 0
  const nextRankXP = nextRank?.minXP ?? currentRankXP
  const xpToNext = nextRankXP - currentRankXP
  const xpProgress = progress ? Math.min(((progress.totalXP - currentRankXP) / (xpToNext || 1)) * 100, 100) : 0

  const completedUnits = units?.filter(u => u.status === 'completed').length ?? 0
  const totalUnits = units?.length ?? 0

  return (
    <div className="min-h-dvh bg-surface-950 pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <Link to="/dashboard" className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} className="text-zinc-400" />
        </Link>
        <h1 className="font-display font-bold text-white text-base">My Progress</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {progressLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="card-game h-24 animate-pulse" />)}
          </div>
        ) : progress ? (
          <>
            {/* Rank Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-game p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/30 to-primary-500/30 flex items-center justify-center">
                  <Trophy size={22} className="text-accent-400" />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Current Rank</p>
                  <p className="font-display font-black text-white text-lg">{progress.rankTitle}</p>
                </div>
              </div>

              {/* XP bar to next rank */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-500 text-xs">XP to next rank</span>
                  <span className="text-zinc-400 text-xs font-medium">
                    {progress.totalXP} / {nextRank ? nextRankXP : '∞'} XP
                  </span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                {nextRank && (
                  <p className="text-zinc-600 text-xs mt-1 text-right">Next: {nextRank.title}</p>
                )}
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 gap-3"
            >
              <StatBox icon={Zap} label="Total XP" value={progress.totalXP} color="accent" />
              <StatBox icon={Star} label="Total Stars" value={progress.totalStars} color="warning" />
              <StatBox icon={Flame} label="Current Streak" value={`${progress.currentStreak} days`} color="primary" />
              <StatBox icon={Trophy} label="Best Streak" value={`${progress.bestStreak} days`} color="accent" />
            </motion.div>

            {/* Curriculum progress */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-game p-4"
            >
              <h2 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-400" /> Learning Journey
              </h2>
              <div className="space-y-3">
                {units?.map((unit, i) => {
                  const pct = unit.totalChapters > 0 ? (unit.chaptersCompleted / unit.totalChapters) * 100 : 0
                  return (
                    <div key={unit.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-300 text-sm font-medium truncate flex-1">{unit.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {unit.status === 'completed' && (
                            <CheckCircle size={13} className="text-success-400" />
                          )}
                          <span className="text-zinc-500 text-xs">{unit.chaptersCompleted}/{unit.totalChapters}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${unit.status === 'completed' ? 'bg-success-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: 0.15 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  )
                })}
                {(!units || units.length === 0) && (
                  <p className="text-zinc-600 text-sm text-center py-2">No curriculum data yet.</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-500 text-xs">Units completed</span>
                <span className="text-white text-sm font-bold">{completedUnits} / {totalUnits}</span>
              </div>
            </motion.div>

            {/* Sentences metric */}
            {progress.structureCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card-game p-4 text-center border-primary-500/20 bg-primary-500/5"
              >
                <p className="text-4xl font-black text-primary-300 font-display">{progress.structureCount}</p>
                <p className="text-zinc-400 text-sm mt-1">English sentences you can build</p>
              </motion.div>
            )}

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-game p-4"
            >
              <h2 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Shield size={16} className="text-warning-400" /> Badges & Achievements
              </h2>
              {badges && badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge, i) => (
                    <motion.div
                      key={badge.badgeId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      className="p-3 rounded-xl border border-warning-500/20 bg-warning-500/5 flex items-start gap-2"
                    >
                      <span className="text-2xl shrink-0">{badge.icon}</span>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-bold truncate">{badge.name}</p>
                        <p className="text-zinc-500 text-xs leading-snug mt-0.5">{badge.description}</p>
                        <p className="text-zinc-700 text-xs mt-1">
                          {new Date(badge.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-3xl mb-2">🎯</p>
                  <p className="text-zinc-500 text-sm">No badges yet — complete quizzes to earn them!</p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <div className="card-game p-8 text-center">
            <p className="text-zinc-500 text-sm">Could not load progress data.</p>
          </div>
        )}

      </main>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ icon: Icon, label, value, color }: {
  icon: any, label: string, value: number | string, color: 'accent' | 'primary' | 'warning'
}) {
  const colorClass = color === 'accent' ? 'text-accent-400' : color === 'primary' ? 'text-primary-400' : 'text-warning-400'
  const bgClass = color === 'accent' ? 'bg-accent-500/15' : color === 'primary' ? 'bg-primary-500/15' : 'bg-warning-500/15'
  return (
    <div className="card-game p-4">
      <div className={`w-8 h-8 rounded-xl ${bgClass} flex items-center justify-center mb-2`}>
        <Icon size={16} className={colorClass} />
      </div>
      <p className={`font-display font-black text-xl ${colorClass}`}>{value}</p>
      <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}
