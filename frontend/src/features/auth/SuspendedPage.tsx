import { auth } from '@/lib/firebase'
import { Ban, LogOut } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <div className="min-h-dvh bg-surface-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <span className="text-5xl mb-4 block">😔</span>
        <Ban size={40} className="text-red-500/60 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-white mb-2">Account Suspended</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Your account has been temporarily suspended. Please contact your teacher or admin for help.
        </p>
        <button onClick={() => auth.signOut()} className="btn-secondary gap-2 mx-auto">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
