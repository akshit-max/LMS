import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { motion } from 'framer-motion'
import { User, Phone, AlertCircle, CheckCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      
      {/* ── LEFT HERO BANNER (Desktop: 7 cols) ──────────────────────────────── */}
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
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-900 font-extrabold text-xs shadow-xl mb-6 border-2 border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Small Steps. Big Brighter Writers! ✨</span>
          </motion.div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-4 text-white drop-shadow-md">
            Start Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
              Grammar Quest
            </span>
          </h1>

          <p className="text-sky-100 text-base sm:text-lg font-medium max-w-md mb-8 leading-relaxed">
            Create your free account today and unlock a fun, rewarding gamified way to master English grammar!
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

        {/* Top Right "Already have an account? Sign In" link bar */}
        <div className="flex justify-end items-center gap-3 mb-6 relative z-10">
          <span className="text-sm font-semibold text-slate-600">Already have an account?</span>
          <Link
            to="/login"
            className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Sign In
          </Link>
        </div>

        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto my-auto relative z-10"
        >
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">

            {step === 'google' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-orange-400 to-amber-300 p-0.5 shadow-lg mb-3">
                    <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-3xl">
                      🚀
                    </div>
                  </div>
                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Start your quest!
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 font-medium">
                    Create your free independent learner account
                  </p>
                </div>

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

                <button
                  id="register-google"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-extrabold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 mb-6"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="text-center text-slate-500 text-xs space-y-2 mb-6">
                  <p className="font-medium">You'll set your display name in the next step.</p>
                </div>

                {/* School Student Box */}
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
                    🏫
                  </div>
                  <div className="text-xs text-indigo-900 leading-snug">
                    <p className="font-bold">School student?</p>
                    <p className="text-indigo-700/90 mt-0.5">
                      Your teacher will create your account. Please ask them for your credentials.
                    </p>
                  </div>
                </div>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-0.5 shadow-lg mb-3">
                    <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-3xl">
                      ✨
                    </div>
                  </div>
                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Almost there!
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 font-medium">
                    Tell us a bit about yourself to setup your profile
                  </p>
                </div>

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

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Arjun Kumar"
                        required
                        minLength={2}
                        className="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-slate-400 lowercase font-normal">(optional)</span>
                    </label>
                    <div className="relative rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="register-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    id="register-submit"
                    type="submit"
                    disabled={isLoading || !displayName.trim()}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 border-b-4 border-orange-700"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
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
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="font-display font-extrabold text-2xl text-slate-900 mb-2">
                  You're all set, {displayName}!
                </h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">
                  Your account is pending review. You will get immediate access to Unit 1 as soon as it is approved.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/pending-approval')}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm shadow-lg shadow-indigo-500/30 transition-all border-b-4 border-indigo-800"
                >
                  View My Account Status
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>

        {/* Bottom copyright */}
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

