import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PlayCircle, BookOpen } from 'lucide-react'

export default function VideoLessonPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col text-white">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/60 sticky top-0 bg-surface-950/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} className="text-zinc-400" />
        </button>
        <p className="font-display font-bold text-sm">Video Lesson</p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl flex items-center justify-center mb-6 border border-primary-500/30 shadow-[0_0_40px_rgba(249,115,22,0.15)]"
        >
          <PlayCircle size={48} className="text-primary-400" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="font-display font-black text-3xl mb-3"
        >
          Coming Soon
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 mb-8 leading-relaxed"
        >
          Our expert instructors are currently recording this lesson. Check back soon for high-quality video content!
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate(-1)}
          className="btn-game w-full flex items-center justify-center gap-2"
        >
          <BookOpen size={18} />
          Return to Chapter
        </motion.button>
      </main>
    </div>
  )
}
