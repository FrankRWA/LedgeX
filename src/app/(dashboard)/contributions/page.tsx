'use client'

import { useState, useMemo } from 'react'
import { useApp, formatRWF } from '@/lib/store'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { Plus, Trash2, TrendingUp, ArrowDownCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { format, parseISO } from 'date-fns'

function emptyForm() {
  return { memberId: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' }
}

export default function ContributionsPage() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterMember, setFilterMember] = useState('')

  const totalSavings = useMemo(
    () => state.contributions.reduce((s, c) => s + c.amount, 0),
    [state.contributions]
  )

  const sorted = useMemo(
    () =>
      [...state.contributions]
        .filter((c) => !filterMember || c.memberId === filterMember)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.contributions, filterMember]
  )

  function getMemberName(id: string) {
    return state.members.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.memberId) {
      setToast({ msg: 'Select a member', type: 'error' })
      return
    }
    if (!amount || amount <= 0) {
      setToast({ msg: 'Enter a valid amount', type: 'error' })
      return
    }
    dispatch({
      type: 'ADD_CONTRIBUTION',
      payload: { id: uuidv4(), memberId: form.memberId, amount, date: form.date, notes: form.notes || undefined },
    })
    setToast({ msg: 'Contribution recorded', type: 'success' })
    setShowForm(false)
    setForm(emptyForm())
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_CONTRIBUTION', payload: id })
    setDeleteConfirm(null)
    setToast({ msg: 'Contribution deleted', type: 'success' })
  }

  // Per-member totals for the summary
  const memberTotals = useMemo(() => {
    const map: Record<string, number> = {}
    state.contributions.forEach((c) => {
      map[c.memberId] = (map[c.memberId] || 0) + c.amount
    })
    return Object.entries(map)
      .map(([id, total]) => ({ id, name: getMemberName(id), total }))
      .sort((a, b) => b.total - a.total)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contributions, state.members])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
          <p className="text-gray-500 mt-1">
            {state.contributions.length} records — Total: {formatRWF(totalSavings)}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Contribution
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contribution history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter */}
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="">All members</option>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <ArrowDownCircle className="w-4 h-4 text-green-700" />
                        </div>
                        <span className="font-medium text-gray-900">{getMemberName(c.memberId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {formatRWF(c.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {format(parseISO(c.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{c.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteConfirm(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      No contributions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member totals */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Member Totals
          </h2>
          <div className="space-y-3">
            {memberTotals.map(({ id, name, total }) => {
              const pct = totalSavings > 0 ? (total / totalSavings) * 100 : 0
              return (
                <div key={id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 truncate max-w-[140px]">{name}</span>
                    <span className="text-green-700 font-semibold">{formatRWF(total)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-bold text-green-700">{formatRWF(totalSavings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Record contribution modal */}
      {showForm && (
        <Modal title="Record Contribution" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select member...</option>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="50000"
                min="1"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. March monthly contribution"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium"
              >
                Record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Delete Contribution" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-gray-600 mb-6">Are you sure you want to delete this contribution record?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
