import { useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Lock, 
  Play, 
  Star, 
  BookOpen, 
  FileText, 
  Video, 
  Flame, 
  Zap, 
  ChevronDown, 
  LogOut, 
  BarChart2, 
  Trophy, 
  Gamepad2, 
  ChevronRight,
  CheckCircle2,
  Check,
  Sparkles,
  Quote,
  Target,
  Unlock,
  Award
} from 'lucide-react'
import { useChapter, useUnits, useProgress } from './hooks/useCurriculum'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const navigate = useNavigate()
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId!)
  const { data: units } = useUnits()
  const { data: progress } = useProgress()
  const { profile } = useAuthStore()

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const isLocked = chapter?.status === 'locked'
  const isCompleted = chapter?.status === 'completed'

  // Parent unit details
  const parentUnit = units?.find(u => u.id === chapter?.unitId)
  const unitNumber = parentUnit ? units?.findIndex(u => u.id === parentUnit.id)! + 1 : 1
  const unitTitle = parentUnit?.title || 'The Past Tense'

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = progress?.totalXP ?? 315
  const streak = progress?.currentStreak ?? 1
  const stars = progress?.totalStars ?? 20

  if (chapterLoading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#5865f2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center font-black text-slate-700">
        Chapter not found.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans flex flex-col selection:bg-[#5865f2] selection:text-white w-full">
      
      {/* ── 1. TOP NAVIGATION BAR ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back Button */}
          <button 
            onClick={() => navigate(chapter.unitId ? `/units/${chapter.unitId}` : '/dashboard')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors border border-slate-200/80 group shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Unit</span>
          </button>

          {/* Center: Brand Logo */}
          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
              <span className="text-xl">🦊</span>
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-display font-black text-base text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                Grammar Adventure
              </span>
            </div>
          </RouterLink>

          {/* Right: Stats & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-black shadow-2xs">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak}d STREAK</span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-600 text-xs font-black shadow-2xs">
              <Zap className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{totalXP} XP</span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-600 text-xs font-black shadow-2xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars} STARS</span>
            </div>

            {/* Profile Menu */}
            <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5865f2] to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm uppercase">
                  {firstName.charAt(0)}
                </div>
                <div className="hidden md:block leading-tight">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    {firstName}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 space-y-1"
                    >
                      <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl mb-1 border border-indigo-100">
                        <p className="font-black text-xs text-slate-900">{fullName}</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{profile?.email}</p>
                      </div>
                      <RouterLink to="/progress" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                        <BarChart2 className="w-4 h-4 text-[#5865f2]" />
                        <span>My Profile & Stats</span>
                      </RouterLink>
                      <RouterLink to="/leaderboard" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Leaderboard</span>
                      </RouterLink>
                      <div className="border-t border-slate-100 my-1" />
                      <button onClick={() => auth.signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 text-left">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </header>

      {/* ── 2. MAIN CONTAINER ──────────────────────────────────────────────── */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        
        {/* Top Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2.5 max-w-2xl z-10">
            {/* Breadcrumb Pill */}
            <RouterLink 
              to={chapter.unitId ? `/units/${chapter.unitId}` : '/dashboard'}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#5865f2] text-xs font-black hover:bg-indigo-100 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Unit {unitNumber} &bull; {unitTitle}</span>
            </RouterLink>

            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              CHAPTER {chapter.order}
            </span>

            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight leading-tight">
              {chapter.title}
            </h1>

            <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
              {chapter.description || 'Learn how to talk about things that happened in the past. Watch the lesson, read the notes, then take the quiz to unlock the next chapter!'}
            </p>
          </div>

          {/* Speech Bubble Speech Callout */}
          <div className="bg-amber-100/90 border border-amber-300/80 rounded-2xl p-4 max-w-xs w-full shrink-0 flex items-center gap-3 shadow-xs relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 text-lg font-bold shadow-xs">
              💡
            </div>
            <p className="text-xs font-black text-amber-950 leading-snug">
              Past events help us tell our stories! 🦊
            </p>
          </div>
        </div>

        {/* ── 3. THREE-COLUMN STRUCTURED LAYOUT ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ── LEFT COLUMN: Mascot & Topic Nav Pills (3 cols) ─────────────── */}
          <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Fox Avatar Box */}
              <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-2xl p-5 text-center shadow-md relative overflow-hidden group">
                <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-white/30 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Grammar
                </span>
                <div className="text-6xl my-2 group-hover:scale-110 transition-transform duration-300">
                  🦊
                </div>
              </div>

              {/* Stacked Topic Nav Pills */}
              <div className="space-y-2.5">
                <button 
                  onClick={() => navigate(chapter.unitId ? `/units/${chapter.unitId}` : '/dashboard')}
                  className="w-full py-3 px-4 rounded-xl bg-[#5865f2] hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs text-center block"
                >
                  PAST TENSE
                </button>

                <RouterLink 
                  to={chapter.quizId ? `/practice/${chapter.quizId}` : '#'}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs text-center block"
                >
                  PRACTICE
                </RouterLink>

                <RouterLink 
                  to="/progress"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs text-center block"
                >
                  PROGRESS
                </RouterLink>

                <RouterLink 
                  to="/leaderboard"
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs text-center block"
                >
                  BETTER YOU
                </RouterLink>
              </div>

              {/* Small Steps Badge Box */}
              <div className="bg-amber-100/80 border border-amber-300/80 rounded-2xl p-3 text-center">
                <p className="text-xs font-black text-amber-950">
                  Small Steps<br />
                  <span className="text-amber-800">Dig Progress! 🦊</span>
                </p>
              </div>

            </div>
          </div>

          {/* ── CENTER COLUMN: Lesson Resources & Quiz CTA (6 cols) ────────── */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 flex flex-col justify-between h-full">
              
              {/* Header */}
              <div>
                <h2 className="font-display font-black text-xl text-slate-900 tracking-tight flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-[#5865f2]" /> Lesson Resources
                </h2>
              </div>

              {/* Resources List */}
              <div className="space-y-3">
                
                {/* 1. Video Lesson */}
                <RouterLink 
                  to={`/chapters/${chapter.id}/video`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition-transform">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                        Video Lesson
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Watch the lesson and learn the key concepts.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </RouterLink>

                {/* 2. Grammar Notes */}
                <RouterLink 
                  to={`/chapters/${chapter.id}/grammar`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                        Grammar Notes
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Read the summary and examples.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </RouterLink>

                {/* 3. Interactive Lesson */}
                <RouterLink 
                  to={`/chapters/${chapter.id}/interactive`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition-transform">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                        Interactive Lesson
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Coming soon in the next update.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </RouterLink>

              </div>

              {/* Big Orange CTA Quiz Button */}
              <div className="space-y-2 pt-2">
                <RouterLink
                  to={isLocked ? '#' : `/quiz/${chapter.quizId}`}
                  className={`w-full py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md active:translate-y-0.5 ${
                    isLocked
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Quiz &gt;</span>
                </RouterLink>
                <p className="text-[11px] font-extrabold text-slate-400 text-center">
                  Score &ge;90% to unlock the next chapter.
                </p>
              </div>

              {/* Secondary Blue Pill Button */}
              {chapter.quizId && (
                <RouterLink
                  to={`/practice/${chapter.quizId}`}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-sky-50/80 border border-sky-200/80 hover:bg-sky-100/80 transition-colors group text-xs font-black text-sky-700"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Practice (no ranking, no XP)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                </RouterLink>
              )}

            </div>
          </div>

          {/* ── RIGHT COLUMN: Encouragement Checklist & Badges (3 cols) ──────── */}
          <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
            <div className="bg-gradient-to-b from-amber-100/90 via-amber-50/80 to-orange-50/90 border border-amber-300/90 rounded-3xl p-5 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Header */}
              <div className="border-b border-amber-200/80 pb-3 flex items-center justify-between">
                <h3 className="font-display font-black text-xs sm:text-sm text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-600" /> YOU'RE DOING GREAT!
                </h3>
                <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300/80">
                  Pathway
                </span>
              </div>

              {/* Professional Circular Checkmarks Checklist */}
              <div className="space-y-2.5 text-xs font-black text-amber-950">
                
                {/* 1. Watch */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-amber-200/70 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-600" /> Watch
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">Ready</span>
                </div>

                {/* 2. Learn */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-amber-200/70 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" /> Learn
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">Notes</span>
                </div>

                {/* 3. Practice */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-amber-200/70 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-emerald-600" /> Practice
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">Unlocked</span>
                </div>

                {/* 4. Take the Quiz */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-amber-200/70 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-orange-600" /> Take the Quiz
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full">≥90% Target</span>
                </div>

                {/* 5. Unlock Next Chapter */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-amber-200/70 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 border border-slate-300 text-slate-400'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-indigo-600" /> Unlock Next Chapter
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">Next Topic</span>
                </div>

              </div>

              {/* Icon Badges & Reward Widgets Below Checklist */}
              <div className="space-y-2 pt-2 border-t border-amber-200/80">
                {/* Stats Mini Badges */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-2xs flex flex-col items-center justify-center">
                    <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-1 shadow-2xs">
                      <Zap className="w-4 h-4 fill-sky-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Reward</span>
                    <span className="text-xs font-black text-sky-700">+50 XP</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-2xs flex flex-col items-center justify-center">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1 shadow-2xs">
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Badge</span>
                    <span className="text-xs font-black text-amber-700">Mastery</span>
                  </div>
                </div>

                {/* Bottom White Banner */}
                <div className="bg-white border border-amber-300/80 rounded-2xl p-2.5 text-center shadow-2xs flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-bounce" />
                  <p className="text-[9px] font-black tracking-widest text-amber-900 uppercase">
                    GOOD GRAMMAR BRIGHTER FUTURES!
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ── 4. BOTTOM FOOTER BANNER ───────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs font-extrabold text-slate-700">
            <Quote className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>&ldquo;Every expert was once a beginner.&rdquo; &mdash; Keep going!</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <span>Same Grammar. Brighter Futures! 😃</span>
          </div>
        </div>

      </main>

    </div>
  )
}


