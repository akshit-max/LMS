import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { motion } from 'framer-motion'
import { User, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import { auth, googleProvider } from '@/lib/firebase'
import api from '@/lib/api'

type Step = 'google' | 'profile' | 'done'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('google')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 1: Google Sign-In
  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      // Pre-fill display name from Google profile
      setDisplayName(result.user.displayName ?? '')
      setStep('profile')
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Complete profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // The AuthProvider will have already called /auth/profile on Firebase login.
      // Here we update the display name if the user changed it.
      await api.post('/auth/profile', {
        email: auth.currentUser?.email,
        displayName: displayName.trim(),
        studentType: 'independent',
      })
      setStep('done')
    } catch (err) {
      setError('Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col items-center justify-center px-4 py-8">
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

          {step === 'google' && (
            <>
              <h1 className="font-display font-bold text-2xl text-white mb-1 text-center">
                Start your quest!
              </h1>
              <p className="text-zinc-500 text-sm text-center mb-6">
                Create your free independent learner account
              </p>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                id="register-google"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl
                           border border-zinc-700 bg-zinc-800/60 text-zinc-100 font-medium
                           hover:bg-zinc-700/80 hover:border-zinc-600 transition-all duration-200
                           disabled:opacity-50 mb-4"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <div className="text-center text-zinc-600 text-xs space-y-1">
                <p>You'll be able to set your name in the next step.</p>
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-400 hover:text-primary-300">Sign in</Link>
                </p>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                <p className="text-accent-300 text-xs text-center">
                  🏫 School student? Your teacher will create your account.
                  Ask them for your login credentials.
                </p>
              </div>
            </>
          )}

          {step === 'profile' && (
            <>
              <h1 className="font-display font-bold text-2xl text-white mb-1 text-center">
                Almost there!
              </h1>
              <p className="text-zinc-500 text-sm text-center mb-6">
                Tell us a bit about yourself
              </p>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="register-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Arjun Kumar"
                      required
                      minLength={2}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Phone Number <span className="text-zinc-600">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="register-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  disabled={isLoading || !displayName.trim()}
                  className="btn-game w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="text-5xl mb-4">🎉</div>
              <CheckCircle size={48} className="text-success-500 mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-white mb-2">
                You're all set, {displayName}!
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                Your account is being reviewed. You'll get access to Unit 1 once approved.
              </p>
              <button
                onClick={() => navigate('/pending-approval')}
                className="btn-game w-full"
              >
                View My Account Status
              </button>
            </motion.div>
          )}
        </div>
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
