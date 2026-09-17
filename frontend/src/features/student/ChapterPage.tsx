import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Play, CheckCircle, Star, BookOpen, FileText, Video } from 'lucide-react'
import { useChapter } from './hooks/useCurriculum'

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const navigate = useNavigate()
  const { data: chapter, isLoading } = useChapter(chapterId!)

  const isLocked = chapter?.status === 'locked'
  const isCompleted = chapter?.status === 'completed'
  const isAvailable = chapter?.status === 'available'
  const hasVideo = !!chapter?.lessonVideoUrl
  const hasPDF = !!chapter?.pdfUrl

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="min-h-dvh bg-surface-950 flex items-center justify-center text-zinc-500 text-sm">
        Chapter not found.
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-500 text-xs">Chapter {chapter.order}</p>
          <h1 className="font-display font-bold text-white text-sm leading-tight truncate">{chapter.title}</h1>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs bg-success-500/20 text-success-400 px-2 py-1 rounded-full font-medium shrink-0">
            <CheckCircle size={12} /> Done
          </span>
        )}
      </header>

      <main className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full space-y-4">

        {/* Chapter hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card-game p-5 text-center
            ${isAvailable ? 'border-primary-500/40 bg-primary-500/5' : ''}
            ${isCompleted ? 'border-success-500/30 bg-success-500/5' : ''}`}
        >
          <div className={`w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl
            ${isLocked ? 'bg-zinc-800' :
              isCompleted ? 'bg-success-500/20' :
              'bg-gradient-to-br from-primary-500/30 to-accent-500/30'}`}>
            {isLocked ? '🔒' : isCompleted ? '✅' : '📖'}
          </div>

          <h2 className="font-display font-bold text-xl text-white mb-2">{chapter.title}</h2>

          {isLocked && (
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Lock size={14} />
              <span>Complete the previous chapter first</span>
            </div>
          )}

          {/* Stars for completed */}
          {isCompleted && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    size={24}
                    className={s <= chapter.bestStars
                      ? 'text-warning-400 fill-warning-400'
                      : 'text-zinc-700'}
                  />
                ))}
              </div>
              <p className="text-zinc-400 text-sm">Best score: <span className="text-success-400 font-bold">{chapter.bestScore}%</span></p>
            </div>
          )}

          {isAvailable && (
            <p className="text-zinc-400 text-sm">
              Study the lesson, then take the quiz to unlock the next chapter.
            </p>
          )}
        </motion.div>

        {/* Lesson resources */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="space-y-2"
        >
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider px-1">Lesson Resources</p>

          {/* Video lesson */}
          <ResourceCard
            icon={Video}
            title="Video Lesson"
            subtitle={hasVideo ? 'Watch the lesson' : 'Coming soon'}
            available={hasVideo && !isLocked}
            color="accent"
            href={chapter.lessonVideoUrl}
            external
          />

          {/* PDF notes */}
          <ResourceCard
            icon={FileText}
            title="Grammar Notes"
            subtitle={hasPDF ? 'Download PDF' : 'Coming soon'}
            available={hasPDF && !isLocked}
            color="primary"
            href={chapter.pdfUrl}
            external
          />

          {/* Reading (placeholder — will be rich content in M5) */}
          <ResourceCard
            icon={BookOpen}
            title="Interactive Lesson"
            subtitle="Coming soon in next update"
            available={false}
            color="warning"
          />
        </motion.div>

        {/* Quiz CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {isAvailable || isCompleted ? (
            <Link to={`/quiz/${chapter.quizId}`} className={isLocked ? 'pointer-events-none' : ''}>
              <button
                disabled={isLocked}
                className={`w-full py-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-3 transition-all duration-200
                  ${isCompleted
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    : 'btn-game text-lg shadow-game hover:scale-[1.02]'}`}
              >
                <Play size={20} />
                {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-3 bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-dashed border-zinc-700"
            >
              <Lock size={18} />
              Locked
            </button>
          )}

          {isAvailable && (
            <p className="text-center text-zinc-600 text-xs mt-2">
              Score ≥90% to unlock the next chapter
            </p>
          )}
          {isCompleted && (
            <p className="text-center text-zinc-600 text-xs mt-2">
              You've passed this chapter ✓ · Retake to improve your stars
            </p>
          )}
        </motion.div>

      </main>
    </div>
  )
}

// ─── Resource Card ────────────────────────────────────────────────────────────

type ResourceColor = 'accent' | 'primary' | 'warning'
const rColors: Record<ResourceColor, string> = {
  accent:  'bg-accent-500/20 text-accent-400',
  primary: 'bg-primary-500/20 text-primary-400',
  warning: 'bg-warning-500/20 text-warning-400',
}

function ResourceCard({
  icon: Icon, title, subtitle, available, color, href, external,
}: {
  icon: any, title: string, subtitle: string, available: boolean,
  color: ResourceColor, href?: string, external?: boolean,
}) {
  const inner = (
    <div className={`card-game p-3.5 flex items-center gap-3 transition-all duration-150
      ${available ? 'hover:border-zinc-600 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${available ? rColors[color] : 'bg-zinc-800 text-zinc-600'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-zinc-500 text-xs">{subtitle}</p>
      </div>
      {available && (
        <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
      )}
    </div>
  )

  if (!available || !href) return inner
  return <a href={href} target={external ? '_blank' : '_self'} rel="noopener noreferrer">{inner}</a>
}
