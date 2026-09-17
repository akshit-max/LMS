import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Trophy, Zap, Star, ArrowRight, Users } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Structured Grammar', desc: 'Curriculum-aligned lessons from basics to advanced' },
  { icon: Zap, title: 'Quiz Battles', desc: 'Compete with bots, earn XP, climb the leaderboard' },
  { icon: Trophy, title: 'Earn Ranks', desc: 'Grammar Rookie → Grammar God — 8 levels of mastery' },
  { icon: Star, title: 'Daily Missions', desc: 'Small achievable tasks that build a daily learning habit' },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦁</span>
          <span className="font-display font-bold text-xl text-white tracking-tight">GrammoQuest</span>
        </div>
        <Link to="/login" className="btn-secondary text-sm py-2 px-4">
          Log In
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Grammo mascot placeholder */}
          <motion.div
            className="text-7xl mb-6 inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🦁
          </motion.div>

          <h1 className="font-display font-black text-4xl md:text-5xl text-white leading-tight mb-4">
            Learn English Grammar{' '}
            <span className="text-gradient">Through Play</span>
          </h1>

          <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
            GrammoQuest turns grammar into an adventure — quizzes, ranks, streaks,
            and your personal grammar lion guide Grammo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" id="cta-get-started" className="btn-game text-lg px-8 py-4 w-full sm:w-auto">
              Get Started Free <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
              Log In
            </Link>
          </div>

          <p className="text-zinc-600 text-sm mt-4">
            5-day free trial · No credit card required
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-center text-white mb-8">
            Why students love GrammoQuest
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className="card-game p-5 flex gap-4 items-start"
              >
                <div className="p-2 rounded-xl bg-primary-500/20 text-primary-400 shrink-0">
                  <f.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 mb-1">{f.title}</h3>
                  <p className="text-zinc-500 text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* School CTA */}
      <section className="px-4 py-10 md:px-8">
        <div className="max-w-2xl mx-auto card-game p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="p-3 rounded-2xl bg-accent-500/20 text-accent-400 shrink-0">
            <Users size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-white text-lg mb-1">
              Using GrammoQuest for your school?
            </h3>
            <p className="text-zinc-400 text-sm">
              School accounts include class management, teacher dashboards, and institution-wide analytics.
            </p>
          </div>
          <Link to="/login" className="btn-secondary shrink-0 text-sm py-2 px-4">
            School Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-zinc-700 text-xs border-t border-zinc-800/50">
        © 2025 GrammoQuest · Learn English Grammar Through Play
      </footer>
    </div>
  )
}
