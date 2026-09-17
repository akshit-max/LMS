import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, GraduationCap, User } from 'lucide-react'
import { auth, googleProvider } from '@/lib/firebase'
import { getDashboardPath } from '@/router/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, profileLoaded, firebaseUser } = useAuthStore()

  const [mode, setMode] = useState<'school' | 'independent'>('school')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as any)?.from?.pathname

  // ── React to profile being loaded ───────────────────────────────────────────
  useEffect(() => {
    if (profileLoaded && firebaseUser && profile) {
      const dest = from && from !== '/login' ? from : getDashboardPath(profile.role as any)
      navigate(dest, { replace: true })
    }
  }, [profileLoaded, firebaseUser, profile, navigate, from])

  // School student / admin — email + password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
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
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getFirebaseErrorMessage(err.code))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen max-h-screen max-w-vw overflow-hidden bg-slate-50 flex flex-col lg:grid lg:grid-cols-2 font-sans selection:bg-orange-500 selection:text-white relative">
      
      {/* ── LEFT HERO BANNER (50% Split, Exact Height Fit) ──────────────── */}
      <div className="lg:col-span-1 bg-sky-200 relative overflow-hidden flex flex-col justify-between p-6 lg:p-8 h-full">
        
        {/* Background Artwork Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/login-banner.png')` }}
        />

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />

        {/* Floating Grammar Badges (Separated non-overlapping coordinates) */}
        <motion.div 
          animate={{ y: [0, -6, 0] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-14 right-10 hidden xl:flex items-center px-3.5 py-1.5 rounded-2xl bg-teal-500 text-white font-black text-xs shadow-lg border-2 border-white/90"
        >
          Nouns
        </motion.div>

        <motion.div 
          animate={{ y: [0, 8, 0] }} 
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-28 right-32 hidden xl:flex items-center px-3.5 py-1.5 rounded-2xl bg-pink-500 text-white font-black text-xs shadow-lg border-2 border-white/90"
        >
          Verbs
        </motion.div>

        <motion.div 
          animate={{ y: [0, -7, 0] }} 
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          className="absolute top-44 right-12 hidden xl:flex items-center px-3.5 py-1.5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-lg border-2 border-white/90"
        >
          Adjectives
        </motion.div>

        <motion.div 
          animate={{ y: [0, 7, 0] }} 
          transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-60 right-36 hidden xl:flex items-center px-3.5 py-1.5 rounded-2xl bg-sky-500 text-white font-black text-xs shadow-lg border-2 border-white/90"
        >
          Adverbs
        </motion.div>

        {/* Speech Bubble Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-16 left-60 hidden 2xl:flex flex-col items-center p-2.5 px-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-[11px] shadow-2xl border-2 border-amber-300 text-center"
        >
          <span className="text-indigo-900">Better Grammar</span>
          <span className="text-orange-500">Brighter You! ✨</span>
        </motion.div>

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform">
              🦊
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                GrammoQuest
              </span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Grammar Adventure
              </span>
            </div>
          </Link>
        </div>

        {/* Left Hero Typography Card (Non-overlapping & Easy to Read) */}
        <div className="relative z-10 my-auto py-2 max-w-sm">
          <div className="bg-black/30 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-3xl shadow-2xl text-white">
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight leading-tight mb-2 drop-shadow-md">
              Small Steps. <br />
              <span className="text-orange-400">Big </span>
              <span className="text-purple-300">Brighter </span>
              <span className="text-sky-200">Writers!</span>
            </h1>

            <p className="text-white/90 font-bold text-xs sm:text-sm mb-4">
              Learn grammar. Play. Grow. Shine!
            </p>

            {/* Wooden Signpost Stack */}
            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
              <div className="py-1.5 px-3.5 rounded-lg bg-amber-500 text-white font-black text-[11px] tracking-wider shadow-md border-b-2 border-orange-700">
                EXPLORE
              </div>
              <div className="py-1.5 px-3.5 rounded-lg bg-blue-600 text-white font-black text-[11px] tracking-wider shadow-md border-b-2 border-blue-800">
                LEARN
              </div>
              <div className="py-1.5 px-3.5 rounded-lg bg-purple-600 text-white font-black text-[11px] tracking-wider shadow-md border-b-2 border-purple-800">
                PRACTICE
              </div>
              <div className="py-1.5 px-3.5 rounded-lg bg-emerald-600 text-white font-black text-[11px] tracking-wider shadow-md border-b-2 border-emerald-800">
                SUCCEED
              </div>
            </div>
          </div>
        </div>

        {/* Footer Mascot Quote */}
        <div className="relative z-10 pt-2 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-[11px]">
            <span>🪨</span>
            <span className="font-bold text-white">"Grammar is your superpower!"</span>
            <span className="text-amber-300 font-black">— Grammo</span>
          </div>
          <span className="hidden sm:inline-block text-white/80 font-bold text-[11px]">v2.0</span>
        </div>

      </div>


      {/* ── RIGHT FORM SECTION (50% Split, Exact Viewport Fit) ──────────────── */}
      <div className="lg:col-span-1 bg-slate-50/90 flex flex-col justify-between p-6 lg:p-8 h-full overflow-y-auto lg:overflow-hidden relative">
        
        {/* Soft Organic Pastel Background Shapes */}
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-orange-100/70 border border-orange-200/40 pointer-events-none blur-sm" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-purple-100/80 border border-purple-200/40 pointer-events-none blur-sm" />
        <div className="absolute -bottom-10 -left-16 w-64 h-64 rounded-full bg-teal-100/60 border border-teal-200/30 pointer-events-none blur-sm" />
        <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-indigo-100/60 border border-indigo-200/30 pointer-events-none blur-sm" />

        {/* Top Navigation Bar */}
        <div className="flex justify-end items-center gap-3 mb-2 relative z-10 shrink-0">
          <span className="text-xs font-semibold text-slate-600">New here?</span>
          <Link
            to="/register"
            className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md transition-all hover:scale-105"
          >
            Create an account
          </Link>
        </div>

        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto my-auto relative z-10 shrink-0"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-950/5 border border-slate-100 p-6 sm:p-7">
            
            {/* Mascot Logo Header inside Card */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-300 p-0.5 shadow-md mb-2">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                  🦊
                </div>
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                Welcome back!
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Continue your grammar adventure
              </p>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex rounded-xl bg-indigo-50/80 p-1 mb-4 border border-indigo-100/60">
              <button
                id="login-tab-school"
                type="button"
                onClick={() => { setMode('school'); setError(null) }}
                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'school'
                    ? 'bg-white text-indigo-900 shadow-md ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${mode === 'school' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>School / Admin</span>
              </button>
              
              <button
                id="login-tab-independent"
                type="button"
                onClick={() => { setMode('independent'); setError(null) }}
                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'independent'
                    ? 'bg-white text-indigo-900 shadow-md ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${mode === 'independent' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Independent</span>
              </button>
            </div>

            {/* Error Banner */}
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

            {mode === 'school' ? (
              /* School / Admin: Email + Password Form */
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="relative rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      required
                      className="w-full bg-transparent py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent py-2.5 pl-10 pr-10 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs tracking-wide shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 border-b-2 border-orange-700 mt-1"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" /> Sign In
                    </span>
                  )}
                </button>
              </form>
            ) : (
              /* Independent: Google Sign-In */
              <div className="space-y-3 py-1">
                <p className="text-slate-500 text-[11px] font-medium text-center leading-relaxed">
                  Independent learners use Google to sign in safely — no passwords needed.
                </p>

                <button
                  id="login-google"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Google Sign-in Option for School tab */}
            {mode === 'school' && (
              <button
                id="login-google"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Sign in with Google</span>
              </button>
            )}

            {/* Bottom School Alert Box */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                🏫
              </div>
              <div className="text-[11px] text-indigo-900 leading-tight">
                <p className="font-bold">School student?</p>
                <p className="text-indigo-700/90 mt-0.5">
                  Your teacher will create your account. <span className="font-bold underline text-indigo-900 cursor-pointer">Need help? Ask your teacher.</span>
                </p>
              </div>
            </div>

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


