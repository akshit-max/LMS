import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, CheckCircle, BookOpen, Star, ChevronRight, Play } from 'lucide-react'
import { useChapters } from './hooks/useCurriculum'
import type { ChapterWithStatus } from './hooks/useCurriculum'

export default function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const navigate = useNavigate()
  const { data: chapters, isLoading } = useChapters(unitId!)

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>
        <div>
          <p className="text-zinc-500 text-xs">Unit</p>
          <h1 className="font-display font-bold text-white text-sm leading-tight">
            {isLoading ? '...' : chapters?.[0]?.unitId ? 'Loading...' : 'Chapters'}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full">
        {/* Unit progress */}
        {chapters && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-game p-4 mb-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm font-medium">Unit Progress</span>
              <span className="text-zinc-500 text-sm">
                {chapters.filter(c => c.status === 'completed').length}/{chapters.length} chapters
              </span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${chapters.length > 0
                    ? (chapters.filter(c => c.status === 'completed').length / chapters.length) * 100
                    : 0}%`
                }}
                transition={{ duration: 0.7, delay: 0.2 }}
              />
            </div>
          </motion.div>
        )}

        {/* Chapter cards */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="card-game h-28 animate-pulse bg-zinc-800/50" />
            ))
          ) : (
            chapters?.map((chapter, i) => (
              <ChapterCard key={chapter.id} chapter={chapter} index={i} />
            ))
          )}
        </div>

        {/* Unit complete hint */}
        {chapters && chapters.every(c => c.status === 'completed') && chapters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 card-game p-4 text-center border border-success-500/30 bg-success-500/5"
          >
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-display font-bold text-white text-sm">Unit Complete!</p>
            <p className="text-zinc-500 text-xs mt-1">
              Score ≥90% on all chapters to unlock the next unit.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

function ChapterCard({ chapter, index }: { chapter: ChapterWithStatus, index: number }) {
  const isLocked = chapter.status === 'locked'
  const isCompleted = chapter.status === 'completed'
  const isAvailable = chapter.status === 'available'

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`card-game p-4 transition-all duration-200
        ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-zinc-600 cursor-pointer'}
        ${isAvailable ? 'border-primary-500/40 bg-primary-500/5' : ''}
        ${isCompleted ? 'border-success-500/30' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Step indicator */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-sm
            ${isLocked ? 'bg-zinc-800 text-zinc-600' :
              isCompleted ? 'bg-success-500/20 text-success-400' :
              'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-game'}`}>
            {isLocked ? <Lock size={16} /> :
             isCompleted ? <CheckCircle size={16} /> :
             index + 1}
          </div>
          {index < 2 && (
            <div className={`w-0.5 h-6 mt-1 ${isCompleted ? 'bg-success-500/40' : 'bg-zinc-800'}`} />
          )}
        </div>

        {/* Chapter info */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-zinc-500 text-xs">Chapter {chapter.order}</p>
            {isAvailable && (
              <span className="text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                Ready!
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm">{chapter.title}</h3>

          {/* Stars if completed */}
          {isCompleted && (
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3].map(s => (
                <Star
                  key={s}
                  size={14}
                  className={s <= chapter.bestStars ? 'text-warning-400 fill-warning-400' : 'text-zinc-700'}
                />
              ))}
              <span className="text-zinc-500 text-xs ml-1">Best: {chapter.bestScore}%</span>
            </div>
          )}
        </div>

        {/* CTA arrow */}
        {!isLocked && (
          <div className={`shrink-0 p-2 rounded-xl
            ${isAvailable ? 'bg-primary-500/20' : 'bg-zinc-800'}`}>
            {isAvailable ? (
              <Play size={16} className="text-primary-400" />
            ) : (
              <ChevronRight size={16} className="text-zinc-500" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )

  if (isLocked) return content
  return <Link to={`/chapters/${chapter.id}`}>{content}</Link>
}
