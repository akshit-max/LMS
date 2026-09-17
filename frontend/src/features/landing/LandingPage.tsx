import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  BookOpen, 
  Gamepad2, 
  Star, 
  TrendingUp, 
  Flame, 
  Award, 
  Trophy, 
  Target, 
  Sparkles,
  School,
  CheckCircle2,
  Lock,
  PlayCircle,
  Check,
  Zap,
  ShieldCheck,
  ChevronRight,
  Compass,
  Menu,
  X
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-500 selection:text-white text-slate-800 overflow-x-hidden">
      
      {/* ── 1. NAVBAR ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-400 to-amber-300 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl">
                🦊
              </div>
            </div>
            <div>
              <span className="font-display font-black text-2xl text-slate-900 tracking-tight block leading-none">
                GrammoQuest
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block mt-1">
                Grammar Adventure
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-10 text-xs font-black uppercase tracking-widest text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors py-1">How It Works</a>
            <a href="#grammar-world" className="hover:text-indigo-600 transition-colors py-1">Grammar World</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors py-1">Features</a>
            <a href="#for-schools" className="hover:text-indigo-600 transition-colors py-1">For Schools</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              id="landing-nav-login"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs tracking-wide transition-all shadow-sm border border-slate-200"
            >
              Log In
            </Link>
            <Link
              to="/login"
              id="landing-nav-register"
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs tracking-wide shadow-md shadow-orange-500/20 transition-all hover:scale-105 flex items-center gap-1.5 border-b-2 border-orange-700 active:translate-y-0.5"
            >
              <span>Start Your Quest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors ml-1"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 text-xs font-black uppercase tracking-wider text-slate-700 shadow-lg"
            >
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-600 transition-colors"
              >
                How It Works
              </a>
              <a 
                href="#grammar-world" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-600 transition-colors"
              >
                Grammar World
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-600 transition-colors"
              >
                Features
              </a>
              <a 
                href="#for-schools" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-indigo-600 transition-colors"
              >
                For Schools
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      {/* ── 2. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 lg:py-24 overflow-hidden bg-gradient-to-b from-sky-100/70 via-indigo-50/40 to-slate-50 border-b border-slate-200/60">
        
        {/* Soft Ambient Background Elements */}
        <div className="absolute top-10 left-10 w-[30rem] h-[30rem] rounded-full bg-orange-200/40 pointer-events-none blur-3xl -z-10" />
        <div className="absolute top-20 right-10 w-[35rem] h-[35rem] rounded-full bg-sky-200/50 pointer-events-none blur-3xl -z-10" />
        <div className="absolute bottom-10 left-1/3 w-[25rem] h-[25rem] rounded-full bg-purple-200/40 pointer-events-none blur-3xl -z-10" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            
            {/* Left Column Content */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-7 text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-indigo-200 text-indigo-700 font-extrabold text-xs shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>The #1 Game-Based Grammar Learning Adventure</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-slate-900 tracking-tight leading-[1.05]">
                Learn English <br />
                Grammar <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">Through </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700">Play</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-lg sm:text-xl font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Turn grammar into an adventure. Learn, practice, earn rewards and become a Grammar Hero.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-3 w-full">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                  <Link
                    to="/login"
                    id="cta-get-started"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wide shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 border-b-4 border-orange-700 transition-all hover:scale-105"
                  >
                    <span>START YOUR QUEST</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border-2 border-slate-200 shadow-sm flex items-center justify-center transition-all hover:scale-105 hover:border-slate-300"
                  >
                    LOG IN
                  </Link>
                </motion.div>
              </div>

              {/* Social Proof & Rating */}
              <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
                <div className="flex -space-x-3">
                  <img className="w-11 h-11 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Student" />
                  <img className="w-11 h-11 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" alt="Student" />
                  <img className="w-11 h-11 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="Student" />
                </div>
                <div className="text-left text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-sm">
                    <span>★ ★ ★ ★ ★</span>
                    <span className="text-slate-800 ml-1">4.9/5</span>
                  </div>
                  <p className="mt-0.5 text-slate-600">Join <strong className="text-slate-900 font-extrabold">10,000+</strong> young learners on their grammar adventure!</p>
                </div>
              </div>

            </motion.div>

            {/* Right Column Mascot Graphic Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="lg:col-span-6 flex justify-center relative my-4 lg:my-0"
            >
              {/* Soft Ambient Background Lighting behind the card */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-amber-400/30 via-orange-500/20 to-indigo-500/30 rounded-[50px] blur-2xl opacity-75 -z-10 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10" />

              {/* Floating Gamification Badges over Hero Image */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="absolute -top-5 -left-3 z-30 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] border border-amber-300/80 text-xs font-black text-slate-800"
              >
                <span className="text-amber-500 text-lg">⭐</span>
                <span>1,250 XP</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-1/3 -right-5 z-30 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] border border-orange-300/80 text-xs font-black text-slate-800"
              >
                <span className="text-orange-500 text-lg">🔥</span>
                <span>7 DAY STREAK</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-5 left-8 z-30 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] border border-purple-300/80 text-xs font-black text-slate-800"
              >
                <span className="text-purple-600 text-lg">🏆</span>
                <span>GRAMMAR CHAMPION</span>
              </motion.div>

              {/* Glassmorphism Visual Deck Frame */}
              <div className="w-full max-w-lg p-3 sm:p-4 rounded-[36px] bg-white/70 backdrop-blur-xl border border-white/90 shadow-[0_30px_70px_-15px_rgba(88,101,242,0.22)] ring-1 ring-slate-900/5 relative group transition-all">
                <div className="w-full rounded-[28px] overflow-hidden relative bg-gradient-to-br from-amber-100/50 via-sky-100/50 to-indigo-100/50 border border-slate-200/60 shadow-inner">
                  <img 
                    src="/hero-artwork.png" 
                    alt="Grammo Mascot Grammar Adventure" 
                    className="w-full h-auto max-h-[540px] object-cover object-center mx-auto transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                  {/* Subtle Gradient Overlay at Bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-40 pointer-events-none" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── 3. TRUST / VALUE STRIP ─────────────────────────────────────────── */}
      <section className="py-10 bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <motion.div whileHover={{ y: -4 }} className="p-5 rounded-3xl bg-indigo-50/80 border-2 border-indigo-100 flex items-center gap-4 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-slate-900">Structured Curriculum</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">Curriculum-aligned learning</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="p-5 rounded-3xl bg-emerald-50/80 border-2 border-emerald-100 flex items-center gap-4 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-slate-900">Game-Based Practice</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">Quizzes, quests & instant feedback</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="p-5 rounded-3xl bg-amber-50/80 border-2 border-amber-100 flex items-center gap-4 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-slate-900">Reward-Based Progress</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">XP, badges & 8 grammar ranks</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="p-5 rounded-3xl bg-sky-50/80 border-2 border-sky-100 flex items-center gap-4 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-slate-900">Track Your Growth</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">Real-time score & streak stats</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── 4. HOW IT WORKS (Visual 4-Step Journey) ───────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-purple-50/40 via-slate-50 to-white relative border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-100/80 border border-indigo-200 px-4 py-1.5 rounded-full shadow-sm">
              4-Step Adventure Journey
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight mt-4">
              How <span className="text-indigo-600">GrammoQuest</span> Works
            </h2>
            <p className="text-slate-600 font-bold text-base sm:text-lg mt-2">
              A simple journey to a brighter you!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/60 border-2 border-purple-100 text-center relative flex flex-col items-center transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center absolute -top-5 shadow-lg ring-4 ring-white">
                01
              </div>
              <div className="w-20 h-20 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center text-4xl my-4 shadow-sm border border-purple-100">
                📚
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">01. LEARN</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">Study clear grammar lessons and interactive notes</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/60 border-2 border-orange-100 text-center relative flex flex-col items-center transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-black text-sm flex items-center justify-center absolute -top-5 shadow-lg ring-4 ring-white">
                02
              </div>
              <div className="w-20 h-20 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center text-4xl my-4 shadow-sm border border-orange-100">
                🎮
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">02. PLAY</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">Take fun grammar quests with immediate feedback</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/60 border-2 border-amber-100 text-center relative flex flex-col items-center transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center absolute -top-5 shadow-lg ring-4 ring-white">
                03
              </div>
              <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center text-4xl my-4 shadow-sm border border-amber-100">
                ⭐
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">03. MASTER</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">Earn stars, XP, badges and climb leaderboards</p>
            </motion.div>

            {/* Step 4 */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/60 border-2 border-emerald-100 text-center relative flex flex-col items-center transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-black text-sm flex items-center justify-center absolute -top-5 shadow-lg ring-4 ring-white">
                04
              </div>
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl my-4 shadow-sm border border-emerald-100">
                🏆
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">04. GROW</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">Unlock new units and become a Grammar Hero!</p>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── 5. GRAMMAR ADVENTURE SECTION (Curriculum World) ────────────────── */}
      <section id="grammar-world" className="py-20 lg:py-28 bg-gradient-to-r from-sky-100/80 via-blue-50 to-indigo-100/80 border-b border-sky-200/80 relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-sky-800 bg-sky-200/80 border border-sky-300 px-4 py-1.5 rounded-full shadow-sm">
              🗺️ Your Grammar Adventure
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight mt-4">
              Explore Your <span className="text-indigo-600">Grammar World</span>
            </h2>
            <p className="text-slate-600 font-bold text-base sm:text-lg mt-2">
              Journey through exciting units: Unit → Chapter → Quest → Mastery!
            </p>
          </div>

          {/* Unit Map Path Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            
            {/* Unit 1 */}
            <motion.div whileHover={{ y: -8 }} className="bg-white rounded-3xl p-7 shadow-xl shadow-sky-950/10 border-2 border-emerald-200 text-center flex flex-col items-center relative transition-all">
              <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-400 flex items-center justify-center text-4xl mb-4 shadow-md relative">
                🌱
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">Unit 1</span>
              <h4 className="font-display font-black text-xl text-slate-900 mt-1">Simple Present</h4>
              <p className="text-xs text-slate-500 font-bold mt-1">Nouns, Verbs & Pronouns</p>
            </motion.div>

            {/* Unit 2 */}
            <motion.div whileHover={{ y: -8 }} className="bg-white rounded-3xl p-7 shadow-xl shadow-sky-950/10 border-2 border-amber-200 text-center flex flex-col items-center relative transition-all">
              <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-4xl mb-4 shadow-md relative">
                🌳
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-md">
                  <PlayCircle className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black uppercase text-amber-600 tracking-wider">Unit 2</span>
              <h4 className="font-display font-black text-xl text-slate-900 mt-1">Past Tense</h4>
              <p className="text-xs text-slate-500 font-bold mt-1">Past Verbs & Adjectives</p>
            </motion.div>

            {/* Unit 3 */}
            <motion.div whileHover={{ y: -8 }} className="bg-white rounded-3xl p-7 shadow-xl shadow-sky-950/10 border-2 border-sky-200 text-center flex flex-col items-center relative transition-all">
              <div className="w-24 h-24 rounded-full bg-sky-100 border-4 border-sky-300 flex items-center justify-center text-4xl mb-4 shadow-md relative">
                🏰
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <span className="text-xs font-black uppercase text-sky-600 tracking-wider">Unit 3</span>
              <h4 className="font-display font-black text-xl text-slate-900 mt-1">Future Tense</h4>
              <p className="text-xs text-slate-500 font-bold mt-1">Modal Verbs & Adverbs</p>
            </motion.div>

            {/* Unit 4 */}
            <motion.div whileHover={{ y: -8 }} className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-7 shadow-2xl text-center flex flex-col items-center relative transition-all border-2 border-indigo-700">
              <div className="absolute -top-3.5 px-4 py-1 rounded-full bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-md">
                New worlds ahead...
              </div>
              <div className="w-24 h-24 rounded-full bg-indigo-800/90 border-4 border-indigo-400/60 flex items-center justify-center text-4xl my-3 shadow-md">
                ✨
              </div>
              <h4 className="font-display font-black text-xl text-white mt-1">More Worlds</h4>
              <span className="text-xs text-indigo-300 font-bold mt-1">Coming Soon!</span>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── 6. GAME FEATURES & GAMIFICATION SHOWCASE ───────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-100/80 border border-purple-200 px-4 py-1.5 rounded-full shadow-sm">
              Gamification Engine
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight mt-4">
              <span className="text-purple-600">Game Features</span> That Keep You Motivated
            </h2>
          </div>

          {/* 6 Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mb-16">
            
            {/* 1. STREAKS */}
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 text-center flex flex-col items-center hover:bg-orange-50/50 hover:border-orange-300 transition-all shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-3 shadow-sm">
                🔥
              </div>
              <h4 className="font-display font-black text-base text-slate-900">STREAKS</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">Keep your learning streak alive</p>
            </motion.div>

            {/* 2. XP & STARS */}
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 text-center flex flex-col items-center hover:bg-amber-50/50 hover:border-amber-300 transition-all shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center text-3xl mb-3 shadow-sm">
                ⭐
              </div>
              <h4 className="font-display font-black text-base text-slate-900">XP & STARS</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">Earn rewards for your progress</p>
            </motion.div>

            {/* 3. BADGES */}
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 text-center flex flex-col items-center hover:bg-pink-50/50 hover:border-pink-300 transition-all shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center text-3xl mb-3 shadow-sm">
                🏅
              </div>
              <h4 className="font-display font-black text-base text-slate-900">BADGES</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">Collect achievements</p>
            </motion.div>

            {/* 4. LEADERBOARDS */}
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 text-center flex flex-col items-center hover:bg-yellow-50/50 hover:border-yellow-300 transition-all shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-3xl mb-3 shadow-sm">
                🏆
              </div>
              <h4 className="font-display font-black text-base text-slate-900">LEADERBOARDS</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">Compete and climb ranks</p>
            </motion.div>

            {/* 5. DAILY MISSIONS */}
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 text-center flex flex-col items-center hover:bg-rose-50/50 hover:border-rose-300 transition-all shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center text-3xl mb-3 shadow-sm">
                🎯
              </div>
              <h4 className="font-display font-black text-base text-slate-900">DAILY MISSIONS</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">Build a daily learning habit</p>
            </motion.div>

            {/* 6. GRAMMO */}
            <motion.div whileHover={{ y: -6 }} className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 text-center flex flex-col items-center hover:bg-indigo-50/50 hover:border-indigo-300 transition-all shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl mb-3 shadow-sm">
                🦊
              </div>
              <h4 className="font-display font-black text-base text-slate-900">GRAMMO</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">Your grammar adventure companion</p>
            </motion.div>

          </div>

          {/* Gamification Interactive Visual Stats Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white shadow-2xl border-2 border-indigo-800/80 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-lg text-center lg:text-left">
              <h3 className="font-display font-black text-3xl text-white">Experience Gamified Rewards</h3>
              <p className="text-indigo-200 text-sm font-semibold mt-2">See how every quiz builds streaks, XP points, and unlocks new grammar ranks!</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-5">
              <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-inner">
                <span className="block text-3xl font-black">⭐ 1,250</span>
                <span className="text-xs font-black uppercase text-amber-300 tracking-wider">XP Points</span>
              </div>

              <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-inner">
                <span className="block text-3xl font-black">🔥 7</span>
                <span className="text-xs font-black uppercase text-orange-300 tracking-wider">Day Streak</span>
              </div>

              <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-inner">
                <span className="block text-3xl font-black">🏆 Rank 4</span>
                <span className="text-xs font-black uppercase text-purple-300 tracking-wider">Grammar Champion</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── 7. SCHOOL / LMS SECTION ───────────────────────────────────────── */}
      <section id="for-schools" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-100/80 border border-indigo-200 px-4 py-1.5 rounded-full shadow-sm">
              LMS & Classroom Platform
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight mt-4">
              Built for Learning. <span className="text-indigo-600">Designed for Play.</span>
            </h2>
            <p className="text-slate-600 font-bold text-base sm:text-lg mt-2">
              Empowering students, reassuring parents, and giving teachers full classroom control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* For Students Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="p-9 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100/60 border-2 border-amber-300/80 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-amber-900/5"
            >
              <div className="relative z-10 max-w-md">
                <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-200/80 px-3.5 py-1 rounded-full shadow-sm">FOR STUDENTS</span>
                <h3 className="font-display font-black text-3xl sm:text-4xl text-slate-900 mt-4 mb-3 leading-tight">
                  Learn grammar through quests, practice and rewards!
                </h3>
                <p className="text-slate-600 text-base font-semibold mb-6 leading-relaxed">
                  Turn your study time into a game, compete on leaderboards, and become a brighter English writer!
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold text-slate-800">
                    <Check className="w-5 h-5 text-orange-500" />
                    <span>Instant quiz feedback & explanations</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold text-slate-800">
                    <Check className="w-5 h-5 text-orange-500" />
                    <span>Fun mascot reactions & level upgrades</span>
                  </div>
                </div>
                <Link
                  to="/login"
                  id="landing-student-start-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wide shadow-md shadow-orange-500/20 transition-all hover:scale-105 border-b-4 border-orange-700"
                >
                  <span>START LEARNING NOW</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Fox Graphic Badge inside Card */}
              <div className="absolute right-4 bottom-4 text-8xl sm:text-9xl select-none opacity-90 pointer-events-none hidden sm:block">
                🦊
              </div>
            </motion.div>

            {/* For Schools & Teachers Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="p-7 sm:p-12 rounded-3xl bg-gradient-to-br from-sky-50 via-indigo-50/80 to-sky-100/60 border-2 border-sky-300/80 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-sky-900/5"
            >
              <div className="relative z-10 max-w-md">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-200/80 px-3.5 py-1 rounded-full shadow-sm">FOR SCHOOLS</span>
                <h3 className="font-display font-black text-2xl sm:text-4xl text-slate-900 mt-4 mb-3 leading-tight">
                  Structured grammar learning with student progress tracking
                </h3>
                <p className="text-slate-600 text-sm sm:text-base font-semibold mb-6 leading-relaxed">
                  Classroom management, curriculum standards, quiz authoring, and institution-wide analytics.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold text-slate-800">
                    <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span>Manage student classes & assignments</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold text-slate-800">
                    <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span>Real-time score & streak dashboards</span>
                  </div>
                </div>
                <Link
                  to="/login"
                  id="landing-school-login-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm tracking-wide shadow-xl shadow-indigo-600/25 transition-all hover:scale-105"
                >
                  <span>SCHOOL / ADMIN LOGIN</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* School Graphic Badge inside Card */}
              <div className="absolute right-4 bottom-4 text-9xl select-none opacity-90 pointer-events-none">
                🏫
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── 8. FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white p-10 sm:p-14 lg:p-20 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10 border-2 border-indigo-800/80">
            
            {/* Ambient Background Accents */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

            {/* Left Graphic & Quote */}
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-5xl shadow-inner shrink-0">
                🦊
              </div>
              <div className="bg-white/95 text-slate-900 px-5 py-3 rounded-2xl shadow-xl border border-amber-300 text-sm font-black">
                Ready to become a <span className="text-orange-500">Grammar Hero?</span>
              </div>
            </div>

            {/* Center Content */}
            <div className="relative z-10 max-w-xl text-center lg:text-left">
              <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight leading-tight">
                Your Adventure Starts Here!
              </h2>
              <p className="text-indigo-200 text-base font-semibold mt-3 leading-relaxed">
                Join GrammoQuest today and turn your grammar skills into something amazing.
              </p>
            </div>

            {/* Right Action Button */}
            <div className="relative z-10 shrink-0 w-full lg:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full lg:w-auto">
                <Link
                  to="/login"
                  id="landing-final-cta-btn"
                  className="w-full lg:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base tracking-wide shadow-md shadow-orange-500/20 flex items-center justify-center gap-3 border-b-4 border-orange-700 transition-all hover:scale-105"
                >
                  <span>START YOUR QUEST</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              </motion.div>
            </div>

          </div>
        </div>
      </section>


      {/* ── 9. FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200/80 py-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3.5">
            <span className="text-3xl">🦊</span>
            <div>
              <span className="font-display font-black text-2xl text-slate-900 block leading-none">GrammoQuest</span>
              <span className="text-xs text-slate-500 font-bold block mt-1">Learn English Grammar Through Play</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-black uppercase tracking-wider text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#grammar-world" className="hover:text-slate-900 transition-colors">Grammar World</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#for-schools" className="hover:text-slate-900 transition-colors">For Schools</a>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Log In</Link>
          </div>

          {/* Copyright */}
          <div className="text-xs font-bold text-slate-400">
            © {new Date().getFullYear()} GrammoQuest. All rights reserved.
          </div>

        </div>
      </footer>

    </div>
  )
}
