import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Flame, 
  Zap, 
  Star, 
  Check, 
  RotateCcw, 
  Home, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  LogOut, 
  BarChart2, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuizSessionStore } from '@/store/quizSessionStore'
import { useProgress } from './hooks/useCurriculum'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'

// Static badge catalog — mirrors backend domain.BadgeCatalog
const BADGE_ICONS: Record<string, string> = {
  first_blood: '🩸', perfect_score: '💯', hat_trick: '🎩',
  streak_starter: '🔥', streak_warrior: '⚔️', unit_mastered: '🏆',
  speed_demon: '⚡', combo_king: '👑', top_scorer: '🌟', grammar_god_badge: '⚡',
}
const BADGE_NAMES: Record<string, string> = {
  first_blood: 'First Blood', perfect_score: 'Perfect Score', hat_trick: 'Hat Trick',
  streak_starter: 'Streak Starter', streak_warrior: 'Streak Warrior', unit_mastered: 'Unit Mastered',
  speed_demon: 'Speed Demon', combo_king: 'Combo King', top_scorer: 'Top Scorer', grammar_god_badge: 'Grammar God',
}

const CELEBRATION_EMOJIS = ['🎉', '✨', '⭐', '🎈', '🏆', '🍭', '🌟', '🍦', '🍡', '🥳', '🎁', '🚀']

export default function QuizResultPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { result, reset } = useQuizSessionStore()
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

  const passed = result.passed
  const starsArray = [1, 2, 3]

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = userProgress?.totalXP ?? (315 + (result?.xpEarned || 0))
  const streak = userProgress?.currentStreak ?? 2
  const stars = userProgress?.totalStars ?? 29

  const correctCount = result.questionResults ? result.questionResults.filter(q => q.isCorrect).length : 0
  const totalCount = result.questionResults ? result.questionResults.length : 5

  // Generate 16 floating celebration popsicles/particles for children
  const celebrationParticles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      emoji: CELEBRATION_EMOJIS[i % CELEBRATION_EMOJIS.length],
      left: `${(i * 6.2) + 3}%`,
      delay: (i * 0.25) % 2.5,
      duration: 3 + ((i * 0.4) % 2),
      scale: 0.8 + ((i % 3) * 0.25),
    }))
  }, [])

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

      {/* ── 2. CELEBRATION FALLING POPSICLES & PARTICLES (Children Effect) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {celebrationParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{ 
              y: ['0vh', '105vh'],
              opacity: [0, 1, 1, 0],
              rotate: [0, 45, -45, 90]
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

      {/* ── 4. MAIN RICH RESULTS GRID ───────────────────────────────────────── */}
      <main className="flex-1 relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT SIDEBAR: SPEECH BUBBLES & MOTIVATIONAL CARDS (3 cols) ── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center space-y-4 pt-4">
            
            {/* Top Speech Bubble positioned over the background mascot */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-amber-300 shadow-xl text-slate-800 text-center relative max-w-[240px]"
            >
              <p className="font-display font-black text-xs sm:text-sm text-slate-900 leading-snug">
                {passed ? 'Awesome job! You mastered this quest! 🎉' : 'Great effort! Mistakes help you learn! 🐾'}
              </p>
              <div className="w-3.5 h-3.5 bg-white border-b-2 border-r-2 border-amber-300 rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2" />
            </motion.div>

            {/* Motivational Speech Card 2 */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-4 text-center max-w-[240px] shadow-sm space-y-1">
              <span className="text-2xl">✨ 🎯 ✨</span>
              <p className="font-display font-black text-xs text-amber-950">
                Practice today. Brighter tomorrow!
              </p>
              <p className="text-[10px] font-extrabold text-amber-700">Grammar Adventure</p>
            </div>

            {/* Bottom Scroll Note */}
            <div className="bg-white/95 border-2 border-amber-300 text-slate-900 px-4 py-2.5 rounded-2xl text-[11px] font-black shadow-md text-center max-w-[240px]">
              Same Grammar. Brighter You! 🐾
            </div>

          </div>

          {/* ── CENTER COLUMN: MAIN ENERGETIC RESULTS CARD (6 cols) ─────────── */}
          <div className="lg:col-span-6 w-full max-w-lg mx-auto">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] relative overflow-visible text-center space-y-5"
            >
              
              {/* Top Floating 3D Curved Ribbon Header Banner */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className={`px-8 py-2.5 rounded-full font-display font-black text-lg text-white shadow-xl tracking-wide whitespace-nowrap flex items-center gap-2 border-2 border-white ${
                    passed 
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shadow-emerald-500/40' 
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-orange-500/40'
                  }`}
                >
                  <span>{passed ? '🎉 LEVEL MASTERED! 🎉' : '⚡ KEEP GOING! ⚡'}</span>
                </motion.div>
              </div>

              {/* Header Subtitle */}
              <div className="pt-4">
                <p className="text-xs sm:text-sm font-bold text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {passed 
                    ? 'You passed! You mastered this chapter with flying colors!' 
                    : "You're on the right track! A little more practice will get you there."}
                </p>
              </div>

              {/* Big Energetic Percentage Score Display */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="py-1"
              >
                <div className="inline-block relative">
                  <span className={`font-display font-black text-6xl sm:text-7xl tracking-tight leading-none filter drop-shadow-md ${
                    passed ? 'text-[#10b981]' : 'text-rose-500'
                  }`}>
                    {result.score}%
                  </span>
                </div>
              </motion.div>

              {/* 3 Animated Giant Gold Stars */}
              <div className="flex items-center justify-center gap-3">
                {starsArray.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 300 }}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-11 sm:h-11 ${
                        s <= result.starsEarned
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Festive Reward Pills (XP, Personal Best, Combo) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {/* XP Pill */}
                <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#5865f2] font-black text-xs flex items-center gap-1.5 shadow-2xs">
                  <Zap className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                  <span>+{result.xpEarned} XP earned</span>
                </div>

                {/* Personal Best */}
                {result.personalBest && (
                  <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <span>🏆 Personal Best!</span>
                  </div>
                )}

                {/* Combo */}
                {result.maxCombo > 1 && (
                  <div className="px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <span>🔥 {result.maxCombo}x Combo!</span>
                  </div>
                )}
              </div>

              {/* Badges Earned */}
              {result.badgesEarned && result.badgesEarned.length > 0 && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-1.5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">🎖️ Badges Unlocked!</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {result.badgesEarned.map(bid => (
                      <div key={bid} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-full text-xs font-extrabold text-slate-800 shadow-2xs">
                        <span>{BADGE_ICONS[bid] ?? '🏅'}</span>
                        <span>{BADGE_NAMES[bid] ?? bid}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attempt Sub-Info */}
              <p className="text-xs font-extrabold text-slate-400">
                Attempt #{result.attemptNumber} &bull; {correctCount}/{totalCount} correct
              </p>

              {/* CTA Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={passed ? handleHome : handleRetry}
                  className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2.5 border-b-4 border-orange-700 active:scale-[0.98] cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  <span>{passed ? 'Continue Journey' : 'Try Again'}</span>
                </button>

                <button
                  onClick={handleHome}
                  className="w-full py-3.5 px-6 rounded-2xl font-display font-black text-sm tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              </div>

              {/* Question Answer Review Accordion — FIX OVERFLOW BUG WITH MAX HEIGHT SCROLLBAR */}
              {result.questionResults && result.questionResults.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowReview(v => !v)}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 transition-colors text-xs font-black text-slate-700 cursor-pointer"
                  >
                    <span>Review answers</span>
                    {showReview ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  <AnimatePresence>
                    {showReview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden text-left"
                      >
                        {/* Scrollable Container with max height prevents screen overflow */}
                        <div className="max-h-[340px] overflow-y-auto space-y-3 pt-3 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                          {result.questionResults.map((qr, i) => (
                            <QuestionReviewCard key={qr.questionId} qr={qr} index={i} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </motion.div>

          </div>

          {/* ── RIGHT SIDEBAR: GOALS & CHECKLIST WIDGETS (3 cols) ───────────── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4">
            
            {/* Checklist Box */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-amber-300 shadow-md space-y-3 text-left">
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

            {/* Quote Bubble Card */}
            <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-2xl p-4 text-left shadow-xs space-y-1">
              <div className="text-[#5865f2] font-black text-2xl leading-none">“</div>
              <p className="text-xs font-extrabold text-indigo-950 leading-relaxed italic">
                Every mistake is a step closer to mastery!
              </p>
              <p className="text-[10px] font-black text-[#5865f2] text-right mt-1">&mdash; Grammo</p>
            </div>

            {/* Next Goals Action Box */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-md space-y-3 text-left">
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

            {/* Bottom Book Stack Note */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-indigo-900">
                Progress Looks Good on You! 🐾
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* ── 5. RANK-UP MODAL POPUP ─────────────────────────────────────────── */}
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

      {/* ── 6. UNIT COMPLETE MODAL POPUP ──────────────────────────────────── */}
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
  qr, index,
}: {
  qr: {
    questionId: string
    selectedAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string
  },
  index: number,
}) {
  return (
    <div className={`p-4 rounded-2xl border-2 text-xs font-bold space-y-2 bg-white ${
      qr.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {qr.isCorrect
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            : <XCircle className="w-4 h-4 text-rose-500" />}
          <span className={qr.isCorrect ? 'text-emerald-700' : 'text-rose-600'}>
            {qr.isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
        <span className="text-slate-400 text-[10px]">Q{index + 1}</span>
      </div>

      {!qr.isCorrect && (
        <div className="space-y-1 pt-1">
          <p className="text-slate-500 text-[10px]">Your answer:</p>
          <p className="text-rose-600 font-extrabold text-xs">
            {qr.selectedAnswer || '(no answer)'}
          </p>
          <p className="text-slate-500 text-[10px] pt-0.5">Correct answer:</p>
          <p className="text-emerald-600 font-extrabold text-xs">{qr.correctAnswer}</p>
        </div>
      )}

      {qr.explanation && (
        <div className="mt-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200/80">
          <p className="text-slate-600 text-[11px] font-semibold leading-relaxed">💡 {qr.explanation}</p>
        </div>
      )}
    </div>
  )
}
