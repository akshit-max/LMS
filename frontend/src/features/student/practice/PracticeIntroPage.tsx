import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Infinity, BookOpen } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { usePracticeSessionStore } from '@/store/practiceSessionStore'
import type { AttemptStartResponse } from '@/types'

// CRITICAL: calls /practice/quizzes/:id/start — NOT the mastery start endpoint
export default function PracticeIntroPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { startSession } = usePracticeSessionStore()

  const { mutate: start, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<AttemptStartResponse>(`/practice/quizzes/${quizId}/start`)
      return res.data
    },
    onSuccess: (data) => {
      startSession(data.attemptId, quizId!, data.questions)
      navigate(`/practice/${quizId}/play`, { replace: true })
    },
  })

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="card-game p-6 text-center border-primary-500/20 bg-primary-500/5">
          <p className="text-5xl mb-3">🎯</p>
          <h1 className="font-display font-black text-white text-2xl mb-2">Practice Arena</h1>
          <p className="text-zinc-400 text-sm">
            Practice without pressure. No timers, no ranking — just learning.
          </p>
        </div>

        {/* Rules */}
        <div className="space-y-2">
          {[
            { icon: Infinity, label: 'Untimed', desc: 'Take as long as you need' },
            { icon: BookOpen, label: 'No Ranking', desc: 'Practice doesn\'t affect leaderboards' },
            { icon: Zap, label: 'No XP or Stars', desc: 'Progress comes from mastery quizzes only' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40">
              <div className="w-8 h-8 rounded-xl bg-zinc-700/60 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-zinc-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={() => start()}
          disabled={isPending}
          className="btn-game w-full py-4 text-base"
        >
          {isPending ? 'Starting…' : 'Start Practice'}
        </button>
      </motion.div>
    </div>
  )
}
