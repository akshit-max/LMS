import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import { auth, googleProvider } from '@/lib/firebase'
import { getDashboardPath } from '@/router/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuthStore()

  const [mode, setMode] = useState<'school' | 'independent'>('school')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as any)?.from?.pathname

  const redirectAfterLogin = (role: string) => {
    const dest = from && from !== '/login' ? from : getDashboardPath(role as any)
    navigate(dest, { replace: true })
  }

  // School student / admin — email + password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Profile will be fetched by AuthProvider — wait for it
      // Navigate is handled via profile watch below
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  // Independent student — Google Sign-In
  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await signInWithPopup(auth, googleProvider)
      // AuthProvider will fetch/create profile, then route guard will redirect
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getFirebaseErrorMessage(err.code))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <span className="text-3xl">🦁</span>
        <span className="font-display font-bold text-xl text-white">GrammoQuest</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="card-game p-6">
          <h1 className="font-display font-bold text-2xl text-white mb-1 text-center">Welcome back!</h1>
          <p className="text-zinc-500 text-sm text-center mb-6">Continue your grammar adventure</p>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-zinc-800/60 p-1 mb-6">
            <button
              id="login-tab-school"
              onClick={() => { setMode('school'); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'school'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              School / Admin
            </button>
            <button
              id="login-tab-independent"
              onClick={() => { setMode('independent'); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'independent'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Independent
            </button>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4"
            >
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {mode === 'school' ? (
            /* School / Admin: email + password */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    required
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="btn-game w-full"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={18} /> Sign In
                  </span>
                )}
              </button>
            </form>
          ) : (
            /* Independent: Google Sign-In only */
            <div className="space-y-4">
              <p className="text-zinc-500 text-sm text-center">
                Independent learners use Google to sign in — no password needed.
              </p>
              <button
                id="login-google"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl
                           border border-zinc-700 bg-zinc-800/60 text-zinc-100 font-medium
                           hover:bg-zinc-700/80 hover:border-zinc-600 transition-all duration-200
                           disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <p className="text-center text-zinc-600 text-xs">
                New user?{' '}
                <Link to="/register" className="text-primary-400 hover:text-primary-300">
                  Create your account
                </Link>
              </p>
            </div>
          )}
        </div>

        {mode === 'school' && (
          <p className="text-center text-zinc-600 text-xs mt-4">
            Independent learner?{' '}
            <button onClick={() => setMode('independent')} className="text-primary-400 hover:text-primary-300">
              Sign in with Google
            </button>
          </p>
        )}
      </motion.div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Sign in failed. Please try again.'
  }
}
