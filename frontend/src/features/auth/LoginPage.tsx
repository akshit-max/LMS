import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Sparkles, GraduationCap, User, ArrowRight, ShieldCheck, Sparkle } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      
      {/* ── LEFT HERO BANNER (Desktop: 6 or 7 cols) ──────────────────────────────── */}
      <div className="lg:col-span-7 bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-[420px] lg:min-h-screen text-white">
        
        {/* Background Artwork Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40 scale-105 transition-transform duration-1000 hover:scale-100"
          style={{ backgroundImage: `url('/login-banner.png')` }}
        />

        {/* Ambient Gradient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Grammar Badges (Animated) */}
        <motion.div 
          animate={{ y: [0, -10, 0] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-24 right-12 hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600/80 backdrop-blur-md border border-indigo-400/40 text-xs font-bold tracking-wide shadow-lg text-white"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Nouns
        </motion.div>

        <motion.div 
          animate={{ y: [0, 12, 0] }} 
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-44 right-32 hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-pink-500/80 backdrop-blur-md border border-pink-300/40 text-xs font-bold tracking-wide shadow-lg text-white"
        >
          Verbs
        </motion.div>

        <motion.div 
          animate={{ y: [0, -8, 0] }} 
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
          className="absolute top-64 right-16 hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-500/80 backdrop-blur-md border border-teal-300/40 text-xs font-bold tracking-wide shadow-lg text-white"
        >
          Adjectives
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-80 right-36 hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/80 backdrop-blur-md border border-blue-300/40 text-xs font-bold tracking-wide shadow-lg text-white"
        >
          Adverbs
        </motion.div>

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
              🦊
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white drop-shadow-sm flex items-center gap-1.5">
                GrammoQuest
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Grammar Adventure
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Main Graphic & Typography */}
        <div className="relative z-10 my-auto py-8">
          
          {/* Speech Bubble */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-900 font-extrabold text-xs shadow-xl mb-6 border-2 border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Small Steps, Big Adventures! ✨</span>
          </motion.div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-4 text-white drop-shadow-md">
            Grammar Today <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
              A Brighter You
            </span>
          </h1>

          <p className="text-sky-100 text-base sm:text-lg font-medium max-w-md mb-8 leading-relaxed">
            Play, learn and level up your English with interactive quests, mascot rewards, and instant feedback!
          </p>

          {/* Game Signpost Planks */}
          <div className="flex flex-wrap gap-2.5 max-w-lg">
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg border-b-4 border-orange-700 flex items-center gap-2 transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
              <span>🟧</span> EXPLORE
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white font-black text-xs uppercase tracking-wider shadow-lg border-b-4 border-blue-700 flex items-center gap-2 transform rotate-1 hover:rotate-0 transition-transform cursor-default">
              <span>🟦</span> LEARN
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs uppercase tracking-wider shadow-lg border-b-4 border-purple-700 flex items-center gap-2 transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
              <span>🟪</span> PRACTICE
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg border-b-4 border-emerald-700 flex items-center gap-2 transform rotate-1 hover:rotate-0 transition-transform cursor-default">
              <span>🟩</span> SUCCEED
            </div>
          </div>

        </div>

        {/* Footer Mascot Quote Stone */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-sky-200">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-base">🪨</span>
            <span className="font-semibold text-white">"Grammar is your superpower!"</span>
            <span className="text-amber-300 font-bold">— Grammo</span>
          </div>
          <span className="hidden sm:inline-block text-sky-200/70 font-medium">GrammoQuest v2.0</span>
        </div>

      </div>


      {/* ── RIGHT FORM SECTION (Desktop: 5 cols) ────────────────────────────────── */}
      <div className="lg:col-span-5 bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative">
        
        {/* Soft Decorative Blobs */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        {/* Top Right "New here? Create an account" link bar */}
        <div className="flex justify-end items-center gap-3 mb-6 relative z-10">
          <span className="text-sm font-semibold text-slate-600">New here?</span>
          <Link
            to="/register"
            className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Create an account
          </Link>
        </div>

        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto my-auto relative z-10"
        >
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">
            
            {/* Mascot Logo Header inside Card */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-orange-400 to-amber-300 p-0.5 shadow-lg mb-3">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-3xl">
                  🦊
                </div>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Welcome back!
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Continue your grammar adventure
              </p>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex rounded-2xl bg-indigo-50/80 p-1.5 mb-6 border border-indigo-100/60 shadow-inner">
              <button
                id="login-tab-school"
                type="button"
                onClick={() => { setMode('school'); setError(null) }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'school'
                    ? 'bg-white text-indigo-900 shadow-md ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${mode === 'school' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>School / Admin</span>
              </button>
              
              <button
                id="login-tab-independent"
                type="button"
                onClick={() => { setMode('independent'); setError(null) }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'independent'
                    ? 'bg-white text-indigo-900 shadow-md ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className={`w-4 h-4 ${mode === 'independent' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Independent</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 mb-6 text-rose-700"
              >
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </motion.div>
            )}

            {mode === 'school' ? (
              /* School / Admin: Email + Password Form */
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      required
                      className="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent py-3.5 pl-11 pr-11 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 border-b-4 border-orange-700"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" /> Sign In
                    </span>
                  )}
                </button>
              </form>
            ) : (
              /* Independent: Google Sign-In */
              <div className="space-y-4 py-2">
                <p className="text-slate-500 text-xs font-medium text-center leading-relaxed">
                  Independent learners use Google to sign in safely — no passwords needed.
                </p>

                <button
                  id="login-google"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Google Sign-in Option for School tab too if clicked */}
            {mode === 'school' && (
              <button
                id="login-google"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Sign in with Google</span>
              </button>
            )}

            {/* Bottom School Alert Box */}
            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
                🏫
              </div>
              <div className="text-xs text-indigo-900 leading-snug">
                <p className="font-bold">School student?</p>
                <p className="text-indigo-700/90 mt-0.5">
                  Your teacher will create your account. <span className="font-bold underline text-indigo-900 cursor-pointer">Need help? Ask your teacher.</span>
                </p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Bottom copyright / policy */}
        <div className="text-center text-xs text-slate-400 font-medium py-2 relative z-10">
          © {new Date().getFullYear()} GrammoQuest. All rights reserved.
        </div>

      </div>

    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
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

