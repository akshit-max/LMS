import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { usePracticeSessionStore } from '@/store/practiceSessionStore'

export default function PracticeResultPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { result, reset } = usePracticeSessionStore()
  const [showReview, setShowReview] = useState(false)

  if (!result) {
    navigate(`/practice/${quizId}`, { replace: true })
    return null
  }

  const pct = Math.round((result.correctCount / result.totalQuestions) * 100)

  const handleRetry = () => {
    reset()
    navigate(`/practice/${quizId}`, { replace: true })
  }

  const handleHome = () => {
    reset()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-8 max-w-lg mx-auto w-full">

        {/* Practice badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-xs font-bold mb-4"
        >
          🎯 Practice Session
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 w-full">
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {pct >= 90 ? '🎉' : pct >= 60 ? '💪' : '📚'}
          </motion.div>
          <h1 className="font-display font-black text-3xl text-white mb-1">
            {pct >= 90 ? 'Excellent!' : pct >= 60 ? 'Good effort!' : 'Keep practising!'}
          </h1>
          <p className="text-zinc-500 text-sm">
            This was practice — no XP or ranking affected.
          </p>
        </motion.div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full card-game p-6 mb-4 text-center border-primary-500/20 bg-primary-500/5"
        >
          <motion.p
            className="font-display font-black text-6xl mb-2 text-primary-300"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {pct}%
          </motion.p>

          <p className="text-zinc-400 text-sm">
            {result.correctCount} / {result.totalQuestions} correct
          </p>

          {result.maxCombo > 1 && (
            <p className="text-accent-400 text-xs font-bold mt-1">⚡ {result.maxCombo}x Combo!</p>
          )}
        </motion.div>

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 mb-5"
        >
          <p className="text-zinc-500 text-xs text-center">
            To earn XP and track your progress, complete the mastery quiz from the chapter page.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="w-full space-y-2 mb-5"
        >
          <button onClick={handleRetry} className="btn-game w-full py-3.5">
            <RotateCcw size={16} /> Practice Again
          </button>
          <button onClick={handleHome} className="btn-secondary w-full py-3">
            <Home size={16} /> Dashboard
          </button>
        </motion.div>

        {/* Review answers */}
        {result.questionResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="w-full"
          >
            <button
              onClick={() => setShowReview(v => !v)}
              className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors text-sm text-zinc-400 font-medium"
            >
              Review answers
              {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {showReview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-3">
                    {result.questionResults.map((qr, i) => (
                      <div
                        key={qr.questionId}
                        className={`card-game p-4 border-l-4 ${qr.isCorrect ? 'border-l-success-500' : 'border-l-red-500'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {qr.isCorrect
                            ? <CheckCircle size={14} className="text-success-400" />
                            : <XCircle size={14} className="text-red-400" />}
                          <span className={`text-xs font-bold ${qr.isCorrect ? 'text-success-400' : 'text-red-400'}`}>
                            {qr.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-zinc-700 text-xs ml-auto">Q{i + 1}</span>
                        </div>
                        {!qr.isCorrect && (
                          <>
                            <p className="text-zinc-500 text-xs mb-0.5">Your answer:</p>
                            <p className="text-red-400 text-sm mb-2">{qr.selectedAnswer || '(no answer)'}</p>
                            <p className="text-zinc-500 text-xs mb-0.5">Correct answer:</p>
                            <p className="text-success-400 text-sm mb-2">{qr.correctAnswer}</p>
                          </>
                        )}
                        {qr.explanation && (
                          <div className="mt-2 p-2.5 bg-zinc-800/60 rounded-xl">
                            <p className="text-zinc-400 text-xs leading-relaxed">💡 {qr.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  )
}
