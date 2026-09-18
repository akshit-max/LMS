import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, useIsActive } from '@/store/authStore'
import type { UserRole } from '@/types'
import { motion } from 'framer-motion'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Required roles — if not provided, any authenticated user can access */
  roles?: UserRole[]
  /** If true, requires accountStatus === 'active' */
  requireActive?: boolean
}

/**
 * ProtectedRoute guards routes based on authentication, role, and account status.
 *
 * Priority:
 * 1. If auth is loading → show spinner
 * 2. If not authenticated → redirect to /login
 * 3. If role doesn't match → redirect to /unauthorized
 * 4. If requireActive and account is pending/suspended/expired → redirect to /pending
 * 5. Otherwise → render children
 */
export function ProtectedRoute({ children, roles, requireActive = true }: ProtectedRouteProps) {
  const { isLoading, firebaseUser, profile } = useAuthStore()
  const location = useLocation()
  const isActive = useIsActive()

  // Step 1: Auth is still initializing
  if (isLoading) {
    return <AuthLoadingScreen />
  }

  // Step 2: Not authenticated
  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Step 3: Profile not loaded yet (edge case)
  if (!profile) {
    return <AuthLoadingScreen />
  }

  // Step 4: Role check
  if (roles && roles.length > 0 && !roles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Step 5: Account status check
  if (requireActive && !isActive) {
    if (profile.accountStatus === 'pending') {
      return <Navigate to="/pending-approval" replace />
    }
    if (profile.accountStatus === 'suspended') {
      return <Navigate to="/suspended" replace />
    }
    if (profile.accountStatus === 'expired') {
      return <Navigate to="/subscription-expired" replace />
    }
  }

  return <>{children}</>
}

/**
 * PublicRoute redirects authenticated users away from login/register pages
 * to their role-appropriate dashboard.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, firebaseUser, profile } = useAuthStore()

  if (isLoading) return <AuthLoadingScreen />

  if (firebaseUser && profile) {
    return <Navigate to={getDashboardPath(profile.role)} replace />
  }

  return <>{children}</>
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':       return '/admin'
    case 'school_admin': return '/school-admin'
    case 'teacher':     return '/teacher'
    case 'student':     return '/dashboard'
    default:            return '/dashboard'
  }
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans selection:bg-orange-500 selection:text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 text-center"
      >
        {/* Awesome Dual Ring Spinner with Mascot */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300 opacity-30 blur-md animate-pulse" />
          
          {/* Outer Rotating Gradient Border Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-amber-400 border-b-orange-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner Fox Avatar Badge */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-500 flex items-center justify-center text-3xl shadow-md border-2 border-white relative z-10">
            🦊
          </div>

          {/* Floating Sparks */}
          <span className="absolute -top-1 -right-1 text-sm animate-bounce">✨</span>
          <span className="absolute -bottom-1 -left-1 text-xs animate-pulse">🌟</span>
        </div>

        {/* Text Container with Border Pill */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-50/90 border-2 border-orange-200/90 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <p className="text-slate-900 text-xs font-black uppercase tracking-widest">
              Loading GrammoQuest...
            </p>
          </div>
          <p className="text-[11px] font-extrabold text-slate-400">
            Preparing your grammar adventure
          </p>
        </div>
      </motion.div>
    </div>
  )
}
