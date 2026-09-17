import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, BookOpen, Clock, LogOut,
  CheckCircle, ChevronRight, AlertTriangle, Search,
  Menu, X, Bell, Settings, TrendingUp
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types'
import UnlockRequestQueue from './UnlockRequestQueue'
import { useAdminUnlockRequests } from '../student/hooks/useNotifications'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number
  activeStudents: number
  pendingApprovals: number
  pendingUnlocks: number
  quizzesToday: number
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'unlocks' | 'curriculum'

export default function AdminDashboard() {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-surface-900 flex">
      {/* Sidebar */}
      <AdminSidebar
        active={activeTab}
        onSelect={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-zinc-800 bg-surface-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Menu size={18} className="text-zinc-400" />
            </button>
            <div>
              <h2 className="font-display font-bold text-white text-sm">
                {tabLabels[activeTab]}
              </h2>
              <p className="text-zinc-600 text-xs hidden sm:block">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors">
              <Bell size={18} className="text-zinc-400" />
            </button>
            <button
              onClick={() => auth.signOut()}
              className="p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} className="text-zinc-400" />
            </button>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'unlocks' && <UnlocksTab />}
          {activeTab === 'curriculum' && <CurriculumTab />}
        </main>
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const tabLabels: Record<AdminTab, string> = {
  overview:   'Overview',
  users:      'Users',
  unlocks:    'Unlock Requests',
  curriculum: 'Curriculum',
}

const navItems: { id: AdminTab, icon: any, label: string }[] = [
  { id: 'overview',   icon: LayoutDashboard, label: 'Overview' },
  { id: 'users',      icon: Users,           label: 'Users' },
  { id: 'unlocks',    icon: AlertTriangle,   label: 'Unlock Requests' },
  { id: 'curriculum', icon: BookOpen,        label: 'Curriculum' },
]

function AdminSidebar({ active, onSelect, open, onClose }: {
  active: AdminTab
  onSelect: (tab: AdminTab) => void
  open: boolean
  onClose: () => void
}) {
  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-56 bg-surface-950 border-r border-zinc-800 flex flex-col
      transition-transform duration-200
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦁</span>
          <div>
            <span className="font-display font-bold text-white text-sm">GrammoQuest</span>
            <div className="text-xs bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-full font-medium w-fit">
              Admin
            </div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-zinc-500 hover:text-zinc-300">
          <X size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${active === item.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Settings (bottom) */}
      <div className="p-3 border-t border-zinc-800">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: User[] }>('/admin/users').then(r => r.data.users).catch(() => [] as User[]),
  })
  const { data: unlockRequests } = useAdminUnlockRequests()

  const activeCount = users?.filter(u => u.accountStatus === 'active').length ?? 0
  const pendingCount = users?.filter(u => u.accountStatus === 'pending').length ?? 0
  const pendingUnlocks = unlockRequests?.length ?? 0

  const stats: { icon: any, label: string, value: string | number, color: string, bg: string }[] = [
    { icon: Users,        label: 'Total Users',      value: users?.length ?? '—',  color: 'text-accent-400',   bg: 'bg-accent-500/20' },
    { icon: CheckCircle,  label: 'Active Students',  value: activeCount,            color: 'text-success-400',   bg: 'bg-success-500/20' },
    { icon: Clock,        label: 'Pending Approval', value: pendingCount,           color: 'text-warning-400',   bg: 'bg-warning-500/20' },
    { icon: TrendingUp,   label: 'Unlock Requests',  value: pendingUnlocks,         color: 'text-primary-400',   bg: 'bg-primary-500/20' },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-game p-4"
          >
            <div className={`${s.bg} ${s.color} p-2 rounded-xl w-fit mb-3`}>
              <s.icon size={18} />
            </div>
            <p className="font-display font-black text-2xl text-white">{s.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending approvals */}
      {pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card-game p-4 border-warning-500/30 bg-warning-500/5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-warning-400" />
            <h3 className="font-semibold text-white text-sm">Pending Approvals ({pendingCount})</h3>
          </div>
          <div className="space-y-2">
            {users?.filter(u => u.accountStatus === 'pending').slice(0, 5).map(u => (
              <PendingUserRow key={u.uid} user={u} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Unlock requests */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card-game p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-primary-400" />
          <h3 className="font-semibold text-white text-sm">Unlock Requests</h3>
        </div>
        <div className="text-center py-8 text-zinc-600">
          <AlertTriangle size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No pending unlock requests</p>
          <p className="text-xs mt-1 text-zinc-700">Students who complete all unit quizzes at ≥90% appear here</p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: User[] }>('/admin/users').then(r => r.data.users).catch(() => [] as User[]),
  })

  const filtered = users?.filter(u => {
    const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.accountStatus === filter
    return matchSearch && matchFilter
  }) ?? []

  return (
    <div className="max-w-4xl space-y-4">
      {/* Search + filter bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input-field pl-8 text-sm py-2"
          />
        </div>
        {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all
              ${filter === f ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Users table */}
      <div className="card-game overflow-hidden">
        <div className="divide-y divide-zinc-800/50">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-zinc-800/30 m-2 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">No users found</div>
          ) : (
            filtered.map(user => <UserRow key={user.uid} user={user} />)
          )}
        </div>
      </div>

      <p className="text-zinc-600 text-xs text-center">
        Showing {filtered.length} of {users?.length ?? 0} users
      </p>
    </div>
  )
}

// ─── Unlocks Tab ──────────────────────────────────────────────────────────────

function UnlocksTab() {
  const { data: requests } = useAdminUnlockRequests()
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-white text-lg">Unlock Request Queue</h2>
        {requests && requests.length > 0 && (
          <span className="text-xs bg-warning-500/20 text-warning-400 border border-warning-500/30 px-2 py-1 rounded-full font-bold">
            {requests.length} pending
          </span>
        )}
      </div>
      <UnlockRequestQueue />
    </div>
  )
}

// ─── Curriculum Tab ───────────────────────────────────────────────────────────

function CurriculumTab() {
  return (
    <div className="max-w-2xl">
      <div className="card-game p-6 text-center border-dashed">
        <BookOpen size={32} className="text-accent-400 mx-auto mb-3" />
        <h3 className="font-display font-bold text-white text-lg mb-2">Curriculum Manager</h3>
        <p className="text-zinc-500 text-sm mb-4">
          Add, edit, and organize units, chapters, and quizzes. Implemented in Milestone 2+.
        </p>
        <div className="space-y-2 text-left mt-4 p-4 bg-zinc-800/30 rounded-2xl">
          <p className="text-zinc-400 text-xs font-medium">Seeded content:</p>
          <p className="text-zinc-500 text-xs">✅ Unit 1 — The Simple Present Tense</p>
          <p className="text-zinc-600 text-xs pl-3">📖 Ch 1 — Subject-Verb Agreement</p>
          <p className="text-zinc-600 text-xs pl-3">📖 Ch 2 — Positive and Negative Forms</p>
          <p className="text-zinc-600 text-xs pl-3">📖 Ch 3 — Questions and Short Answers</p>
          <p className="text-zinc-700 text-xs mt-2">To add more: edit seed.js and run it</p>
        </div>
      </div>
    </div>
  )
}

// ─── Row components ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active:    'bg-success-500/20 text-success-400',
  pending:   'bg-warning-500/20 text-warning-400',
  suspended: 'bg-red-500/20 text-red-400',
  expired:   'bg-zinc-700 text-zinc-500',
}

function UserRow({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer">
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/40 to-accent-500/40 flex items-center justify-center text-sm font-bold text-white shrink-0">
        {user.displayName[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
        <p className="text-zinc-600 text-xs truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[user.accountStatus] ?? 'bg-zinc-700 text-zinc-500'}`}>
          {user.accountStatus}
        </span>
        <span className="text-zinc-700 text-xs hidden sm:block">{user.role}</span>
        <ChevronRight size={14} className="text-zinc-700" />
      </div>
    </div>
  )
}

function PendingUserRow({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors cursor-pointer">
      <div className="w-7 h-7 rounded-full bg-warning-500/20 flex items-center justify-center text-xs font-bold text-warning-400">
        {user.displayName[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{user.displayName}</p>
        <p className="text-zinc-600 text-xs truncate">{user.email}</p>
      </div>
      <button className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-500/30 transition-colors font-medium shrink-0">
        Approve
      </button>
    </div>
  )
}
