import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Star, Target, Clock, RotateCcw } from 'lucide-react'
import { useStartAttempt } from './hooks/useQuiz'
import { useQuizSessionStore } from '@/store/quizSessionStore'

// QuizIntroPage is shown when a student taps "Start Quiz" from ChapterPage.
// It shows quiz metadata and the Start button that calls the backend.
// quizId comes from the route param (same as chapter's quizId).
export default function QuizIntroPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const startSession = useQuizSessionStore(s => s.startSession)
  const { mutate: startAttempt, isPending, error } = useStartAttempt()

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
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>
        <span className="font-display font-bold text-white text-sm">Quiz</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-6"
        >
          {/* Mascot placeholder — Lottie-ready area */}
          <motion.div
            className="text-6xl mb-2"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🦁
          </motion.div>

          <div>
            <p className="text-zinc-500 text-sm font-medium mb-1">Ready to test yourself?</p>
            <h1 className="font-display font-black text-2xl text-white">Grammar Quiz</h1>
          </div>

          {/* Quiz stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-game p-3 text-center">
              <Target size={18} className="text-primary-400 mx-auto mb-1" />
              <p className="font-bold text-white text-sm">5</p>
              <p className="text-zinc-600 text-xs">Questions</p>
            </div>
            <div className="card-game p-3 text-center">
              <Clock size={18} className="text-accent-400 mx-auto mb-1" />
              <p className="font-bold text-white text-sm">30s</p>
              <p className="text-zinc-600 text-xs">Per Q</p>
            </div>
            <div className="card-game p-3 text-center">
              <Target size={18} className="text-success-400 mx-auto mb-1" />
              <p className="font-bold text-white text-sm">90%</p>
              <p className="text-zinc-600 text-xs">To pass</p>
            </div>
          </div>

          {/* Stars info */}
          <div className="card-game p-4">
            <p className="text-zinc-400 text-xs font-medium mb-3">Star rewards</p>
            <div className="space-y-2 text-left">
              {[
                { stars: '⭐⭐⭐', score: '90–100%', xp: '+50 XP', color: 'text-warning-400' },
                { stars: '⭐⭐', score: '70–89%', xp: '+30 XP', color: 'text-zinc-400' },
                { stars: '⭐', score: '50–69%', xp: '+15 XP', color: 'text-zinc-500' },
              ].map(r => (
                <div key={r.score} className="flex items-center justify-between">
                  <span className="text-sm">{r.stars}</span>
                  <span className="text-zinc-500 text-xs">{r.score}</span>
                  <span className={`text-xs font-bold ${r.color}`}>{r.xp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Failed to start quiz. Please try again.
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleStart}
            disabled={isPending}
            className="btn-game w-full text-lg py-4"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading quiz...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play size={20} /> Start Quiz
              </span>
            )}
          </button>

          <p className="text-zinc-600 text-xs">
            Questions are shuffled each attempt
          </p>
        </motion.div>
      </main>
    </div>
  )
}
