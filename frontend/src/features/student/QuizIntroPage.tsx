import { useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Play, 
  Star, 
  Target, 
  Clock, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Zap, 
  ChevronDown, 
  LogOut, 
  BarChart2, 
  Trophy, 
  BookOpen, 
  TrendingUp,
  Quote
} from 'lucide-react'
import { useStartAttempt } from './hooks/useQuiz'
import { useProgress } from './hooks/useCurriculum'
import { useQuizSessionStore } from '@/store/quizSessionStore'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'

export default function QuizIntroPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const startSession = useQuizSessionStore(s => s.startSession)
  const { mutate: startAttempt, isPending, error } = useStartAttempt()
  const { data: progress } = useProgress()
  const { profile } = useAuthStore()

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = progress?.totalXP ?? 315
  const streak = progress?.currentStreak ?? 1
  const stars = progress?.totalStars ?? 20

  const handleStart = () => {
    if (!quizId) return
    startAttempt(quizId, {
      onSuccess: (data) => {
        startSession(data.attemptId, quizId, data.questions)
        navigate(`/quiz/${quizId}/play`, { replace: true })
      },
    })
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col font-sans selection:bg-[#5865f2] selection:text-white bg-[#0e1626] overflow-x-hidden">
      
      {/* ── 1. BACKGROUND ARTWORK (Clean version without baked-in quiz) ───────── */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/quiz_intro_bg_clean.jpg')` }}
      >
        {/* Subtle Overlay to make the center card pop while keeping background vivid */}
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px]" />
      </div>

      {/* ── 2. STICKY TOP NAVBAR ───────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors border border-slate-200/80 group shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Lesson</span>
          </button>

          {/* Center Brand */}
          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
              <span className="text-xl">🦊</span>
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-black text-base text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                Grammar Adventure
              </span>
            </div>
          </RouterLink>

          {/* Right Stats & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50/95 border border-orange-200/90 text-orange-600 text-xs font-black shadow-2xs">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak}d STREAK</span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50/95 border border-sky-200/90 text-sky-600 text-xs font-black shadow-2xs">
              <Zap className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{totalXP} XP</span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/95 border border-amber-200/90 text-amber-600 text-xs font-black shadow-2xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars} STARS</span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5865f2] to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm uppercase">
                  {firstName.charAt(0)}
                </div>
                <div className="hidden md:block leading-tight">
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
                      className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 space-y-1"
                    >
                      <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl mb-1 border border-indigo-100">
                        <p className="font-black text-xs text-slate-900">{fullName}</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{profile?.email}</p>
                      </div>
                      <RouterLink to="/progress" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                        <BarChart2 className="w-4 h-4 text-[#5865f2]" />
                        <span>My Profile & Stats</span>
                      </RouterLink>
                      <RouterLink to="/leaderboard" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Leaderboard</span>
                      </RouterLink>
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

      {/* ── 3. MAIN ARENA CONTAINER: Centered Quiz Card on Background Desk ── */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex items-center justify-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[540px] sm:max-w-[580px] bg-white rounded-[32px] p-6 sm:p-9 border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] space-y-6 text-center relative overflow-hidden ring-1 ring-slate-900/5 mx-auto"
        >
          {/* Top Decorative Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

          {/* Magical Icon & Clean Header */}
          <div className="pt-2 space-y-2">
            <motion.div 
              className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#5865f2] via-indigo-600 to-purple-600 text-white rounded-2xl p-1 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-3xl relative"
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              📖
              <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
            </motion.div>

            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-100/90 px-3 py-1 rounded-full border border-slate-200/60 mt-2">
                READY TO TEST YOURSELF?
              </span>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight mt-1.5">
                Grammar Quiz
              </h1>
            </div>
          </div>

          {/* 3 Key Metric Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* 5 Questions */}
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 shadow-xs flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <Target className="w-4 h-4" />
              </div>
              <p className="font-display font-black text-lg text-slate-900 leading-none">5</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1">Questions</p>
            </div>

            {/* 30s Per Q */}
            <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200/80 shadow-xs flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <p className="font-display font-black text-lg text-slate-900 leading-none">30s</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1">Per Question</p>
            </div>

            {/* 90% To Pass */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 shadow-xs flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="font-display font-black text-lg text-slate-900 leading-none">90%</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1">To Pass</p>
            </div>
          </div>

          {/* Star Rewards Table */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-left space-y-3 shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 border-b border-amber-200/60 pb-2 text-center">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-display font-black text-xs text-amber-950 uppercase tracking-widest">
                Star Rewards
              </span>
            </div>

            <div className="space-y-2 text-xs font-black">
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-amber-500 text-xs">⭐⭐⭐</span>
                <span className="text-slate-700 font-extrabold text-xs">90–100%</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#5865f2] border border-indigo-200/60 font-black text-xs">
                  +50 XP
                </span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-amber-500 text-xs">⭐⭐</span>
                <span className="text-slate-700 font-extrabold text-xs">70–89%</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#5865f2] border border-indigo-200/60 font-black text-xs">
                  +30 XP
                </span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-amber-500 text-xs">⭐</span>
                <span className="text-slate-700 font-extrabold text-xs">50–69%</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#5865f2] border border-indigo-200/60 font-black text-xs">
                  +15 XP
                </span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold">
              Failed to start evaluation quiz attempt. Please try again.
            </div>
          )}

          {/* Vibrant Orange CTA Button */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleStart}
              disabled={isPending}
              className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white shadow-[0_10px_25px_-5px_rgba(249,115,22,0.45)] hover:shadow-[0_15px_30px_-5px_rgba(249,115,22,0.6)] transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading quiz arena...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> Start Quiz
                </span>
              )}
            </button>

            <p className="text-[11px] font-extrabold text-slate-400">
              Questions are shuffled each attempt
            </p>
          </div>

        </motion.div>

      </main>

    </div>
  )
}
