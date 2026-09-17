import { auth } from '@/lib/firebase'
import { CreditCard, LogOut } from 'lucide-react'

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-dvh bg-surface-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <span className="text-5xl mb-4 block">⏰</span>
        <CreditCard size={40} className="text-zinc-600 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-white mb-2">Access Expired</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Your trial or subscription has ended. Renew inside the LMS (₹100/year) to continue your grammar adventure!
        </p>
        <p className="text-zinc-600 text-xs mb-6">
          After paying, your admin will restore access within the next unlock window (8am / 8pm).
        </p>
        <button onClick={() => auth.signOut()} className="btn-secondary gap-2 mx-auto">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
