import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Zap, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  xp: number
  stars: number
  rankTitle: string
  isCurrentUser: boolean
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  callerEntry: LeaderboardEntry | null
  period: string
  totalStudents: number
}

type Period = 'alltime' | 'weekly' | 'monthly'

function useLeaderboard(period: Period) {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['leaderboard', period, uid],
    queryFn: async () => {
      const res = await api.get<LeaderboardResponse>(`/leaderboard?period=${period}`)
      return res.data
    },
    staleTime: 60_000,
    enabled: !!uid,
  })
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_COLORS: Record<number, string> = {
  1: 'border-yellow-500/40 bg-yellow-500/8',
  2: 'border-zinc-400/30 bg-zinc-400/5',
  3: 'border-amber-600/30 bg-amber-600/5',
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('alltime')
  const { data, isLoading } = useLeaderboard(period)

  return (
    <div className="min-h-dvh bg-surface-950 pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <Link to="/dashboard" className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} className="text-zinc-400" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-base">Leaderboard</h1>
          <p className="text-zinc-500 text-xs">{data?.totalStudents ?? 0} students ranked</p>
        </div>
        <Trophy size={18} className="text-warning-400" />
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Period switcher */}
        <div className="flex items-center gap-2 bg-zinc-900 rounded-2xl p-1 border border-zinc-800">
          {(['alltime', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                period === p
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p === 'alltime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-zinc-800/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {(data?.leaderboard ?? []).length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-2 mb-2"
              >
                {/* 2nd place */}
                <PodiumCard entry={(data?.leaderboard ?? [])[1]} medal={MEDALS[1]} />
                {/* 1st place — taller */}
                <PodiumCard entry={(data?.leaderboard ?? [])[0]} medal={MEDALS[0]} tall />
                {/* 3rd place */}
                <PodiumCard entry={(data?.leaderboard ?? [])[2]} medal={MEDALS[2]} />
              </motion.div>
            )}

            {/* Full list (4–10) */}
            <div className="space-y-2">
              {(data?.leaderboard ?? []).slice(3).map((entry, idx) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <EntryRow entry={entry} />
                </motion.div>
              ))}

              {/* Empty state */}
              {(data?.leaderboard ?? []).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">🏆</p>
                  <p className="text-zinc-500 text-sm">No rankings for this period yet.</p>
                  <p className="text-zinc-600 text-xs mt-1">Complete quizzes to appear here!</p>
                </div>
              )}
            </div>

            {/* Caller's own entry if outside top 10 */}
            {data?.callerEntry && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-zinc-600 text-xs mb-2 text-center">Your position</p>
                <EntryRow entry={data.callerEntry} highlight />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PodiumCard({ entry, medal, tall = false }: { entry: LeaderboardEntry, medal: string, tall?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all
      ${RANK_COLORS[entry.rank] ?? 'border-zinc-800 bg-zinc-800/20'}
      ${tall ? 'pt-5' : 'pt-3'}`}>
      <span className="text-2xl">{medal}</span>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center text-sm font-black text-white">
        {entry.displayName.charAt(0).toUpperCase()}
      </div>
      <p className="text-white text-xs font-bold truncate w-full">{entry.displayName.split(' ')[0]}</p>
      <div className="flex items-center gap-1">
        <Zap size={10} className="text-accent-400" />
        <span className="text-accent-400 text-xs font-bold">{entry.xp}</span>
      </div>
    </div>
  )
}

function EntryRow({ entry, highlight = false }: { entry: LeaderboardEntry, highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors
      ${entry.isCurrentUser || highlight
        ? 'border-primary-500/40 bg-primary-500/5'
        : 'border-zinc-800/60 bg-zinc-800/20 hover:bg-zinc-800/40'}`}
    >
      <span className="text-zinc-500 text-sm font-black w-6 text-center shrink-0">
        #{entry.rank}
      </span>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-black text-zinc-300 shrink-0">
        {entry.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-sm font-medium truncate">{entry.displayName}</p>
          {(entry.isCurrentUser || highlight) && (
            <span className="text-[10px] text-primary-400 font-bold">(you)</span>
          )}
        </div>
        <p className="text-zinc-600 text-xs truncate">{entry.rankTitle}</p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-accent-400 text-sm font-bold">{entry.xp} XP</span>
        <div className="flex items-center gap-1">
          <Star size={10} className="text-warning-400 fill-warning-400" />
          <span className="text-zinc-500 text-xs">{entry.stars}</span>
        </div>
      </div>
    </div>
  )
}
