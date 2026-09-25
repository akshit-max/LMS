import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Book, CheckCircle, RefreshCw } from 'lucide-react'
import { useChapter } from '@/features/student/hooks/useCurriculum'

export default function GrammarNotesPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const navigate = useNavigate()
  const { data: chapter, isLoading } = useChapter(chapterId!)

  let url = chapter?.pdfUrl
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col text-white">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/60 sticky top-0 bg-surface-950/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} className="text-zinc-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm truncate">{chapter?.title || 'Grammar Notes'}</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-4xl mx-auto w-full">
        {isLoading ? (
          <RefreshCw size={32} className="animate-spin text-zinc-600" />
        ) : url ? (
          <div className="w-full h-[80vh] rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex flex-col items-center justify-center">
            <embed src={url} type="application/pdf" className="w-full h-full" />
            <div className="py-3 flex flex-col items-center gap-1">
              <p className="text-zinc-500 text-xs">If the document doesn't display, open it directly:</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:underline text-xs font-bold">Open PDF in new tab ↗</a>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="w-24 h-24 bg-gradient-to-br from-accent-500/20 to-primary-500/20 rounded-3xl flex items-center justify-center mb-6 border border-accent-500/30 shadow-[0_0_40px_rgba(236,72,153,0.15)]"
            >
              <Book size={48} className="text-accent-400" />
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
              className="text-zinc-400 mb-8 leading-relaxed max-w-md"
            >
              We are preparing detailed, easy-to-read grammar notes for this module. Stay tuned!
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate(-1)}
              className="btn-game bg-accent-500 hover:bg-accent-600 active:bg-accent-700 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Return to Chapter
            </motion.button>
          </>
        )}
      </main>
    </div>
  )
}
