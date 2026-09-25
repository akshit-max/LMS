import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Flame, 
  Zap, 
  Star, 
  ChevronDown, 
  LogOut, 
  BarChart2, 
  Trophy, 
  Check,
  X,
} from 'lucide-react'
import {
  useQuizSessionStore,
  useCurrentQuestion,
  useQuizProgress,
} from '@/store/quizSessionStore'
import { useSubmitAttempt, useCheckAnswer } from './hooks/useQuiz'
import { useProgress } from './hooks/useCurriculum'
import { useUserLeaderboardRank, getTop3RankBadge } from './hooks/useBadges'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'
import type { QuestionPublic } from '@/types'

const TIMER_SECONDS = 30

// ── Feedback message banks ──────────────────────────────────────────────────
const CORRECT_MESSAGES = [
  "Spot on, Champion! 🎯",
  "Boom! Pure brilliance! ⚡",
  "Unstoppable power! 🔥",
  "Flawless execution! ⭐",
  "Grammar masterclass in action! 👑",
  "You're dominating this quiz! 🚀",
  "Nailed it like a pro! ✨",
]
const WRONG_MESSAGES = [
  "Shake it off! Champions don't back down — claim your revenge on the next question! 👑",
  "A minor setback for a major comeback. Show this quiz who's boss! 🔥",
  "Not quite, but greatness takes practice. Time to hit back twice as hard! 💪",
  "Is that all this question had? Refocus and reclaim your streak now! ⚡",
  "Legends aren't defined by one miss — turn up the heat! 🚀",
  "Close call! You've got the talent, now bring the thunder! 🌩️",
]
function pickRandom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)] }

type FeedbackState = { correct: boolean; explanation?: string; combo: number; message: string } | null

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const { attemptId, status, nextQuestion, setResult, setStatus, recordAnswer } =
    useQuizSessionStore()
  const currentQuestion = useCurrentQuestion()
  const progress = useQuizProgress()
  const { mutate: submitAttempt } = useSubmitAttempt()
  const { mutate: checkAnswer, isPending: isChecking } = useCheckAnswer()

  const [selected, setSelected] = useState<string | null>(null)
  const [timerPct, setTimerPct] = useState(100)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [timerFrozen, setTimerFrozen] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [reorderItems, setReorderItems] = useState<string[]>([])
  const [matchLeft, setMatchLeft] = useState<string | null>(null)
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({})
  const questionStartTime = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Guard: if session not started, redirect to intro
  useEffect(() => {
    if (!attemptId) {
      navigate(`/quiz/${quizId}`, { replace: true })
    }
  }, [attemptId])

  // Reset per-question state when question changes
  useEffect(() => {
    if (!currentQuestion) return
    setSelected(null)
    setFeedback(null)
    setTimerFrozen(false)
    setTimerPct(100)
    setTimeLeft(TIMER_SECONDS)
    questionStartTime.current = Date.now()

    if (currentQuestion.type === 'reorder') {
      setReorderItems([...currentQuestion.options].sort(() => Math.random() - 0.5))
    }
    setMatchLeft(null)
    setMatchPairs({})
  }, [currentQuestion?.id])

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timerFrozen || !currentQuestion) return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1
        setTimerPct((next / TIMER_SECONDS) * 100)
        return next <= 0 ? 0 : next
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerFrozen, currentQuestion?.id])

  // Auto-advance after feedback period
  const advanceAfterFeedback = useCallback(() => {
    const isLast = useQuizSessionStore.getState().currentIndex
      >= useQuizSessionStore.getState().questions.length - 1
    if (isLast) {
      handleSubmitAll()
    } else {
      nextQuestion()
    }
  }, [nextQuestion])

  // Core: called when student selects ANY answer (option click, reorder confirm, match complete)
  const handleAnswerSelected = useCallback((answer: string) => {
    if (timerFrozen || isChecking || !currentQuestion || !attemptId) return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerFrozen(true)
    setSelected(answer)

    // ✅ Persist the answer immediately so handleSubmitAll always has a full answers array
    recordAnswer({ questionId: currentQuestion.id, selectedAnswer: answer })

    const timeTakenMs = Date.now() - questionStartTime.current

    checkAnswer(
      { attemptId, questionId: currentQuestion.id, selectedAnswer: answer, timeTakenMs },
      {
        onSuccess: (result) => {
          const message = result.correct
            ? pickRandom(CORRECT_MESSAGES)
            : pickRandom(WRONG_MESSAGES)
          setFeedback({ ...result, message })

          // Auto-advance after feedback duration
          feedbackTimerRef.current = setTimeout(() => {
            setFeedback(null)
            advanceAfterFeedback()
          }, 1050)
        },
        onError: () => {
          // Network error — still record locally and advance
          setTimerFrozen(false)
          alert('Connection error. Please check your internet and try again.')
        },
      }
    )
  }, [timerFrozen, isChecking, currentQuestion, attemptId, checkAnswer, advanceAfterFeedback, recordAnswer])

  // Timer expiry: treat blank as wrong
  useEffect(() => {
    if (timeLeft === 0 && !timerFrozen) {
      handleAnswerSelected('')
    }
  }, [timeLeft, timerFrozen, handleAnswerSelected])

  const handleSubmitAll = () => {
    if (!attemptId) return
    setStatus('submitting')
    // Read latest answers directly from store to avoid stale closure
    const latestAnswers = useQuizSessionStore.getState().answers

    submitAttempt(
      { attemptId, answers: latestAnswers },
      {
        onSuccess: (result) => {
          setResult(result)
          navigate(`/quiz/${quizId}/result`, { replace: true })
        },
        onError: () => {
          setStatus('in_progress')
          alert('Submission failed. Please try again.')
        },
      }
    )
  }


  const { data: userCurriculumProgress } = useProgress()
  const { profile } = useAuthStore()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const fullName = profile?.displayName ?? 'Student'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = userCurriculumProgress?.totalXP ?? 0
  const streak = userCurriculumProgress?.currentStreak ?? 0
  const stars = userCurriculumProgress?.totalStars ?? 0

  if (!currentQuestion || status === 'submitting') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans selection:bg-orange-500 selection:text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          {/* Awesome Dual Ring Spinner with Mascot */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer Pulsing Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300 opacity-30 blur-md animate-pulse" />
            
            {/* Outer Rotating Gradient Border Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-amber-400 border-b-orange-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />

            {/* Inner Fox Avatar Badge */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-500 flex items-center justify-center text-3xl shadow-md border-2 border-white relative z-10">
              🦊
            </div>

            {/* Floating Sparks */}
            <span className="absolute -top-1 -right-1 text-sm animate-bounce">✨</span>
            <span className="absolute -bottom-1 -left-1 text-xs animate-pulse">🌟</span>
          </div>

          {/* Text Container with Border Pill */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-50/90 border-2 border-orange-200/90 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <p className="text-slate-900 text-xs font-black uppercase tracking-widest">
                {status === 'submitting' ? 'Calculating your score...' : 'Loading question...'}
              </p>
            </div>
            <p className="text-[11px] font-extrabold text-slate-400">
              GrammoQuest Grammar Adventure
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  const isLast = progress.current >= progress.total - 1
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#eab308' : '#f97316'

  return (
    <div className="min-h-screen w-full relative flex flex-col font-sans selection:bg-[#5865f2] selection:text-white bg-[#0e1626] overflow-x-hidden">

      {/* ── FULL-SCREEN FEEDBACK OVERLAY ─────────────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key="feedback-overlay"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 gap-6 select-none ${
              feedback.correct
                ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-green-800 text-white backdrop-blur-md'
                : 'bg-gradient-to-b from-rose-600 via-red-600 to-rose-950 text-white backdrop-blur-md'
            }`}
          >
            {/* Ambient Background Pulse Glow */}
            <div className={`absolute inset-0 pointer-events-none opacity-40 animate-pulse ${
              feedback.correct ? 'bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.5)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.6)_0%,transparent_70%)]'
            }`} />

            {/* Big Energetic Icon */}
            <motion.div
              initial={{ scale: 0.3, rotate: feedback.correct ? -15 : 15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              className="relative z-10"
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${
                feedback.correct
                  ? 'bg-white/25 border-4 border-white/70 shadow-[0_0_40px_rgba(255,255,255,0.4)] ring-4 ring-emerald-300/40'
                  : 'bg-white/20 border-4 border-white/60 shadow-[0_0_40px_rgba(244,63,94,0.6)] ring-4 ring-rose-300/40 animate-pulse'
              }`}>
                {feedback.correct
                  ? <Check className="w-20 h-20 text-white stroke-[3.5] drop-shadow-md" />
                  : <X className="w-20 h-20 text-white stroke-[3.5] drop-shadow-md" />}
              </div>
              {/* Mascot badge */}
              <span className="absolute -top-4 -right-4 text-6xl filter drop-shadow-xl select-none animate-bounce">
                {feedback.correct ? '🦊' : '🔥'}
              </span>
            </motion.div>

            {/* Status label & Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="text-center relative z-10 space-y-1"
            >
              <p className="font-display font-black text-4xl sm:text-5xl tracking-tight drop-shadow-lg uppercase">
                {feedback.correct ? 'Spot On, Champion! 🎯' : 'Challenge Accepted! ⚔️'}
              </p>
            </motion.div>

            {/* Healthy Ego Trigger Statement Card for Wrong Answer */}
            {!feedback.correct && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 300 }}
                className="max-w-md w-full bg-white/20 backdrop-blur-xl border-2 border-white/40 shadow-2xl rounded-3xl p-5 text-center relative z-10 space-y-2"
              >
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md">
                  <Flame className="w-4 h-4 fill-amber-950 text-amber-950 animate-bounce" /> HEALTHY EGO BOOST
                </div>
                <p className="font-display font-black text-base sm:text-lg leading-relaxed text-white drop-shadow-sm">
                  "{feedback.message}"
                </p>
              </motion.div>
            )}

            {/* Correct Message Sub-text */}
            {feedback.correct && (
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="text-white/95 font-extrabold text-xl relative z-10 drop-shadow-sm"
              >
                {feedback.message}
              </motion.p>
            )}

            {/* Combo badge */}
            {feedback.correct && feedback.combo > 1 && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.18, type: 'spring' }}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-amber-950 border-2 border-white rounded-full shadow-xl relative z-10"
              >
                <Flame className="w-5 h-5 fill-amber-950 text-amber-950" />
                <span className="font-display font-black text-lg uppercase tracking-wide">{feedback.combo}x COMBO STREAK!</span>
              </motion.div>
            )}

            {/* Explanation */}
            {feedback.explanation && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="max-w-md w-full bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/30 text-center relative z-10"
              >
                <p className="text-white/95 text-xs sm:text-sm font-bold leading-snug">💡 {feedback.explanation}</p>
              </motion.div>
            )}

            {/* Progress dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 relative z-10"
            >
              {Array.from({ length: progress.total }).map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${
                  i < progress.index + 1
                    ? 'w-4 h-4 bg-white shadow-md ring-2 ring-white/40'
                    : 'w-3 h-3 bg-white/30'
                }`} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. BACKGROUND ARTWORK ─────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/quiz_intro_bg_clean.jpg')` }}
      >
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px]" />
      </div>

      {/* ── 2. STICKY TOP NAVBAR ───────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <button 
            onClick={() => { if (confirm('Quit this quiz? Your progress will be lost.')) navigate(-1) }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-black text-xs transition-colors border border-slate-200/80 group shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-orange-500 group-hover:-translate-x-1 transition-all" />
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

      {/* ── 3. SUB-HEADER QUESTION STEPPER PILL (Even Distribution & Proportions) ── */}
      <div className="w-full max-w-[540px] sm:max-w-[560px] mx-auto px-4 sm:px-0 pt-5 pb-2 flex items-center justify-center z-20">
        
        {/* Unified Stepper Pill Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-full px-5 sm:px-6 pt-3.5 pb-2.5 border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 sm:gap-4 w-full relative overflow-visible">
          
          {/* Step Track (Left Side - Evenly Distributed across space) */}
          <div className="flex items-center justify-between flex-1 overflow-visible py-1 pr-2">
            {Array.from({ length: Math.max(progress.total, 1) }).map((_, i) => {
              const isCompleted = i < progress.current
              const isCurrent = i === progress.current
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="relative flex items-center justify-center shrink-0">
                    {/* Fox Avatar Mascot Sitting Right on Top of Current Step Circle */}
                    {isCurrent && (
                      <motion.div 
                        initial={{ y: -3, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        className="absolute -top-[17px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-30 pointer-events-none select-none w-6"
                      >
                        <span className="text-[14px] leading-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transform -translate-x-[0.5px]">
                          🦊
                        </span>
                        <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] border-t-amber-500 -mt-[0.5px]" />
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isCurrent ? 1.05 : 1 }}
                      className={`rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'w-6 h-6 bg-[#00c853] text-white shadow-xs'
                          : isCurrent
                          ? 'w-6 h-6 border-2 border-amber-400 bg-white ring-2 ring-amber-300/50 shadow-xs'
                          : 'w-6 h-6 border-2 border-indigo-200/80 bg-white/80'
                      }`}
                    >
                      {isCompleted && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </motion.div>
                  </div>

                  {/* Connecting Line between Dots */}
                  {i < Math.max(progress.total, 1) - 1 && (
                    <div className={`h-[3px] flex-1 mx-1.5 sm:mx-2 rounded-full transition-colors ${
                      i < progress.current ? 'bg-[#00c853]' : 'bg-indigo-100/90'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200/90 shrink-0" />

          {/* Counter Text (Right Side) */}
          <span className="font-display font-black text-xs sm:text-sm text-slate-900 tracking-tight shrink-0 whitespace-nowrap pl-1">
            Question <strong className="text-slate-900">{progress.current + 1}</strong> of <strong className="text-slate-900">{progress.total}</strong>
          </span>

        </div>

      </div>

      {/* ── 4. CENTER QUESTION ARENA ────────────────────────────────────────── */}
      <main className="flex-1 relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-6 flex flex-col items-center justify-center space-y-4">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-[540px] sm:max-w-[560px] bg-white rounded-[32px] p-6 sm:p-8 pt-8 sm:pt-10 border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] relative overflow-visible mx-auto space-y-6 text-center ring-1 ring-slate-900/5"
          >
            {/* Top Floating Outer 3D Timer Clock Widget */}
            <div className="absolute -top-11 sm:-top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className={`w-22 h-22 sm:w-24 sm:h-24 bg-[#0d1527] rounded-full p-1 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.45)] border-4 border-white pointer-events-auto transition-all ${
                timeLeft <= 5 ? 'ring-4 ring-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.7)] animate-bounce' : ''
              }`}>
                <BigTimerWidget pct={timerPct} seconds={timeLeft} color={timerColor} frozen={timerFrozen} />
              </div>
            </div>

            {/* Question Subtitle */}
            <div className="pt-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                {formatQuestionType(currentQuestion.type)}
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight leading-snug mt-2">
                {currentQuestion.text}
              </h1>
            </div>

            {/* Answer Options Container */}
            <div className="space-y-3 pt-1 text-left">
              {currentQuestion.type === 'reorder' ? (
                <ReorderQuestion
                  items={reorderItems}
                  onConfirm={handleAnswerSelected}
                  disabled={timerFrozen || isChecking}
                />
              ) : currentQuestion.type === 'match' ? (
                <MatchQuestion
                  options={currentQuestion.options}
                  leftSelected={matchLeft}
                  pairs={matchPairs}
                  disabled={timerFrozen || isChecking}
                  onLeftClick={(item) => {
                    if (timerFrozen || isChecking) return
                    if (matchPairs[item]) {
                      setMatchPairs(p => { const n = { ...p }; delete n[item]; return n })
                    } else {
                      setMatchLeft(l => l === item ? null : item)
                    }
                  }}
                  onRightClick={(rightItem) => {
                    if (timerFrozen || isChecking || !matchLeft) return
                    const newPairs = { ...matchPairs, [matchLeft]: rightItem }
                    setMatchPairs(newPairs)
                    setMatchLeft(null)
                    const leftCount = Math.floor((currentQuestion.options ?? []).length / 2)
                    if (Object.keys(newPairs).length === leftCount) {
                      const canonical = Object.keys(newPairs).sort().map(l => `${l}→${newPairs[l]}`).join('|')
                      handleAnswerSelected(canonical)
                    }
                  }}
                />
              ) : currentQuestion.type === 'fill_blank' && (!currentQuestion.options || currentQuestion.options.length === 0) ? (
                // Fill-blank with no stored options → text input
                <FillBlankQuestion
                  disabled={timerFrozen || isChecking}
                  onConfirm={handleAnswerSelected}
                />
              ) : currentQuestion.type === 'true_false' && (!currentQuestion.options || currentQuestion.options.length === 0) ? (
                // True/False with no options in DB → always force the two buttons
                ['True', 'False'].map((option, i) => (
                  <AnswerTile
                    key={option}
                    option={option}
                    index={i}
                    selected={selected === option}
                    disabled={timerFrozen || isChecking}
                    feedback={feedback && selected === option ? (feedback.correct ? 'correct' : 'wrong') : null}
                    onClick={() => handleAnswerSelected(option)}
                  />
                ))
              ) : currentQuestion.type === 'odd_one_out' ? (
                // Odd One Out — 2-column grid using OddOneTile
                <div className="grid grid-cols-2 gap-3">
                  {(currentQuestion.options ?? []).map((option, i) => (
                    <OddOneTile
                      key={option}
                      option={option}
                      index={i}
                      selected={selected === option}
                      disabled={timerFrozen || isChecking}
                      onClick={() => handleAnswerSelected(option)}
                    />
                  ))}
                </div>
              ) : (
                // MCQ, true_false (with options), fill_blank (with options), drag_drop — standard AnswerTile list
                (currentQuestion.options ?? []).map((option, i) => (
                  <AnswerTile
                    key={option}
                    option={option}
                    index={i}
                    selected={selected === option}
                    disabled={timerFrozen || isChecking}
                    feedback={feedback && selected === option ? (feedback.correct ? 'correct' : 'wrong') : null}
                    onClick={() => handleAnswerSelected(option)}
                  />
                ))
              )}
            </div>

            {/* Checking indicator — shows while waiting for backend response */}
            {isChecking && (
              <div className="pt-1 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full"
                />
                Checking...
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── 5. FLOATING BOTTOM MOTIVATIONAL QUOTE BANNER ──────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-[540px] sm:max-w-[560px] mx-auto bg-[#eef3ff]/95 backdrop-blur-md rounded-2xl p-4 border border-indigo-200/90 shadow-md flex items-center gap-3 relative overflow-hidden text-left"
        >
          <div className="text-3xl font-serif text-[#5865f2] font-black leading-none shrink-0 opacity-70">
            “
          </div>
          <div className="flex-1 leading-snug">
            <p className="font-display font-black text-xs sm:text-sm text-indigo-950 italic">
              Every correct answer brings you closer to your goals! ”
            </p>
          </div>
          <div className="text-2xl shrink-0 opacity-80">
            🏔️
          </div>
        </motion.div>

      </main>

    </div>
  )
}

// ─── Answer Tile ─────────────────────────────────────────────────────────────

const TILE_LETTERS = ['A', 'B', 'C', 'D', 'E']

function AnswerTile({
  option, index, selected, disabled, feedback, onClick,
}: {
  option: string
  index: number
  selected: boolean
  disabled: boolean
  feedback: 'correct' | 'wrong' | null
  onClick: () => void
}) {
  const letter = TILE_LETTERS[index] ?? String(index + 1)

  const tileClass = feedback === 'correct'
    ? 'border-emerald-500 bg-emerald-50 text-slate-900 ring-2 ring-emerald-300/60 shadow-sm'
    : feedback === 'wrong'
    ? 'border-rose-500 bg-rose-50 text-slate-900 ring-2 ring-rose-300/60 shadow-sm'
    : selected
    ? 'border-[#2563eb] bg-[#eff6ff] text-slate-900 shadow-xs ring-2 ring-[#2563eb]/20'
    : 'border-slate-200/90 bg-white text-slate-800 hover:bg-orange-50/80 hover:border-orange-300'

  const badgeClass = feedback === 'correct'
    ? 'bg-emerald-500 text-white'
    : feedback === 'wrong'
    ? 'bg-rose-500 text-white'
    : selected
    ? 'bg-[#2563eb] text-white'
    : 'bg-slate-100 text-slate-700 group-hover:bg-orange-500 group-hover:text-white'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-3.5 sm:py-4 rounded-2xl border-2 flex items-center gap-3.5 text-left font-bold text-base transition-all duration-150 cursor-pointer group
        ${tileClass}
        ${disabled && !selected && !feedback ? 'opacity-40' : ''}`}
    >
      <div className={`w-9 h-9 rounded-full font-black text-sm flex items-center justify-center shrink-0 transition-colors shadow-2xs ${badgeClass}`}>
        {letter}
      </div>
      <span className="flex-1 font-display font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
        {option}
      </span>
      {(selected || feedback) && (
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 shadow-2xs ${
          feedback === 'correct' ? 'bg-emerald-500 text-white'
          : feedback === 'wrong' ? 'bg-rose-500 text-white'
          : 'bg-[#2563eb] text-white'
        }`}>
          {feedback === 'correct' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : feedback === 'wrong' ? <X className="w-3.5 h-3.5 stroke-[3]" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      )}
    </button>
  )
}

// ─── Reorder Question ─────────────────────────────────────────────────────────

function ReorderQuestion({
  items,
  onConfirm,
  disabled,
}: {
  items: string[],
  onConfirm: (answer: string) => void,
  disabled: boolean,
}) {
  const [bank, setBank] = useState<string[]>(items)
  const [answer, setAnswer] = useState<string[]>([])

  // Reset state if items change (e.g. new question)
  useEffect(() => {
    setBank(items)
    setAnswer([])
  }, [items])

  const handleBankClick = (word: string, idx: number) => {
    if (disabled) return
    setBank(b => b.filter((_, i) => i !== idx))
    setAnswer(a => [...a, word])
  }

  const handleAnswerClick = (word: string, idx: number) => {
    if (disabled) return
    setAnswer(a => a.filter((_, i) => i !== idx))
    setBank(b => [...b, word])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Answer Area */}
      <div className="min-h-[60px] p-3 border-b-2 border-zinc-800 flex flex-wrap gap-2 items-start content-start">
        {answer.length === 0 && (
          <span className="text-zinc-600 text-sm italic mt-1">Tap words to build the sentence...</span>
        )}
        <AnimatePresence>
          {answer.map((word, i) => (
            <motion.button
              key={`ans-${word}-${i}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleAnswerClick(word, i)}
              disabled={disabled}
              className="px-3 py-1.5 bg-primary-500 text-white rounded-lg font-medium shadow-sm active:scale-95 transition-transform"
            >
              {word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Word Bank Area */}
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence>
          {bank.map((word, i) => (
            <motion.button
              key={`bank-${word}-${i}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleBankClick(word, i)}
              disabled={disabled}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg font-medium shadow-sm hover:bg-zinc-700 active:scale-95 transition-all"
            >
              {word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={() => onConfirm(answer.join(' '))}
        disabled={disabled || answer.length !== items.length}
        className="btn-game w-full mt-2 disabled:opacity-50"
      >
        Confirm Order
      </button>
    </div>
  )
}

// ─── Match the Following Question ─────────────────────────────────────────────
// Convention: options array = [...leftItems, ...rightItems] where first half is
// the left column and second half is the right column.
// The confirmed answer string is sorted-left-keys→right joined by '|'.
// Admin must store correctAnswer in the same canonical format.

function MatchQuestion({
  options,
  leftSelected,
  pairs,
  disabled,
  onLeftClick,
  onRightClick,
}: {
  options: string[]
  leftSelected: string | null
  pairs: Record<string, string>
  disabled: boolean
  onLeftClick: (item: string) => void
  onRightClick: (item: string) => void
}) {
  const half = Math.floor(options.length / 2)
  const leftItems = options.slice(0, half)
  const rightItems = options.slice(half)
  const usedRight = new Set(Object.values(pairs))

  return (
    <div className="space-y-4">
      <p className="text-zinc-500 text-xs text-center">Tap a left item, then its match on the right</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item, i) => {
            const isPaired = !!pairs[item]
            const isActive = leftSelected === item
            return (
              <motion.button
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onLeftClick(item)}
                disabled={disabled}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all duration-150
                  ${isPaired ? 'border-success-500/50 bg-success-500/15 text-success-300' :
                    isActive ? 'border-primary-500 bg-primary-500/20 text-white scale-[0.98]' :
                    'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600'}`}
              >
                {isPaired ? `✓ ${item}` : item}
                {isPaired && <span className="text-zinc-500 text-xs block truncate">&rarr; {pairs[item]}</span>}
              </motion.button>
            )
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {rightItems.map((item, i) => {
            const isUsed = usedRight.has(item)
            return (
              <motion.button
                key={item}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onRightClick(item)}
                disabled={disabled || isUsed}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all duration-150
                  ${isUsed ? 'border-success-500/30 bg-success-500/10 text-zinc-500 opacity-60 cursor-not-allowed' :
                    leftSelected ? 'border-accent-500/60 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20 animate-pulse' :
                    'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600'}`}
              >
                {item}
              </motion.button>
            )
          })}
        </div>
      </div>

      {leftSelected && (
        <p className="text-center text-accent-400 text-xs font-medium animate-pulse">
          Now tap a match for "{leftSelected}"
        </p>
      )}
    </div>
  )
}

// ─── Fill in the Blank Question (No Options) ────────────────────────────────

function FillBlankQuestion({
  disabled,
  onConfirm
}: {
  disabled: boolean
  onConfirm: (val: string) => void
}) {
  const [val, setVal] = useState('')

  return (
    <div className="space-y-4 pt-2">
      <input 
        type="text" 
        value={val} 
        onChange={e => setVal(e.target.value)}
        disabled={disabled}
        className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 text-center font-display font-bold text-lg text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
        placeholder="Type your answer here..."
        onKeyDown={e => {
          if (e.key === 'Enter' && val.trim()) {
            onConfirm(val.trim())
          }
        }}
      />
      <button 
        disabled={disabled || !val.trim()}
        onClick={() => onConfirm(val.trim())}
        className="btn-game w-full mt-2 disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  )
}

// ─── Odd One Out Tile ─────────────────────────────────────────────────────────

function OddOneTile({
  option, index, selected, disabled, onClick,
}: {
  option: string, index: number, selected: boolean, disabled: boolean, onClick: () => void,
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      disabled={disabled}
      className={`answer-tile flex items-center gap-3 transition-all duration-150
        ${selected ? 'border-red-500 bg-red-500/20 scale-[0.99]' : ''}
        ${disabled && !selected ? 'opacity-40' : ''}
        ${!disabled ? 'hover:scale-[1.01] active:scale-[0.98] hover:border-red-500/40' : ''}`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors
        ${selected ? 'bg-red-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
        {TILE_LETTERS[index] ?? index + 1}
      </span>
      <span className="text-sm font-medium text-left leading-snug flex-1">{option}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-red-500/30 border-2 border-red-500 shrink-0"
        />
      )}
    </motion.button>
  )
}

// ─── Big 3D Clock Timer Widget ───────────────────────────────────────────────

function BigTimerWidget({ pct, seconds, color, frozen }: {
  pct: number, seconds: number, color: string, frozen: boolean,
}) {
  const r = 31
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Sunburst Sparks on Top-Right */}
      <div className="absolute -top-3 -right-3 z-20 text-amber-400 text-sm animate-pulse pointer-events-none select-none">
        ✨
      </div>

      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 76 76">
        <defs>
          <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <circle cx="38" cy="38" r={r} fill="none" stroke="#131b2e" strokeWidth="6" />
        <motion.circle
          cx="38" cy="38" r={r}
          fill="none"
          stroke={seconds <= 5 ? '#ef4444' : 'url(#clockGradient)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center leading-none">
        <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md">
          {frozen ? '✓' : seconds}
        </span>
        {!frozen && (
          <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest mt-0.5">
            sec
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Circular Timer ───────────────────────────────────────────────────────────

function CircularTimer({ pct, seconds, color, frozen }: {
  pct: number, seconds: number, color: string, frozen: boolean,
}) {
  const r = 14
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative w-9 h-9 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#27272a" strokeWidth="3" />
        <motion.circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold
        ${frozen ? 'text-zinc-600' : ''}`}
        style={{ color: frozen ? undefined : color }}
      >
        {frozen ? '✓' : seconds}
      </span>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatQuestionType(type: string): string {
  const map: Record<string, string> = {
    mcq: 'Choose the correct answer',
    true_false: 'True or False?',
    fill_blank: 'Fill in the blank',
    reorder: 'Rearrange the sentence',
    drag_drop: 'Drag and drop',
    match: 'Match the pairs',
    odd_one_out: 'Find the odd one out',
  }
  return map[type] ?? 'Question'
}
