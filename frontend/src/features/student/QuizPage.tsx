import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import {
  useQuizSessionStore,
  useCurrentQuestion,
  useQuizProgress,
} from '@/store/quizSessionStore'
import { useSubmitAttempt } from './hooks/useQuiz'
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

  if (!currentQuestion || status === 'submitting') {
    return (
      <div className="min-h-dvh bg-surface-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm font-medium">
          {status === 'submitting' ? 'Calculating your score...' : 'Loading...'}
        </p>
      </div>
    )
  }

  const isLast = progress.current >= progress.total
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#eab308' : '#f97316'

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      {/* Top bar: progress + timer */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-2">
          {/* Quit button */}
          <button
            onClick={() => { if (confirm('Quit this quiz? Your progress will be lost.')) navigate(-2) }}
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X size={16} className="text-zinc-500" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
              animate={{ width: `${(progress.current / progress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Q counter */}
          <span className="text-zinc-500 text-xs font-medium shrink-0">
            {progress.current}/{progress.total}
          </span>

          {/* Streak badge — visual only, shows answered-question streak */}
          {visualStreak >= 2 && (
            <span className="text-xs font-black text-accent-400 shrink-0">
              ⚡{visualStreak}x
            </span>
          )}

          {/* Circular timer */}
          <CircularTimer pct={timerPct} seconds={timeLeft} color={timerColor} frozen={timerFrozen} />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col px-4 pt-2 pb-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="flex-1 flex flex-col"
          >
            {/* Mascot reaction area — Lottie-ready */}
            <div className="flex justify-center mb-4 mt-2">
              <motion.div
                className="text-4xl"
                animate={selected !== null ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                🦁
              </motion.div>
            </div>

            {/* Question text */}
            <div className="card-game p-5 mb-5">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">
                {formatQuestionType(currentQuestion.type)}
              </p>
              <p className="text-white font-semibold text-lg leading-snug">
                {currentQuestion.text}
              </p>
            </div>

            {/* Answer options */}
            <div className="flex-1 space-y-3">
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
                    // If already paired, unpair
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
                    // Half the options are left-side items
                    const leftCount = Math.floor(currentQuestion.options.length / 2)
                    if (Object.keys(newPairs).length === leftCount) {
                      // All paired — build canonical answer
                      const canonical = Object.keys(newPairs).sort().map(l => `${l}→${newPairs[l]}`).join('|')
                      handleOptionClick(canonical)
                    }
                  }}
                />
              ) : currentQuestion.type === 'odd_one_out' ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, i) => (
                    <OddOneTile
                      key={option}
                      option={option}
                      index={i}
                      selected={selected === option}
                      disabled={timerFrozen}
                      onClick={() => handleOptionClick(option)}
                    />
                  ))}
                </div>
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

            {/* Next button (shown after answering) */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5"
                >
                  <button onClick={handleNext} className="btn-game w-full text-base py-3.5">
                    {progress.current >= progress.total - 1 ? 'Submit Quiz →' : 'Next Question →'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
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
  return (
    <motion.button
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      disabled={disabled}
      className={`answer-tile flex items-center gap-3 transition-all duration-150
        ${selected ? 'border-primary-500 bg-primary-500/20 scale-[0.99]' : ''}
        ${disabled && !selected ? 'opacity-40' : ''}
        ${!disabled ? 'hover:scale-[1.01] active:scale-[0.98]' : ''}`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors
        ${selected ? 'bg-primary-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
        {TILE_LETTERS[index] ?? index + 1}
      </span>
      <span className="text-sm font-medium text-left leading-snug flex-1">{option}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-primary-500/30 border-2 border-primary-500 shrink-0"
        />
      )}
    </motion.button>
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
