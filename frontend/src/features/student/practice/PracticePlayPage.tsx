import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Sparkles, Check, Lightbulb, Clock, Infinity as InfinityIcon, BookOpen } from 'lucide-react'
import {
  usePracticeSessionStore,
  usePracticeCurrentQuestion,
  usePracticeProgress,
} from '@/store/practiceSessionStore'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import type { PracticeResult } from '@/store/practiceSessionStore'
import type { QuestionPublic } from '@/types'

export default function PracticePlayPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const { attemptId, status, recordAnswer, nextQuestion, setResult, setStatus } =
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
  const { mutate: submitPractice } = useMutation({
    mutationFn: async () => {
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
      <div className="min-h-screen w-full flex items-center justify-center bg-[#fffef7] font-sans p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url('/quiz_intro_bg_clean.jpg')` }}
        >
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl p-8 border-4 border-purple-200 shadow-2xl flex flex-col items-center gap-5 text-center max-w-sm w-full"
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-indigo-500 border-b-sky-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-sky-400 flex items-center justify-center text-3xl shadow-md border-2 border-white relative z-10">
              🎯
            </div>
          </div>
          <div>
            <p className="text-slate-900 font-display font-black text-lg tracking-tight">
              Calculating Results...
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Great practice session! Wrapping up...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  const stepPct = Math.min(((progress.current + 1) / progress.total) * 100, 100)

  return (
    <div className="min-h-screen w-full relative flex flex-col font-sans selection:bg-[#5865f2] selection:text-white bg-[#0e1626] overflow-x-hidden">
      
      {/* ── 1. BACKGROUND ARTWORK ─────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/quiz_intro_bg_clean.jpg')` }}
      >
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[0.5px]" />
      </div>

      {/* ── 2. TOP NAVBAR ─────────────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Exit Button */}
          <button 
            onClick={() => navigate(`/practice/${quizId}`, { replace: true })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 font-black text-xs transition-all border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Exit Practice</span>
          </button>

          {/* GrammoQuest Logo */}
          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-0.5 shadow-md group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center text-xl">
              🦊
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-black text-base text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                CASUAL PRACTICE
              </span>
            </div>
          </RouterLink>

          {/* Right Untimed Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-purple-50/90 border border-purple-200 text-purple-700 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Untimed
            </span>
          </div>

        </div>

        {/* Stepper Progress Bar with Fox Mascot Pointer */}
        <div className="w-full bg-white/90 border-t border-slate-200/60 py-2 px-4">
          <div className="max-w-md mx-auto relative flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">🦊</span>
                Question {progress.current + 1} of {progress.total}
              </span>
              <span className="text-[#5865f2] uppercase tracking-wider flex items-center gap-1">
                <span>🎯</span> PRACTICE ARENA
              </span>
            </div>
            
            <div className="h-2.5 w-full bg-slate-200/80 rounded-full relative overflow-visible p-0.5 border border-slate-300/80">
              {/* Fox Mascot Pointer riding along progress bar */}
              <motion.div
                className="absolute -top-[15px] z-20 flex flex-col items-center"
                animate={{ left: `calc(${stepPct}% - 12px)` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center text-xs border border-white">
                  🦊
                </div>
              </motion.div>

              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 rounded-full"
                animate={{ width: `${stepPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN GAME ARENA (3-COLUMN DESKTOP LAYOUT) ────────────────────── */}
      <main className="flex-1 relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* ── LEFT DESKTOP WIDGETS & MASCOT (3 cols) ───────────────── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col items-start space-y-6">
            
            {/* Wooden Signpost */}
            <div className="w-48 bg-[#d97706]/90 backdrop-blur-xs border-4 border-[#78350f] rounded-2xl p-3 shadow-xl transform -rotate-2 relative overflow-hidden">
              <div className="bg-[#fef3c7] py-2 px-3 rounded-xl border-2 border-[#b45309] text-center shadow-xs">
                <p className="font-display font-black text-amber-950 text-xs uppercase tracking-wide leading-snug">
                  Small Steps<br/>Big Progress! 💖
                </p>
              </div>
            </div>

            {/* Fox Mascot & Speech Bubble */}
            <div className="relative flex flex-col items-start space-y-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border-2 border-purple-300 shadow-xl text-slate-800 text-xs font-black text-center relative max-w-[200px] leading-snug"
              >
                <span>You've got this!<br/><span className="text-purple-600">Pick the best answer!</span></span>
                <div className="w-3 h-3 bg-white border-b-2 border-r-2 border-purple-300 rotate-45 absolute -bottom-1.5 left-8" />
              </motion.div>

              <div className="text-7xl filter drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                🦊
              </div>
            </div>

            {/* Stack of Colorful Books */}
            <div className="w-52 space-y-1 transform rotate-1">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-indigo-950 shadow-xs">
                PRACTICE
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-purple-950 shadow-xs">
                LEARN
              </div>
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-teal-950 shadow-xs">
                IMPROVE
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs px-3 py-1.5 rounded-lg border-b-2 border-amber-950 shadow-xs">
                GROW
              </div>
            </div>

          </div>

          {/* ── CENTER PARCHMENT CARD & QUESTION (6 cols) ────────────── */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto flex flex-col items-center space-y-4">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.25 }}
                className="w-full bg-[#fffef9] rounded-[36px] p-6 sm:p-8 border-4 border-[#e8d5b7] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-visible text-left space-y-6"
              >
                {/* Inner Parchment Border Line */}
                <div className="absolute inset-2.5 rounded-[28px] border-2 border-dashed border-[#d9b276]/40 pointer-events-none" />

                {/* Corner Scroll Accents */}
                <div className="absolute top-4 left-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╔</div>
                <div className="absolute top-4 right-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╗</div>
                <div className="absolute bottom-4 left-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╚</div>
                <div className="absolute bottom-4 right-4 text-[#d9b276]/60 text-xs font-serif select-none pointer-events-none">╝</div>

                {/* Top Card Header */}
                <div className="flex items-center justify-between relative z-10">
                  <span className="px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[#5865f2] font-black text-xs uppercase tracking-widest shadow-2xs">
                    QUESTION {progress.current + 1}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500">
                    No Ranking Penalty
                  </span>
                </div>

                {/* Question Prompt */}
                <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight leading-snug relative z-10">
                  {currentQuestion.text}
                </h2>

                {/* Question Options */}
                <div className="relative z-10">
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
                        const leftCount = Math.floor((currentQuestion.options?.length ?? 0) / 2)
                        if (Object.keys(newPairs).length === leftCount) {
                          const canonical = Object.keys(newPairs).sort().map(l => `${l}→${newPairs[l]}`).join('|')
                          handleOptionClick(canonical)
                        }
                      }
                    }}
                    onReorderChange={(items) => setReorderItems(items)}
                    onReorderSubmit={() => handleOptionClick(reorderItems.join('|'))}
                    disabled={false}
                  />
                </div>

                {/* Action CTA Button */}
                <div className="pt-2 relative z-10">
                  {selected === null ? (
                    <button
                      disabled
                      className="w-full py-4 px-6 rounded-2xl font-display font-black text-base sm:text-lg tracking-wide bg-slate-200 text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed border-2 border-slate-300"
                    >
                      <span>Select an answer to continue</span>
                      <ArrowRight className="w-5 h-5 opacity-60" />
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmAndNext}
                      className="w-full py-4 px-6 rounded-2xl font-display font-black text-base sm:text-lg tracking-wide bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:brightness-110 text-white shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 border-b-4 border-purple-800 active:translate-y-[2px] cursor-pointer"
                    >
                      <span>{progress.current >= progress.total - 1 ? 'Submit Practice Session' : 'Confirm & Next'}</span>
                      <ArrowRight className="w-5 h-5 stroke-[3]" />
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>

            {/* Bottom Motivation Pill */}
            <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-2 border border-purple-200 shadow-md text-xs font-black text-slate-700 flex items-center justify-center gap-2 max-w-md w-full">
              <span className="text-amber-500">⭐</span>
              <span>Great learners practice, and practice makes progress!</span>
              <span className="text-purple-500">✨</span>
            </div>

          </div>

          {/* ── RIGHT DESKTOP WIDGETS (3 cols) ───────────────────────── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4">
            
            {/* Widget 1: Wooden Header Timer Box */}
            <div className="w-full bg-[#fef3c7] border-2 border-amber-500 p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-black text-xs text-amber-950">Take your time!</p>
                  <p className="text-[10px] font-bold text-amber-800">Practice mode - no timer</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 font-bold">
                <InfinityIcon className="w-4 h-4" />
              </div>
            </div>

            {/* Widget 2: Hint Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-sky-200 shadow-md space-y-2 text-left">
              <div className="flex items-center gap-2 text-sky-700">
                <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="font-display font-black text-xs uppercase tracking-wider">Hint</span>
              </div>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Look carefully at the sentence structure and choose the grammatically correct option.
              </p>
            </div>

            {/* Widget 3: Grammo Mascot Quote */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border-2 border-purple-200 shadow-md flex items-center justify-between gap-3 text-left">
              <p className="text-[11px] font-black text-purple-900 leading-snug">
                “Practice today, brighter tomorrow!!”
                <span className="block font-bold text-slate-500 text-[10px] mt-0.5">&mdash; Grammo 🦊</span>
              </p>
              <span className="text-2xl">❝</span>
            </div>

            {/* Widget 4: Progress Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-slate-200 shadow-md space-y-2 text-left">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span>Your Progress</span>
                <span className="text-purple-600">{progress.current + 1} of {progress.total}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-purple-600 rounded-full" 
                  style={{ width: `${stepPct}%` }} 
                />
              </div>
            </div>

            {/* Bottom Wooden Banner */}
            <div className="bg-[#fef3c7] border-2 border-amber-600 rounded-2xl p-3 text-center shadow-md">
              <p className="font-handwriting font-bold text-xs text-amber-950 leading-snug flex items-center justify-center gap-1">
                <span>Better Grammar Brighter You!</span>
                <span>🐾</span>
              </p>
            </div>

          </div>

        </div>

      </main>

    </div>
  )
}

// ─── Practice Question Renderer (Matches Screenshot 2 Option Styling) ───────

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
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']

  if (type === 'mcq' || type === 'true_false' || type === 'fill_blank') {
    return (
      <div className="space-y-3 pt-1">
        {question.options?.map((opt, idx) => {
          const isSelected = selected === opt
          const letter = letters[idx % letters.length]

          return (
            <button
              key={opt}
              disabled={disabled}
              onClick={() => onSelect(opt)}
              className={`w-full text-left px-4.5 py-3.5 rounded-2xl border-2 transition-all font-display font-bold text-sm sm:text-base flex items-center justify-between group cursor-pointer shadow-2xs ${
                isSelected
                  ? 'border-[#5865f2] bg-indigo-50/90 text-[#5865f2] shadow-md ring-2 ring-indigo-200'
                  : 'border-slate-200/90 bg-white text-slate-800 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-colors shrink-0 ${
                  isSelected ? 'bg-[#5865f2] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-[#5865f2]'
                }`}>
                  {letter}
                </span>
                <span>{opt}</span>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-[#5865f2] text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (type === 'odd_one_out') {
    return (
      <div className="grid grid-cols-2 gap-3 pt-1">
        {question.options?.map((opt) => {
          const isSelected = selected === opt
          return (
            <button
              key={opt}
              disabled={disabled}
              onClick={() => onSelect(opt)}
              className={`p-4 rounded-2xl border-2 text-center transition-all font-display font-bold text-sm cursor-pointer shadow-2xs ${
                isSelected 
                  ? 'border-[#5865f2] bg-indigo-50/90 text-[#5865f2] shadow-md' 
                  : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (type === 'match') {
    const half = Math.floor((question.options?.length ?? 0) / 2)
    const lefts = question.options?.slice(0, half) ?? []
    const rights = question.options?.slice(half) ?? []
    const usedRight = new Set(Object.values(matchPairs))

    return (
      <div className="space-y-4 pt-1">
        <p className="text-slate-500 text-xs font-bold">Tap a left item, then its match on the right:</p>
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
                  className={`w-full px-3.5 py-3 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                    isPaired ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
                    isActive ? 'border-[#5865f2] bg-indigo-50 text-[#5865f2] scale-[0.98]' :
                    'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {isPaired ? `✓ ${l}` : l}
                  {isPaired && <span className="text-slate-500 text-[10px] block truncate">&rarr; {matchPairs[l]}</span>}
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
                  className={`w-full px-3.5 py-3 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                    isUsed ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed' :
                    matchLeft ? 'border-amber-400 bg-amber-50 text-amber-900 animate-pulse' :
                    'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                  }`}
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
      <div className="space-y-2.5 pt-1">
        {reorderItems.map((item, i) => (
          <div key={item} className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <button
                disabled={i === 0 || disabled}
                onClick={() => {
                  const arr = [...reorderItems]
                  ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
                  onReorderChange(arr)
                }}
                className="w-7 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
              >▲</button>
              <button
                disabled={i === reorderItems.length - 1 || disabled}
                onClick={() => {
                  const arr = [...reorderItems]
                  ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
                  onReorderChange(arr)
                }}
                className="w-7 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
              >▼</button>
            </div>
            <div className="flex-1 p-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-xs">
              {item}
            </div>
          </div>
        ))}
        <button
          disabled={disabled}
          onClick={onReorderSubmit}
          className="w-full py-3 mt-2 rounded-xl bg-[#5865f2] hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          Confirm Order
        </button>
      </div>
    )
  }

  return null
}
