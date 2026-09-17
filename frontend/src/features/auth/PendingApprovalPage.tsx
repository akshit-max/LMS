import { motion } from 'framer-motion'
import { Clock, LogOut } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'

export default function PendingApprovalPage() {
  const { profile } = useAuthStore()

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
          You'll receive access to Unit 1 within 24 hours of registration.
          Check back soon!
        </p>
        <div className="card-game p-4 text-left mb-6">
          <p className="text-zinc-400 text-sm font-medium mb-2">While you wait, you can:</p>
          <ul className="text-zinc-500 text-sm space-y-1">
            <li>✅ Explore the GrammoQuest curriculum</li>
            <li>✅ Set up your profile</li>
            <li>✅ Choose your avatar (coming soon)</li>
          </ul>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="btn-secondary text-sm gap-2 mx-auto"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </motion.div>
    </div>
  )
}
