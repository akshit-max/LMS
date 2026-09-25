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
import { usePracticeSessionStore } from '@/store/practiceSessionStore'
import { useProgress } from '../hooks/useCurriculum'
import { useAuthStore } from '@/store/authStore'

export default function PracticeResultPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { result, reset, questions } = usePracticeSessionStore()
  const { data: userProgress } = useProgress()
  const { profile } = useAuthStore()
  const [showReview, setShowReview] = useState(false)

  if (!result) {
    navigate(`/practice/${quizId}`, { replace: true })
    return null
  }

  const score = Math.round((result.correctCount / result.totalQuestions) * 100)
  const starsArray = [1, 2, 3]

  const totalXP = userProgress?.totalXP ?? 985
  const streak = userProgress?.currentStreak ?? 2
  const stars = userProgress?.totalStars ?? 55

  const correctCount = result.correctCount
  const totalCount = result.totalQuestions

  // Score mood configs for Practice Mode
  const moodConfig = useMemo(() => {
    if (score >= 90) {
      return {
        ribbonBadge: '🎯 PRACTICE MASTERED! 🎯',
        ribbonBg: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-[#5865f2] shadow-indigo-500/50',
        scoreColor: 'text-[#5865f2]',
        speechBubble1: 'FANTASTIC PRACTICE! You crushed this session! 🎯',
        speechBubble2: 'Practice today, brighter tomorrow! 💖',
        subtitle: 'Great practice session! You are ready for the evaluation quiz!',
        mascotSign: 'Practice today, brighter tomorrow! 💖',
        particleCount: 25,
        emojis: ['🎉', '✨', '⭐', '🎈', '🎯', '🍦', '🍡', '🥳']
      }
    } else if (score >= 70) {
      return {
        ribbonBadge: '⚡ GREAT EFFORT! ⚡',
        ribbonBg: 'bg-gradient-to-r from-indigo-500 via-[#5865f2] to-sky-500 shadow-indigo-500/50',
        scoreColor: 'text-indigo-600',
        speechBubble1: 'Great practice effort! Mistakes build skills! 🐾',
        speechBubble2: 'Practice today, brighter tomorrow! 💖',
        subtitle: "You're on the right track! Practice again to build 100% confidence.",
        mascotSign: 'Practice today, brighter tomorrow! 💖',
        particleCount: 18,
        emojis: ['✨', '⭐', '🎈', '🎯', '🌟', '💖']
      }
    } else {
      return {
        ribbonBadge: '💪 KEEP PRACTICING! 💪',
        ribbonBg: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-orange-500/50',
        scoreColor: 'text-orange-500',
        speechBubble1: 'Mistakes help us learn and grow stronger! 🦅',
        speechBubble2: 'Mistakes today, mastery tomorrow! 💖',
        subtitle: "Every question you practice makes your brain super smart! Let's practice again!",
        mascotSign: 'Mistakes today, mastery tomorrow! 💖',
        particleCount: 14,
        emojis: ['🌱', '✨', '🐾', '💡', '🎈', '💖']
      }
    }
  }, [score])

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
    navigate(`/practice/${quizId}`, { replace: true })
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
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[0.5px]" />
      </div>

      {/* ── 2. CELEBRATION PARTICLES ───────────────────────────────────────── */}
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

      {/* ── 3. TOP NAVBAR ──────────────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          <button
            onClick={handleHome}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors border border-slate-200/80 group shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Lesson</span>
          </button>

          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
              <span className="text-xl">🦊</span>
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-black text-base text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                CASUAL PRACTICE
              </span>
            </div>
          </RouterLink>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50/95 border border-orange-200/90 text-orange-600 text-xs font-black shadow-2xs">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak}d STREAK</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50/95 border border-sky-200/90 text-sky-600 text-xs font-black shadow-2xs">
              <Zap className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{totalXP} XP</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/95 border border-amber-200/90 text-amber-600 text-xs font-black shadow-2xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars} STARS</span>
            </div>
          </div>

        </div>
      </header>

      {/* ── 4. MAIN PARCHMENT RESULT GRID ──────────────────────────────────── */}
      <main className="flex-1 relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT DESKTOP COLUMN (Mascot & Speech Bubbles) (3 cols) ── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-center space-y-4 pt-2">

            {/* Top Speech Bubble 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 border-2 border-purple-300 shadow-xl text-slate-800 text-center relative max-w-[220px]"
            >
              <p className="font-display font-black text-xs text-slate-900 leading-snug">
                {moodConfig.speechBubble1}
              </p>
              <div className="w-3 h-3 bg-white border-b-2 border-r-2 border-purple-300 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
            </motion.div>

            {/* Speech Bubble 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 border-2 border-pink-300 shadow-lg text-slate-800 text-center relative max-w-[220px]"
            >
              <p className="font-display font-black text-xs text-purple-900 leading-snug">
                {moodConfig.speechBubble2}
              </p>
            </motion.div>

            {/* Fox Mascot holding a book */}
            <div className="relative flex flex-col items-center pt-2">
              <div className="text-8xl filter drop-shadow-2xl animate-bounce" style={{ animationDuration: '3s' }}>
                🦊
              </div>
            </div>

            {/* Stack of Colorful Books */}
            <div className="w-52 space-y-1 transform rotate-1 pt-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-indigo-950 shadow-xs">
                Better Grammar
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-purple-950 shadow-xs">
                Brighter Futures
              </div>
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-teal-950 shadow-xs">
                Small Steps
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-amber-950 shadow-xs">
                Big Results
              </div>
            </div>

          </div>

          {/* ── CENTER PARCHMENT CARD (6 cols) ────────────────────────── */}
          <div className="lg:col-span-6 w-full max-w-lg mx-auto">

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#fffef9] rounded-[36px] p-6 sm:p-8 border-4 border-[#e8d5b7] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4)] relative overflow-visible text-center space-y-4"
            >
              {/* Inner Parchment Border Line */}
              <div className="absolute inset-2.5 rounded-[28px] border-2 border-dashed border-[#d9b276]/40 pointer-events-none" />

              {/* Corner Scroll Accents */}
              <div className="absolute top-4 left-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╔</div>
              <div className="absolute top-4 right-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╗</div>
              <div className="absolute bottom-4 left-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╚</div>
              <div className="absolute bottom-4 right-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╝</div>

              {/* Ribbon Header */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 border-4 border-white shadow-md flex items-center justify-center text-xl text-white font-black -mb-2 relative z-30">
                  🎯
                </div>

                <motion.div
                  className={`px-8 py-2.5 rounded-full font-display font-black text-base sm:text-lg text-white shadow-xl tracking-wide whitespace-nowrap flex items-center gap-2 border-2 border-white ${moodConfig.ribbonBg}`}
                >
                  <span>{moodConfig.ribbonBadge}</span>
                </motion.div>
              </div>

              {/* Subtitle */}
              <div className="pt-6 relative z-10">
                <p className="text-xs sm:text-sm font-extrabold text-slate-600 max-w-xs mx-auto leading-relaxed">
                  {moodConfig.subtitle}
                </p>
              </div>

              {/* Score Percentage */}
              <div className="py-1 relative z-10">
                <span className={`font-display font-black text-6xl sm:text-7xl tracking-tight leading-none filter drop-shadow-sm ${moodConfig.scoreColor}`}>
                  {score}%
                </span>
              </div>

              {/* Stars Animation */}
              <div className="flex items-center justify-center gap-3 py-1 relative z-10">
                {starsArray.map((s, i) => {
                  const starsEarned = score >= 90 ? 3 : score >= 70 ? 2 : 1
                  const isEarned = s <= starsEarned
                  return (
                    <motion.div
                      key={s}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
                    >
                      <Star
                        className={`w-10 h-10 ${isEarned
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-slate-200 fill-slate-100'
                          }`}
                      />
                    </motion.div>
                  )
                })}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 relative z-10">
                <div className="px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                  <span>🎯 Practice Session</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                  <span>No XP or Rank Affected</span>
                </div>
              </div>

              <p className="text-xs font-extrabold text-slate-500 relative z-10">
                {correctCount} / {totalCount} correct answers
              </p>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1 relative z-10">
                <button
                  onClick={handleRetry}
                  className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2.5 border-b-4 border-purple-900 active:translate-y-[2px] cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  <span>Practice Again</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleHome}
                    className="py-3.5 px-4 rounded-2xl font-display font-black text-xs tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setShowReview(true)}
                    className="py-3.5 px-4 rounded-2xl font-display font-black text-xs tracking-wide bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Review ({correctCount}/{totalCount})</span>
                  </button>
                </div>
              </div>

              {/* In-Card Mascot Quote Box */}
              <div className="mt-3 p-3 bg-purple-50/80 rounded-2xl border border-purple-200/90 flex items-center justify-between gap-3 text-left relative z-10">
                <p className="text-[11px] font-extrabold text-slate-700 leading-snug italic">
                  “Practice makes progress! Ready for the official quiz?”
                  <span className="block font-black text-purple-700 not-italic mt-0.5">&mdash; Grammo</span>
                </p>
                <div className="w-8 h-8 rounded-xl bg-purple-200/80 border border-purple-300 flex items-center justify-center text-lg shrink-0">
                  🦊
                </div>
              </div>

            </motion.div>

          </div>

          {/* ── RIGHT DESKTOP COLUMN (Next Steps & Desk Items) (3 cols) ── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4">

            {/* Widget 1: Next Steps Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-purple-200 shadow-md space-y-3 text-left">
              <h4 className="font-display font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Next Steps</span>
                <span className="text-xs text-purple-500">🎯</span>
              </h4>
              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                  <span>Practice Unlimited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                  <span>Build confidence</span>
                </div>
              </div>
            </div>

            {/* Widget 2: Next Goals Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-slate-200 shadow-md space-y-3 text-left">
              <h4 className="font-display font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-500" />
                <span>NEXT GOALS</span>
              </h4>

              <div className="space-y-2">
                <button
                  onClick={handleRetry}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-black text-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>📋</span> Practice again
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">&rsaquo;</span>
                </button>

                <button
                  onClick={handleHome}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-black text-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>📚</span> Try a new topic
                  </span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">&rsaquo;</span>
                </button>
              </div>
            </div>

            {/* Wooden Desk Note & Mug */}
            <div className="bg-[#fef08a] border-2 border-amber-300 p-3 rounded-xl shadow-md text-center transform -rotate-2">
              <p className="font-handwriting font-bold text-xs text-amber-950 leading-snug">
                Mistakes today.<br />Mastery tomorrow! 💖
              </p>
            </div>

            <div className="bg-white/90 border-2 border-slate-300 p-2.5 rounded-xl shadow-xs text-center">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter block">
                👑 GOOD LEARNERS PRACTICE OFTEN
              </span>
            </div>

          </div>

        </div>

      </main>

      {/* ── 5. REVIEW ANSWERS OVERLAY MODAL ─────────────────────────────────── */}
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
              className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border-2 border-purple-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl text-purple-600">
                    📋
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg sm:text-xl">
                      Review Practice Answers
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                      Score: {score}% &bull; {correctCount} of {totalCount} correct
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

              {/* Questions review list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                {result.questionResults?.map((qr, i) => {
                  const originalQuestion = questions.find(q => q.id === qr.questionId);

                  return (
                    <div key={qr.questionId} className={`p-4 rounded-2xl border flex flex-col gap-2 text-xs font-bold bg-white ${qr.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${qr.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}>
                            {qr.isCorrect ? '✓' : '✕'}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm">Q{i + 1}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${qr.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                          {qr.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <p className="text-slate-800 font-black text-sm leading-relaxed border-b border-slate-100/50 pb-2">
                        {originalQuestion?.text || 'Unknown Question'}
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
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowReview(false)}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md transition-colors cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
