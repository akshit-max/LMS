import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Flame,
  Zap,
  Star,
  RotateCcw,
  Home,
  ChevronDown,
  Trophy,
  LogOut,
  BarChart2,
  Target,
  FileText,
  X,
  ArrowRight
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuizSessionStore } from '@/store/quizSessionStore'
import { useProgress } from './hooks/useCurriculum'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'

export default function QuizResultPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { result, reset, questions } = useQuizSessionStore()
  const { data: userProgress } = useProgress()
  const { profile } = useAuthStore()

  const [showReview, setShowReview] = useState(false)
  const [showUnitCompleteModal, setShowUnitCompleteModal] = useState(true)
  const [showRankUpModal, setShowRankUpModal] = useState(true)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // If no result in store (e.g. page refresh), redirect to intro
  if (!result) {
    navigate(`/quiz/${quizId}`, { replace: true })
    return null
  }

  const score = result.score
  const passed = result.passed
  const starsArray = [1, 2, 3]

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = userProgress?.totalXP ?? (900 + (result?.xpEarned || 0))
  const streak = userProgress?.currentStreak ?? 2
  const stars = userProgress?.totalStars ?? 51

  const correctCount = result.questionResults ? result.questionResults.filter(q => q.isCorrect).length : 5
  const totalCount = result.questionResults ? result.questionResults.length : 5

  // Multi-Tier Mood Configurations for Children matching exact user reference screenshot
  const moodConfig = useMemo(() => {
    if (score === 100) {
      return {
        ribbonBadge: '👑 PERFECT SCORE! 👑',
        ribbonBg: 'bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 shadow-orange-500/50',
        scoreColor: 'text-orange-500',
        speechBubble: 'Unbelievable! You got a PERFECT SCORE! 🌟',
        subtitle: 'You are a true Grammar Superhero! Outstanding work!',
        mascotSign: 'Practice today, brighter tomorrow! ❤️',
        bottomQuote: 'Every effort you make builds a brighter you!',
        particleCount: 32,
        emojis: ['🎉', '🎗️', '🏆', '🌟', '👑', '🍬', '🍦', '✨', '🥳', '🎀', '🎊']
      }
    } else if (passed && score >= 90) {
      return {
        ribbonBadge: '🎉 LEVEL MASTERED! 🎉',
        ribbonBg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-emerald-500/50',
        scoreColor: 'text-[#10b981]',
        speechBubble: 'FANTASTIC! You mastered this chapter! 🎉',
        subtitle: "Incredible job! You've officially passed and mastered this topic!",
        mascotSign: 'Practice today, brighter tomorrow! ❤️',
        bottomQuote: 'Every effort you make builds a brighter you!',
        particleCount: 24,
        emojis: ['⭐', '🎗️', '✨', '🎈', '🏆', '🍦', '🎉', '🎀']
      }
    } else if (passed) {
      return {
        ribbonBadge: '🎉 LEVEL PASSED! 🎉',
        ribbonBg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-emerald-500/50',
        scoreColor: 'text-[#10b981]',
        speechBubble: 'Great effort! You passed this level! 🐾',
        subtitle: "You're on the right track! You have unlocked the next step.",
        mascotSign: 'Practice today, brighter tomorrow! ❤️',
        bottomQuote: 'Every effort you make builds a brighter you!',
        particleCount: 18,
        emojis: ['✨', '⭐', '🎈', '🎯', '🌟', '🎗️', '💖']
      }
    } else {
      return {
        ribbonBadge: '💪 KEEP GOING! 💪',
        ribbonBg: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-orange-500/50',
        scoreColor: 'text-orange-500',
        speechBubble: 'Mistakes help us learn and grow stronger! 🐾',
        subtitle: "Every question you practice makes your brain super smart! Let's try again!",
        mascotSign: 'Mistakes today, mastery tomorrow! ❤️',
        bottomQuote: 'Mistakes are proof that you are trying!',
        particleCount: 14,
        emojis: ['🌱', '✨', '🐾', '💡', '🎈', '💖']
      }
    }
  }, [score, passed])

  // Falling particles tailored to score mood (Ribbons, Confetti, Props)
  const celebrationParticles = useMemo(() => {
    return Array.from({ length: moodConfig.particleCount }).map((_, i) => ({
      id: i,
      emoji: moodConfig.emojis[i % moodConfig.emojis.length],
      left: `${(i * (100 / moodConfig.particleCount)) + 1}%`,
      delay: (i * 0.2) % 2.5,
      duration: 3.0 + ((i * 0.4) % 2.5),
      scale: 0.85 + ((i % 3) * 0.3),
    }))
  }, [moodConfig])

  const handleRetry = () => {
    reset()
    navigate(`/quiz/${quizId}`, { replace: true })
  }

  const handleHome = () => {
    reset()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col font-sans selection:bg-[#5865f2] selection:text-white bg-[#0e1626] overflow-x-hidden">

      {/* ── 1. BACKGROUND ARTWORK ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/quiz_intro_bg_clean.jpg')` }}
      >
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px]" />
      </div>

      {/* ── 2. FALLING CELEBRATION PARTICLES (Ribbons, Confetti & Props) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {celebrationParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: -80, opacity: 0, rotate: 0 }}
            animate={{
              y: ['0vh', '108vh'],
              opacity: [0, 1, 1, 0],
              rotate: [0, 60, -60, 120]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute text-2xl sm:text-3xl select-none filter drop-shadow-md"
            style={{ left: p.left, scale: p.scale }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </div>

      {/* ── 3. STICKY TOP NAVBAR ───────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Back Button */}
          <button
            onClick={handleHome}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors border border-slate-200/80 group shadow-2xs cursor-pointer"
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
                className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group cursor-pointer"
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
                      <button onClick={() => auth.signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 text-left cursor-pointer">
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

      {/* ── 4. MAIN RICH RESULTS GRID (MATCHING USER REFERENCE SCREENSHOT) ── */}
      <main className="flex-1 relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT SIDEBAR: MASCOT SPEECH BUBBLES & NOTE CARD (3 cols) ── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center space-y-4 pt-2">

            {/* Speech Bubble floating over Fox Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-amber-300 shadow-xl text-slate-800 text-center relative max-w-[240px]"
            >
              <p className="font-display font-black text-xs sm:text-sm text-slate-900 leading-snug">
                {moodConfig.speechBubble}
              </p>
              <div className="w-3.5 h-3.5 bg-white border-b-2 border-r-2 border-amber-300 rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2" />
            </motion.div>

            {/* Mascot Sign Note Card matching User Screenshot */}
            <div className="bg-white/90 border-2 border-amber-300/80 rounded-2xl p-4 text-center max-w-[240px] shadow-md space-y-1">
              <p className="font-display font-black text-xs text-slate-900 leading-snug">
                {moodConfig.mascotSign}
              </p>
            </div>

          </div>

          {/* ── CENTER COLUMN: MAIN PARCHMENT SCORE CARD (6 cols) ──────────── */}
          <div className="lg:col-span-6 w-full max-w-lg mx-auto">

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-[#fffdfa]/95 backdrop-blur-xl rounded-[38px] p-6 sm:p-8 border-4 border-amber-200/90 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] relative overflow-visible text-center space-y-4"
            >

              {/* Radial Light Glow behind Parchment Card */}
              {score >= 80 && (
                <div className="absolute -inset-4 rounded-[48px] bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20 blur-xl pointer-events-none -z-10 animate-pulse" />
              )}

              {/* 3 Gold Stars Crown atop Banner & 3D Curved Ribbon Banner */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                {/* Crown Stars */}
                <div className="flex items-center gap-1 -mb-2 relative z-30">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-md -rotate-12" />
                  <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-lg -mt-2" />
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-md rotate-12" />
                </div>

                {/* 3D Ribbon Banner */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 250, delay: 0.3 }}
                  className={`px-8 py-2.5 rounded-full font-display font-black text-base sm:text-lg text-white shadow-xl tracking-wide whitespace-nowrap flex items-center gap-2 border-2 border-white ${moodConfig.ribbonBg}`}
                >
                  <span>{moodConfig.ribbonBadge}</span>
                </motion.div>
              </div>

              {/* Header Subtitle */}
              <div className="pt-6">
                <p className="text-xs sm:text-sm font-extrabold text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {moodConfig.subtitle}
                </p>
              </div>

              {/* Big Energetic Percentage Score Display framed by Laurel Leaves */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.35 }}
                className="py-1 flex items-center justify-center gap-3"
              >
                <span className="text-3xl text-emerald-600 font-bold select-none opacity-80 hidden sm:inline">🌿</span>
                <span className={`font-display font-black text-6xl sm:text-7xl tracking-tight leading-none filter drop-shadow-sm ${moodConfig.scoreColor}`}>
                  {result.score}%
                </span>
                <span className="text-3xl text-emerald-600 font-bold select-none opacity-80 hidden sm:inline scale-x-[-1]">🌿</span>
              </motion.div>

              {/* ── SEQUENTIAL GAME STAR REVEAL ANIMATION (STARS POP ONE BY ONE) ── */}
              <div className="flex items-center justify-center gap-3.5 py-1">
                {starsArray.map((s, i) => {
                  const isEarned = s <= result.starsEarned
                  return (
                    <div key={s} className="relative">
                      {/* Sparkle bursting effect behind earned stars */}
                      {isEarned && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.8, 0], opacity: [0, 0.8, 0] }}
                          transition={{ delay: 0.45 + i * 0.35, duration: 0.6 }}
                          className="absolute inset-0 bg-amber-400 rounded-full blur-md"
                        />
                      )}
                      <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -45 }}
                        animate={{ scale: [0, 1.45, 0.9, 1], opacity: 1, rotate: [-45, 15, 0] }}
                        transition={{
                          delay: 0.45 + i * 0.35,
                          duration: 0.5,
                          type: 'spring',
                          stiffness: 280,
                          damping: 14
                        }}
                      >
                        <Star
                          className={`w-11 h-11 sm:w-12 sm:h-12 transition-all duration-300 ${isEarned
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.8)]'
                              : 'text-slate-200 fill-slate-100'
                            }`}
                        />
                      </motion.div>
                    </div>
                  )
                })}
              </div>

              {/* Festive Reward Badges (XP, Personal Best, Combo) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#5865f2] font-black text-xs flex items-center gap-1.5 shadow-2xs">
                  <Zap className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                  <span>+{result.xpEarned} XP earned</span>
                </div>

                {result.personalBest && (
                  <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <span>🏆 Personal Best!</span>
                  </div>
                )}

                {result.maxCombo > 1 && (
                  <div className="px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <span>🔥 {result.maxCombo}x Combo!</span>
                  </div>
                )}
              </div>

              {/* Attempt Sub-Info */}
              <p className="text-xs font-extrabold text-slate-400">
                Attempt #{result.attemptNumber} &bull; {correctCount}/{totalCount} correct
              </p>

              {/* CTA Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={passed ? handleHome : handleRetry}
                  className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 border-b-4 border-orange-700 active:scale-[0.98] cursor-pointer"
                >
                  <span>{passed ? 'Continue Journey' : 'Try Again'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleHome}
                    className="py-3 px-4 rounded-2xl font-display font-black text-xs tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setShowReview(true)}
                    className="py-3 px-4 rounded-2xl font-display font-black text-xs tracking-wide bg-indigo-50 hover:bg-indigo-100 text-[#5865f2] border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-[#5865f2]" />
                    <span>Review ({correctCount}/{totalCount})</span>
                  </button>
                </div>
              </div>

              {/* Bottom Card Quote Box inside Parchment matching user reference screenshot */}
              <div className="mt-3 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 text-left">
                <p className="text-[11px] font-extrabold text-slate-700 leading-snug italic">
                  “{moodConfig.bottomQuote}”
                  <span className="block font-black text-[#5865f2] not-italic mt-0.5">&mdash; Grammo</span>
                </p>
                <div className="w-8 h-8 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center text-lg shrink-0">
                  🦊
                </div>
              </div>

            </motion.div>

          </div>

          {/* ── RIGHT SIDEBAR: GOALS & PROGRESS (EXACTLY MATCHING USER SCREENSHOT) ───── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4">

            {/* Card 1: Checklist Box */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-300 shadow-md space-y-3 text-left">
              <h4 className="font-display font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>You're Almost There!</span>
                <span className="text-xs text-amber-500">✨</span>
              </h4>
              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                  <span>Keep practicing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                  <span>Learn from mistakes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  <span>You'll do even better!</span>
                </div>
              </div>
            </div>

            {/* Card 2: Quote Bubble Card with Mascot Face */}
            <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-2xl p-4 text-left shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[#5865f2] font-black text-xl leading-none">“</div>
                <p className="text-xs font-extrabold text-indigo-950 leading-relaxed italic">
                  Every mistake is a step closer to mastery!
                </p>
                <p className="text-[10px] font-black text-[#5865f2] text-right mt-1">&mdash; Grammo</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                🦊
              </div>
            </div>

            {/* Card 3: Next Goals Action Box */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-md space-y-3 text-left">
              <h4 className="font-display font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-500" />
                <span>Next Goals</span>
              </h4>

              <div className="space-y-2">
                <button
                  onClick={handleRetry}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-black text-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>📋</span> Retake this quiz
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">&rsaquo;</span>
                </button>

                <button
                  onClick={handleHome}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-black text-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span> Try a new topic
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">&rsaquo;</span>
                </button>
              </div>
            </div>

            {/* Card 4: Progress Track Badge */}
            <div className="bg-white/95 rounded-2xl p-4 border border-indigo-100 shadow-sm space-y-2 text-left">
              <p className="text-[11px] font-black text-slate-900">Progress Looks Good on You!</p>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                <div className="h-0.5 w-4 bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ── 5. REVIEW ANSWERS POPUP MODAL (ON CLICK REVIEW BUTTON) ───────────── */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border-2 border-indigo-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl text-[#5865f2]">
                    📋
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg sm:text-xl">
                      Review Your Answers
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                      Score: {result.score}% &bull; {correctCount} of {totalCount} correct
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReview(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable list for questions */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                {result.questionResults?.map((qr, i) => {
                  const originalQuestion = questions.find(q => q.id === qr.questionId);
                  return <QuestionReviewCard key={qr.questionId} qr={qr} index={i} originalQuestionText={originalQuestion?.text} />
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowReview(false)}
                  className="w-full py-3.5 rounded-2xl bg-[#5865f2] hover:bg-indigo-600 text-white font-black text-sm shadow-md transition-colors cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. RANK-UP MODAL POPUP ─────────────────────────────────────────── */}
      <AnimatePresence>
        {result.rankUpTitle && showRankUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-amber-300 shadow-2xl space-y-4"
            >
              <motion.div
                className="text-6xl mx-auto"
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8 }}
              >
                🎉
              </motion.div>
              <div>
                <h3 className="font-display font-black text-slate-900 text-2xl">Rank Up!</h3>
                <p className="text-[#5865f2] font-black text-lg mt-1">{result.rankUpTitle}</p>
              </div>
              <p className="text-slate-600 text-xs font-bold leading-relaxed">
                You've levelled up your grammar mastery. Keep the momentum going!
              </p>
              <button
                onClick={() => setShowRankUpModal(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-sm shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
              >
                Let's Go! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 7. UNIT COMPLETE MODAL POPUP ──────────────────────────────────── */}
      <AnimatePresence>
        {result.unitComplete && showUnitCompleteModal && (!result.rankUpTitle || !showRankUpModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-amber-300 shadow-2xl space-y-4"
            >
              <div className="text-6xl mx-auto">🎓</div>
              <div>
                <h3 className="font-display font-black text-slate-900 text-2xl">Level Completed!</h3>
                <p className="text-slate-600 text-xs font-bold mt-1">
                  You've mastered every chapter in this unit at &ge;90%.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-1">
                <p className="text-amber-900 text-xs font-black flex items-center gap-1.5">
                  <span>⏳ Ask Admin to Unlock</span>
                </p>
                <p className="text-amber-800 text-[11px] font-medium leading-relaxed">
                  An unlock request has been sent. Once approved, the next unit will appear in your journey.
                </p>
              </div>

              <button
                onClick={() => setShowUnitCompleteModal(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-sm shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ─── Question Review Card ─────────────────────────────────────────────────────

function QuestionReviewCard({
  qr, index, originalQuestionText
}: {
  qr: {
    questionId: string
    selectedAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string
  },
  index: number,
  originalQuestionText?: string
}) {
  return (
    <div className={`p-4 rounded-2xl border flex flex-col gap-2 text-xs font-bold bg-white shadow-2xs transition-all hover:border-indigo-300 ${qr.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${qr.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
            {qr.isCorrect ? '✓' : '✕'}
          </span>
          <span className="font-extrabold text-slate-800 text-sm">Q{index + 1}</span>
        </div>
        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${qr.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
          {qr.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>

      <p className="text-slate-800 font-black text-sm leading-relaxed border-b border-slate-100/50 pb-2">
        {originalQuestionText || 'Unknown Question'}
      </p>

      <p className="text-slate-600 font-bold text-xs leading-relaxed pt-1">
        {qr.explanation || (qr.isCorrect ? 'Correct answer!' : 'Incorrect answer.')}
      </p>

      {!qr.isCorrect && (
        <div className="mt-1 p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl space-y-1 text-xs">
          <p className="text-rose-600 font-bold">Your answer: {qr.selectedAnswer || '(none)'}</p>
          <p className="text-emerald-700 font-bold">Correct answer: {qr.correctAnswer}</p>
        </div>
      )}
    </div>
  )
}
