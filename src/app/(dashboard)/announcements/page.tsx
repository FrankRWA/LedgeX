'use client'

import { useState, useMemo } from 'react'
import { useApp, formatRWF } from '@/lib/store'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { Announcement } from '@/lib/types'
import { Megaphone, Plus, Trash2, Pin, PinOff, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { format, parseISO } from 'date-fns'

export default function AnnouncementsPage() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [expanded, setExpanded] = useState<string | null>(state.announcements[0]?.id ?? null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const sorted = useMemo(
    () =>
      [...state.announcements].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.publishedAt.localeCompare(a.publishedAt)
      }),
    [state.announcements]
  )

  function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ msg: 'Title and content are required', type: 'error' })
      return
    }
    dispatch({
      type: 'ADD_ANNOUNCEMENT',
      payload: { id: uuidv4(), title: form.title.trim(), content: form.content.trim(), publishedAt: new Date().toISOString(), pinned: false },
    })
    setForm({ title: '', content: '' })
    setShowForm(false)
    setToast({ msg: 'Announcement published', type: 'success' })
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: id })
    setDeleteConfirm(null)
    if (expanded === id) setExpanded(null)
    setToast({ msg: 'Announcement deleted', type: 'success' })
  }

  function commentsFor(id: string) {
    return state.announcementComments.filter((c) => c.announcementId === id)
  }

  function getMemberName(id: string) {
    return state.members.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">{state.announcements.length} published</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((ann) => {
          const comments = commentsFor(ann.id)
          const isExpanded = expanded === ann.id
          return (
            <div key={ann.id} className={`bg-white rounded-xl border overflow-hidden ${ann.pinned ? 'border-blue-200' : 'border-gray-100'}`}>
              {/* Header row */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : ann.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ann.pinned ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Megaphone className={`w-4 h-4 ${ann.pinned ? 'text-blue-700' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{ann.title}</p>
                    {ann.pinned && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Pinned</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {format(parseISO(ann.publishedAt), 'dd MMM yyyy · HH:mm')} ·{' '}
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {comments.length} comment{comments.length !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'PIN_ANNOUNCEMENT', payload: ann.id }) }}
                    className={`p-1.5 rounded-lg transition-colors ${ann.pinned ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title={ann.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    {ann.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(ann.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <p className="text-gray-700 text-sm leading-relaxed pt-4 whitespace-pre-wrap">{ann.content}</p>

                  {/* Comments */}
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Member Comments ({comments.length})
                    </p>
                    {comments.length === 0 ? (
                      <p className="text-gray-400 text-sm">No comments yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 text-xs font-bold">
                                {getMemberName(c.memberId).split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                              <p className="text-xs font-semibold text-gray-700">{getMemberName(c.memberId)}</p>
                              <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                              <p className="text-xs text-gray-400 mt-1">{format(parseISO(c.date), 'dd MMM · HH:mm')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No announcements yet. Publish your first one.</p>
          </div>
        )}
      </div>

      {/* Publish modal */}
      {showForm && (
        <Modal title="New Announcement" onClose={() => setShowForm(false)} size="lg">
          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Monthly meeting — June 2024"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the announcement details here..."
                rows={6}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium">Publish</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Announcement" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-gray-600 mb-6">This will also delete all member comments on this announcement.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium">Delete</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
