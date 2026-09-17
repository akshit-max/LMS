import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Zap, 
  Star, 
  Flame, 
  Trophy, 
  CheckCircle, 
  BookOpen, 
  Shield,
  ChevronDown,
  LogOut,
  BarChart2,
  Award,
  Sparkles
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useProgress, useUnits } from './hooks/useCurriculum'
import { useMyBadges } from './hooks/useBadges'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'

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
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: progress, isLoading: progressLoading } = useProgress()
  const { data: units } = useUnits()
  const { data: badges } = useMyBadges()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const streak = progress?.currentStreak ?? 1
  const stars = progress?.totalStars ?? 20
  const totalXP = progress?.totalXP ?? 0

  const nextRank = progress ? getNextRank(progress.totalXP) : null
  const currentRankXP = progress ? (RANK_THRESHOLDS.find(r => r.title === progress.rankTitle)?.minXP ?? 0) : 0
  const nextRankXP = nextRank?.minXP ?? currentRankXP
  const xpToNext = nextRankXP - currentRankXP
  const xpProgress = progress ? Math.min(((progress.totalXP - currentRankXP) / (xpToNext || 1)) * 100, 100) : 0

  const completedUnits = units?.filter(u => u.status === 'completed').length ?? 0
  const totalUnits = units?.length ?? 0

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
                className="flex items-center gap-2 py-1 px-1.5 rounded-2xl hover:bg-slate-100 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5865f2] via-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white uppercase">
                  {firstName.charAt(0)}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    {firstName}
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
                        <p className="font-black text-xs text-slate-900">{fullName}</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{profile?.email}</p>
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
          
          {/* Title Header Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white/60 backdrop-blur-md p-6 sm:p-7 rounded-3xl border-2 border-white/80 shadow-md">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5865f2] text-white text-xs font-black shadow-md shadow-indigo-500/25">
                <BarChart2 className="w-4 h-4" />
                <span>Student Analytics</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
                My Adventure Progress
              </h1>

              <p className="text-slate-700 font-bold text-sm sm:text-base leading-relaxed">
                Track your level ranks, total experience points, completed units, and unlocked achievement badges!
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
                <span className="text-3xl shrink-0">💡</span>
                <p className="text-xs font-extrabold leading-snug">
                  Keep going! <br />
                  <span className="font-bold text-slate-800">Every lesson brings you closer to Grammar Legend! 💕</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* 3-Column Adventure Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Mascot & Carved Stone Column (3 cols) */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:col-span-3 space-y-4 pt-2">
              <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-6 border-2 border-white shadow-xl text-center space-y-4">
                
                {/* Fox Mascot Artwork Circle */}
                <div className="relative group">
                  <div className="w-40 h-40 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 p-1.5 shadow-2xl border-4 border-white mx-auto flex items-center justify-center text-8xl group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                    🦊
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/30 rounded-full text-[10px] font-black text-white">Grammo</div>
                  </div>
                </div>

                {/* Wooden Signpost Badge */}
                <div className="bg-gradient-to-b from-amber-800 via-amber-850 to-amber-950 text-amber-100 px-4 py-3 rounded-2xl border-2 border-amber-900 shadow-lg font-display font-black text-xs uppercase tracking-wider text-center">
                  Small Steps <br />
                  <span className="text-amber-300 text-sm">Big Writers! ✨</span>
                </div>

                {/* Rock Carving Box */}
                <div className="bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 border-2 border-slate-400 p-4 rounded-3xl shadow-inner text-center">
                  <p className="font-display font-black text-xs text-slate-700 uppercase tracking-widest leading-relaxed">
                    LEARN <br />
                    PRACTICE <br />
                    IMPROVE <br />
                    <span className="text-amber-600 font-extrabold text-sm">GROW</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Center Analytics Dashboard Column (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              
              {progressLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/70 rounded-3xl animate-pulse" />)}
                </div>
              ) : progress ? (
                <>
                  {/* Current Rank Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border-2 border-slate-100 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl shadow-lg border-2 border-white shrink-0">
                        🏆
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Current Hero Rank</p>
                        <p className="font-display font-black text-2xl text-slate-900">{progress.rankTitle}</p>
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>XP to next rank level</span>
                        <span className="text-[#5865f2] font-black">
                          {progress.totalXP} / {nextRank ? nextRankXP : 'Max'} XP
                        </span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <motion.div
                          className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${xpProgress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      {nextRank && (
                        <p className="text-[11px] font-extrabold text-slate-500 text-right">
                          Next Rank: <span className="text-slate-800">{nextRank.title}</span>
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* 4-Stat Cards Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <StatCard icon={Zap} label="Total Experience" value={`${progress.totalXP} XP`} color="sky" />
                    <StatCard icon={Star} label="Total Stars" value={`${progress.totalStars} Stars`} color="amber" />
                    <StatCard icon={Flame} label="Current Streak" value={`${progress.currentStreak} Days`} color="orange" />
                    <StatCard icon={Trophy} label="Best Streak" value={`${progress.bestStreak} Days`} color="indigo" />
                  </motion.div>

                  {/* Learning Journey Unit Progress */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border-2 border-slate-100 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#5865f2]" /> Learning Journey
                      </h2>
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {completedUnits} / {totalUnits} Units Completed
                      </span>
                    </div>

                    <div className="space-y-4">
                      {units?.map((unit, i) => {
                        const pct = unit.totalChapters > 0 ? (unit.chaptersCompleted / unit.totalChapters) * 100 : 0
                        return (
                          <div key={unit.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                              <span className="truncate flex-1 mr-2">{unit.title}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {unit.status === 'completed' && (
                                  <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                                )}
                                <span className="text-slate-500">{unit.chaptersCompleted}/{unit.totalChapters} Chapters</span>
                              </div>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                              <motion.div
                                className={`h-full rounded-full ${unit.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-400 to-[#5865f2]'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, delay: 0.1 + i * 0.05 }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {(!units || units.length === 0) && (
                        <p className="text-slate-400 text-xs text-center py-2 font-bold">No curriculum units found.</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Sentence Building Ability Metric */}
                  {progress.structureCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center shadow-xl space-y-1 relative overflow-hidden"
                    >
                      <Sparkles className="w-8 h-8 text-amber-300 absolute top-3 right-4 opacity-30" />
                      <p className="text-5xl font-black font-display tracking-tight text-amber-300">{progress.structureCount}</p>
                      <p className="text-sm font-extrabold text-indigo-100 uppercase tracking-wider">English Sentences You Can Build!</p>
                    </motion.div>
                  )}

                  {/* Badges & Achievements */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border-2 border-slate-100 shadow-2xl space-y-4"
                  >
                    <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Shield className="w-5 h-5 text-amber-500" /> Badges & Achievements
                    </h2>

                    {badges && badges.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {badges.map((badge, i) => (
                          <motion.div
                            key={badge.badgeId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.04 }}
                            className="p-3.5 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex items-start gap-3 shadow-xs"
                          >
                            <span className="text-3xl shrink-0">{badge.icon}</span>
                            <div className="min-w-0">
                              <p className="text-slate-900 text-xs font-black truncate">{badge.name}</p>
                              <p className="text-slate-600 text-[11px] font-bold leading-snug mt-0.5">{badge.description}</p>
                              <p className="text-amber-700 text-[10px] font-extrabold mt-1">
                                Earned: {new Date(badge.awardedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-4xl mb-2">🎯</p>
                        <p className="text-slate-700 font-extrabold text-xs">No badges unlocked yet!</p>
                        <p className="text-slate-400 font-bold text-[11px] mt-0.5">Complete chapters with 90%+ scores to earn shiny badges!</p>
                      </div>
                    )}
                  </motion.div>
                </>
              ) : (
                <div className="bg-white p-8 rounded-3xl text-center text-slate-500 font-bold">
                  Could not load progress data.
                </div>
              )}

            </div>

            {/* Right Directional Castle Signpost (3 cols) */}
            <div className="hidden lg:flex flex-col items-center justify-center lg:col-span-3 space-y-4 pt-2">
              <div className="bg-gradient-to-b from-amber-900 via-amber-850 to-amber-950 text-amber-100 p-6 rounded-3xl border-4 border-amber-950 shadow-2xl text-center space-y-4 w-full">
                <span className="text-4xl block animate-bounce">🏰</span>
                <p className="font-display font-black text-sm uppercase tracking-widest text-amber-300">Grammar Castle</p>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-800 to-amber-900 py-3 px-4 rounded-2xl border-2 border-amber-700 font-black text-xs tracking-widest uppercase shadow-md hover:scale-105 transition-transform">EXPLORE</div>
                  <div className="bg-gradient-to-r from-amber-800 to-amber-900 py-3 px-4 rounded-2xl border-2 border-amber-700 font-black text-xs tracking-widest uppercase shadow-md hover:scale-105 transition-transform">LEARN</div>
                  <div className="bg-gradient-to-r from-amber-800 to-amber-900 py-3 px-4 rounded-2xl border-2 border-amber-700 font-black text-xs tracking-widest uppercase shadow-md hover:scale-105 transition-transform">PRACTICE</div>
                  <div className="bg-gradient-to-r from-orange-600 to-amber-600 py-3 px-4 rounded-2xl border-2 border-orange-400 font-black text-xs tracking-widest uppercase text-white shadow-xl hover:scale-105 transition-transform">MASTER</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any, label: string, value: string, color: 'sky' | 'amber' | 'orange' | 'indigo'
}) {
  const colorStyles = {
    sky: 'bg-sky-50 text-sky-600 border-sky-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  }[color]

  return (
    <div className={`p-4 rounded-3xl border-2 bg-white shadow-md space-y-1.5 ${colorStyles.split(' ')[2]}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${colorStyles}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-display font-black text-xl text-slate-900 leading-none pt-1">{value}</p>
      <p className="text-slate-500 font-bold text-xs">{label}</p>
    </div>
  )
}

