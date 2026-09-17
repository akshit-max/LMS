import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, BookOpen, Clock, LogOut,
  CheckCircle, ChevronRight, AlertTriangle, Search,
  Menu, X, Bell, Settings, TrendingUp, Lock,
  HelpCircle, BarChart2, CheckSquare, XSquare, RefreshCcw,
  CheckCircle2, XCircle
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types'
import UnlockRequestQueue from './UnlockRequestQueue'
import { useAdminUnlockRequests } from '../student/hooks/useNotifications'
import type { UnitWithStatus } from '../student/hooks/useCurriculum'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number
  activeStudents: number
  pendingApprovals: number
  pendingUnlocks: number
  quizzesToday: number
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'unlocks' | 'curriculum' | 'questions' | 'leaderboard'

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
          {activeTab === 'overview'   && <OverviewTab />}
          {activeTab === 'users'      && <UsersTab />}
          {activeTab === 'unlocks'    && <UnlocksTab />}
          {activeTab === 'curriculum' && <CurriculumTab />}
          {activeTab === 'questions'  && <QuestionManagementTab />}
          {activeTab === 'leaderboard'&& <LeaderboardAdminTab />}
        </main>
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

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
  { id: 'questions',   icon: HelpCircle,      label: 'Questions' },
  { id: 'leaderboard', icon: BarChart2,       label: 'Leaderboard' },
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

      {/* Unlock requests — live data */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-primary-400" />
          <h3 className="font-semibold text-white text-sm">Unlock Requests</h3>
          {pendingUnlocks > 0 && (
            <span className="text-xs bg-warning-500/20 text-warning-400 border border-warning-500/30 px-2 py-0.5 rounded-full font-bold">
              {pendingUnlocks} pending
            </span>
          )}
        </div>
        <UnlockRequestQueue compact />
      </motion.div>
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
    <div className="max-w-4xl space-y-4 relative">
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
            filtered.map(user => (
              <UserRow key={user.uid} user={user} onClick={() => setSelectedUser(user)} />
            ))
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card-game p-6 max-w-md w-full relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">User Details</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Name</p>
                <p className="text-white font-medium">{selectedUser.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Email</p>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Role</p>
                <p className="text-white font-medium capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Status</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[selectedUser.accountStatus] ?? 'bg-zinc-700 text-zinc-500'}`}>
                  {selectedUser.accountStatus}
                </span>
              </div>
            </div>
            
            {/* Student Progress (if applicable) */}
            {selectedUser.role === 'student' && (
              <div className="mb-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <h3 className="text-white font-bold text-sm mb-3">Student Progress</h3>
                {progressLoading ? (
                  <p className="text-zinc-500 text-xs">Loading progress...</p>
                ) : userProgress ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Rank</p>
                      <p className="text-primary-400 font-semibold">{userProgress.rankTitle || 'Rookie'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">XP</p>
                      <p className="text-accent-400 font-semibold">{userProgress.totalXP || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Completed Units</p>
                      <p className="text-white">{userProgress.completedUnits?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Completed Chapters</p>
                      <p className="text-white">{userProgress.completedChapters?.length || 0}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs">No progress data found.</p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {selectedUser.accountStatus === 'pending' && (
                <button
                  onClick={() => approve(selectedUser.uid)}
                  disabled={approving}
                  className="btn-primary py-2 px-4"
                >
                  {approving ? 'Approving...' : 'Approve'}
                </button>
              )}
              {selectedUser.accountStatus === 'active' && (
                <button
                  onClick={() => suspend(selectedUser.uid)}
                  disabled={suspending || selectedUser.uid === profile?.uid}
                  className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {suspending ? 'Suspending...' : 'Suspend'}
                </button>
              )}
              {selectedUser.accountStatus === 'suspended' && (
                <button
                  onClick={() => reactivate(selectedUser.uid)}
                  disabled={reactivating}
                  className="bg-success-500/20 text-success-400 border border-success-500/30 font-bold text-sm px-4 py-2 rounded-xl hover:bg-success-500/30 transition-colors disabled:opacity-50"
                >
                  {reactivating ? 'Reactivating...' : 'Reactivate'}
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

// ─── Admin Curriculum Tab ─────────────────────────────────────────────────────
// Uses admin-specific endpoints (/admin/units, /admin/units/:id/chapters)
// that return raw chapter data WITHOUT student chapterStatus enrichment.
// The student-facing endpoints would return "locked" for everything since
// the admin has no chapterStatus documents.

interface RawUnit {
  id: string
  title: string
  description: string
  order: number
  chapterCount: number
}

interface RawChapter {
  id: string
  title: string
  order: number
  quizId: string
  lessonVideoUrl: string
  pdfUrl: string
}

function CurriculumTab() {
  const { data: units, isLoading } = useQuery({
    queryKey: ['admin', 'units-raw'],
    queryFn: () => api.get<{ units: RawUnit[] }>('/admin/units').then(r => r.data.units),
  })

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-white text-lg">Curriculum</h2>
        <span className="text-xs text-zinc-500">{units?.length ?? 0} units</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="card-game h-20 animate-pulse" />)}
        </div>
      ) : !units?.length ? (
        <div className="card-game p-8 text-center border-dashed">
          <BookOpen size={28} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No units found.</p>
          <p className="text-zinc-700 text-xs mt-1">Run <code className="bg-zinc-800 px-1 rounded">node seed.js</code> in the backend to seed content.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map(unit => <AdminUnitCard key={unit.id} unit={unit} />)}
        </div>
      )}
    </div>
  )
}

function AdminUnitCard({ unit }: { unit: RawUnit }) {
  const [open, setOpen] = useState(false)
  const { data: chapters, isLoading } = useQuery({
    queryKey: ['admin', 'chapters-raw', unit.id],
    queryFn: () => api.get<{ chapters: RawChapter[] }>(`/admin/units/${unit.id}/chapters`).then(r => r.data.chapters),
    enabled: open,
  })

  return (
    <div className="card-game overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-400 shrink-0">
          {unit.order}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{unit.title}</p>
          <p className="text-zinc-500 text-xs">{unit.chapterCount} chapters</p>
        </div>
        <ChevronRight size={14} className={`text-zinc-600 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-zinc-800/60 bg-zinc-900/40">
          {isLoading ? (
            <div className="p-3 text-zinc-600 text-xs text-center">Loading chapters...</div>
          ) : chapters?.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/30 last:border-0">
              <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                <BookOpen size={12} className="text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-zinc-300 text-xs font-medium">Ch {ch.order}: {ch.title}</p>
                <p className="text-zinc-600 text-xs">Quiz: {ch.quizId}</p>
              </div>
              <div className="flex gap-1.5">
                {ch.lessonVideoUrl && <span className="text-xs bg-accent-500/10 text-accent-400 px-1.5 py-0.5 rounded-full">Video</span>}
                {ch.pdfUrl && <span className="text-xs bg-primary-500/10 text-primary-400 px-1.5 py-0.5 rounded-full">PDF</span>}
              </div>
            </div>
          ))}
        </div>
      )}
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

function UserRow({ user, onClick }: { user: User, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer">
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
  const qc = useQueryClient()
  const { mutate: approve, isPending } = useMutation({
    mutationFn: () => api.post(`/admin/users/${user.uid}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
      <div className="w-7 h-7 rounded-full bg-warning-500/20 flex items-center justify-center text-xs font-bold text-warning-400">
        {user.displayName[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{user.displayName}</p>
        <p className="text-zinc-600 text-xs truncate">{user.email}</p>
      </div>
      <button
        onClick={() => approve()}
        disabled={isPending}
        className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-500/30 transition-colors font-medium shrink-0 disabled:opacity-50"
      >
        {isPending ? '...' : 'Approve'}
      </button>
    </div>
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
    approved: 'text-success-400 bg-success-500/10 border-success-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
    pending:  'text-warning-400 bg-warning-500/10 border-warning-500/20',
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Filter by Chapter ID..."
          value={chapterId}
          onChange={e => setChapterId(e.target.value)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-600 flex-1 focus:outline-none focus:border-primary-500"
        />
        <input
          type="text"
          placeholder="Search question text..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-600 flex-1 focus:outline-none focus:border-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-zinc-800/40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          No questions found.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([chapter, qs]) => (
            <div key={chapter} className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 pl-1">
                Chapter: {chapter || 'Unknown'}
              </h3>
              {qs.map(q => (
                <div key={q.id} className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-medium text-white text-base leading-snug">{q.text}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">{q.type}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">ch: {q.chapterId}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusColor[q.approvalStatus] || statusColor.pending}`}>
                      {q.approvalStatus || 'pending'}
                    </span>
                    <button
                      onClick={() => setApproval({ questionId: q.id, status: 'approved' })}
                      className="p-2 rounded-xl bg-success-500/10 text-success-400 hover:bg-success-500/20 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => setApproval({ questionId: q.id, status: 'rejected' })}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      onClick={() => setApproval({ questionId: q.id, status: 'pending' })}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['alltime', 'weekly', 'monthly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize ${
              period === p ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {p === 'alltime' ? 'All Time' : p}
          </button>
        ))}
        <span className="text-zinc-600 text-xs ml-auto">{data?.totalStudents ?? 0} students</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-2xl bg-zinc-800/40 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {(data?.leaderboard ?? []).map(entry => (
            <div key={entry.userId} className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors
              ${entry.rank === 1 ? 'border-yellow-500/30 bg-yellow-500/5' :
                entry.rank === 2 ? 'border-zinc-400/20 bg-zinc-400/5' :
                entry.rank === 3 ? 'border-amber-600/20 bg-amber-600/5' :
                'border-zinc-800 bg-zinc-800/20'}`}
            >
              <span className={`text-sm font-black w-6 text-center shrink-0
                ${entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-zinc-300' : entry.rank === 3 ? 'text-amber-600' : 'text-zinc-600'}`}>
                #{entry.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{entry.displayName}</p>
                <p className="text-zinc-500 text-xs">{entry.rankTitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <p className="text-accent-400 text-sm font-bold">{entry.xp} XP</p>
                  <p className="text-zinc-600 text-xs">⭐ {entry.stars}</p>
                </div>
              </div>
            </div>
          ))}
          {(data?.leaderboard ?? []).length === 0 && (
            <div className="text-center py-8 text-zinc-600">
              <p className="text-sm">No data for this period yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

