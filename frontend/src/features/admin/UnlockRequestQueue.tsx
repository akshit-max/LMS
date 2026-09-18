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
        {[1, 2].map(i => <div key={i} className="bg-slate-100 h-24 animate-pulse rounded-2xl" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-center text-rose-600 text-xs font-bold">
        Failed to load unlock requests
      </div>
    )
  }

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-2xl shadow-2xs">
          📋
        </div>
        <div>
          <p className="font-display font-black text-slate-900 text-base">No pending unlock requests</p>
          <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm mx-auto">
            Students who complete all unit quizzes at &ge;90% will appear here for verification.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-left">
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setActiveAction(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border-2 border-slate-200 p-6 rounded-3xl w-full max-w-sm shadow-2xl text-slate-900"
            >
              <h3 className="font-display font-black text-slate-900 text-lg mb-1 capitalize">
                {activeAction.type === 'retry' ? 'Request Retry' : activeAction.type} Unlock Request
              </h3>
              <p className="text-slate-500 text-xs font-semibold mb-4">
                {activeAction.type === 'approve'
                  ? 'This will unlock the next unit for the student.'
                  : activeAction.type === 'reject'
                  ? 'The student will be notified and can improve their scores.'
                  : 'The student will be asked to retry certain quizzes.'}
              </p>

              <div className="mb-4">
                <label className="text-slate-700 text-xs font-black block mb-1">
                  <MessageSquare size={12} className="inline mr-1 text-slate-500" />
                  Message to student (optional)
                </label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a personal note for the student..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 font-medium resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveAction(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={approving || rejecting || retrying}
                  className={`flex-1 py-2.5 rounded-2xl font-black text-xs text-white transition-all shadow-md cursor-pointer
                    ${activeAction.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' :
                      activeAction.type === 'reject' ? 'bg-rose-500 hover:bg-rose-600' :
                      'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {(approving || rejecting || retrying) ? 'Processing...' : (
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
  const requestedAt = new Date(req.requestedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="bg-white border border-amber-200/90 rounded-3xl overflow-hidden shadow-xs">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-amber-50/50 transition-colors"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-600/20 border border-amber-200 flex items-center justify-center font-black text-slate-900 shrink-0">
          {req.studentName?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-slate-900 text-xs sm:text-sm truncate">{req.studentName ?? req.userId}</p>
            <span className="shrink-0 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-black">
              Pending
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold truncate">
            <BookOpen size={10} className="inline mr-1" />
            {req.unitTitle ?? req.unitId}
          </p>
          <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Requested {requestedAt}</p>
        </div>

        {/* Lowest score indicator */}
        <div className="text-right shrink-0">
          <p className="font-black text-emerald-600 text-sm sm:text-base">{req.lowestScore}%</p>
          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">min score</p>
        </div>

        {expanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
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
            <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3 bg-slate-50/50">
              {/* Student info */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <User size={12} />
                <span>{req.studentEmail ?? '—'}</span>
                {req.totalRetries > 0 && (
                  <span className="ml-2 bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 font-black text-[10px]">
                    {req.totalRetries} retries
                  </span>
                )}
              </div>

              {/* Quiz scores */}
              {req.quizScores && Object.keys(req.quizScores).length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs font-black mb-2">Quiz Scores</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(req.quizScores).map(([qid, score]) => (
                      <div key={qid} className={`p-2.5 rounded-2xl text-center border bg-white
                        ${score >= 90 ? 'border-emerald-200' : 'border-amber-200'}`}>
                        <p className={`font-black text-base ${score >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {score}%
                        </p>
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {[1,2,3].map(s => (
                            <Star key={s} size={10}
                              className={s <= (score >= 90 ? 3 : score >= 70 ? 2 : 1)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'} />
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <CheckCircle size={15} /> Pass
                </button>
                <button
                  onClick={() => onAction(req.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <XCircle size={15} /> Reject
                </button>
                <button
                  onClick={() => onAction(req.id, 'retry')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
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
