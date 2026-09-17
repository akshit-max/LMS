import { useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Infinity as InfinityIcon, BookOpen, Target, Sparkles, Play } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { usePracticeSessionStore } from '@/store/practiceSessionStore'
import type { AttemptStartResponse } from '@/types'

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
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans flex flex-col selection:bg-[#5865f2] selection:text-white w-full">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors border border-slate-200/80 group shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center text-lg">
              🎯
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-black text-base text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                Casual Practice
              </span>
            </div>
          </RouterLink>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" /> No Penalty
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6 text-center relative overflow-hidden"
        >
          {/* Top Decorative Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500" />

          {/* Practice Badge */}
          <motion.div
            className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 p-1 mx-auto shadow-md flex items-center justify-center text-5xl relative group"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎯
            <span className="absolute -bottom-2 bg-slate-900 text-sky-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-400/40 uppercase tracking-wider">
              Practice Arena
            </span>
          </motion.div>

          {/* Header Title */}
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Casual Learning Mode
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Grammar Practice Arena
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              Practice without pressure! Unlimited time, no countdown timers, and no ranking penalties.
            </p>
          </div>

          {/* Rules / Features List */}
          <div className="space-y-2.5 text-left">
            {[
              { icon: InfinityIcon, label: 'Untimed Practice', desc: 'Take as long as you need for every question', color: 'bg-purple-100 text-purple-600' },
              { icon: BookOpen, label: 'Safe Environment', desc: 'Practice does not impact leaderboard rankings', color: 'bg-indigo-100 text-indigo-600' },
              { icon: Zap, label: 'Mastery Focus', desc: 'Earn XP & Stars when you take the official evaluation quiz', color: 'bg-sky-100 text-sky-600' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 font-bold shadow-2xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-black text-sm text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500 font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => start()}
              disabled={isPending}
              className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide bg-gradient-to-r from-[#5865f2] via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:translate-y-0.5 disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing Practice Arena...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> Start Practice Session
                </span>
              )}
            </button>
          </div>

        </motion.div>
      </main>

    </div>
  )
}
