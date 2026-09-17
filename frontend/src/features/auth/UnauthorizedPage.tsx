import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh bg-surface-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <span className="text-5xl mb-4 block">🔒</span>
        <ShieldOff size={40} className="text-zinc-600 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-white mb-2">Access Restricted</h1>
        <p className="text-zinc-500 text-sm mb-6">
          You don't have permission to view this page.
        </p>
        <Link to="/dashboard" className="btn-game">Go to Dashboard</Link>
      </div>
    </div>
  )
}
