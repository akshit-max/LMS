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
  }, [currentQuestion?.id])

  // Countdown timer
  useEffect(() => {
    if (timerFrozen || !currentQuestion) return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1
        setTimerPct((next / TIMER_SECONDS) * 100)
        if (next <= 0) {
          // Time's up — auto-submit blank
          handleSelectAnswer('')
          return 0
        }
        return next
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerFrozen, currentQuestion?.id])

  const handleSelectAnswer = useCallback((answer: string) => {
    if (selected !== null || timerFrozen) return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerFrozen(true)
    setSelected(answer)

    const timeTakenMs = Date.now() - questionStartTime.current

    recordAnswer({
      questionId: currentQuestion!.id,
      selectedAnswer: answer,
      timeTakenMs,
    })
  }, [selected, timerFrozen, currentQuestion, recordAnswer])

  const handleNext = () => {
    if (progress.current >= progress.total) {
      handleSubmitAll()
    } else {
      nextQuestion()
    }
  }

  const handleSubmitAll = () => {
    if (!attemptId) return
    setStatus('submitting')

    submitAttempt(
      { attemptId, answers: [...answers] },
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
                  onConfirm={handleSelectAnswer}
                  disabled={selected !== null}
                />
              ) : (
                currentQuestion.options.map((option, i) => (
                  <AnswerTile
                    key={option}
                    option={option}
                    index={i}
                    selected={selected === option}
                    disabled={selected !== null}
                    onClick={() => handleSelectAnswer(option)}
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
                    {isLast ? 'Submit Quiz →' : 'Next Question →'}
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
  const [order, setOrder] = useState(items)
  const [dragging, setDragging] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    const next = [...order]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setOrder(next)
  }

  return (
    <div className="space-y-2">
      <p className="text-zinc-500 text-xs text-center mb-3">Tap items to rearrange</p>
      {order.map((item, i) => (
        <div
          key={item}
          className={`card-game p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing
            ${dragging === i ? 'opacity-50 border-primary-500/60' : 'hover:border-zinc-600'}`}
          draggable
          onDragStart={() => setDragging(i)}
          onDragOver={e => { e.preventDefault(); if (dragging !== null && dragging !== i) move(dragging, i) }}
          onDragEnd={() => setDragging(null)}
        >
          <span className="text-zinc-600 text-xs font-mono">≡</span>
          <span className="text-white text-sm">{item}</span>
        </div>
      ))}
      {!disabled && (
        <button
          onClick={() => onConfirm(order.join(' '))}
          className="btn-game w-full mt-2"
        >
          Confirm Order
        </button>
      )}
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
