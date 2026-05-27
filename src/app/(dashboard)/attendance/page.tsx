'use client'

import { useState, useMemo } from 'react'
import { useApp, formatRWF } from '@/lib/store'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { CalendarCheck, Plus, Trash2, Users, CheckSquare, Square } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { format, parseISO } from 'date-fns'

export default function AttendancePage() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' })
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(
    state.meetings[0]?.id ?? null
  )
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const sorted = useMemo(
    () => [...state.meetings].sort((a, b) => b.date.localeCompare(a.date)),
    [state.meetings]
  )

  const activeMeeting = useMemo(
    () => sorted.find((m) => m.id === selectedMeeting) ?? null,
    [sorted, selectedMeeting]
  )

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setToast({ msg: 'Meeting title is required', type: 'error' })
      return
    }
    const id = uuidv4()
    dispatch({
      type: 'ADD_MEETING',
      payload: { id, title: form.title.trim(), date: form.date, description: form.description || undefined, attendees: [] },
    })
    setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' })
    setShowForm(false)
    setSelectedMeeting(id)
    setToast({ msg: 'Meeting created', type: 'success' })
  }

  function toggleAttendee(memberId: string) {
    if (!activeMeeting) return
    const isPresent = activeMeeting.attendees.includes(memberId)
    dispatch({
      type: 'UPDATE_MEETING',
      payload: {
        ...activeMeeting,
        attendees: isPresent
          ? activeMeeting.attendees.filter((id) => id !== memberId)
          : [...activeMeeting.attendees, memberId],
      },
    })
  }

  function markAll(present: boolean) {
    if (!activeMeeting) return
    dispatch({
      type: 'UPDATE_MEETING',
      payload: { ...activeMeeting, attendees: present ? state.members.map((m) => m.id) : [] },
    })
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_MEETING', payload: id })
    setDeleteConfirm(null)
    setSelectedMeeting(sorted.find((m) => m.id !== id)?.id ?? null)
    setToast({ msg: 'Meeting deleted', type: 'success' })
  }

  const absenceCount = activeMeeting ? state.members.length - activeMeeting.attendees.length : 0
  const totalFine = absenceCount * state.fineSettings.missedAttendanceFine

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">{state.meetings.length} meetings recorded</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Meeting list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Meetings</p>
          {sorted.map((m) => {
            const pct = state.members.length > 0 ? (m.attendees.length / state.members.length) * 100 : 0
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMeeting(m.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selectedMeeting === m.id ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-900 text-sm">{m.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{format(parseISO(m.date), 'dd MMM yyyy')}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{m.attendees.length}/{state.members.length}</span>
                </div>
              </button>
            )
          })}
          {sorted.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No meetings yet</p>
          )}
        </div>

        {/* Attendance sheet */}
        {activeMeeting ? (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">{activeMeeting.title}</h2>
                <p className="text-gray-500 text-sm">{format(parseISO(activeMeeting.date), 'EEEE, dd MMMM yyyy')}</p>
                {activeMeeting.description && (
                  <p className="text-gray-400 text-sm mt-1">{activeMeeting.description}</p>
                )}
              </div>
              <button
                onClick={() => setDeleteConfirm(activeMeeting.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{activeMeeting.attendees.length}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{absenceCount}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-orange-700">{formatRWF(totalFine)}</p>
                <p className="text-xs text-gray-500">Total fines</p>
              </div>
            </div>

            {/* Mark all buttons */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => markAll(true)} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors">
                Mark all present
              </button>
              <button onClick={() => markAll(false)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                Clear all
              </button>
            </div>

            {/* Member list */}
            <div className="space-y-1">
              {state.members.map((m) => {
                const present = activeMeeting.attendees.includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleAttendee(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      present ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    {present ? (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className={`font-medium text-sm ${present ? 'text-green-900' : 'text-gray-700'}`}>
                        {m.name}
                      </span>
                      <span className="text-gray-400 text-xs ml-2 capitalize">{m.role}</span>
                    </div>
                    {!present && (
                      <span className="text-xs text-orange-600 font-medium">
                        Fine: {formatRWF(state.fineSettings.missedAttendanceFine)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-12 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Select a meeting to record attendance</p>
            </div>
          </div>
        )}
      </div>

      {/* Create meeting modal */}
      {showForm && (
        <Modal title="Create Meeting" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. May General Meeting"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agenda / Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional meeting agenda..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Meeting" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-gray-600 mb-6">This will permanently delete the meeting and its attendance record.</p>
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
