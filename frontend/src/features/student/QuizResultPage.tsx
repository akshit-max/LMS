import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Star, Zap, RotateCcw, Home, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useQuizSessionStore } from '@/store/quizSessionStore'

// Static badge catalog — mirrors backend domain.BadgeCatalog.
// Only used for display; the backend is authoritative for award decisions.
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

export default function QuizResultPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { result, reset } = useQuizSessionStore()
  const [showReview, setShowReview] = useState(false)
  const [showUnitCompleteModal, setShowUnitCompleteModal] = useState(true)
  const [showRankUpModal, setShowRankUpModal] = useState(true)

  // If no result in store (e.g. page refresh), redirect to intro
  if (!result) {
    navigate(`/quiz/${quizId}`, { replace: true })
    return null
  }

  const passed = result.passed
  const starsArray = [1, 2, 3]

  const handleRetry = () => {
    reset()
    navigate(`/quiz/${quizId}`, { replace: true })
  }

  const handleHome = () => {
    reset()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-8 max-w-lg mx-auto w-full">

        {/* Result header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 w-full"
        >
          {/* Mascot — Lottie celebration area */}
          <motion.div
            className="text-6xl mb-4"
            animate={passed
              ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }
              : { y: [0, -6, 0] }
            }
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {passed ? '🎉' : '😤'}
          </motion.div>

          <h1 className="font-display font-black text-3xl text-white mb-1">
            {passed ? 'Great job!' : 'Keep going!'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {passed
              ? 'You passed! This chapter is now complete.'
              : `Score ${result.score}% — you need 90% to pass. Try again!`}
          </p>
        </motion.div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className={`w-full card-game p-6 mb-4 text-center
            ${passed ? 'border-success-500/30 bg-success-500/5' : 'border-red-500/20 bg-red-500/5'}`}
        >
          {/* Score number */}
          <motion.p
            className="font-display font-black text-6xl mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            style={{ color: passed ? '#22c55e' : '#ef4444' }}
          >
            {result.score}%
          </motion.p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {starsArray.map((s, i) => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4 + i * 0.12, type: 'spring', stiffness: 300 }}
              >
                <Star
                  size={32}
                  className={s <= result.starsEarned
                    ? 'text-warning-400 fill-warning-400'
                    : 'text-zinc-700'}
                />
              </motion.div>
            ))}
          </div>

          {/* XP earned */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/30 px-4 py-2 rounded-full"
          >
            <Zap size={16} className="text-accent-400" />
            <span className="font-bold text-accent-300 text-sm">+{result.xpEarned} XP earned</span>
          </motion.div>

          {result.personalBest && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-primary-400 text-xs font-bold mt-2"
            >
              🏆 Personal Best!
            </motion.p>
          )}

          {/* Max combo display */}
          {result.maxCombo > 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="text-accent-400 text-xs font-bold mt-1"
            >
              ⚡ {result.maxCombo}x Combo!
            </motion.p>
          )}
        </motion.div>

        {/* Badges earned this attempt */}
        {result.badgesEarned?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full card-game p-4 mb-4 border-warning-500/30 bg-warning-500/5"
          >
            <p className="text-warning-400 text-xs font-bold uppercase tracking-wider mb-2">🎖️ Badges Unlocked!</p>
            <div className="flex flex-wrap gap-2">
              {result.badgesEarned.map(bid => (
                <div key={bid} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700">
                  <span className="text-base">{BADGE_ICONS[bid] ?? '🏅'}</span>
                  <span className="text-white text-xs font-semibold">{BADGE_NAMES[bid] ?? bid}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Unit Complete card — moved to popup modal at the bottom */}

        {/* Attempt info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 text-zinc-600 text-xs mb-5 w-full justify-center"
        >
          <span>Attempt #{result.attemptNumber}</span>
          <span>·</span>
          <span>
            {result.questionResults
              ? `${result.questionResults.filter(q => q.isCorrect).length}/${result.questionResults.length} correct`
              : '—'}
          </span>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="w-full space-y-2 mb-5"
        >
          {!passed ? (
            <button onClick={handleRetry} className="btn-game w-full py-3.5">
              <RotateCcw size={18} /> Try Again
            </button>
          ) : (
            <button onClick={handleHome} className="btn-game w-full py-3.5">
              <Home size={18} /> Back to Journey
            </button>
          )}
          {passed && (
            <button onClick={handleRetry} className="btn-secondary w-full py-3">
              <RotateCcw size={16} /> Retry for more stars
            </button>
          )}
          {!passed && (
            <button onClick={handleHome} className="btn-secondary w-full py-3">
              <Home size={16} /> Dashboard
            </button>
          )}
        </motion.div>

        {/* Question review — collapsible */}
        {result.questionResults && result.questionResults.length > 0 && (
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
                      <QuestionReviewCard key={qr.questionId} qr={qr} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </main>

      {/* Rank-Up Modal — shown first, dismisses to show unit complete if applicable */}
      <AnimatePresence>
        {result.rankUpTitle && showRankUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="card-game p-6 max-w-sm w-full text-center border-accent-500/40 bg-zinc-900 shadow-2xl"
            >
              <motion.p
                className="text-6xl mb-4"
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8 }}
              >🎉</motion.p>
              <h3 className="font-display font-black text-white text-2xl mb-1">Rank Up!</h3>
              <p className="text-accent-400 font-bold text-lg mb-3">{result.rankUpTitle}</p>
              <p className="text-zinc-400 text-sm mb-6">
                You've levelled up your grammar mastery. Keep the momentum going!
              </p>
              <button
                onClick={() => setShowRankUpModal(false)}
                className="btn-game w-full py-3.5"
              >
                Let's Go! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unit Complete Popup — shown after rank-up is dismissed */}
      <AnimatePresence>
        {result.unitComplete && showUnitCompleteModal && !showRankUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="card-game p-6 max-w-sm w-full text-center border-accent-500/40 bg-zinc-900 shadow-2xl"
            >
              <p className="text-5xl mb-4">🎓</p>
              <h3 className="font-display font-black text-white text-2xl mb-2">Level Completed!</h3>
              <p className="text-zinc-400 text-sm mb-5">
                You've mastered every chapter in this unit at ≥90%.
              </p>
              
              <div className="p-4 bg-accent-500/10 rounded-2xl mb-6 border border-accent-500/20">
                <p className="text-accent-400 text-base font-bold mb-1">
                  ⏳ Ask Admin to Unlock
                </p>
                <p className="text-accent-300/70 text-xs">
                  An unlock request has been sent. Once approved, the next unit will appear in your journey.
                </p>
              </div>

              <button
                onClick={() => setShowUnitCompleteModal(false)}
                className="btn-game w-full py-3.5"
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
    <div className={`card-game p-4 border-l-4
      ${qr.isCorrect ? 'border-l-success-500' : 'border-l-red-500'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {qr.isCorrect
          ? <CheckCircle size={14} className="text-success-400" />
          : <XCircle size={14} className="text-red-400" />}
        <span className={`text-xs font-bold ${qr.isCorrect ? 'text-success-400' : 'text-red-400'}`}>
          {qr.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
        <span className="text-zinc-700 text-xs ml-auto">Q{index + 1}</span>
      </div>

      {!qr.isCorrect && (
        <>
          <p className="text-zinc-500 text-xs mb-0.5">Your answer:</p>
          <p className="text-red-400 text-sm mb-2 font-medium">
            {qr.selectedAnswer || '(no answer)'}
          </p>
          <p className="text-zinc-500 text-xs mb-0.5">Correct answer:</p>
          <p className="text-success-400 text-sm font-medium mb-2">{qr.correctAnswer}</p>
        </>
      )}

      {qr.explanation && (
        <div className="mt-2 p-2.5 bg-zinc-800/60 rounded-xl">
          <p className="text-zinc-400 text-xs leading-relaxed">💡 {qr.explanation}</p>
        </div>
      )}
    </div>
  )
}
