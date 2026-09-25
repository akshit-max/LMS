import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PlayCircle, BookOpen, RefreshCw } from 'lucide-react'
import { useChapter } from '@/features/student/hooks/useCurriculum'

export default function VideoLessonPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const navigate = useNavigate()
  const { data: chapter, isLoading } = useChapter(chapterId!)

  let embedUrl = null
  const url = chapter?.lessonVideoUrl
  if (url) {
    try {
      if (url.includes('res.cloudinary.com')) {
        const p = new URL(url).pathname.split('/')
        const cloudName = p[1]
        const uploadIdx = p.indexOf('upload')
        if (uploadIdx !== -1) {
          let idStart = uploadIdx + 1
          if (p[idStart]?.match(/^v\d+$/)) idStart++
          const publicId = p.slice(idStart).join('/').replace(/\.[^/.]+$/, "")
          embedUrl = `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${encodeURIComponent(publicId)}`
        }
      }
    } catch (e) {}
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col text-white">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/60 sticky top-0 bg-surface-950/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} className="text-zinc-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm truncate">{chapter?.title || 'Video Lesson'}</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-4xl mx-auto w-full">
        {isLoading ? (
          <RefreshCw size={32} className="animate-spin text-zinc-600" />
        ) : embedUrl ? (
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
            <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen frameBorder="0"></iframe>
          </div>
        ) : url ? (
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center">
            {/* Fallback for non-cloudinary URLs */}
            <iframe src={url} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen frameBorder="0"></iframe>
          </div>
        ) : (
          <>
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
              className="text-zinc-400 mb-8 leading-relaxed max-w-md"
            >
              Our expert instructors are currently recording this lesson. Check back soon for high-quality video content!
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate(-1)}
              className="btn-game flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              Return to Chapter
            </motion.button>
          </>
        )}
      </main>
    </div>
  )
}
