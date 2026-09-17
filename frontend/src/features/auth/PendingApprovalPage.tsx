import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export default function PendingApprovalPage() {
  const { profile, setProfile } = useAuthStore()
  const navigate = useNavigate()

  // Poll backend every 10s to check if admin has approved the account.
  // When the backend returns accountStatus === 'active', redirect to dashboard.
  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/auth/me')
        const updated = res.data
        if (updated.accountStatus === 'active') {
          setProfile(updated)
          navigate('/dashboard', { replace: true })
        }
      } catch {
        // ignore errors — just keep polling
      }
    }

    // Check immediately in case approval already happened
    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [navigate, setProfile])

  const handleSignOut = async () => {
    await auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          🦁
        </motion.div>
        <div className="p-3 rounded-2xl bg-warning-500/20 border border-warning-500/30 w-fit mx-auto mb-6">
          <Clock size={32} className="text-warning-400" />
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-3">
          Hang tight, {profile?.displayName?.split(' ')[0] ?? 'Learner'}!
        </h1>
        <p className="text-zinc-400 mb-2">
          Your account is waiting for admin approval.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          This page checks automatically. Once approved, you'll be taken straight to your dashboard!
        </p>
        <div className="card-game p-4 text-left mb-6">
          <p className="text-zinc-400 text-sm font-medium mb-2">While you wait, you can:</p>
          <ul className="text-zinc-500 text-sm space-y-1">
            <li>✅ Explore the GrammoQuest curriculum</li>
            <li>✅ Set up your profile</li>
            <li>✅ Choose your avatar (coming soon)</li>
          </ul>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleSignOut}
            className="btn-secondary text-sm gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
          <button
            onClick={() => {
              api.get('/auth/me').then(res => {
                if (res.data.accountStatus === 'active') {
                  setProfile(res.data)
                  navigate('/dashboard', { replace: true })
                }
              }).catch(() => {})
            }}
            className="btn-secondary text-sm gap-2"
          >
            <RefreshCw size={16} /> Refresh Status
          </button>
        </div>
      </motion.div>
    </div>
  )
}
