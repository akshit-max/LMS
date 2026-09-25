import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, BookOpen, Clock, LogOut,
  ChevronRight, AlertTriangle, Search,
  Menu, X, Bell, Settings, TrendingUp, Lock,
  HelpCircle, BarChart2, CheckSquare, XSquare, RefreshCcw,
  CheckCircle2, XCircle, Sparkles, User as UserIcon, GraduationCap
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types'
import UnlockRequestQueue from './UnlockRequestQueue'
import { useAdminUnlockRequests } from '../student/hooks/useNotifications'
import { AdminCMS } from './AdminCMS'

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'unlocks' | 'curriculum' | 'questions' | 'leaderboard'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-dvh bg-[#f4f7fc] text-slate-800 font-sans flex selection:bg-[#5865f2] selection:text-white overflow-x-hidden">
      
      {/* ── 1. SIDEBAR ─────────────────────────────────────────────────────── */}
      <AdminSidebar
        active={activeTab}
        onSelect={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 2. MAIN WORKSPACE ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f7fc] relative z-10">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/80 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div>
              <h2 className="font-display font-black text-slate-900 text-base tracking-tight">
                {tabLabels[activeTab]}
              </h2>
              <p className="text-slate-500 text-xs font-semibold hidden sm:block">{profile?.email ?? 'admin@lms.com'}</p>
            </div>
          </div>

          {/* Search, Notifications & Admin Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Input Pill */}
            <div className="relative hidden md:block w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full bg-slate-100/90 border border-slate-200 rounded-full pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                Ctrl K
              </span>
            </div>

            {/* Notification Bell with Badge */}
            <button className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {/* Admin Profile Dropdown Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                A
              </div>
              <span className="hidden sm:inline">Admin</span>
              <ChevronRight size={14} className="text-slate-400 rotate-90" />
            </div>

            {/* Logout Button */}
            <button
              onClick={() => auth.signOut()}
              className="p-2 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors border border-slate-200 hover:border-rose-300 cursor-pointer"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>

          </div>
        </header>

        {/* ── 3. MAIN DASHBOARD CONTENT ──────────────────────────────────────── */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto max-w-7xl mx-auto w-full space-y-6">
          {activeTab === 'overview'   && <OverviewTab onNavigate={setActiveTab} />}
          {activeTab === 'users'      && <UsersTab />}
          {activeTab === 'unlocks'    && <UnlocksTab />}
          {activeTab === 'curriculum' && <CurriculumTab />}
          {activeTab === 'questions'  && <QuestionManagementTab />}
          {activeTab === 'leaderboard'&& <LeaderboardAdminTab />}
        </main>

        {/* ── 4. FOOTER BAR ──────────────────────────────────────────────────── */}
        <footer className="px-6 py-4 border-t border-slate-200/80 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
          <p className="flex items-center gap-1.5 font-bold text-slate-600">
            <span>Keep building a smarter learning community.</span>
            <span>🚀</span>
          </p>
          <p className="font-extrabold text-slate-500">
            GrammoQuest &bull; Learn &bull; Practice &bull; Grow ❤️
          </p>
        </footer>

      </div>
    </div>
  )
}

// ─── Sidebar Navigation ──────────────────────────────────────────────────────

const tabLabels: Record<AdminTab, string> = {
  overview:    'Overview',
  users:       'Users',
  unlocks:     'Unlock Requests',
  curriculum:  'Curriculum',
  questions:   'Question Management',
  leaderboard: 'Leaderboard',
}

const navItems: { id: AdminTab, icon: any, label: string }[] = [
  { id: 'overview',    icon: LayoutDashboard, label: 'Overview' },
  { id: 'users',       icon: Users,           label: 'Users' },
  { id: 'unlocks',     icon: AlertTriangle,   label: 'Unlock Requests' },
  { id: 'curriculum',  icon: BookOpen,        label: 'Curriculum' },
  // { id: 'questions',   icon: HelpCircle,      label: 'Questions' }, // Commented out per request
  { id: 'leaderboard', icon: BarChart2,       label: 'Leaderboard' },
]

function AdminSidebar({ active, onSelect, open, onClose }: {
  active: AdminTab
  onSelect: (tab: AdminTab) => void
  open: boolean
  onClose: () => void
}) {
  const { data: unlockRequests } = useAdminUnlockRequests()
  const pendingCount = unlockRequests?.length ?? 0

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-40
      w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shadow-2xs
      transition-transform duration-200 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex flex-col h-full">
        
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center text-xl shrink-0">
              🦊
            </div>
            <div>
              <span className="font-display font-black text-slate-900 text-base tracking-tight block leading-none">
                Grammo<span className="text-amber-500">Quest</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5865f2] block mt-1">
                Learn &bull; Practice &bull; Grow
              </span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = active === item.id
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.015, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-50 text-amber-800 border-2 border-amber-300 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={17} className={isActive ? 'text-amber-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'unlocks' && pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Bottom Mascot Promo Card */}
        <div className="p-4 space-y-3 border-t border-slate-200/80">
          
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-amber-50/90 border border-indigo-200/80 rounded-3xl p-3.5 relative overflow-hidden shadow-xs">
            
            {/* Crown Icon */}
            <span className="absolute top-3 right-3 text-sm">👑</span>

            <div className="flex items-start gap-3">
              <div className="text-4xl filter drop-shadow-md shrink-0">
                🦊
              </div>
              <div className="space-y-1 text-left pr-4">
                <div className="bg-white border border-indigo-200 rounded-xl px-2.5 py-1 text-[10px] font-black text-indigo-900 shadow-2xs inline-block">
                  Better Grammar Brighter Futures!
                </div>
                <p className="text-[11px] font-black text-slate-700 leading-tight">
                  Empower learners every day
                </p>
              </div>
            </div>

            {/* Bottom Progress Line Accent */}
            <div className="w-full bg-indigo-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-purple-600 h-full w-3/4 rounded-full" />
            </div>

          </div>

          {/* Settings Button */}
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
            <Settings size={16} />
            <span>Settings</span>
          </button>

        </div>

      </div>
    </aside>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: User[] }>('/admin/users').then(r => r.data.users).catch(() => [] as User[]),
  })
  const { data: unlockRequests } = useAdminUnlockRequests()

  const activeCount = users?.filter(u => u.accountStatus === 'active').length ?? 0
  const pendingCount = users?.filter(u => u.accountStatus === 'pending').length ?? 0
  const pendingUnlocks = unlockRequests?.length ?? 0

  const stats = [
    {
      icon: Users,
      label: 'Total Users',
      value: users?.length ?? 6,
      subtext: 'Active platform users',
      color: 'text-purple-600',
      badgeBg: 'bg-purple-100 border-purple-200',
      cardBorder: 'border-purple-200/90 hover:border-purple-300',
      dotColor: 'bg-purple-500',
    },
    {
      icon: GraduationCap,
      label: 'Active Students',
      value: activeCount || 6,
      subtext: 'Currently learning',
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 border-emerald-200',
      cardBorder: 'border-emerald-200/90 hover:border-emerald-300',
      dotColor: 'bg-emerald-500',
    },
    {
      icon: Clock,
      label: 'Pending Approval',
      value: pendingCount,
      subtext: 'Awaiting review',
      color: 'text-amber-600',
      badgeBg: 'bg-amber-100 border-amber-200',
      cardBorder: 'border-amber-200/90 hover:border-amber-300',
      dotColor: 'bg-amber-500',
    },
    {
      icon: TrendingUp,
      label: 'Unlock Requests',
      value: pendingUnlocks,
      subtext: 'Requests from students',
      color: 'text-sky-600',
      badgeBg: 'bg-sky-100 border-sky-200',
      cardBorder: 'border-sky-200/90 hover:border-sky-300',
      dotColor: 'bg-sky-500',
    },
  ]

  return (
    <div className="space-y-6 text-left">
      
      {/* Hero Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <p className="text-xs font-black text-slate-400 flex items-center gap-1.5">
            <span>Welcome back!</span> 👋
          </p>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
            Grammo<span className="text-amber-500">Quest</span> Admin
          </h1>
          <p className="text-xs sm:text-sm font-extrabold text-slate-500 mt-1">
            Manage learners, content, and keep the learning journey going.
          </p>
        </div>

        {/* Top Right Quote */}
        <div className="relative bg-white border border-slate-200/90 shadow-2xs rounded-2xl p-3.5 max-w-xs text-right hidden sm:block">
          <p className="text-xs font-black text-slate-700 italic">
            “Good grammar builds brighter opportunities.” ✨
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full ml-auto mt-1.5" />
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`bg-white border rounded-3xl p-5 shadow-sm relative overflow-hidden group transition-all ${s.cardBorder}`}
          >
            {/* Background Watermark Icon */}
            <s.icon className="absolute right-3 bottom-3 w-20 h-20 text-slate-100 group-hover:text-slate-200/80 transition-colors pointer-events-none" />

            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 ${s.badgeBg} ${s.color}`}>
              <s.icon size={22} />
            </div>

            <p className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              {s.value}
            </p>

            <p className="text-xs font-black text-slate-800 mt-1">
              {s.label}
            </p>

            <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
              <span>{s.subtext}</span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Unlock Requests Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-900 text-base">Unlock Requests</h3>
              <p className="text-xs text-slate-500 font-extrabold">Review and approve student requests to unlock content.</p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('unlocks')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Content Box */}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
          
          {pendingUnlocks > 0 ? (
            <div className="w-full">
              <UnlockRequestQueue compact />
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-2xl shadow-2xs">
                📋
              </div>
              <div>
                <p className="font-display font-black text-slate-900 text-base">No pending unlock requests</p>
                <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm mx-auto">
                  Students who complete all unit quizzes at &ge;90% will appear here for verification.
                </p>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const qc = useQueryClient()
  const { profile } = useAuthStore()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: User[] }>('/admin/users').then(r => r.data.users).catch(() => [] as User[]),
  })

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (uid: string) => api.post(`/admin/users/${uid}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
    },
  })

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['admin', 'users', selectedUser?.uid, 'progress'],
    queryFn: () => selectedUser ? api.get(`/admin/users/${selectedUser.uid}/progress`).then(r => r.data) : null,
    enabled: !!selectedUser,
  })

  const { mutate: suspend, isPending: suspending } = useMutation({
    mutationFn: (uid: string) => api.post(`/admin/users/${uid}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
    },
  })

  const { mutate: reactivate, isPending: reactivating } = useMutation({
    mutationFn: (uid: string) => api.post(`/admin/users/${uid}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
    },
  })

  const filtered = users?.filter(u => {
    const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.accountStatus === filter
    return matchSearch && matchFilter
  }) ?? []

  return (
    <div className="space-y-4 text-left relative">
      
      {/* Search + Filter Bar */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                filter === f 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-slate-100 m-2 rounded-2xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-bold text-sm">
              No users match your filter criteria.
            </div>
          ) : (
            filtered.map(user => (
              <UserRow key={user.uid} user={user} onClick={() => setSelectedUser(user)} />
            ))
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 max-w-md w-full relative shadow-2xl space-y-4 text-slate-900">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-black text-slate-900 font-display border-b border-slate-100 pb-3">
              User Details
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-black">Name</p>
                <p className="text-slate-900 font-black text-sm">{selectedUser.displayName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-black">Email</p>
                <p className="text-slate-700 font-bold">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-black">Role</p>
                <p className="text-amber-600 font-black uppercase tracking-wider">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-slate-400 font-black">Status</p>
                <span className={`inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-full font-black capitalize ${statusColors[selectedUser.accountStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                  {selectedUser.accountStatus}
                </span>
              </div>
            </div>
            
            {/* Student Progress (if applicable) */}
            {selectedUser.role === 'student' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-slate-900 font-black text-xs uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  Student Learning Stats
                </h3>
                {progressLoading ? (
                  <p className="text-slate-500 text-xs font-bold">Loading progress...</p>
                ) : userProgress ? (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <p className="text-slate-400 font-bold">Rank</p>
                      <p className="text-amber-600 font-black">{userProgress.rankTitle || 'Rookie'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">Total XP</p>
                      <p className="text-purple-600 font-black">{userProgress.totalXP || 0} XP</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">Completed Units</p>
                      <p className="text-slate-800 font-bold">{userProgress.completedUnits?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">Completed Chapters</p>
                      <p className="text-slate-800 font-bold">{userProgress.completedChapters?.length || 0}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs font-bold">No progress data recorded.</p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              {selectedUser.accountStatus === 'pending' && (
                <button
                  onClick={() => approve(selectedUser.uid)}
                  disabled={approving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-5 rounded-2xl cursor-pointer shadow-md disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve User'}
                </button>
              )}
              {selectedUser.accountStatus === 'active' && (
                <button
                  onClick={() => suspend(selectedUser.uid)}
                  disabled={suspending || selectedUser.uid === profile?.uid}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-xs px-4 py-2.5 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {suspending ? 'Suspending...' : 'Suspend Account'}
                </button>
              )}
              {selectedUser.accountStatus === 'suspended' && (
                <button
                  onClick={() => reactivate(selectedUser.uid)}
                  disabled={reactivating}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-black text-xs px-4 py-2.5 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {reactivating ? 'Reactivating...' : 'Reactivate Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Unlocks Tab ──────────────────────────────────────────────────────────────

function UnlocksTab() {
  const { data: requests } = useAdminUnlockRequests()
  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-lg">Unlock Request Queue</h2>
          <p className="text-xs text-slate-500 font-extrabold">Review student requests to unlock next units.</p>
        </div>
        {requests && requests.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full font-black">
            {requests.length} pending
          </span>
        )}
      </div>
      <UnlockRequestQueue />
    </div>
  )
}

// ─── Curriculum Tab ─────────────────────────────────────────────────────────
// Delegates to AdminCMS which provides the full Unit→Chapter→Quiz→Question CMS.

function CurriculumTab() {
  return <AdminCMS />
}

// ─── Row components ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pending:   'bg-amber-100 text-amber-800 border border-amber-200',
  suspended: 'bg-rose-100 text-rose-700 border border-rose-200',
  expired:   'bg-slate-100 text-slate-600',
}

function UserRow({ user, onClick }: { user: User, onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.005, x: 2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0"
    >
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-purple-600/20 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-800 shrink-0 shadow-2xs">
        {user.displayName[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 text-xs sm:text-sm font-black truncate">{user.displayName}</p>
        <p className="text-slate-500 text-xs truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black capitalize ${statusColors[user.accountStatus] ?? 'bg-slate-100 text-slate-600'}`}>
          {user.accountStatus}
        </span>
        <span className="text-slate-500 text-xs font-bold capitalize hidden sm:block">{user.role}</span>
        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
      </div>
    </motion.div>
  )
}

// ─── Question Management Tab ──────────────────────────────────────────────────

interface AdminQuestion {
  id: string
  text: string
  type: string
  options: string[]
  correctAnswer: string
  explanation: string
  chapterId: string
  unitId: string
  approvalStatus: string
}

function QuestionManagementTab() {
  const qc = useQueryClient()
  const [chapterId, setChapterId] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'questions', chapterId],
    queryFn: async () => {
      const url = chapterId ? `/admin/questions?chapterId=${chapterId}` : '/admin/questions'
      const res = await api.get<{ questions: AdminQuestion[] }>(url)
      return res.data.questions ?? []
    },
  })

  const { mutate: setApproval } = useMutation({
    mutationFn: ({ questionId, status }: { questionId: string; status: string }) =>
      api.post(`/admin/questions/${questionId}/approval`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'questions'] }),
  })

  const statusColor: Record<string, string> = {
    approved: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    rejected: 'text-rose-700 bg-rose-100 border-rose-200',
    pending:  'text-amber-800 bg-amber-100 border-amber-200',
  }

  const filtered = data?.filter(q =>
    !searchInput || q.text.toLowerCase().includes(searchInput.toLowerCase())
  ) ?? []

  const grouped = filtered.reduce((acc, q) => {
    if (!acc[q.chapterId]) acc[q.chapterId] = []
    acc[q.chapterId].push(q)
    return acc
  }, {} as Record<string, AdminQuestion[]>)

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Filter by Chapter ID..."
          value={chapterId}
          onChange={e => setChapterId(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-xs placeholder:text-slate-400 flex-1 focus:outline-none focus:border-indigo-400 font-medium shadow-2xs"
        />
        <input
          type="text"
          placeholder="Search question text..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-800 text-xs placeholder:text-slate-400 flex-1 focus:outline-none focus:border-indigo-400 font-medium shadow-2xs"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-3xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-bold text-sm bg-white border border-slate-200 rounded-3xl">
          No questions found.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([chapter, qs]) => (
            <div key={chapter} className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                Chapter: {chapter || 'Unknown'}
              </h3>
              {qs.map(q => (
                <div key={q.id} className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col md:flex-row md:items-start gap-4 shadow-xs">
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-black text-slate-900 text-sm leading-snug">{q.text}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold capitalize">{q.type}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">ch: {q.chapterId}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${statusColor[q.approvalStatus] || statusColor.pending}`}>
                      {q.approvalStatus || 'pending'}
                    </span>
                    <button
                      onClick={() => setApproval({ questionId: q.id, status: 'approved' })}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      title="Approve"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => setApproval({ questionId: q.id, status: 'rejected' })}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      onClick={() => setApproval({ questionId: q.id, status: 'pending' })}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Reset to Pending"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Leaderboard Admin Tab ────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  xp: number
  stars: number
  rankTitle: string
  isCurrentUser: boolean
}

function LeaderboardAdminTab() {
  const [period, setPeriod] = useState<'alltime' | 'weekly' | 'monthly'>('alltime')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'leaderboard', period],
    queryFn: async () => {
      const res = await api.get<{ leaderboard: LeaderboardEntry[], totalStudents: number }>(`/leaderboard?period=${period}`)
      return res.data
    },
    staleTime: 60_000,
  })

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        {(['alltime', 'weekly', 'monthly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-4 py-2 rounded-xl font-black transition-colors capitalize cursor-pointer ${
              period === p ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {p === 'alltime' ? 'All Time' : p}
          </button>
        ))}
        <span className="text-slate-500 text-xs font-black ml-auto">{data?.totalStudents ?? 0} students</span>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-3xl bg-slate-100 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2.5">
          {(data?.leaderboard ?? []).map(entry => (
            <div key={entry.userId} className={`flex items-center gap-4 p-4 rounded-3xl border transition-colors bg-white
              ${entry.rank === 1 ? 'border-amber-300 bg-amber-50/50' :
                entry.rank === 2 ? 'border-slate-300 bg-slate-50/50' :
                entry.rank === 3 ? 'border-orange-300 bg-orange-50/50' :
                'border-slate-200'}`}
            >
              <span className={`text-base font-black w-7 text-center shrink-0
                ${entry.rank === 1 ? 'text-amber-500' : entry.rank === 2 ? 'text-slate-400' : entry.rank === 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                #{entry.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-black truncate">{entry.displayName}</p>
                <p className="text-slate-500 text-xs font-extrabold">{entry.rankTitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <p className="text-purple-600 text-sm font-black">{entry.xp} XP</p>
                  <p className="text-amber-500 text-xs font-bold">⭐ {entry.stars}</p>
                </div>
              </div>
            </div>
          ))}
          {(data?.leaderboard ?? []).length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-3xl">
              <p className="text-sm font-extrabold">No leaderboard data found for this period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
