import { useState } from 'react'
import { useParams, Link as RouterLink, useNavigate as useNav } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Lock, 
  BookOpen, 
  Star, 
  ChevronRight, 
  Flame, 
  Zap, 
  ChevronDown, 
  LogOut, 
  BarChart2, 
  Trophy, 
  Check,
  CheckCircle2,
  Sparkles,
  Award,
  Clock
} from 'lucide-react'
import { useChapters, useUnits, useProgress } from './hooks/useCurriculum'
import type { ChapterWithStatus } from './hooks/useCurriculum'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'

export default function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const navigate = useNav()
  const { data: chapters, isLoading: chaptersLoading } = useChapters(unitId!)
  const { data: units } = useUnits()
  const { data: progress } = useProgress()
  const { profile } = useAuthStore()

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const currentUnit = units?.find(u => u.id === unitId)
  const unitNumber = currentUnit ? units?.findIndex(u => u.id === unitId)! + 1 : 1
  const unitTitle = currentUnit?.title || 'The Simple Present Tense'
  const unitDescription = currentUnit?.description || 'Learn how to talk about habits, facts and daily routines. This unit will help you build a strong foundation in English!'

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const totalXP = progress?.totalXP ?? 315
  const streak = progress?.currentStreak ?? 1
  const stars = progress?.totalStars ?? 20

  const completedChaptersCount = chapters?.filter(c => c.status === 'completed').length ?? 0
  const totalChaptersCount = chapters?.length ?? 3
  const isUnitComplete = totalChaptersCount > 0 && completedChaptersCount === totalChaptersCount

  // Next unit ID if completed
  const currentUnitIdx = units?.findIndex(u => u.id === unitId) ?? 0
  const nextUnit = units?.[currentUnitIdx + 1]
  const nextUnitTarget = nextUnit ? `/units/${nextUnit.id}` : '/dashboard'

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-[#5865f2] selection:text-white w-full">
      
      {/* ── 1. STICKY TOP NAVBAR ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors border border-slate-200 group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>

          {/* Center Brand Logo */}
          <RouterLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-400 to-amber-300 p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-lg">
                🦊
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-black text-base text-slate-900 tracking-tight leading-none block">
                GrammoQuest
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#5865f2] block">
                Grammar Curriculum &bull; Unit {unitNumber}
              </span>
            </div>
          </RouterLink>

          {/* Right Stats & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-black shadow-xs">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak}d <span className="hidden md:inline text-[10px] text-slate-500 uppercase font-bold">Streak</span></span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-xs font-black shadow-xs">
              <Zap className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{totalXP} <span className="hidden md:inline text-[10px] text-slate-500 uppercase font-bold">XP</span></span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-black shadow-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars} <span className="hidden md:inline text-[10px] text-slate-500 uppercase font-bold">Stars</span></span>
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative border-l border-slate-200 pl-2 sm:pl-3">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5865f2] via-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm border border-white uppercase">
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

      {/* ── 2. STRUCTURED MAIN DASHBOARD LAYOUT ───────────────────────────────── */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* Unit Top Hero Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#5865f2] text-white text-xs font-black">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Unit {unitNumber}</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight leading-tight">
              {unitTitle}
            </h1>

            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              {unitDescription}
            </p>
          </div>

          {/* Unit Completion Progress Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-xs w-full shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-700">
              <span>Unit Progress</span>
              <span className="text-[#5865f2]">{completedChaptersCount}/{totalChaptersCount} Chapters</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${totalChaptersCount > 0 ? (completedChaptersCount / totalChaptersCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Chapter Quest Path List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-display font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Chapters & Topics List
                </h2>
                <span className="text-xs text-slate-400 font-bold">Select a chapter to start learning</span>
              </div>

              {/* Chapters Rows */}
              <div className="space-y-3">
                {chaptersLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                  ))
                ) : (
                  chapters?.map((chapter, index) => (
                    <ChapterRowCard key={chapter.id} chapter={chapter} index={index} />
                  ))
                )}
              </div>

              {/* Unit Complete Trophy Banner */}
              {isUnitComplete && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border-2 border-amber-200/90 shadow-xs space-y-3 mt-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white flex items-center justify-center text-2xl shadow-sm shrink-0 border border-white">
                        🏆
                      </div>
                      <div>
                        <h4 className="font-display font-black text-base text-slate-900">Unit Completed!</h4>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          You scored ≥90% on all chapters in this unit. Great job!
                        </p>
                      </div>
                    </div>

                    <RouterLink
                      to={nextUnitTarget}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-md shrink-0 text-center transition-all hover:scale-105"
                    >
                      Continue to Next Unit &rarr;
                    </RouterLink>
                  </div>

                  {/* Admin Unlock Request Note */}
                  <div className="p-3 rounded-xl bg-amber-100/80 border border-amber-300/80 text-amber-900 text-xs flex items-center gap-2.5 font-semibold shadow-2xs">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Note:</strong> An admin unlock request has been submitted for this unit. Your teacher will review and unlock the next unit soon.
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Companion & Mastery Info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Companion Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 p-1 mx-auto shadow-sm flex items-center justify-center text-4xl">
                🦊
              </div>
              <div>
                <h3 className="font-display font-black text-base text-slate-900">Grammo Companion</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">LEARN &bull; PRACTICE &bull; IMPROVE &bull; GROW</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Small Steps &bull; Big Writers! ✨
                </p>
              </div>
            </div>

            {/* Castle Mastery Milestones Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-display font-black text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Unit Mastery Pathway
              </h3>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase">1. EXPLORE</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase">2. LEARN</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase">3. PRACTICE</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="p-3 rounded-xl bg-amber-500 text-white flex items-center justify-between shadow-xs">
                  <span className="text-xs font-black uppercase">4. MASTER</span>
                  <Star className="w-4 h-4 fill-white" />
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  )
}

function ChapterRowCard({ chapter, index }: { chapter: ChapterWithStatus; index: number }) {
  const isCompleted = chapter.status === 'completed'
  const isAvailable = chapter.status === 'available'
  const isLocked = chapter.status === 'locked'

  return (
    <RouterLink
      to={isLocked ? '#' : `/chapters/${chapter.id}`}
      className={`block p-4 rounded-xl border transition-all group ${
        isCompleted
          ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
          : isAvailable
          ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Status Icon & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
            isCompleted 
              ? 'bg-emerald-500 text-white' 
              : isAvailable 
              ? 'bg-amber-500 text-white' 
              : 'bg-slate-300 text-white'
          }`}>
            {isCompleted ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : isAvailable ? (
              <span>{index + 1}</span>
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Chapter {chapter.order}
            </span>
            <h3 className="font-display font-black text-sm text-slate-900 group-hover:text-[#5865f2] transition-colors truncate">
              {chapter.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {chapter.description || 'Learn key concepts and practice skills.'}
            </p>
          </div>
        </div>

        {/* Right Stars & Chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {isCompleted && (
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= chapter.bestStars ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                Best: {chapter.bestScore}%
              </span>
            </div>
          )}

          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#5865f2] group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

      </div>
    </RouterLink>
  )
}



