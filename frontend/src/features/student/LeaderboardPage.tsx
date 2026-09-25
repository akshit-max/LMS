import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Zap,
  Star,
  Flame,
  ChevronDown,
  LogOut,
  BarChart2,
  Crown,
  Medal,
  Award
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useProgress } from './hooks/useCurriculum'
import { useUserLeaderboardRank, getTop3RankBadge } from './hooks/useBadges'
import { auth } from '@/lib/firebase'

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

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: progress } = useProgress()
  const { data: userRank } = useUserLeaderboardRank()
  const top3Badge = getTop3RankBadge(userRank)
  const [period, setPeriod] = useState<Period>('alltime')
  const { data, isLoading } = useLeaderboard(period)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const streak = progress?.currentStreak ?? 1
  const stars = progress?.totalStars ?? 20
  const totalXP = progress?.totalXP ?? 0

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800 font-sans flex flex-col selection:bg-orange-500 selection:text-white w-full">

      {/* ── 1. TOP HEADER BAR ────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Back to Home Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs transition-all border border-slate-200/70 shadow-xs group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          {/* Center Brand Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-400 to-amber-300 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white rounded-[13px] flex items-center justify-center text-xl">
                🦊
              </div>
            </div>
            <div className="text-center">
              <span className="font-display font-black text-lg text-slate-900 tracking-tight block leading-none">
                GrammoQuest
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                GRAMMAR ADVENTURE
              </span>
            </div>
          </Link>

          {/* Right Stats & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-black shadow-xs">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak}d <span className="hidden md:inline text-[10px] text-slate-500 uppercase font-bold">Streak</span></span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-xs font-black shadow-xs">
              <Zap className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{totalXP} <span className="hidden md:inline text-[10px] text-slate-500 uppercase font-bold">XP</span></span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-black shadow-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars} <span className="hidden md:inline text-[10px] text-slate-500 uppercase font-bold">Stars</span></span>
            </div>

            {/* Profile Avatar */}
            <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-2xl hover:bg-slate-100 transition-colors text-left group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5865f2] via-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white uppercase ${top3Badge ? top3Badge.haloClass : ''}`}>
                  {firstName.charAt(0)}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    {firstName}
                    {top3Badge && <span>{top3Badge.icon}</span>}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-40 space-y-1"
                    >
                      <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl mb-1 border border-indigo-100">
                        <p className="font-black text-xs text-slate-900 flex items-center gap-1">
                          {fullName}
                          {top3Badge && <span>{top3Badge.icon}</span>}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{profile?.email}</p>
                        {top3Badge && (
                          <div className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] ${top3Badge.badgeBg}`}>
                            <span>{top3Badge.shortLabel}</span>
                          </div>
                        )}
                      </div>
                      <Link to="/progress" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                        <BarChart2 className="w-4 h-4 text-[#5865f2]" />
                        <span>My Profile & Stats</span>
                      </Link>
                      <Link to="/leaderboard" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Leaderboard</span>
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                      <button onClick={() => auth.signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 text-left">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </header>

      {/* ── 2. HERO LANDSCAPE & MAIN CONTENT CONTAINER ──────────────────────── */}
      <div className="w-full flex-1 relative overflow-hidden bg-gradient-to-b from-[#87ceeb] via-[#b0e0e6] via-50% to-[#f4f7fc] p-4 sm:p-6 lg:p-8">

        {/* Sky Clouds Backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <svg className="w-full h-full" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
            <circle cx="150" cy="80" r="60" fill="white" opacity="0.6" />
            <circle cx="200" cy="70" r="45" fill="white" opacity="0.6" />
            <circle cx="1200" cy="90" r="70" fill="white" opacity="0.5" />
            <circle cx="1260" cy="80" r="50" fill="white" opacity="0.5" />
            <path d="M900 350 L1050 160 L1200 350 Z" fill="#93c5fd" opacity="0.5" />
            <path d="M1050 350 L1180 190 L1350 350 Z" fill="#bfdbfe" opacity="0.4" />
            <path d="M-100 450 Q 250 280, 600 420 T 1500 380 L 1500 600 L -100 600 Z" fill="#86efac" opacity="0.4" />
            <path d="M-50 500 Q 400 350, 950 480 T 1550 450 L 1550 600 L -50 600 Z" fill="#4ade80" opacity="0.3" />
          </svg>
        </div>

        <div className="w-full max-w-[1550px] mx-auto relative z-10 space-y-6">

          {/* Header Title Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white/60 backdrop-blur-md p-6 sm:p-7 rounded-3xl border-2 border-white/80 shadow-md">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-500/25">
                <Trophy className="w-4 h-4" />
                <span>Grammar Champions</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
                Global Leaderboard
              </h1>

              <p className="text-slate-700 font-bold text-sm sm:text-base leading-relaxed">
                Rank among top grammar heroes by earning XP through daily practice, quizzes, and streak combos!
              </p>
            </div>

            {/* Sticky Yellow Post-it Note */}
            <motion.div
              initial={{ rotate: -2, scale: 0.95 }}
              animate={{ rotate: 1, scale: 1 }}
              className="bg-[#fef08a] text-amber-950 p-5 rounded-3xl shadow-2xl border-2 border-amber-300 max-w-xs shrink-0 relative transform hover:rotate-0 transition-transform"
            >
              <div className="w-4 h-4 bg-amber-400 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 border-2 border-amber-500 shadow-xs" />
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">👑</span>
                <p className="text-xs font-extrabold leading-snug">
                  Reach Top 3! <br />
                  <span className="font-bold text-slate-800">Earn special trophy badges and rank bragging rights! 💕</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* 3-Column Adventure Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Mascot & Quick Quest Column (3 cols) */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:col-span-3 space-y-4 pt-2">
              <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 border-2 border-white shadow-xl text-center space-y-4">

                {/* Fox Mascot Artwork Circle */}
                <div className="relative group">
                  <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 p-1.5 shadow-xl border-4 border-white mx-auto flex items-center justify-center text-7xl group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                    🦊
                    <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-black/25 rounded-full text-[10px] font-black text-white backdrop-blur-xs">
                      Grammo
                    </div>
                  </div>
                </div>

                {/* Wooden Signpost Badge */}
                <div className="bg-gradient-to-r from-[#5865f2] to-indigo-600 text-white px-4 py-3 rounded-2xl border border-indigo-400 shadow-md font-display font-black text-xs uppercase tracking-wider text-center">
                  Small Steps <br />
                  <span className="text-amber-300 text-sm">Big Writers! ✨</span>
                </div>

                {/* Daily Quest Rules Card */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl shadow-xs text-left space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Daily Quest Rules</p>
                  <div className="space-y-2 text-xs font-extrabold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                      <span>Earn XP by taking daily quizzes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                      <span>Build long streak combos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                      <span>Claim Top 3 Leader status!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Leaderboard Card Column (6 cols) */}
            <div className="lg:col-span-6 space-y-4">

              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-100 space-y-6">

                {/* Period Filter Switcher Buttons */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {(['alltime', 'weekly', 'monthly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all capitalize ${period === p
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      {p === 'alltime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* V.I.P. Champion Spotlight Banner (If Current User is Top 3) */}
                    {top3Badge && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-2 border-amber-300 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3.5 relative z-10">
                          <span className="text-4xl filter drop-shadow-md select-none">{top3Badge.icon}</span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-black/25 text-amber-100 px-2.5 py-0.5 rounded-full shadow-2xs">
                              {top3Badge.shortLabel} Spotlight
                            </span>
                            <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-tight mt-0.5 drop-shadow-xs">
                              {top3Badge.title}
                            </h3>
                            <p className="text-amber-50 text-xs sm:text-sm font-extrabold drop-shadow-2xs mt-0.5">
                              {top3Badge.bannerMessage}
                            </p>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/40 text-xs font-black text-white shadow-xs shrink-0">
                          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>VIP Hero</span>
                        </div>
                      </motion.div>
                    )}
                    {/* Top 3 Podium Cards & 3D Pedestals */}
                    {(data?.leaderboard ?? []).length >= 3 && (
                      <div className="space-y-0 pt-1 pb-1">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-3 gap-3 items-end relative z-10 px-1"
                        >
                          {/* 2nd place — Silver */}
                          <div className="flex flex-col items-center">
                            <PodiumCard entry={(data?.leaderboard ?? [])[1]} medal={MEDALS[1]} rank={2} />
                            <div className="w-[85%] bg-gradient-to-b from-[#e9ecef] to-[#ced4da] border-t border-[#f8f9fa] h-5 rounded-b-xl flex items-center justify-center font-display font-extrabold text-[9px] text-[#495057] shadow-inner">
                              2ND
                            </div>
                          </div>

                          {/* 1st place — Gold Champion */}
                          <div className="flex flex-col items-center relative">
                            {/* Ambient Gold Aura Glow */}
                            <div className="absolute inset-0 bg-[#fcc419]/20 blur-xl rounded-full -z-10" />
                            <PodiumCard entry={(data?.leaderboard ?? [])[0]} medal={MEDALS[0]} rank={1} tall />
                            <div className="w-[90%] bg-gradient-to-b from-[#ffec99] to-[#fcc419] border-t border-[#fffbe6] h-7 rounded-b-xl flex items-center justify-center font-display font-black text-[10px] text-[#b06500] shadow-inner tracking-widest">
                              1ST
                            </div>
                          </div>

                          {/* 3rd place — Bronze */}
                          <div className="flex flex-col items-center">
                            <PodiumCard entry={(data?.leaderboard ?? [])[2]} medal={MEDALS[2]} rank={3} />
                            <div className="w-[85%] bg-gradient-to-b from-[#ffd8a8] to-[#ffa94d] border-t border-[#fff0e6] h-4 rounded-b-xl flex items-center justify-center font-display font-extrabold text-[8px] text-[#d9480f] shadow-inner">
                              3RD
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Rankings List (4+) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {(data?.leaderboard ?? []).slice(3).map((entry, idx) => (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <EntryRow entry={entry} />
                        </motion.div>
                      ))}

                      {/* Empty state */}
                      {(data?.leaderboard ?? []).length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-3xl mb-1">🏆</p>
                          <p className="text-slate-700 font-extrabold text-xs">No rankings for this period yet.</p>
                          <p className="text-slate-400 font-bold text-[10px] mt-0.5">Complete quizzes to claim the top spot!</p>
                        </div>
                      )}
                    </div>

                    {/* Caller's own entry if outside top 10 */}
                    {data?.callerEntry && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-slate-500 font-black text-[10px] mb-1 text-center uppercase tracking-wider">Your Position</p>
                        <EntryRow entry={data.callerEntry} highlight />
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>

            {/* Right Directional Castle Signpost (3 cols) */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:col-span-3 space-y-4 pt-2">
              <div className="bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 text-amber-100 p-5 rounded-3xl border-4 border-amber-900 shadow-xl text-center space-y-3 w-full">
                <span className="text-3xl block filter drop-shadow-sm">🏰</span>
                <div>
                  <p className="font-display font-black text-xs uppercase tracking-widest text-amber-300">Grammar Castle</p>
                  <p className="text-[9px] text-amber-200 font-bold mt-0.5">Choose your next quest</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-amber-900/90 hover:bg-amber-800 text-amber-100 py-2 px-3 rounded-xl border border-amber-700/80 font-black text-[11px] tracking-widest uppercase shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>Explore Castle</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </button>
                  <button
                    onClick={() => navigate('/units/1')}
                    className="w-full bg-amber-900/90 hover:bg-amber-800 text-amber-100 py-2 px-3 rounded-xl border border-amber-700/80 font-black text-[11px] tracking-widest uppercase shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>Learn Lessons</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </button>
                  <button
                    onClick={() => navigate('/practice')}
                    className="w-full bg-amber-900/90 hover:bg-amber-800 text-amber-100 py-2 px-3 rounded-xl border border-amber-700/80 font-black text-[11px] tracking-widest uppercase shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>Practice Arena</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2 px-3 rounded-xl border border-orange-400 font-black text-[11px] tracking-widest uppercase shadow-md flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>Master Quiz</span>
                    <span className="group-hover:translate-x-1 transition-transform">👑</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

function PodiumCard({ entry, medal, rank, tall = false }: { entry: LeaderboardEntry; medal: string; rank: number; tall?: boolean }) {
  const isGold = rank === 1
  const isSilver = rank === 2
  const isBronze = rank === 3

  const cardContainerStyle = isGold
    ? 'bg-gradient-to-b from-[#fffbe6] to-[#ffec99] border-2 border-[#f5c211] text-[#5c3c00] shadow-[0_12px_24px_-8px_rgba(245,194,17,0.5)]'
    : isSilver
    ? 'bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef] border-2 border-[#ced4da] text-[#343a40] shadow-[0_12px_24px_-8px_rgba(173,181,189,0.5)]'
    : 'bg-gradient-to-b from-[#fff0e6] to-[#ffd8a8] border-2 border-[#ffa94d] text-[#854000] shadow-[0_12px_24px_-8px_rgba(255,169,77,0.5)]'

  const avatarHalo = isGold
    ? 'ring-4 ring-white/60 shadow-md bg-gradient-to-br from-[#fcc419] to-[#e67700] text-white font-black border-2 border-white'
    : isSilver
    ? 'ring-4 ring-white/60 shadow-md bg-gradient-to-br from-[#ced4da] to-[#868e96] text-white font-black border-2 border-white'
    : 'ring-4 ring-white/60 shadow-md bg-gradient-to-br from-[#ffa94d] to-[#d9480f] text-white font-black border-2 border-white'

  const xpBadgeStyle = isGold
    ? 'bg-white/90 text-[#e67700] border border-[#fcc419]'
    : isSilver
    ? 'bg-white/90 text-[#495057] border border-[#ced4da]'
    : 'bg-white/90 text-[#d9480f] border border-[#ffa94d]'

  return (
    <motion.div
      whileHover={{ scale: isGold ? 1.03 : 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`relative flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl cursor-pointer select-none w-full ${cardContainerStyle} ${tall ? 'py-3.5 z-20' : 'py-2.5 z-10'}`}
    >
      {/* Crown / Trophy Badge on Top */}
      <div className="relative mb-1 flex items-center gap-1 select-none">
        <span className="text-xl sm:text-2xl filter drop-shadow-xs inline-block">
          {isGold ? '👑' : medal}
        </span>
      </div>

      {/* Avatar Circle with Badge */}
      <div className="relative mb-1">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl text-base sm:text-lg flex items-center justify-center border border-white uppercase ${avatarHalo}`}>
          {entry.displayName.charAt(0)}
        </div>
        {entry.isCurrentUser && (
          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-rose-600 text-white font-black text-[7px] rounded-full border border-white shadow-2xs tracking-wider uppercase">
            YOU
          </span>
        )}
      </div>

      {/* Student Name */}
      <p className="font-display font-black text-xs truncate w-full tracking-tight drop-shadow-2xs mt-0.5">
        {entry.displayName.split(' ')[0]}
      </p>

      {/* XP Stat Pill */}
      <div className={`flex items-center gap-1 mt-1 font-black text-[10px] px-2 py-0.5 rounded-full ${xpBadgeStyle}`}>
        <Zap className="w-2.5 h-2.5 fill-current" />
        <span>{entry.xp} XP</span>
      </div>
    </motion.div>
  )
}

function EntryRow({ entry, highlight = false }: { entry: LeaderboardEntry; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${entry.isCurrentUser || highlight
        ? 'bg-amber-50/90 border-amber-300 shadow-md'
        : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}>
      <span className="text-slate-400 font-black text-xs w-6 text-center shrink-0">
        #{entry.rank}
      </span>

      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5865f2] to-indigo-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-xs shrink-0 uppercase">
        {entry.displayName.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-display font-black text-sm text-slate-900 truncate">{entry.displayName}</p>
          {(entry.isCurrentUser || highlight) && (
            <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">(YOU)</span>
          )}
        </div>
        <p className="text-slate-400 font-extrabold text-[11px] truncate">{entry.rankTitle}</p>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <span className="text-sky-600 font-black text-xs flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
          {entry.xp} XP
        </span>
        <span className="text-amber-500 font-black text-[11px] flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {entry.stars}
        </span>
      </div>
    </div>
  )
}
