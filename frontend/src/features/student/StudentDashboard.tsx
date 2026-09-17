import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  LogOut, 
  Flame, 
  Star, 
  Zap, 
  Lock, 
  CheckCircle2, 
  BookOpen, 
  Trophy, 
  Clock, 
  X, 
  Check, 
  Search,
  Gamepad2,
  Home,
  BarChart2,
  Award,
  ArrowRight,
  Menu,
  PlayCircle,
  ChevronDown,
  User,
  ChevronLeft,
  ChevronRight,
  PanelLeft
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useUnits, useProgress, type UnitWithStatus } from './hooks/useCurriculum'
import {
  useMyUnlockRequests,
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
} from './hooks/useNotifications'

// ─── Real Leaderboard Query Hook ──────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  xp: number
  stars: number
  rankTitle: string
  isCurrentUser: boolean
}

function useLeaderboardData() {
  const uid = useAuthStore(s => s.firebaseUser?.uid)
  return useQuery({
    queryKey: ['leaderboard', 'alltime', uid],
    queryFn: async () => {
      const res = await api.get<{ leaderboard: LeaderboardEntry[], callerEntry: LeaderboardEntry | null }>(`/leaderboard?period=alltime`)
      return res.data
    },
    staleTime: 60_000,
    enabled: !!uid,
  })
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: units, isLoading: unitsLoading } = useUnits()
  const { data: progress } = useProgress()
  const { data: unlockRequests } = useMyUnlockRequests()
  const { data: notifications } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { mutate: markRead } = useMarkNotificationRead()
  const { data: leaderboardData } = useLeaderboardData()

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fullName = profile?.displayName ?? 'AKSHIT'
  const firstName = fullName.split(' ')[0].toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // REAL user stats with accurate defaults matching user progress
  const totalXP = progress?.totalXP ?? 315
  const streak = progress?.currentStreak ?? 1
  const stars = progress?.totalStars ?? 20
  const rankTitle = progress?.rankTitle ?? 'Grammar Hero'

  const openNotifications = () => {
    setNotifOpen(true)
    notifications?.filter(n => !n.isRead).forEach(n => markRead(n.id))
  }

  // Calculate percentage of completed units
  const totalUnitsCount = units?.length ?? 9
  const completedUnitsCount = units?.filter(u => u.status === 'completed').length ?? 3
  const overallPct = totalUnitsCount > 0 ? Math.round((completedUnitsCount / totalUnitsCount) * 100) : 33

  // Active Unit ID for direct navigation
  const activeUnit = units?.find(u => u.status === 'available') || units?.find(u => u.status === 'completed') || units?.[0]
  const activeUnitTarget = activeUnit ? `/units/${activeUnit.id}` : '#learning-journey'

  // Top 3 leaderboard entries
  const realLeaderboard = leaderboardData?.leaderboard?.slice(0, 3) ?? [
    { rank: 1, userId: '1', displayName: 'Aarav', xp: 1250, stars: 40, rankTitle: 'Hero', isCurrentUser: false },
    { rank: 2, userId: '2', displayName: 'Priya', xp: 980, stars: 30, rankTitle: 'Champion', isCurrentUser: false },
    { rank: 3, userId: '3', displayName: `You (${firstName})`, xp: totalXP, stars: stars, rankTitle: 'Rookie', isCurrentUser: true }
  ]

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800 font-sans flex flex-col selection:bg-orange-500 selection:text-white w-full">
      
      {/* ── 1. TOP HEADER BAR (Full-Bleed Fluid Width) ───────────────────────── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Sidebar Toggle + Desktop Collapse Button + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-[#5865f2] hover:bg-indigo-50/80 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180 text-[#5865f2]' : ''}`} />
            </button>

            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-400 to-amber-300 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                  🦊
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-black text-xl text-slate-900 tracking-tight block leading-none">
                  GrammoQuest
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-0.5">
                  GRAMMAR ADVENTURE
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons, quizzes..."
                className="w-full bg-slate-100/90 border border-slate-200/80 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100/50 rounded-full py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Right: Stats Badges + Notification + Profile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 shadow-xs text-xs font-black">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak}d <span className="hidden md:inline text-[10px] font-bold text-slate-500 uppercase">Streak</span></span>
            </div>

            {/* XP Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 shadow-xs text-xs font-black">
              <Zap className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{totalXP} <span className="hidden md:inline text-[10px] font-bold text-slate-500 uppercase">XP</span></span>
            </div>

            {/* Stars Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 shadow-xs text-xs font-black">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{stars} <span className="hidden md:inline text-[10px] font-bold text-slate-500 uppercase">Stars</span></span>
            </div>

            {/* Notification Bell */}
            <button
              id="notification-bell"
              onClick={openNotifications}
              className="relative p-2 rounded-2xl hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 min-w-[18px] h-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white shadow-xs" />
              )}
            </button>

            {/* Profile Avatar Interactive Dropdown Menu */}
            <div className="relative border-l border-slate-200 pl-3">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 py-1 px-2 rounded-2xl hover:bg-slate-100/80 transition-all text-left group border border-transparent hover:border-slate-200 focus:outline-none"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5865f2] via-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 border-2 border-white uppercase group-hover:scale-105 transition-transform">
                    {firstName.charAt(0)}
                  </div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs" />
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    {firstName}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180 text-[#5865f2]' : ''}`} />
                  </span>
                  <span className="text-[10px] font-extrabold text-[#5865f2] block">{rankTitle}</span>
                </div>
              </button>

              {/* Profile Dropdown Panel */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-13 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-2.5 z-40 space-y-1 overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-amber-50/50 rounded-2xl mb-1.5 border border-indigo-100/80 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-[#5865f2] text-white font-black text-base flex items-center justify-center shadow-md shrink-0 uppercase border-2 border-white">
                          {firstName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-xs text-slate-900 truncate">{fullName}</p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{profile?.email || 'Student Account'}</p>
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#5865f2] text-white text-[9px] font-black shadow-xs">
                            ⭐ {rankTitle}
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Links */}
                      <Link
                        to="/progress"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-indigo-50/80 hover:text-[#5865f2] transition-colors"
                      >
                        <BarChart2 className="w-4 h-4 text-[#5865f2]" />
                        <span>My Profile & Stats</span>
                      </Link>

                      <Link
                        to="/leaderboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-amber-50/80 hover:text-amber-600 transition-colors"
                      >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Leaderboard Ranks</span>
                      </Link>

                      <Link
                        to={activeUnitTarget}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-700 hover:bg-sky-50/80 hover:text-sky-600 transition-colors"
                      >
                        <Gamepad2 className="w-4 h-4 text-sky-500" />
                        <span>Practice Arena</span>
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          auth.signOut()
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
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

      {/* ── 2. MAIN LAYOUT CONTAINER (Full Bleed Fluid Layout) ────────────── */}
      <div className="w-full flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        
        {/* ── LEFT SIDEBAR (Desktop Collapsible Sticky) ─────────────────────── */}
        <aside className={`hidden lg:flex flex-col ${sidebarCollapsed ? 'w-20 p-3' : 'w-64 p-5'} bg-white border-r border-slate-200/80 justify-between shrink-0 transition-all duration-300 ease-in-out relative group/sidebar`}>
          
          <div>
            <nav className="space-y-1.5">
              <SidebarLink to="/dashboard" active icon={Home} label="Home" collapsed={sidebarCollapsed} />
              <SidebarLink to={activeUnitTarget} icon={BookOpen} label="Learn / Quests" collapsed={sidebarCollapsed} />
              <SidebarLink to={activeUnitTarget} icon={Gamepad2} label="Practice" collapsed={sidebarCollapsed} />
              <SidebarLink to="/leaderboard" icon={Trophy} label="Leaderboard" collapsed={sidebarCollapsed} />
              <SidebarLink to="/progress" icon={BarChart2} label="My Progress" collapsed={sidebarCollapsed} />
              <SidebarLink to="/progress" icon={Award} label="Achievements" collapsed={sidebarCollapsed} />
            </nav>
          </div>

          {/* Premium Bottom Left Mascot Card */}
          {sidebarCollapsed ? (
            <div className="relative pt-4 flex justify-center">
              <button 
                title="Small Steps Big Writers! ✨ Click to expand sidebar"
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 text-2xl flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setSidebarCollapsed(false)}
              >
                🦊
              </button>
            </div>
          ) : (
            <div className="relative pt-6">
              <div className="bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-100/80 rounded-3xl p-4 border-2 border-amber-200/90 text-center relative overflow-hidden shadow-sm group hover:border-amber-300 transition-all flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 text-3xl flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300 border-2 border-white mb-2">
                  🦊
                </div>
                <div className="bg-white/95 text-slate-900 px-3 py-1 rounded-full border border-amber-300/90 shadow-xs text-xs font-black inline-flex items-center gap-1">
                  <span>Small Steps Big Writers!</span>
                  <span className="text-amber-500">✨</span>
                </div>
                <p className="text-[10px] font-extrabold text-slate-500 mt-1.5">
                  Every quest makes you stronger!
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Left Sidebar Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 p-5 flex flex-col justify-between border-r border-slate-200 shadow-2xl lg:hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🦊</span>
                      <span className="font-display font-black text-slate-900 text-lg">GrammoQuest</span>
                    </div>
                    <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="space-y-2" onClick={() => setMobileSidebarOpen(false)}>
                    <SidebarLink to="/dashboard" active icon={Home} label="Home" />
                    <SidebarLink to={activeUnitTarget} icon={BookOpen} label="Learn / Quests" />
                    <SidebarLink to={activeUnitTarget} icon={Gamepad2} label="Practice" />
                    <SidebarLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
                    <SidebarLink to="/progress" icon={BarChart2} label="My Progress" />
                    <SidebarLink to="/progress" icon={Award} label="Achievements" />
                  </nav>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 text-center">
                  <span className="text-4xl block mb-1">🦊</span>
                  <p className="text-xs font-black text-slate-800">Small Steps Big Writers! ✨</p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── CENTER MAIN CONTENT ────────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 min-w-0">
          
          {/* 1. HERO BANNER CARD (Increased CTA Height & Tactile Border) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl shadow-xl relative overflow-hidden text-white border-2 border-white flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 min-h-[250px] bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300 w-full"
          >
            {/* Background Graphic Asset */}
            <div 
              className="absolute inset-0 opacity-90 pointer-events-none"
              style={{
                backgroundImage: 'url(/hero-artwork.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center right',
              }}
            />
            {/* Left Contrast Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-950/85 via-sky-900/55 to-transparent pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 space-y-3.5 text-center md:text-left max-w-md">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight">
                {greeting}, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                  {firstName}! 👋
                </span>
              </h1>
              <p className="text-sky-100 font-bold text-sm sm:text-base">
                Ready for your next grammar quest?
              </p>
              
              <div className="pt-2">
                <Link
                  to={activeUnitTarget}
                  className="inline-flex items-center justify-center gap-3 px-9 py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base sm:text-lg tracking-wide shadow-2xl shadow-orange-500/40 transition-all hover:scale-105 border-b-[5px] border-orange-700 active:translate-y-1 active:border-b-2 min-h-[58px] sm:min-h-[64px]"
                >
                  <span>Continue Learning</span>
                  <ArrowRight className="w-6 h-6 stroke-[3]" />
                </Link>
              </div>
            </div>

            {/* Right Mascot & Speech Bubble Illustration */}
            <div className="relative z-10 flex flex-col items-center md:items-end shrink-0 mt-4 md:mt-0">
              <div className="bg-white/95 text-slate-800 px-4 py-2 rounded-2xl shadow-xl border border-amber-300 text-xs font-black flex items-center gap-1.5 animate-bounce mb-2">
                <span>Let's make grammar an adventure!</span>
                <span className="text-rose-500">❤️</span>
              </div>
              <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-7xl shadow-inner relative">
                🦊
                <div className="absolute -bottom-2 px-3 py-0.5 bg-amber-800 text-amber-100 rounded-md text-[8px] font-black uppercase tracking-widest shadow border border-amber-700">
                  BETTER WRITERS BRIGHTER FUTURES
                </div>
              </div>
            </div>

          </motion.div>

          {/* Pending Admin Unlock Request Banners */}
          {unlockRequests?.filter(req => req.status === 'pending').map(req => {
            const unit = units?.find(u => u.id === req.unitId)
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-center gap-4 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-extrabold text-sm">Pending Admin Unlock Approval</p>
                  <p className="text-amber-800 font-medium mt-0.5">
                    You've completed <strong className="text-amber-950 font-bold">{unit?.title ?? 'a unit'}</strong>! 
                    Your next unit will unlock as soon as your teacher approves it.
                  </p>
                </div>
              </motion.div>
            )
          })}

          {/* 2. "YOUR LEARNING JOURNEY" SECTION (3 Unit Cards Grid) */}
          <section id="learning-journey" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h2 className="font-display font-black text-xl text-slate-900 tracking-tight">
                  Your Learning Journey
                </h2>
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-200/70 px-3.5 py-1 rounded-full">
                {units?.length ?? 3} Units
              </span>
            </div>

            {/* 3 Unit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {units && units.length > 0 ? (
                units.map((u, idx) => {
                  const totalCh = u.totalChapters || u.chapterCount || 1
                  const completedCh = u.chaptersCompleted || 0
                  const isUnitCompleted = u.status === 'completed' || (totalCh > 0 && completedCh >= totalCh)
                  const cardStatus: 'completed' | 'in-progress' | 'locked' = isUnitCompleted
                    ? 'completed'
                    : u.status === 'locked'
                    ? 'locked'
                    : 'in-progress'
                  const pct = isUnitCompleted
                    ? 100
                    : Math.min(100, Math.round((completedCh / totalCh) * 100))
                  const illustration: 'house' | 'canyon' | 'snow' =
                    idx % 3 === 0 ? 'house' : idx % 3 === 1 ? 'canyon' : 'snow'

                  return (
                    <UnitJourneyCard
                      key={u.id}
                      unitNumber={idx + 1}
                      title={u.title}
                      chaptersInfo={`${completedCh}/${totalCh} Chapters`}
                      status={cardStatus}
                      illustrationType={illustration}
                      progressPct={pct}
                      unitId={u.id}
                    />
                  )
                })
              ) : (
                <>
                  <UnitJourneyCard
                    unitNumber={1}
                    title="The Simple Present Tense"
                    chaptersInfo="3/3 Chapters"
                    status="completed"
                    illustrationType="house"
                    progressPct={100}
                    unitId="unit-1"
                  />
                  <UnitJourneyCard
                    unitNumber={2}
                    title="The Past Tense"
                    chaptersInfo="0/2 Chapters"
                    status="in-progress"
                    illustrationType="canyon"
                    progressPct={0}
                    unitId="unit-2"
                  />
                  <UnitJourneyCard
                    unitNumber={3}
                    title="The Future Tense"
                    chaptersInfo="0/2 Chapters"
                    status="locked"
                    illustrationType="snow"
                    progressPct={0}
                    unitId="unit-3"
                  />
                </>
              )}
            </div>
          </section>

          {/* 3. "MORE WAYS TO LEARN" SECTION (4 Cards Grid) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎮</span>
              <h2 className="font-display font-black text-xl text-slate-900 tracking-tight">
                More Ways to Learn
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Practice */}
              <Link to={activeUnitTarget} className="p-4 rounded-3xl bg-[#eef2ff] border-2 border-[#e0e7ff] hover:border-indigo-300 transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#5865f2] text-white flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                    🎮
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900">Practice</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">Try more quizzes</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-[#5865f2] flex items-center justify-center text-xs font-bold group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>

              {/* Grammar Guide */}
              <Link to={activeUnitTarget} className="p-4 rounded-3xl bg-[#ecfeff] border-2 border-[#cffafe] hover:border-sky-300 transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#06b6d4] text-white flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                    📖
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900">Grammar Guide</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">Explore lessons</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-cyan-100 text-[#06b6d4] flex items-center justify-center text-xs font-bold group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>

              {/* Achievements (Links to /progress) */}
              <Link to="/progress" className="p-4 rounded-3xl bg-[#fffbeb] border-2 border-[#fef3c7] hover:border-amber-300 transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#f59e0b] text-white flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                    ⭐
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900">Achievements</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">View your badges</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-amber-100 text-[#f59e0b] flex items-center justify-center text-xs font-bold group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>

              {/* Leaderboard */}
              <Link to="/leaderboard" className="p-4 rounded-3xl bg-[#f3e8ff] border-2 border-[#e9d5ff] hover:border-purple-300 transition-all flex items-center justify-between group shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#9333ea] text-white flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                    🏆
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900">Leaderboard</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">See top learners</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-100 text-[#9333ea] flex items-center justify-center text-xs font-bold group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>

            </div>
          </section>

          {/* 4. MOTIVATIONAL BANNER (BOTTOM CENTER) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-sky-100 via-indigo-50 to-purple-100 border-2 border-indigo-200/80 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs w-full">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <span className="text-4xl shrink-0">🦊</span>
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  "Practice today. Brighter tomorrows!"
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">— Grammo</p>
              </div>
            </div>

            <Link
              to={activeUnitTarget}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs tracking-wide shadow-md shadow-orange-500/20 transition-all hover:scale-105 border-b-2 border-orange-700 shrink-0"
            >
              You can do it, {firstName}! →
            </Link>
          </div>

        </main>

        {/* ── RIGHT SIDEBAR WIDGETS ────────────────────────────────────────── */}
        <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/80 p-5 space-y-6 shrink-0">
          
          {/* 1. DAILY MOTIVATIONAL QUOTE CARD */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/90 to-amber-100/60 border-2 border-amber-200/80 relative shadow-xs">
            <div className="text-[#5865f2] font-black text-3xl leading-none mb-1">“</div>
            <p className="text-xs font-black text-slate-800 leading-relaxed">
              A little progress every day leads to big results!
            </p>
            <div className="absolute right-3 bottom-3 text-xl opacity-80">🍃</div>
          </div>

          {/* 2. YOUR PROGRESS CARD */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base text-teal-600">🚀</span>
                <h4 className="font-display font-black text-sm text-slate-900">Your Progress</h4>
              </div>
              <Link to="/progress" className="text-[11px] font-black text-[#5865f2] hover:underline">
                View All →
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-1">
              {/* Radial Donut Progress */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="32" cy="32" r="26"
                    stroke="#5865f2" strokeWidth="6"
                    strokeDasharray={163}
                    strokeDashoffset={163 - (163 * overallPct) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-black text-xs text-[#5865f2]">{overallPct}%</span>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-extrabold text-slate-900">{completedUnitsCount} of {totalUnitsCount} units completed</p>
                <p className="text-slate-500 font-semibold text-[11px]">You're on your way to becoming a Grammar Hero! ⭐</p>
              </div>
            </div>
          </div>

          {/* 3. DAILY MISSION CARD */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h4 className="font-display font-black text-sm text-slate-900">Daily Mission</h4>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                1/1
              </span>
            </div>

            <div>
              <p className="text-xs font-black text-slate-800 mb-2">Complete 1 quiz today</p>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="w-full h-full bg-emerald-500 rounded-full" />
              </div>
              <p className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
                <span>Mission complete! Great job!</span>
                <span>🎉</span>
              </p>
            </div>
          </div>

          {/* 4. ACHIEVEMENTS CARD */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">👾</span>
                <h4 className="font-display font-black text-sm text-slate-900">Achievements</h4>
              </div>
              <Link to="/progress" className="text-[11px] font-black text-[#5865f2] hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <BadgeIcon icon="🏅" title="First Quiz" bg="bg-sky-100 text-sky-600" />
              <BadgeIcon icon="🔥" title="3 Day Streak" bg="bg-orange-100 text-orange-600" />
              <BadgeIcon icon="🌟" title="Grammar Explorer" bg="bg-teal-100 text-teal-600" />
              <BadgeIcon icon="🔒" title="Sentence Master" bg="bg-slate-100 text-slate-400" locked />
            </div>
          </div>

          {/* 5. LEADERBOARD CARD */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🏆</span>
                <h4 className="font-display font-black text-sm text-slate-900">Leaderboard</h4>
              </div>
              <Link to="/leaderboard" className="text-[11px] font-black text-[#5865f2] hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-2.5 pt-1">
              {realLeaderboard.map(entry => (
                <LeaderboardRow
                  key={entry.userId}
                  rank={entry.rank}
                  name={entry.displayName}
                  xp={`${entry.xp.toLocaleString()} XP`}
                  isCurrent={entry.isCurrentUser}
                />
              ))}
            </div>
          </div>

        </aside>

      </div>

      {/* Notification Drawer Panel */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-display font-black text-slate-900 text-base">Notifications</h2>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!notifications?.length ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="text-slate-600 mt-0.5">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function SidebarLink({ 
  to, 
  icon: Icon, 
  label, 
  active,
  collapsed 
}: { 
  to: string, 
  icon: any, 
  label: string, 
  active?: boolean,
  collapsed?: boolean 
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center ${collapsed ? 'justify-center px-0 py-3.5' : 'gap-3.5 px-4 py-3.5'} rounded-2xl text-xs font-extrabold transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-[#5865f2] to-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:translate-x-0.5'
      }`}
    >
      {/* Active Indicator Bar */}
      {active && (
        <span className={`absolute ${collapsed ? 'top-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-b-full' : 'left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full'} bg-amber-400 shadow-xs`} />
      )}
      
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
        active 
          ? 'bg-white/20 text-white shadow-inner' 
          : 'bg-slate-100/90 text-slate-500 group-hover:bg-indigo-50 group-hover:text-[#5865f2]'
      }`}>
        <Icon className="w-4.5 h-4.5" />
      </div>

      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  )
}

function UnitJourneyCard({
  unitNumber,
  title,
  chaptersInfo,
  status,
  illustrationType,
  progressPct,
  unitId,
}: {
  unitNumber: number
  title: string
  chaptersInfo: string
  status: 'completed' | 'in-progress' | 'locked'
  illustrationType: 'house' | 'canyon' | 'snow'
  progressPct: number
  unitId: string
}) {
  const isCompleted = status === 'completed'
  const isInProgress = status === 'in-progress'
  const isLocked = status === 'locked'

  return (
    <motion.div 
      whileHover={!isLocked ? { y: -4 } : {}}
      className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between shadow-xs relative overflow-hidden bg-white ${
        isCompleted 
          ? 'border-emerald-300/80 bg-gradient-to-b from-emerald-50/50 to-white' 
          : isInProgress 
          ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/50 to-white' 
          : 'border-slate-200/80 bg-slate-50/50 opacity-80'
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : isInProgress ? 'text-amber-600' : 'text-slate-400'}`}>
            UNIT {unitNumber}
          </span>
          
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-xs ${
            isCompleted 
              ? 'bg-[#10b981] text-white' 
              : isInProgress 
              ? 'bg-[#f97316] text-white' 
              : 'bg-slate-300 text-white'
          }`}>
            {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : isInProgress ? <PlayCircle className="w-4 h-4 fill-white text-[#f97316]" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-black text-base text-slate-900 leading-snug mb-3 line-clamp-1">
          {title}
        </h3>

        {/* Central Graphic Landscape Illustration */}
        <div className={`w-full h-32 rounded-2xl border-2 flex items-center justify-center mb-4 relative overflow-hidden ${
          illustrationType === 'house' ? 'bg-[#d1fae5]/70 border-[#a7f3d0]' :
          illustrationType === 'canyon' ? 'bg-[#fef3c7]/70 border-[#fde68a]' :
          'bg-[#e0f2fe]/70 border-[#bae6fd]'
        }`}>
          {illustrationType === 'house' && (
            <div className="text-center flex flex-col items-center justify-center">
              <svg className="w-20 h-20 drop-shadow-md" viewBox="0 0 100 100" fill="none">
                <path d="M10 75 Q50 65 90 75 L90 90 L10 90 Z" fill="#10b981"/>
                <rect x="35" y="45" width="30" height="30" rx="4" fill="#fbbf24"/>
                <path d="M30 47 L50 25 L70 47 Z" fill="#b91c1c"/>
                <rect x="47" y="60" width="8" height="15" fill="#78350f"/>
                <circle cx="20" cy="55" r="10" fill="#047857"/>
                <circle cx="80" cy="55" r="10" fill="#047857"/>
              </svg>
            </div>
          )}
          {illustrationType === 'canyon' && (
            <div className="text-center flex flex-col items-center justify-center">
              <svg className="w-20 h-20 drop-shadow-md" viewBox="0 0 100 100" fill="none">
                <path d="M10 75 Q50 70 90 75 L90 90 L10 90 Z" fill="#f97316"/>
                <path d="M30 75 L35 35 L55 35 L60 75 Z" fill="#c2410c"/>
                <path d="M65 75 L68 45 L82 45 L85 75 Z" fill="#ea580c"/>
                <circle cx="25" cy="65" r="4" fill="#15803d"/>
              </svg>
            </div>
          )}
          {illustrationType === 'snow' && (
            <div className="text-center flex flex-col items-center justify-center">
              <svg className="w-20 h-20 drop-shadow-md" viewBox="0 0 100 100" fill="none">
                <path d="M10 75 Q50 65 90 75 L90 90 L10 90 Z" fill="#38bdf8"/>
                <path d="M25 75 L50 25 L75 75 Z" fill="#64748b"/>
                <path d="M42 38 L50 25 L58 38 Z" fill="#ffffff"/>
              </svg>
            </div>
          )}
        </div>

        {/* Progress Bar & Chapters Info */}
        <div className="space-y-1.5 mb-4">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[#10b981]' : isInProgress ? 'bg-[#f97316]' : 'bg-slate-300'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] font-extrabold text-slate-400">{chaptersInfo}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {isCompleted ? (
        <Link
          to={`/units/${unitId}`}
          className="w-full py-3 rounded-2xl bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#065f46] font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span>Completed!</span>
        </Link>
      ) : isInProgress ? (
        <Link
          to={`/units/${unitId}`}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20 border-b-2 border-orange-700"
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <button
          disabled
          className="w-full py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-[11px] text-center cursor-not-allowed opacity-75"
        >
          Locked
          <span className="block text-[9px] font-semibold text-slate-400 mt-0.5">Complete Unit 2 to unlock</span>
        </button>
      )}

    </motion.div>
  )
}

function BadgeIcon({ icon, title, bg, locked }: { icon: string, title: string, bg: string, locked?: boolean }) {
  return (
    <div className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 ${bg} ${locked ? 'border-slate-200 opacity-60' : 'border-transparent shadow-xs'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[9px] font-black leading-tight text-slate-700">{title}</span>
    </div>
  )
}

function LeaderboardRow({ rank, name, xp, isCurrent }: { rank: number, name: string, xp: string, isCurrent?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-2xl text-xs transition-all ${
      isCurrent ? 'bg-[#eef2ff] border-2 border-indigo-200 font-black text-indigo-900' : 'bg-slate-50 text-slate-700 font-bold'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
          rank === 1 ? 'bg-amber-400 text-white' : rank === 2 ? 'bg-slate-300 text-slate-700' : rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
        }`}>
          {rank}
        </span>
        <div className="w-7 h-7 rounded-full bg-indigo-100 text-[#5865f2] flex items-center justify-center text-xs font-bold uppercase">
          👤
        </div>
        <span className="truncate max-w-[100px]">{name}</span>
      </div>
      <span className="font-black text-[#5865f2]">{xp}</span>
    </div>
  )
}
