import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Infinity as InfinityIcon, BookOpen, Play } from 'lucide-react'
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
    <div className="min-h-screen w-full relative flex flex-col font-sans selection:bg-[#5865f2] selection:text-white bg-[#0e1626] overflow-x-hidden">
      
      {/* ── 1. BACKGROUND ARTWORK ─────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 scale-105 transform transition-transform duration-1000"
        style={{ backgroundImage: `url('/quiz_intro_bg_clean.jpg')` }}
      >
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[0.5px]" />
      </div>

      {/* ── 2. TOP NAVBAR ─────────────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200/90 group shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Lesson</span>
          </button>

          {/* GrammoQuest Logo */}
          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-0.5 shadow-md group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center text-2xl">
              🦊
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-black text-lg text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                GRAMMAR ADVENTURE
              </span>
            </div>
          </RouterLink>

          {/* Top Right Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-300 text-sky-700 flex items-center gap-1.5 shadow-2xs">
              <span className="text-sm">🎯</span> No Penalty
            </span>
          </div>

        </div>
      </header>

      {/* ── 3. MAIN CONTENT CONTAINER ──────────────────────────────────────── */}
      <main className="flex-1 relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center">
        
        <div className="w-full flex items-center justify-center lg:justify-between gap-8">
          
          {/* ── LEFT DESKTOP DECORATIONS (Wide screen) ────────────────── */}
          <div className="hidden lg:flex flex-col items-start gap-8 w-64 shrink-0 self-end pb-4">
            
            {/* Wooden Signpost Stack */}
            <div className="w-48 bg-[#d97706]/90 backdrop-blur-xs border-4 border-[#78350f] rounded-2xl p-3 shadow-2xl transform -rotate-2 relative overflow-hidden">
              <div className="space-y-1.5 text-center font-display font-black text-amber-950">
                <div className="bg-[#fef3c7] py-1.5 px-3 rounded-lg border-2 border-[#b45309] shadow-xs text-sm tracking-wider">
                  PRACTICE
                </div>
                <div className="bg-[#fef3c7] py-1.5 px-3 rounded-lg border-2 border-[#b45309] shadow-xs text-sm tracking-wider">
                  LEARN
                </div>
                <div className="bg-[#fef3c7] py-1.5 px-3 rounded-lg border-2 border-[#b45309] shadow-xs text-sm tracking-wider">
                  IMPROVE
                </div>
                <div className="bg-[#fef3c7] py-1.5 px-3 rounded-lg border-2 border-[#b45309] shadow-xs text-sm tracking-wider flex items-center justify-center gap-1">
                  <span>GROW</span>
                  <span className="text-xs">🐾</span>
                </div>
              </div>
            </div>

            {/* Stack of Colorful Books */}
            <div className="w-52 space-y-1 transform rotate-1">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs px-3 py-2 rounded-lg border-b-4 border-indigo-900 shadow-md flex items-center justify-between">
                <span>Better Grammar</span>
                <span className="text-[10px] opacity-75">VOL. 1</span>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs px-3 py-2 rounded-lg border-b-4 border-purple-900 shadow-md flex items-center justify-between">
                <span>Brighter Futures</span>
                <span className="text-[10px] opacity-75">VOL. 2</span>
              </div>
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs px-3 py-2 rounded-lg border-b-4 border-teal-900 shadow-md flex items-center justify-between">
                <span>Small Steps</span>
                <span className="text-[10px] opacity-75">VOL. 3</span>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs px-3 py-2 rounded-lg border-b-4 border-amber-800 shadow-md flex items-center justify-between">
                <span>Big Results</span>
                <span className="text-[10px] opacity-75">VOL. 4</span>
              </div>
            </div>

          </div>

          {/* ── CENTER PARCHMENT CARD (Main Focus) ────────────────────────── */}
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* Top Mascot & Speech Bubble Banner */}
            <div className="w-full flex items-end justify-between px-2 mb-[-18px] relative z-30 pointer-events-none">
              
              {/* Left Speech Bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 border-2 border-purple-300 shadow-xl text-slate-900 font-display font-black text-xs sm:text-sm text-center relative flex items-center gap-1.5 transform -rotate-2 pointer-events-auto"
              >
                <span>Ready to Practice? <br/><span className="text-purple-600">Let's go!</span></span>
                {/* Speech Bubble Arrow */}
                <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-purple-300" />
              </motion.div>

              {/* Fox Mascot Center Icon */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-24 h-24 sm:w-28 sm:h-28 relative -mb-4 shrink-0 flex items-center justify-center filter drop-shadow-2xl"
              >
                <div className="text-6xl sm:text-7xl animate-bounce" style={{ animationDuration: '3s' }}>
                  🦊
                </div>
              </motion.div>

              {/* Right Wooden Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-[#fef3c7] border-2 border-amber-600 rounded-2xl px-3.5 py-2 text-center shadow-lg transform rotate-3 pointer-events-auto"
              >
                <p className="text-[11px] font-black text-amber-950 uppercase tracking-wide">
                  No pressure
                </p>
                <p className="text-[9px] font-extrabold text-amber-800">
                  &bull; Practice mode &bull;
                </p>
              </motion.div>

            </div>

            {/* Parchment Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="w-full bg-[#fffef9] rounded-[36px] p-6 sm:p-8 border-4 border-[#e8d5b7] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-visible text-center space-y-5"
            >
              {/* Inner Parchment Double Border Line */}
              <div className="absolute inset-2.5 rounded-[28px] border-2 border-dashed border-[#d9b276]/40 pointer-events-none" />

              {/* Corner Scroll Accents */}
              <div className="absolute top-4 left-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╔</div>
              <div className="absolute top-4 right-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╗</div>
              <div className="absolute bottom-4 left-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╚</div>
              <div className="absolute bottom-4 right-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╝</div>

              {/* Top 3D Target Practice Badge */}
              <div className="relative z-20 flex justify-center -mt-12 sm:-mt-14 mb-2">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-700 p-1 shadow-xl flex flex-col items-center justify-center border-4 border-white transform transition-transform hover:scale-105">
                  <span className="text-2xl sm:text-3xl leading-none">🎯</span>
                  <span className="text-[7px] sm:text-[8px] font-black text-white uppercase tracking-tighter leading-tight mt-1">
                    PRACTICE ARENA
                  </span>
                </div>
              </div>

              {/* Card Title & Subtitle */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/90 px-3.5 py-1 rounded-full border border-indigo-200/80 inline-block shadow-2xs">
                  CASUAL LEARNING MODE
                </span>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  Grammar Practice Arena
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-extrabold max-w-md mx-auto leading-relaxed">
                  Practice without pressure! Unlimited time, no countdown timers, and no ranking penalties.
                </p>
              </div>

              {/* 3 Feature Rows */}
              <div className="space-y-3 text-left pt-2 relative z-10">
                
                {/* Feature 1 */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f8f0ff] border border-purple-200/90 shadow-2xs hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm border border-purple-400">
                      <InfinityIcon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-display font-black text-xs sm:text-sm text-slate-900">Unlimited Practice</p>
                      <p className="text-[11px] text-slate-600 font-semibold">Take as long as you need for every question</p>
                    </div>
                  </div>
                  <div className="relative shrink-0 hidden sm:block">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#fcf8ff] text-purple-700 border border-purple-300 shadow-2xs block">
                      Learn at your pace!
                    </span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f0f7ff] border border-sky-200/90 shadow-2xs hover:border-sky-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm border border-sky-300">
                      <BookOpen className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-display font-black text-xs sm:text-sm text-slate-900">Safe Environment</p>
                      <p className="text-[11px] text-slate-600 font-semibold">Practice does not impact leaderboard rankings</p>
                    </div>
                  </div>
                  <div className="relative shrink-0 hidden sm:block">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#f4faff] text-sky-700 border border-sky-300 shadow-2xs block">
                      Make mistakes!
                    </span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#edfdfd] border border-teal-200/90 shadow-2xs hover:border-teal-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm border border-teal-300">
                      <Zap className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-display font-black text-xs sm:text-sm text-slate-900">Mastery Focus</p>
                      <p className="text-[11px] text-slate-600 font-semibold">Earn XP & Stars when you take the official evaluation quiz</p>
                    </div>
                  </div>
                  <div className="relative shrink-0 hidden sm:block">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#f0fdfc] text-teal-700 border border-teal-300 shadow-2xs block">
                      Build your skills!
                    </span>
                  </div>
                </div>

              </div>

              {/* CTA Start Button Section */}
              <div className="pt-2 relative z-10">
                <div className="relative flex items-center justify-center">
                  <span className="absolute -left-3 sm:-left-4 text-2xl animate-pulse select-none">✨</span>
                  
                  <button
                    onClick={() => start()}
                    disabled={isPending}
                    className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg sm:text-xl tracking-wide bg-gradient-to-r from-[#ff6800] via-[#ea384d] to-[#9810fa] hover:brightness-110 text-white shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-3 border-b-4 border-[#7b00b8] active:translate-y-[2px] active:border-b-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2 text-base">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Preparing Session...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2.5">
                        <Play className="w-6 h-6 fill-current" /> Start Practice Session
                      </span>
                    )}
                  </button>

                  <span className="absolute -right-3 sm:-right-4 text-2xl animate-pulse select-none">✨</span>
                </div>

                <p className="text-xs font-black text-slate-700 mt-3.5 flex items-center justify-center gap-1.5">
                  <span>Practice today, brighter tomorrow!</span>
                  <span className="text-purple-600">🐾</span>
                </p>
              </div>

            </motion.div>
          </div>

          {/* ── RIGHT DESKTOP DECORATIONS (Wide screen) ───────────────── */}
          <div className="hidden lg:flex flex-col items-end gap-6 w-64 shrink-0 self-end pb-4">
            
            {/* Hanging Castle Banner */}
            <div className="w-44 bg-gradient-to-b from-indigo-800 to-purple-900 border-2 border-amber-400 text-white p-3 rounded-b-2xl shadow-xl text-center relative transform rotate-2">
              <div className="text-amber-300 text-lg mb-1">👑</div>
              <p className="font-display font-black text-xs uppercase tracking-wider text-amber-200 leading-snug">
                EXPLORE<br/>LEARN<br/>PRACTICE<br/>GROW
              </p>
            </div>

            {/* Yellow Sticky Note */}
            <div className="w-48 bg-[#fef08a] border-2 border-amber-300 p-3 rounded-xl shadow-lg transform -rotate-3 relative">
              <div className="w-8 h-3 bg-amber-200/80 absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-1" />
              <p className="font-bold text-xs text-amber-950 text-center leading-snug">
                Same Grammar.<br/>Brighter You! 🙂
              </p>
            </div>

            {/* Mug & Books */}
            <div className="w-52 space-y-1 transform -rotate-1">
              <div className="bg-[#f8fafc] border-2 border-slate-300 p-2 rounded-xl shadow-sm text-center mb-2">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter block">
                  👑 GOOD LEARNERS PRACTICE OFTEN
                </span>
              </div>
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-indigo-950 shadow-xs">
                QUIZ
              </div>
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-emerald-950 shadow-xs">
                PRACTICE
              </div>
              <div className="bg-gradient-to-r from-purple-700 to-indigo-900 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-purple-950 shadow-xs">
                PROGRESS
              </div>
              <div className="bg-gradient-to-r from-pink-600 to-rose-700 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-rose-950 shadow-xs">
                CONFIDENCE
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  )
}
