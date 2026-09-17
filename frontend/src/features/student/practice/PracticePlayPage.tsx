import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import {
  usePracticeSessionStore,
  usePracticeCurrentQuestion,
  usePracticeProgress,
} from '@/store/practiceSessionStore'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import type { PracticeResult } from '@/store/practiceSessionStore'
import type { QuestionPublic } from '@/types'

// CRITICAL: Submits to /practice/attempts/:id/submit — NOT the mastery endpoint.
// This page must never use useSubmitAttempt() from useQuiz.ts.
export default function PracticePlayPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const { attemptId, answers, status, recordAnswer, nextQuestion, setResult, setStatus, questions } =
    usePracticeSessionStore()
  const currentQuestion = usePracticeCurrentQuestion()
  const progress = usePracticeProgress()

  const [selected, setSelected] = useState<string | null>(null)
  const [matchLeft, setMatchLeft] = useState<string | null>(null)
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({})
  const [reorderItems, setReorderItems] = useState<string[]>([])
  const questionStartTime = useRef(Date.now())

  // Guard: if session not started, redirect to intro
  useEffect(() => {
    if (!attemptId) {
      navigate(`/practice/${quizId}`, { replace: true })
    }
  }, [attemptId])

  // Reset per-question state
  useEffect(() => {
    if (!currentQuestion) return
    setSelected(null)
    setMatchLeft(null)
    setMatchPairs({})
    setReorderItems(currentQuestion.options ? [...currentQuestion.options] : [])
    questionStartTime.current = Date.now()
  }, [currentQuestion?.id])

  // Submit mutation — practice endpoint only
  const { mutate: submitPractice, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      // Read the latest state from the store directly to avoid closure staleness
      const latestAnswers = usePracticeSessionStore.getState().answers
      const res = await api.post<PracticeResult>(`/practice/attempts/${attemptId}/submit`, {
        answers: latestAnswers,
      })
      return res.data
    },
    onSuccess: (result) => {
      setResult(result)
      navigate(`/practice/${quizId}/result`, { replace: true })
    },
  })

  const handleOptionClick = useCallback((answer: string) => {
    // Just update the local selection state. Don't record or advance yet.
    setSelected(answer)
  }, [])

  const handleConfirmAndNext = useCallback(() => {
    if (selected === null) return
    const timeTakenMs = Date.now() - questionStartTime.current
    recordAnswer({ questionId: currentQuestion!.id, selectedAnswer: selected, timeTakenMs })

    const isLast = progress.current >= progress.total - 1
    if (isLast) {
      setStatus('submitting')
      submitPractice()
    } else {
      nextQuestion()
    }
  }, [selected, currentQuestion, progress, recordAnswer, submitPractice, nextQuestion, setStatus])

  if (!currentQuestion || status === 'submitting') {
    return (
      <div className="min-h-dvh bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      {/* Header — no timer for practice */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-surface-950/80 backdrop-blur-sm z-10">
        <button
          onClick={() => navigate(`/practice/${quizId}`, { replace: true })}
          className="p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <X size={18} className="text-zinc-400" />
        </button>

        {/* Progress bar */}
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <span className="text-zinc-500 text-xs font-medium shrink-0">
          {progress.current}/{progress.total}
        </span>

        <span className="text-xs text-primary-400 font-bold shrink-0">🎯 Practice</span>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <p className="text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">
              Q{progress.index + 1}
            </p>
            <h2 className="font-display font-bold text-white text-lg leading-snug mb-6">
              {currentQuestion.text}
            </h2>

            {/* Question type renderers — reused from mastery quiz */}
            <PracticeQuestionRenderer
              question={currentQuestion}
              selected={selected}
              matchLeft={matchLeft}
              matchPairs={matchPairs}
              reorderItems={reorderItems}
              onSelect={handleOptionClick}
              onMatchSelect={(side, val) => {
                if (side === 'left') {
                  if (matchPairs[val]) {
                    setMatchPairs(p => { const n = { ...p }; delete n[val]; return n })
                  } else {
                    setMatchLeft(l => l === val ? null : val)
                  }
                } else if (matchLeft) {
                  const newPairs = { ...matchPairs, [matchLeft]: val }
                  setMatchPairs(newPairs)
                  setMatchLeft(null)
                  // Let them confirm manually instead of auto-submitting
                  const leftCount = Math.floor((currentQuestion.options?.length ?? 0) / 2)
                  if (Object.keys(newPairs).length === leftCount) {
                    const canonical = Object.keys(newPairs).sort().map(l => `${l}→${newPairs[l]}`).join('|')
                    handleOptionClick(canonical)
                  }
                }
              }}
              onReorderChange={(items) => setReorderItems(items)}
              onReorderSubmit={() => handleOptionClick(reorderItems.join('|'))}
              disabled={false} // never disabled, allow switching
            />

            {/* Next button (shown after an answer is selected) */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <button onClick={handleConfirmAndNext} className="btn-game w-full text-base py-3.5">
                    {progress.current >= progress.total - 1 ? 'Submit Practice →' : 'Next Question →'}
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

// ─── Practice Question Renderer ───────────────────────────────────────────────
// Reuses the same UI patterns as mastery QuizPage but fully self-contained.

function PracticeQuestionRenderer({
  question, selected, matchLeft, matchPairs, reorderItems,
  onSelect, onMatchSelect, onReorderChange, onReorderSubmit, disabled,
}: {
  question: QuestionPublic
  selected: string | null
  matchLeft: string | null
  matchPairs: Record<string, string>
  reorderItems: string[]
  onSelect: (a: string) => void
  onMatchSelect: (side: 'left' | 'right', val: string) => void
  onReorderChange: (items: string[]) => void
  onReorderSubmit: () => void
  disabled: boolean
}) {
  const { type } = question

  if (type === 'mcq' || type === 'true_false' || type === 'fill_blank') {
    return (
      <div className="space-y-3">
        {question.options?.map((opt) => (
          <button
            key={opt}
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all font-medium text-sm
              ${selected === opt
                ? 'border-primary-500 bg-primary-500/15 text-white'
                : 'border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60'
              } ${disabled && selected !== opt ? 'opacity-50' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'odd_one_out') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {question.options?.map((opt) => (
          <button
            key={opt}
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className={`px-4 py-3 rounded-2xl border text-center transition-all font-medium text-sm
              ${selected === opt ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:border-zinc-600'}
              ${disabled && selected !== opt ? 'opacity-50' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'match') {
    const half = Math.floor((question.options?.length ?? 0) / 2)
    const lefts = question.options?.slice(0, half) ?? []
    const rights = question.options?.slice(half) ?? []
    const usedRight = new Set(Object.values(matchPairs))

    return (
      <div className="space-y-4">
        <p className="text-zinc-500 text-xs text-center">Tap a left item, then its match on the right</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {lefts.map(l => {
              const isPaired = !!matchPairs[l]
              const isActive = matchLeft === l
              return (
                <button
                  key={l}
                  disabled={disabled}
                  onClick={() => onMatchSelect('left', l)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-left text-sm transition-all
                    ${isPaired ? 'border-success-500/50 bg-success-500/15 text-success-300' :
                      isActive ? 'border-primary-500 bg-primary-500/20 text-white scale-[0.98]' :
                      'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600'}`}
                >
                  {isPaired ? `✓ ${l}` : l}
                  {isPaired && <span className="text-zinc-500 text-xs block truncate">&rarr; {matchPairs[l]}</span>}
                </button>
              )
            })}
          </div>
          <div className="space-y-2">
            {rights.map(r => {
              const isUsed = usedRight.has(r)
              return (
                <button
                  key={r}
                  disabled={disabled || isUsed}
                  onClick={() => onMatchSelect('right', r)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-left text-sm transition-all
                    ${isUsed ? 'border-success-500/30 bg-success-500/10 text-zinc-500 opacity-60 cursor-not-allowed' :
                      matchLeft ? 'border-accent-500/60 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20 animate-pulse' :
                      'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600'}`}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'reorder') {
    return (
      <div className="space-y-2">
        {reorderItems.map((item, i) => (
          <div key={item} className="flex gap-2">
            <div className="flex gap-1">
              <button
                disabled={i === 0 || disabled}
                onClick={() => {
                  const arr = [...reorderItems]
                  ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
                  onReorderChange(arr)
                }}
                className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500 text-xs hover:text-zinc-300 disabled:opacity-30 transition-colors"
              >▲</button>
              <button
                disabled={i === reorderItems.length - 1 || disabled}
                onClick={() => {
                  const arr = [...reorderItems]
                  ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
                  onReorderChange(arr)
                }}
                className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500 text-xs hover:text-zinc-300 disabled:opacity-30 transition-colors"
              >▼</button>
            </div>
            <div className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/40 text-zinc-300 text-sm">
              {item}
            </div>
          </div>
        ))}
        <button
          disabled={disabled}
          onClick={onReorderSubmit}
          className="btn-game w-full py-3 mt-2"
        >
          Submit Order
        </button>
      </div>
    )
  }

  return null
}
