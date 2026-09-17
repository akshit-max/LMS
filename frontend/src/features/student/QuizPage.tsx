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
  Sparkles,
  ArrowRight,
  Check,
  Clock
} from 'lucide-react'
import {
  useQuizSessionStore,
  useCurrentQuestion,
  useQuizProgress,
} from '@/store/quizSessionStore'
import { useSubmitAttempt } from './hooks/useQuiz'
import { useProgress } from './hooks/useCurriculum'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'
import type { QuestionPublic } from '@/types'

const TIMER_SECONDS = 30

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const { attemptId, answers, status, recordAnswer, nextQuestion, setResult, setStatus } =
    useQuizSessionStore()
  const currentQuestion = useCurrentQuestion()
  const progress = useQuizProgress()
  const { mutate: submitAttempt } = useSubmitAttempt()

  const [selected, setSelected] = useState<string | null>(null)
  const [timerPct, setTimerPct] = useState(100)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [timerFrozen, setTimerFrozen] = useState(false)
  const [reorderItems, setReorderItems] = useState<string[]>([])
  // Match the Following state: { leftSelected, pairs: {left→right} }
  const [matchLeft, setMatchLeft] = useState<string | null>(null)
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({})
  // Visual streak — counts consecutive non-blank answers (display only, not authoritative)
  const [visualStreak, setVisualStreak] = useState(0)
  const questionStartTime = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    setTimerFrozen(false)
    setTimerPct(100)
    setTimeLeft(TIMER_SECONDS)
    questionStartTime.current = Date.now()

    if (currentQuestion.type === 'reorder') {
      setReorderItems([...currentQuestion.options].sort(() => Math.random() - 0.5))
    }
    // Reset match state
    setMatchLeft(null)
    setMatchPairs({})
  }, [currentQuestion?.id])

  // Countdown timer
  useEffect(() => {
    if (timerFrozen || !currentQuestion) return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1
        setTimerPct((next / TIMER_SECONDS) * 100)
        if (next <= 0) {
          // Time's up — auto-submit current selection or blank
          // We must use a ref or state wrapper, but since this runs in setInterval, 
          // we use the dispatcher pattern or just rely on useEffect's scope?
          // Actually, we can just call confirmAnswer from inside the setTimeLeft using the stale closure?
          // Better: just trigger the timeout state.
          return 0
        }
        return next
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerFrozen, currentQuestion?.id])

  const handleOptionClick = useCallback((answer: string) => {
    if (timerFrozen) return
    setSelected(answer)
  }, [timerFrozen])

  const confirmAnswer = useCallback((answerToRecord: string) => {
    if (timerFrozen) return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerFrozen(true)

    // Update visual streak
    if (answerToRecord === '') {
      setVisualStreak(0)
    } else {
      setVisualStreak(s => s + 1)
    }

    const timeTakenMs = Date.now() - questionStartTime.current
    recordAnswer({
      questionId: currentQuestion!.id,
      selectedAnswer: answerToRecord,
      timeTakenMs,
    })
  }, [timerFrozen, currentQuestion, recordAnswer])
  const handleNext = useCallback(() => {
    if (!timerFrozen) {
      confirmAnswer(selected ?? '')
    }
    
    if (progress.current >= progress.total - 1) {
      handleSubmitAll()
    } else {
      nextQuestion()
    }
  }, [timerFrozen, selected, confirmAnswer, progress, nextQuestion])

  // Watch for timeout hitting 0 to trigger submission
  useEffect(() => {
    if (timeLeft === 0 && !timerFrozen) {
       handleNext()
    }
  }, [timeLeft, timerFrozen, handleNext])

  const handleSubmitAll = () => {
    if (!attemptId) return
    setStatus('submitting')

    // Read the latest state from the store directly to avoid closure staleness
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

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = userCurriculumProgress?.totalXP ?? 315
  const streak = userCurriculumProgress?.currentStreak ?? 1
  const stars = userCurriculumProgress?.totalStars ?? 20

  if (!currentQuestion || status === 'submitting') {
    return (
      <div className="min-h-screen bg-[#0e1626] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-300 text-sm font-bold">
          {status === 'submitting' ? 'Calculating your final score...' : 'Loading question...'}
        </p>
      </div>
    )
  }

  const isLast = progress.current >= progress.total - 1
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#eab308' : '#f97316'

  return (
    <div className="min-h-screen w-full relative flex flex-col font-sans selection:bg-[#5865f2] selection:text-white bg-[#0e1626] overflow-x-hidden">
      
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
                        initial={{ y: -4, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        className="absolute -top-[21px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-30 pointer-events-none select-none w-6"
                      >
                        <span className="text-[14px] leading-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transform -translate-x-[1px]">
                          🦊
                        </span>
                        <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] border-t-amber-500 mt-[0.5px]" />
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
                  onConfirm={handleOptionClick}
                  disabled={timerFrozen}
                />
              ) : currentQuestion.type === 'match' ? (
                <MatchQuestion
                  options={currentQuestion.options}
                  leftSelected={matchLeft}
                  pairs={matchPairs}
                  disabled={timerFrozen}
                  onLeftClick={(item) => {
                    if (timerFrozen) return
                    if (matchPairs[item]) {
                      setMatchPairs(p => { const n = { ...p }; delete n[item]; return n })
                    } else {
                      setMatchLeft(l => l === item ? null : item)
                    }
                  }}
                  onRightClick={(rightItem) => {
                    if (timerFrozen || !matchLeft) return
                    const newPairs = { ...matchPairs, [matchLeft]: rightItem }
                    setMatchPairs(newPairs)
                    setMatchLeft(null)
                    const leftCount = Math.floor(currentQuestion.options.length / 2)
                    if (Object.keys(newPairs).length === leftCount) {
                      const canonical = Object.keys(newPairs).sort().map(l => `${l}→${newPairs[l]}`).join('|')
                      handleOptionClick(canonical)
                    }
                  }}
                />
              ) : (
                currentQuestion.options.map((option, i) => (
                  <AnswerTile
                    key={option}
                    option={option}
                    index={i}
                    selected={selected === option}
                    disabled={timerFrozen}
                    onClick={() => handleOptionClick(option)}
                  />
                ))
              )}
            </div>

            {/* CTA Submit / Next Button */}
            <div className="pt-2">
              <button
                onClick={handleNext}
                disabled={selected === null || timerFrozen}
                className={`w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                  selected !== null && !timerFrozen
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white shadow-[0_10px_25px_-5px_rgba(249,115,22,0.45)] hover:shadow-[0_15px_30px_-5px_rgba(249,115,22,0.6)] cursor-pointer'
                    : 'bg-orange-500/20 text-orange-300/80 border border-orange-400/30 cursor-not-allowed'
                }`}
              >
                <span>{isLast ? 'Submit Quiz' : 'Submit Answer'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

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
          {/* Mountain Graphic Accent */}
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
  option, index, selected, disabled, onClick,
}: {
  option: string, index: number, selected: boolean, disabled: boolean, onClick: () => void,
}) {
  const letter = TILE_LETTERS[index] ?? String(index + 1)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-3.5 sm:py-4 rounded-2xl border-2 flex items-center gap-3.5 text-left font-bold text-base transition-all duration-150 cursor-pointer
        ${selected 
          ? 'border-[#2563eb] bg-[#eff6ff] text-slate-900 shadow-xs ring-2 ring-[#2563eb]/20' 
          : 'border-slate-200/90 bg-slate-50/80 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
        }
        ${disabled && !selected ? 'opacity-40' : ''}`}
    >
      <div className={`w-9 h-9 rounded-full font-black text-sm flex items-center justify-center shrink-0 transition-colors shadow-2xs
        ${selected ? 'bg-[#2563eb] text-white' : 'bg-slate-200 text-slate-700'}`}>
        {letter}
      </div>
      <span className="flex-1 font-display font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
        {option}
      </span>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
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
