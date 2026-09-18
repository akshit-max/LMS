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
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Grammo placeholder — will be replaced with Lottie animation */}
        <div className="relative w-16 h-16">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-md"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">🦊</span>
        </div>
        <p className="text-slate-600 text-sm font-extrabold tracking-wide">Loading GrammoQuest...</p>
      </motion.div>
    </div>
  )
}
