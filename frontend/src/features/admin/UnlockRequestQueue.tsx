import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp,
  Clock, AlertTriangle, Star, User, BookOpen, MessageSquare
} from 'lucide-react'
import {
  useAdminUnlockRequests,
  useApproveUnlock,
  useRejectUnlock,
  useRequestRetry,
  type UnlockRequest,
} from '../student/hooks/useNotifications'

export default function UnlockRequestQueue({ compact = false }: { compact?: boolean }) {
  const { data: requests, isLoading, error } = useAdminUnlockRequests()
  const { mutate: approve, isPending: approving } = useApproveUnlock()
  const { mutate: reject, isPending: rejecting } = useRejectUnlock()
  const { mutate: retry, isPending: retrying } = useRequestRetry()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string>('')
  const [activeAction, setActiveAction] = useState<{ id: string; type: 'approve' | 'reject' | 'retry' } | null>(null)
  const [noteText, setNoteText] = useState('')

  const handleAction = (id: string, type: 'approve' | 'reject' | 'retry') => {
    setActiveAction({ id, type })
    setNoteText('')
  }

  const confirmAction = () => {
    if (!activeAction) return
    const payload = { requestId: activeAction.id, adminNote: noteText }

    if (activeAction.type === 'approve') approve(payload, { onSuccess: () => setActiveAction(null) })
    else if (activeAction.type === 'reject') reject(payload, { onSuccess: () => setActiveAction(null) })
    else retry(payload, { onSuccess: () => setActiveAction(null) })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="card-game h-24 animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-game p-4 text-center text-red-400 text-sm">
        Failed to load unlock requests
      </div>
    )
  }

  if (!requests?.length) {
    return (
      <div className="card-game p-8 text-center">
        <AlertTriangle size={28} className="text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">No pending unlock requests</p>
        <p className="text-zinc-700 text-xs mt-1">
          Students who complete all unit quizzes at ≥90% will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req, i) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <RequestCard
            req={req}
            expanded={expandedId === req.id}
            onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
            onAction={handleAction}
          />
        </motion.div>
      ))}

      {/* Action confirmation modal */}
      <AnimatePresence>
        {activeAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveAction(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="card-game p-5 w-full max-w-sm"
            >
              <h3 className="font-display font-bold text-white mb-1 capitalize">
                {activeAction.type === 'retry' ? 'Request Retry' : activeAction.type} Unlock Request
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                {activeAction.type === 'approve'
                  ? 'This will unlock the next unit for the student.'
                  : activeAction.type === 'reject'
                  ? 'The student will be notified and can improve their scores.'
                  : 'The student will be asked to retry certain quizzes.'}
              </p>

              <div className="mb-4">
                <label className="text-zinc-400 text-xs font-medium block mb-1">
                  <MessageSquare size={12} className="inline mr-1" />
                  Message to student (optional)
                </label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a personal note for the student..."
                  rows={3}
                  className="input-field resize-none text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveAction(null)}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={approving || rejecting || retrying}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all
                    ${activeAction.type === 'approve' ? 'bg-success-500 hover:bg-success-600' :
                      activeAction.type === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                      'bg-primary-500 hover:bg-primary-600'}`}
                >
                  {(approving || rejecting || retrying) ? '...' : (
                    activeAction.type === 'approve' ? 'Pass ✓' :
                    activeAction.type === 'reject' ? 'Reject' :
                    'Retry'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  req, expanded, onToggle, onAction,
}: {
  req: UnlockRequest
  expanded: boolean
  onToggle: () => void
  onAction: (id: string, type: 'approve' | 'reject' | 'retry') => void
}) {
  const lowestStars = req.lowestScore >= 90 ? 3 : req.lowestScore >= 70 ? 2 : 1
  const requestedAt = new Date(req.requestedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="card-game border-warning-500/30 bg-warning-500/5 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center font-bold text-white shrink-0">
          {req.studentName?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-sm truncate">{req.studentName ?? req.userId}</p>
            <span className="shrink-0 text-xs bg-warning-500/20 text-warning-400 px-1.5 py-0.5 rounded-full font-medium">
              Pending
            </span>
          </div>
          <p className="text-zinc-500 text-xs truncate">
            <BookOpen size={10} className="inline mr-1" />
            {req.unitTitle ?? req.unitId}
          </p>
          <p className="text-zinc-700 text-xs mt-0.5">Requested {requestedAt}</p>
        </div>

        {/* Lowest score indicator */}
        <div className="text-right shrink-0">
          <p className="font-bold text-success-400 text-sm">{req.lowestScore}%</p>
          <p className="text-zinc-700 text-xs">min score</p>
        </div>

        {expanded ? <ChevronUp size={16} className="text-zinc-500 shrink-0" /> : <ChevronDown size={16} className="text-zinc-500 shrink-0" />}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/50 pt-3">
              {/* Student info */}
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <User size={12} />
                <span>{req.studentEmail ?? '—'}</span>
                {req.totalRetries > 0 && (
                  <span className="ml-2 bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                    {req.totalRetries} retries
                  </span>
                )}
              </div>

              {/* Quiz scores */}
              {req.quizScores && Object.keys(req.quizScores).length > 0 && (
                <div>
                  <p className="text-zinc-500 text-xs font-medium mb-2">Quiz Scores</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(req.quizScores).map(([qid, score]) => (
                      <div key={qid} className={`p-2 rounded-xl text-center border
                        ${score >= 90 ? 'border-success-500/30 bg-success-500/10' : 'border-warning-500/30 bg-warning-500/10'}`}>
                        <p className={`font-bold text-base ${score >= 90 ? 'text-success-400' : 'text-warning-400'}`}>
                          {score}%
                        </p>
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {[1,2,3].map(s => (
                            <Star key={s} size={8}
                              className={s <= (score >= 90 ? 3 : score >= 70 ? 2 : 1)
                                ? 'text-warning-400 fill-warning-400'
                                : 'text-zinc-700'} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onAction(req.id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success-500/20 text-success-400 border border-success-500/30 text-sm font-bold hover:bg-success-500/30 transition-colors"
                >
                  <CheckCircle size={15} /> Pass
                </button>
                <button
                  onClick={() => onAction(req.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-bold hover:bg-red-500/30 transition-colors"
                >
                  <XCircle size={15} /> Reject
                </button>
                <button
                  onClick={() => onAction(req.id, 'retry')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 text-sm font-bold hover:bg-primary-500/30 transition-colors"
                >
                  <RotateCcw size={15} /> Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
