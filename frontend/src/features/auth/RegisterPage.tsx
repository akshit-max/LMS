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
    <div className="min-h-screen lg:h-screen w-screen max-w-full overflow-x-hidden lg:overflow-hidden bg-slate-50 flex flex-col lg:grid lg:grid-cols-2 font-sans selection:bg-orange-500 selection:text-white relative">
      
      {/* ── LEFT HERO BANNER (Hidden on Mobile/Tablet < 1024px, 50% Desktop Image) ── */}
      <div className="hidden lg:block lg:col-span-1 h-full relative overflow-hidden select-none bg-sky-200">
        <img 
          src="/login-banner.png" 
          alt="GrammoQuest Grammar Adventure"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* ── RIGHT FORM SECTION (Full Width on Mobile, 50% Desktop) ──────── */}
      <div className="w-full lg:col-span-1 bg-slate-50/90 flex flex-col justify-between p-4 sm:p-6 lg:p-8 min-h-screen lg:min-h-0 h-full overflow-y-auto lg:overflow-hidden relative">
        
        {/* Soft Organic Pastel Background Shapes */}
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-orange-100/70 border border-orange-200/40 pointer-events-none blur-sm" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-purple-100/80 border border-purple-200/40 pointer-events-none blur-sm" />
        <div className="absolute -bottom-10 -left-16 w-64 h-64 rounded-full bg-teal-100/60 border border-teal-200/30 pointer-events-none blur-sm" />
        <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-indigo-100/60 border border-indigo-200/30 pointer-events-none blur-sm" />

        {/* Top Navigation Bar */}
        <div className="flex justify-between sm:justify-end items-center gap-3 mb-4 sm:mb-2 relative z-10 shrink-0">
          <Link to="/" className="lg:hidden flex items-center gap-2">
            <span className="text-xl">🦊</span>
            <span className="font-display font-black text-lg text-indigo-950">GrammoQuest</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Already have an account?</span>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md transition-all hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto my-auto relative z-10 shrink-0 py-2"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-950/5 border border-slate-100 p-6 sm:p-7">

            {step === 'google' && (
              <>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-300 p-0.5 shadow-md mb-2">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                      🦊
                    </div>
                  </div>
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                    Start your quest!
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">
                    Create your free independent learner account
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-4 text-rose-700"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <button
                  id="register-google"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 mb-4"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="text-center text-slate-500 text-xs mb-4">
                  <p className="font-medium">You'll set your display name in the next step.</p>
                </div>

                {/* School Student Box */}
                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                    🏫
                  </div>
                  <div className="text-[11px] text-indigo-900 leading-tight">
                    <p className="font-bold">School student?</p>
                    <p className="text-indigo-700/90 mt-0.5">
                      Your teacher will create your account. Ask them for credentials.
                    </p>
                  </div>
                </div>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-300 p-0.5 shadow-md mb-2">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                      🦊
                    </div>
                  </div>
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                    Almost there!
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">
                    Tell us a bit about yourself to setup your profile
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-4 text-rose-700"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Name
                    </label>
                    <div className="relative rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Arjun Kumar"
                        required
                        minLength={2}
                        className="w-full bg-transparent py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number <span className="text-slate-400 lowercase font-normal">(optional)</span>
                    </label>
                    <div className="relative rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-transparent py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    id="register-submit"
                    type="submit"
                    disabled={isLoading || !displayName.trim()}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs tracking-wide shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 border-b-2 border-orange-700 mt-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                className="text-center py-2"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="font-display font-extrabold text-xl text-slate-900 mb-1">
                  You're all set, {displayName}!
                </h2>
                <p className="text-slate-500 text-xs mb-5 leading-relaxed font-medium">
                  Your account is pending review. You will get immediate access to Unit 1 as soon as it is approved.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/pending-approval')}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-md transition-all border-b-2 border-indigo-800"
                >
                  View My Account Status
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>

        {/* Bottom Copyright */}
        <div className="text-center text-[11px] text-slate-400 font-medium py-1 relative z-10 shrink-0">
          © {new Date().getFullYear()} GrammoQuest. All rights reserved.
        </div>

      </div>

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
