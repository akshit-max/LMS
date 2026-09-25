/**
 * AdminCMS.tsx — Full Curriculum Management System for GrammoQuest Admins
 * Architecture: Unit → Chapter → Quiz → Questions
 * All routes use /api/v1/admin/cms/* (admin RBAC enforced on backend)
 */

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, ChevronRight, Edit3, Archive, BookOpen, FileText,
  Video, HelpCircle, CheckCircle2, Layers, X, Trash2,
  Upload, ArrowLeft, RefreshCw, Star, Check, GripVertical, Eye
} from 'lucide-react'
import { Reorder } from 'framer-motion'
import api from '@/lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ContentStatus = 'draft' | 'published' | 'archived' | ''

interface CMSUnit {
  id: string; title: string; description: string; order: number
  chapterCount: number; status: ContentStatus; isActive: boolean
  createdBy: string; createdAt: string
}

interface CMSChapter {
  id: string; unitId: string; title: string; description: string
  order: number; status: ContentStatus; isActive: boolean
  quizId: string; lessonVideoUrl: string; pdfUrl: string; createdAt: string
}

interface CMSQuiz {
  id: string; chapterId: string; unitId: string; title: string
  description: string; questionIds: string[]; passingScore: number
  status: ContentStatus; isActive: boolean
}

interface CMSQuestion {
  id: string; quizId: string; chapterId: string; unitId: string
  type: string; text: string; options: string[]; correctAnswer: string
  explanation: string; difficulty: string; grammarTopic: string
  order: number; status: 'active' | 'archived'; approvalStatus: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    published: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Published' },
    draft:     { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Draft' },
    archived:  { color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Archived' },
    active:    { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
    '':        { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Published' },
  }
  const c = cfg[status] ?? cfg['draft']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.color}`}>
      {c.label}
    </span>
  )
}

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  document.querySelectorAll('.cms-toast').forEach(e => e.remove())
  const el = document.createElement('div')
  el.className = `cms-toast fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold animate-in ${
    type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
  }`
  el.textContent = type === 'success' ? `✓ ${msg}` : `✗ ${msg}`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

function Modal({ open, onClose, title, children, size = 'max-w-2xl' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-3xl shadow-2xl ${size} w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-display font-black text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inp = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium bg-white"
const sel = `${inp} cursor-pointer`

const QTYPES = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'reorder', label: 'Reorder' },
  { value: 'match', label: 'Match' },
  { value: 'odd_one_out', label: 'Odd One Out' },
]

// ─── Navigation State ──────────────────────────────────────────────────────────

type CMSView =
  | { level: 'units' }
  | { level: 'unit'; unitId: string }
  | { level: 'chapter'; chapterId: string; unitId: string }
  | { level: 'quiz'; quizId: string; chapterId: string; unitId: string }

// ─── ROOT: AdminCMS ────────────────────────────────────────────────────────────

export function AdminCMS() {
  const [view, setView] = useState<CMSView>({ level: 'units' })

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {view.level !== 'units' && (
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 flex-wrap">
          <button onClick={() => setView({ level: 'units' })}
            className="hover:text-indigo-600 transition-colors cursor-pointer">All Units</button>

          {'unitId' in view && (
            <>
              <ChevronRight size={12} />
              <button
                onClick={() => {
                  if (view.level === 'unit' || view.level === 'chapter' || view.level === 'quiz') {
                    setView({ level: 'unit', unitId: view.unitId })
                  }
                }}
                className={`transition-colors cursor-pointer ${view.level === 'unit' ? 'text-slate-900' : 'hover:text-indigo-600'}`}>
                Unit
              </button>
            </>
          )}

          {'chapterId' in view && (
            <>
              <ChevronRight size={12} />
              <button
                onClick={() => {
                  if (view.level === 'chapter' || view.level === 'quiz') {
                    setView({ level: 'chapter', chapterId: view.chapterId, unitId: view.unitId })
                  }
                }}
                className={`transition-colors cursor-pointer ${view.level === 'chapter' ? 'text-slate-900' : 'hover:text-indigo-600'}`}>
                Chapter
              </button>
            </>
          )}

          {view.level === 'quiz' && (
            <>
              <ChevronRight size={12} />
              <span className="text-slate-900">Quiz</span>
            </>
          )}
        </nav>

      )}

      {view.level === 'units' && (
        <UnitsView onSelectUnit={id => setView({ level: 'unit', unitId: id })} />
      )}
      {view.level === 'unit' && (
        <UnitDetailView
          unitId={view.unitId}
          onBack={() => setView({ level: 'units' })}
          onSelectChapter={cid => view.level === 'unit' && setView({ level: 'chapter', chapterId: cid, unitId: view.unitId })}
        />
      )}
      {view.level === 'chapter' && (
        <ChapterDetailView
          chapterId={view.chapterId}
          unitId={view.unitId}
          onBack={() => view.level === 'chapter' && setView({ level: 'unit', unitId: view.unitId })}
          onSelectQuiz={qid => view.level === 'chapter' && setView({ level: 'quiz', quizId: qid, chapterId: view.chapterId, unitId: view.unitId })}
        />
      )}
      {view.level === 'quiz' && (
        <QuizDetailView
          quizId={view.quizId}
          onBack={() => view.level === 'quiz' && setView({ level: 'chapter', chapterId: view.chapterId, unitId: view.unitId })}
        />
      )}
    </div>
  )
}

// ─── UNITS VIEW ────────────────────────────────────────────────────────────────

function UnitsView({ onSelectUnit }: { onSelectUnit: (id: string) => void }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editUnit, setEditUnit] = useState<CMSUnit | null>(null)
  const [deleteUnit, setDeleteUnit] = useState<CMSUnit | null>(null)

  const { data: units, isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'units'],
    queryFn: () => api.get<{ units: CMSUnit[] }>('/admin/cms/units').then(r => r.data.units),
  })

  const createMut = useMutation({
    mutationFn: (d: object) => api.post('/admin/cms/units', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'units'] }); setShowCreate(false); showToast('Unit created!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Create failed', 'error'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => api.patch(`/admin/cms/units/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'units'] }); setEditUnit(null); showToast('Unit updated!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Update failed', 'error'),
  })

  const visibleUnits = (units ?? []).filter(u => showArchived || u.status !== 'archived').sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="font-display font-black text-slate-900 text-lg">Curriculum Management</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs text-slate-500 font-semibold">Create and manage Units, Chapters, Quizzes and Questions.</p>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
              <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" />
              Show Archived
            </label>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer">
          <Plus size={14} /> Create Unit
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : !visibleUnits.length ? (
        <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
          <Layers size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">No units found.</p>
          <p className="text-slate-400 text-xs mt-1">Click "Create Unit" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleUnits.map(unit => (
            <div key={unit.id} className={`bg-white border ${unit.status === 'archived' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200/90'} rounded-2xl shadow-xs overflow-hidden`}>
              <div className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl ${unit.status === 'archived' ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'} border flex items-center justify-center text-sm font-black shrink-0`}>
                  {unit.order || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-slate-900 text-sm font-black truncate">{unit.title}</p>
                    <StatusBadge status={unit.status || ''} />
                  </div>
                  <p className="text-slate-500 text-xs truncate">{unit.description || 'No description'}</p>
                  <p className="text-slate-400 text-[10px] font-mono mt-0.5">{unit.chapterCount || 0} chapters</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditUnit(unit)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => setDeleteUnit(unit)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" title="Delete">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => onSelectUnit(unit.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer">
                    Manage <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Unit">
        <UnitForm onSubmit={d => createMut.mutate(d)} loading={createMut.isPending} onCancel={() => setShowCreate(false)} existingCount={units?.length ?? 0} />
      </Modal>
      <Modal open={!!editUnit} onClose={() => setEditUnit(null)} title="Edit Unit">
        {editUnit && <UnitForm initial={editUnit} onSubmit={d => updateMut.mutate({ id: editUnit.id, d })} loading={updateMut.isPending} onCancel={() => setEditUnit(null)} existingCount={units?.length ?? 0} />}
      </Modal>
      <Modal open={!!deleteUnit} onClose={() => setDeleteUnit(null)} title="Delete Unit">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm font-medium">Are you sure you want to delete <strong>{deleteUnit?.title}</strong>? This action will remove it from the curriculum. Historical student data will be preserved.</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { if (deleteUnit) { updateMut.mutate({ id: deleteUnit.id, d: { status: 'archived' } }); setDeleteUnit(null); } }} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">Yes, Delete Unit</button>
            <button onClick={() => setDeleteUnit(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function UnitForm({ initial, onSubmit, loading, onCancel, existingCount }: { initial?: Partial<CMSUnit>; onSubmit: (d: object) => void; loading: boolean; onCancel: () => void; existingCount: number }) {
  const [f, setF] = useState({ title: initial?.title ?? '', description: initial?.description ?? '', order: initial?.order ?? existingCount + 1, status: (initial?.status ?? 'draft').toLowerCase() })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-4">
      <Field label="Title" required><input className={inp} value={f.title} onChange={e => s('title', e.target.value)} placeholder="e.g. The Simple Present Tense" /></Field>
      <Field label="Description"><textarea className={`${inp} resize-none`} rows={3} value={f.description} onChange={e => s('description', e.target.value)} placeholder="What students will learn..." /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Order" required>
          <select className={sel} value={f.order} onChange={e => s('order', Number(e.target.value))}>
            {Array.from({ length: Math.max(1, existingCount + (initial ? 0 : 1)) }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </Field>
        <Field label="Status" required><select className={sel} value={f.status} onChange={e => s('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button disabled={loading || !f.title} onClick={() => onSubmit(f)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">{loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Unit'}</button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}

// ─── UNIT DETAIL VIEW ──────────────────────────────────────────────────────────

function UnitDetailView({ unitId, onBack, onSelectChapter }: { unitId: string; onBack: () => void; onSelectChapter: (id: string) => void }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editChapter, setEditChapter] = useState<CMSChapter | null>(null)
  const [deleteChapter, setDeleteChapter] = useState<CMSChapter | null>(null)

  const { data: unit } = useQuery({
    queryKey: ['admin', 'cms', 'units', unitId],
    queryFn: () => api.get<CMSUnit>(`/admin/cms/units/${unitId}`).then(r => r.data),
  })
  const { data: chapters, isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'units', unitId, 'chapters'],
    queryFn: () => api.get<{ chapters: CMSChapter[] }>(`/admin/cms/units/${unitId}/chapters`).then(r => r.data.chapters),
  })

  const createMut = useMutation({
    mutationFn: (d: object) => api.post(`/admin/cms/units/${unitId}/chapters`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'units'] }); setShowCreate(false); showToast('Chapter created!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => api.patch(`/admin/cms/chapters/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'units'] }); setEditChapter(null); showToast('Chapter updated!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })

  const visibleChapters = (chapters ?? []).filter(c => showArchived || c.status !== 'archived').sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"><ArrowLeft size={16} /></button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display font-black text-slate-900 text-lg">{unit?.title ?? '...'}</h2>
                <StatusBadge status={unit?.status || ''} />
              </div>
              <p className="text-slate-500 text-xs">{unit?.description || 'No description'}</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer shrink-0 transition-colors">
            <Plus size={13} /> Add Chapter
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800">Chapters</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
              <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" />
              Show Archived
            </label>
            <span className="text-xs text-slate-500 font-bold">{visibleChapters.length}</span>
          </div>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : !visibleChapters.length ? (
          <div className="p-10 text-center"><BookOpen size={24} className="text-slate-300 mx-auto mb-2" /><p className="text-slate-500 text-sm font-bold">No chapters yet.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleChapters.map((ch, idx) => (
              <div key={ch.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black shrink-0">{ch.order || idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-slate-800 text-sm font-bold truncate">{ch.title}</p><StatusBadge status={ch.status || ''} /></div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ch.quizId && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 size={9} /> Quiz</span>}
                    {ch.lessonVideoUrl && <span className="text-[10px] text-purple-600 font-bold flex items-center gap-0.5"><Video size={9} /> Video</span>}
                    {ch.pdfUrl && <span className="text-[10px] text-sky-600 font-bold flex items-center gap-0.5"><FileText size={9} /> PDF</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditChapter(ch)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer" title="Edit"><Edit3 size={13} /></button>
                  <button onClick={() => setDeleteChapter(ch)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete"><Trash2 size={13} /></button>
                  <button onClick={() => onSelectChapter(ch.id)} className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 cursor-pointer transition-colors">
                    Manage <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Chapter">
        <ChapterForm onSubmit={d => createMut.mutate(d)} loading={createMut.isPending} onCancel={() => setShowCreate(false)} existingCount={chapters?.length ?? 0} />
      </Modal>
      <Modal open={!!editChapter} onClose={() => setEditChapter(null)} title="Edit Chapter">
        {editChapter && <ChapterForm initial={editChapter} onSubmit={d => updateMut.mutate({ id: editChapter.id, d })} loading={updateMut.isPending} onCancel={() => setEditChapter(null)} existingCount={chapters?.length ?? 0} />}
      </Modal>
      <Modal open={!!deleteChapter} onClose={() => setDeleteChapter(null)} title="Delete Chapter">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm font-medium">Are you sure you want to delete <strong>{deleteChapter?.title}</strong>? This action will remove it from the unit. Historical student data will be preserved.</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { if (deleteChapter) { updateMut.mutate({ id: deleteChapter.id, d: { status: 'archived' } }); setDeleteChapter(null); } }} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">Yes, Delete Chapter</button>
            <button onClick={() => setDeleteChapter(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ChapterForm({ initial, onSubmit, loading, onCancel, existingCount }: { initial?: Partial<CMSChapter>; onSubmit: (d: object) => void; loading: boolean; onCancel: () => void; existingCount: number }) {
  const [f, setF] = useState({ title: initial?.title ?? '', description: initial?.description ?? '', order: initial?.order ?? existingCount + 1, status: (initial?.status ?? 'draft').toLowerCase() })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-4">
      <Field label="Chapter Title" required><input className={inp} value={f.title} onChange={e => s('title', e.target.value)} placeholder="e.g. Simple Past — Affirmative" /></Field>
      <Field label="Description"><textarea className={`${inp} resize-none`} rows={3} value={f.description} onChange={e => s('description', e.target.value)} placeholder="What this chapter covers..." /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Order" required>
          <select className={sel} value={f.order} onChange={e => s('order', Number(e.target.value))}>
            {Array.from({ length: Math.max(1, existingCount + (initial ? 0 : 1)) }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </Field>
        <Field label="Status" required><select className={sel} value={f.status} onChange={e => s('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button disabled={loading || !f.title} onClick={() => onSubmit(f)} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">{loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Chapter'}</button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}

// ─── CHAPTER DETAIL VIEW ───────────────────────────────────────────────────────

function ChapterDetailView({ chapterId, unitId, onBack, onSelectQuiz }: { chapterId: string; unitId: string; onBack: () => void; onSelectQuiz: (id: string) => void }) {
  const qc = useQueryClient()
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [uploadingField, setUploadingField] = useState<'lessonVideoUrl' | 'pdfUrl' | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'chapters', chapterId],
    queryFn: () => api.get<{ chapter: CMSChapter; quiz: CMSQuiz | null }>(`/admin/cms/chapters/${chapterId}`).then(r => r.data),
  })
  const chapter = data?.chapter
  const quiz = data?.quiz

  const createQuiz = useMutation({
    mutationFn: (d: object) => api.post(`/admin/cms/chapters/${chapterId}/quiz`, { ...d, unitId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'chapters', chapterId] }); setShowCreateQuiz(false); showToast('Quiz created!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })
  const updateResources = useMutation({
    mutationFn: (d: object) => api.patch(`/admin/cms/chapters/${chapterId}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'chapters', chapterId] }); setShowResources(false); showToast('Resources updated!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })

  const handleUpload = async (file: File, field: 'lessonVideoUrl' | 'pdfUrl') => {
    setUploadingField(field)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'lessons')
      const res = await api.post<{ url: string }>('/admin/cms/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      await updateResources.mutateAsync({ [field]: res.data.url })
      showToast('File uploaded!')
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Upload failed', 'error')
    } finally { setUploadingField(null) }
  }

  const handleClear = async (field: 'lessonVideoUrl' | 'pdfUrl') => {
    try {
      await updateResources.mutateAsync({ [field]: '' })
      showToast('URL cleared')
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to clear', 'error')
    }
  }

  if (isLoading) return <div className="p-8 text-center"><RefreshCw size={20} className="animate-spin mx-auto text-slate-400" /></div>
  if (!chapter) return <div className="p-8 text-center text-slate-400 text-sm">Chapter not found.</div>

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer mt-0.5 transition-colors"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1"><h2 className="font-display font-black text-slate-900 text-lg">{chapter.title}</h2><StatusBadge status={chapter.status || ''} /></div>
            {chapter.description && <p className="text-slate-500 text-sm">{chapter.description}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resources Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><Layers size={14} className="text-purple-500" /> Lesson Resources</h3>
            <button onClick={() => setShowResources(true)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"><Edit3 size={11} /> Edit URLs</button>
          </div>
          <div className="p-4 space-y-3">
            <ResourceRow icon={<Video size={14} />} label="Video Lesson" url={chapter.lessonVideoUrl} field="lessonVideoUrl" onUpload={handleUpload} onClear={handleClear} uploadingField={uploadingField} />
            <ResourceRow icon={<FileText size={14} />} label="PDF / Grammar Notes" url={chapter.pdfUrl} field="pdfUrl" onUpload={handleUpload} onClear={handleClear} uploadingField={uploadingField} />
          </div>
        </div>

        {/* Quiz Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><HelpCircle size={14} className="text-amber-500" /> Quiz</h3>
          </div>
          <div className="p-4">
            {quiz ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{quiz.title}</p>
                  {quiz.description && <p className="text-xs text-slate-500 mt-0.5">{quiz.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={quiz.status || ''} />
                    <span className="text-[10px] text-slate-500 font-mono">{quiz.questionIds?.length ?? 0} questions</span>
                    <span className="text-[10px] text-slate-500 font-mono">Pass: {quiz.passingScore}%</span>
                  </div>
                </div>
                <button onClick={() => onSelectQuiz(quiz.id)} className="w-full flex items-center justify-center gap-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 cursor-pointer transition-colors">
                  Manage Quiz & Questions <ChevronRight size={12} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-4"><HelpCircle size={24} className="text-slate-300 mx-auto mb-2" /><p className="text-slate-500 text-xs font-bold">No quiz yet.</p></div>
                <button onClick={() => setShowCreateQuiz(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
                  <Plus size={12} /> Create Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showCreateQuiz} onClose={() => setShowCreateQuiz(false)} title="Create Quiz">
        <QuizForm onSubmit={d => createQuiz.mutate(d)} loading={createQuiz.isPending} onCancel={() => setShowCreateQuiz(false)} />
      </Modal>
      <Modal open={showResources} onClose={() => setShowResources(false)} title="Edit Lesson Resources">
        <ResourceForm key={showResources ? 'open' : 'closed'} initial={{ lessonVideoUrl: chapter.lessonVideoUrl, pdfUrl: chapter.pdfUrl }} onSubmit={d => updateResources.mutate(d)} loading={updateResources.isPending} onCancel={() => setShowResources(false)} />
      </Modal>
    </div>
  )
}

function getPreviewUrl(url: string, field: 'lessonVideoUrl' | 'pdfUrl'): string {
  if (!url) return url
  let formattedUrl = url
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl
  }
  // For Cloudinary video URLs, inject fl_inline transformation to force browser playback
  if (field === 'lessonVideoUrl' && formattedUrl.includes('res.cloudinary.com')) {
    return formattedUrl.replace('/upload/', '/upload/fl_inline/')
  }
  return formattedUrl
}

/** Convert any Google Drive sharing URL to an embeddable preview URL */
function toEmbedUrl(url: string): string | null {
  if (!url) return null
  // Google Drive: https://drive.google.com/file/d/{ID}/view?... → /preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  // YouTube: various formats → embed URL
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\.\w-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  return null
}

function ResourceRow({ icon, label, url, field, onUpload, onClear, uploadingField }: { icon: React.ReactNode; label: string; url: string; field: 'lessonVideoUrl' | 'pdfUrl'; onUpload: (f: File, field: 'lessonVideoUrl' | 'pdfUrl') => void; onClear: (field: 'lessonVideoUrl' | 'pdfUrl') => void; uploadingField: 'lessonVideoUrl' | 'pdfUrl' | null }) {
  const ref = useRef<HTMLInputElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const previewUrl = getPreviewUrl(url, field)
  const isVideo = field === 'lessonVideoUrl'
  const isUploading = uploadingField === field
  const anyUploading = uploadingField !== null

  let embedUrl: string | null = null
  if (isVideo && url) {
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
      } else {
        // Try Google Drive / YouTube conversion
        embedUrl = toEmbedUrl(url)
      }
    } catch(e) {}
  }

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700">{label}</p>
          {url ? (
            <button onClick={() => setShowPreview(true)} className="text-[10px] text-indigo-600 hover:underline truncate block cursor-pointer text-left w-full">
              {url.length > 40 ? url.slice(0, 40) + '...' : url}
            </button>
          ) : (
            <p className="text-[10px] text-slate-400">Not set</p>
          )}
        </div>
        <input ref={ref} type="file" className="hidden" accept={isVideo ? 'video/*' : 'application/pdf'} onChange={e => { if (e.target.files?.[0]) { onUpload(e.target.files[0], field); e.target.value = '' } }} />
        
        <div className="flex items-center gap-2 shrink-0">
          {url && (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all shrink-0 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border-slate-200 hover:border-indigo-200"
              title={isVideo ? 'Preview Video' : 'Preview PDF'}
            >
              <Eye size={11} /> Preview
            </button>
          )}
          {url && (
            <button
              onClick={() => onClear(field)}
              disabled={anyUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all shrink-0 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear URL"
            >
              <X size={11} /> Clear
            </button>
          )}
          <button
            onClick={() => ref.current?.click()}
            disabled={anyUploading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all shrink-0 ${
              isUploading
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 cursor-wait'
                : 'bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border-slate-200 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title={isVideo ? 'Upload Video' : 'Upload PDF'}
          >
            {isUploading
              ? <><RefreshCw size={11} className="animate-spin" /> Uploading…</>
              : <><Upload size={11} /> Upload</>
            }
          </button>
        </div>
      </div>

      <Modal open={showPreview} onClose={() => setShowPreview(false)} title={isVideo ? 'Video Preview' : 'PDF Preview'} size="max-w-5xl">
        <div className={`w-full ${isVideo ? 'aspect-video' : 'h-[75vh]'} rounded-xl overflow-hidden bg-black/5 flex flex-col items-center justify-center`}>
          {isVideo && embedUrl ? (
            <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen frameBorder="0"></iframe>
          ) : isVideo && !embedUrl ? (
            // Fallback: direct URL in iframe (e.g. self-hosted video)
            <iframe src={previewUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen frameBorder="0"></iframe>
          ) : !isVideo && url ? (
            // Direct embed — works natively in Chrome/Edge for publicly accessible PDFs
            <embed src={previewUrl} type="application/pdf" className="w-full h-full" />
          ) : null}
        </div>
        {!isVideo && url && (
          <div className="pt-4 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-400">If the preview doesn't load, open the file directly:</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors"
            >
              <Eye size={14} /> Open PDF in New Tab
            </a>
          </div>
        )}
      </Modal>
    </>
  )
}

function ResourceForm({ initial, onSubmit, loading, onCancel }: { initial: { lessonVideoUrl: string; pdfUrl: string }; onSubmit: (d: object) => void; loading: boolean; onCancel: () => void }) {
  const [f, setF] = useState(initial)
  return (
    <div className="space-y-4">
      <Field label="Video URL"><input className={inp} value={f.lessonVideoUrl} onChange={e => setF(p => ({ ...p, lessonVideoUrl: e.target.value }))} placeholder="https://..." /></Field>
      <Field label="PDF / Notes URL"><input className={inp} value={f.pdfUrl} onChange={e => setF(p => ({ ...p, pdfUrl: e.target.value }))} placeholder="https://..." /></Field>
      <div className="flex gap-3 pt-2">
        <button disabled={loading} onClick={() => onSubmit(f)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">{loading ? 'Saving...' : 'Save'}</button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}

function QuizForm({ initial, onSubmit, loading, onCancel }: { initial?: Partial<CMSQuiz>; onSubmit: (d: object) => void; loading: boolean; onCancel: () => void }) {
  const [f, setF] = useState({ title: initial?.title ?? '', description: initial?.description ?? '', passingScore: initial?.passingScore ?? 90, status: (initial?.status ?? 'draft').toLowerCase() })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-4">
      <Field label="Quiz Title" required><input className={inp} value={f.title} onChange={e => s('title', e.target.value)} placeholder="e.g. Past Tense Basics" /></Field>
      <Field label="Description"><textarea className={`${inp} resize-none`} rows={2} value={f.description} onChange={e => s('description', e.target.value)} placeholder="Brief description..." /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Passing Score (%)" required><input className={inp} type="number" min={1} max={100} value={f.passingScore} onChange={e => s('passingScore', Number(e.target.value))} /></Field>
        <Field label="Status" required><select className={sel} value={f.status} onChange={e => s('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
        ⚠️ Default passing score is 90%. The ≥90% mastery rule for progression applies.
      </div>
      <div className="flex gap-3 pt-2">
        <button disabled={loading || !f.title} onClick={() => onSubmit(f)} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">{loading ? 'Creating...' : initial?.id ? 'Save Changes' : 'Create Quiz'}</button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}

// ─── QUIZ DETAIL VIEW ──────────────────────────────────────────────────────────

function QuizDetailView({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [showCreateQ, setShowCreateQ] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editQ, setEditQ] = useState<CMSQuestion | null>(null)
  const [deleteQ, setDeleteQ] = useState<CMSQuestion | null>(null)
  const [showEditQuiz, setShowEditQuiz] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'quizzes', quizId],
    queryFn: () => api.get<{ quiz: CMSQuiz; questions: CMSQuestion[] }>(`/admin/cms/quizzes/${quizId}`).then(r => r.data),
  })
  const quiz = data?.quiz
  const allQuestions = (data?.questions ?? []).sort((a, b) => (a.order || 0) - (b.order || 0))
  const visibleQuestions = allQuestions.filter(q => showArchived || q.status !== 'archived')
  const [localQuestions, setLocalQuestions] = useState<CMSQuestion[]>([])

  useEffect(() => {
    setLocalQuestions(visibleQuestions)
  }, [data?.questions, showArchived])

  const updateQuiz = useMutation({
    mutationFn: (d: object) => api.patch(`/admin/cms/quizzes/${quizId}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'quizzes', quizId] }); setShowEditQuiz(false); showToast('Quiz updated!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })
  const reorderQ = useMutation({
    mutationFn: async (newOrder: CMSQuestion[]) => {
      await Promise.all(newOrder.map((q, idx) => {
        if (q.order !== idx + 1) return api.patch(`/admin/cms/questions/${q.id}`, { order: idx + 1 })
      }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cms', 'quizzes', quizId] })
  })
  const handleReorder = (newOrder: CMSQuestion[]) => {
    setLocalQuestions(newOrder)
    reorderQ.mutate(newOrder)
  }
  const createQ = useMutation({
    mutationFn: (d: object) => api.post(`/admin/cms/quizzes/${quizId}/questions`, { ...d, chapterId: quiz?.chapterId ?? '', unitId: quiz?.unitId ?? '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'quizzes', quizId] }); setShowCreateQ(false); showToast('Question created!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })
  const updateQ = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => api.patch(`/admin/cms/questions/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'quizzes', quizId] }); setEditQ(null); showToast('Question updated!') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })
  const archiveQ = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/cms/questions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'quizzes', quizId] }); showToast('Question archived. Historical attempts preserved.') },
    onError: (e: any) => showToast(e?.response?.data?.error || 'Failed', 'error'),
  })

  if (isLoading) return <div className="p-8 text-center"><RefreshCw size={20} className="animate-spin mx-auto text-slate-400" /></div>
  if (!quiz) return <div className="p-8 text-center text-slate-400 text-sm">Quiz not found.</div>

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer mt-0.5 transition-colors"><ArrowLeft size={16} /></button>
            <div>
              <div className="flex items-center gap-2 mb-1"><h2 className="font-display font-black text-slate-900 text-lg">{quiz.title}</h2><StatusBadge status={quiz.status || ''} /></div>
              {quiz.description && <p className="text-slate-500 text-sm mb-1">{quiz.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Star size={10} /> {quiz.passingScore}% to pass</span>
                <span className="flex items-center gap-1"><HelpCircle size={10} /> {allQuestions.length} questions</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowEditQuiz(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"><Edit3 size={12} /> Edit</button>
            <button onClick={() => setShowCreateQ(true)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"><Plus size={12} /> Add Question</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800">Questions</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
              <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer" />
              Show Archived
            </label>
            <span className="text-xs text-slate-500 font-bold">{visibleQuestions.length} active</span>
          </div>
        </div>
        {!localQuestions.length ? (
          <div className="p-10 text-center"><HelpCircle size={24} className="text-slate-300 mx-auto mb-2" /><p className="text-slate-500 text-sm font-bold">No questions yet.</p><p className="text-slate-400 text-xs mt-1">Click "Add Question" to create one.</p></div>
        ) : (
          <Reorder.Group axis="y" values={localQuestions} onReorder={handleReorder} className="divide-y divide-slate-100">
            {localQuestions.map((q, idx) => (
              <Reorder.Item key={q.id} value={q} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors bg-white relative">
                <div className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-1.5 rounded-lg border border-transparent hover:border-indigo-100 transition-colors shrink-0" title="Drag to reorder"><GripVertical size={18} /></div>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-bold leading-snug">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{q.type}</span>
                    {q.correctAnswer && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 size={9} /> {q.correctAnswer}</span>}
                  </div>
                  {q.options?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.options.map((opt, oi) => (
                        <span key={oi} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${opt === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditQ(q)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer" title="Edit"><Edit3 size={13} /></button>
                  <button onClick={() => setDeleteQ(q)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete"><Trash2 size={13} /></button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <Modal open={showCreateQ} onClose={() => setShowCreateQ(false)} title="Add Question">
        <QuestionForm questionCount={allQuestions.length} onSubmit={d => createQ.mutate(d)} loading={createQ.isPending} onCancel={() => setShowCreateQ(false)} />
      </Modal>
      <Modal open={!!editQ} onClose={() => setEditQ(null)} title="Edit Question">
        {editQ && <QuestionForm initial={editQ} questionCount={allQuestions.length} onSubmit={d => updateQ.mutate({ id: editQ.id, d })} loading={updateQ.isPending} onCancel={() => setEditQ(null)} />}
      </Modal>
      <Modal open={!!deleteQ} onClose={() => setDeleteQ(null)} title="Delete Question">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm font-medium">Are you sure you want to delete this question? It will be removed from the quiz.</p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 truncate">
            "{deleteQ?.text}"
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { if (deleteQ) { archiveQ.mutate(deleteQ.id); setDeleteQ(null); } }} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">Yes, Delete</button>
            <button onClick={() => setDeleteQ(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
          </div>
        </div>
      </Modal>
      <Modal open={showEditQuiz} onClose={() => setShowEditQuiz(false)} title="Edit Quiz">
        <QuizForm initial={quiz} onSubmit={d => updateQuiz.mutate(d)} loading={updateQuiz.isPending} onCancel={() => setShowEditQuiz(false)} />
      </Modal>
    </div>
  )
}

// ─── QUESTION FORM ──────────────────────────────────────────────────────────────

function QuestionForm({ initial, questionCount, onSubmit, loading, onCancel }: { initial?: Partial<CMSQuestion>; questionCount: number; onSubmit: (d: object) => void; loading: boolean; onCancel: () => void }) {
  const [f, setF] = useState({
    type: initial?.type ?? 'mcq', text: initial?.text ?? '',
    options: initial?.options ?? ['', '', '', ''], correctAnswer: initial?.correctAnswer ?? '',
    explanation: initial?.explanation ?? '', difficulty: initial?.difficulty ?? 'medium',
    grammarTopic: initial?.grammarTopic ?? '', order: initial?.order ?? questionCount + 1,
    status: (initial?.status ?? 'active').toLowerCase(),
  })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const setOpt = (i: number, v: string) => setF(p => { const o = [...p.options]; o[i] = v; return { ...p, options: o } })
  const addOpt = () => setF(p => ({ ...p, options: [...p.options, ''] }))
  const rmOpt = (i: number) => setF(p => ({ ...p, options: p.options.filter((_, oi) => oi !== i) }))

  const showOpts = ['mcq', 'fill_blank', 'reorder', 'odd_one_out', 'match'].includes(f.type)
  const isTF = f.type === 'true_false'
  const isAutoAns = ['reorder', 'match'].includes(f.type)
  const isSelectAns = ['mcq', 'fill_blank', 'odd_one_out'].includes(f.type)

  const handleSubmit = () => {
    let validOpts = f.options.filter(o => o.trim())
    let finalAnswer = f.correctAnswer

    if (f.type === 'true_false') {
      validOpts = ['True', 'False']
    }

    if (f.type === 'reorder') {
      finalAnswer = validOpts.join('|')
    } else if (f.type === 'match') {
      const half = Math.floor(validOpts.length / 2)
      const pairs = validOpts.slice(0, half).map((l, i) => `${l}→${validOpts[half + i]}`)
      pairs.sort((a, b) => a.split('→')[0].localeCompare(b.split('→')[0]))
      finalAnswer = pairs.join('|')
    }

    onSubmit({ ...f, options: validOpts, correctAnswer: finalAnswer })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Question Type" required>
          <select className={sel} value={f.type} onChange={e => {
            const newType = e.target.value;
            setF(p => {
              const o = [...p.options];
              if (newType === 'match' && o.length % 2 !== 0) o.push('');
              return { ...p, type: newType, options: o };
            })
          }}>{QTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          <div className="mt-1.5 text-[10px] text-slate-500 font-medium leading-tight">
            {f.type === 'reorder' && <><span className="text-amber-600 font-bold">💡 Note:</span> Add options in the correct sequence. The system will auto-shuffle them for the student.</>}
            {f.type === 'match' && <><span className="text-amber-600 font-bold">💡 Note:</span> Enter matching pairs side-by-side. The system will shuffle the right-side options for the student.</>}
            {isSelectAns && <><span className="text-amber-600 font-bold">💡 Note:</span> Add options below, then pick the correct one from the dropdown.</>}
            {f.type === 'fill_blank' && <><span className="text-amber-600 font-bold">💡 Note:</span> Use underscores (___) in the Question Text where the blank should be.</>}
          </div>
        </Field>
        <Field label="Difficulty">
          <select className={sel} value={f.difficulty} onChange={e => s('difficulty', e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        </Field>
        <Field label="Status">
          <select className={sel} value={f.status} onChange={e => s('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>
      <Field label="Question Text" required>
        <textarea className={`${inp} resize-none`} rows={3} value={f.text} onChange={e => s('text', e.target.value)} placeholder='e.g. "Yesterday, I _____ to the park."' />
      </Field>
      {isTF && (
        <Field label="Correct Answer" required>
          <select className={sel} value={f.correctAnswer} onChange={e => s('correctAnswer', e.target.value)}><option value="">Select...</option><option value="True">True</option><option value="False">False</option></select>
        </Field>
      )}
      {showOpts && f.type !== 'match' && (
        <Field label="Options" required>
          <div className="space-y-2">
            {f.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inp} flex-1`} value={opt} onChange={e => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                <button onClick={() => rmOpt(i)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 cursor-pointer shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={addOpt} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"><Plus size={12} /> Add option</button>
          </div>
        </Field>
      )}
      {f.type === 'match' && (
        <Field label="Matching Pairs" required>
          <div className="space-y-2">
            {Array.from({ length: Math.max(1, Math.floor(f.options.length / 2)) }).map((_, i) => {
              const half = Math.floor(f.options.length / 2);
              return (
                <div key={i} className="flex items-center gap-3">
                  <input className={`${inp} flex-1`} value={f.options[i] || ''} onChange={e => setOpt(i, e.target.value)} placeholder={`Left Item ${i + 1}`} />
                  <span className="text-slate-300 font-black">&rarr;</span>
                  <input className={`${inp} flex-1`} value={f.options[half + i] || ''} onChange={e => setOpt(half + i, e.target.value)} placeholder={`Right Match ${i + 1}`} />
                  <button onClick={() => setF(p => {
                    if (p.options.length <= 2) return p;
                    const h = Math.floor(p.options.length / 2);
                    const o = [...p.options];
                    o.splice(h + i, 1);
                    o.splice(i, 1);
                    return { ...p, options: o };
                  })} className="p-2 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 cursor-pointer shrink-0"><Trash2 size={13} /></button>
                </div>
              )
            })}
            <button onClick={() => setF(p => {
              const h = Math.floor(p.options.length / 2);
              const o = [...p.options];
              o.splice(h, 0, ''); 
              o.push(''); 
              return { ...p, options: o };
            })} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"><Plus size={12} /> Add pair</button>
          </div>
        </Field>
      )}
      {!isTF && (
        <Field label="Correct Answer" required={!isAutoAns}>
          {isSelectAns ? (
            <select className={sel} value={f.correctAnswer} onChange={e => s('correctAnswer', e.target.value)}>
              <option value="">Select the correct option...</option>
              {f.options.filter(o => o.trim()).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : isAutoAns ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Auto-generated from your options
            </div>
          ) : (
            <input className={inp} value={f.correctAnswer} onChange={e => s('correctAnswer', e.target.value)} placeholder="Type the correct answer" />
          )}
        </Field>
      )}
      <Field label="Explanation">
        <textarea className={`${inp} resize-none`} rows={2} value={f.explanation} onChange={e => s('explanation', e.target.value)} placeholder="Why is this the correct answer?" />
      </Field>
      <Field label="Grammar Topic"><input className={inp} value={f.grammarTopic} onChange={e => s('grammarTopic', e.target.value)} placeholder="e.g. Simple Past" /></Field>
      <div className="flex gap-3 pt-2">
        <button disabled={loading || !f.text || (!f.correctAnswer && !isAutoAns) || !f.type} onClick={handleSubmit}
          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Question'}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}
