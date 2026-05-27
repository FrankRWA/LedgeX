'use client'

import { useState, useMemo } from 'react'
import { useApp, formatRWF } from '@/lib/store'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { BarChart3, Plus, Trash2, Printer, TrendingUp, CreditCard, Wallet, AlertTriangle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { format, parseISO } from 'date-fns'

export default function PublishedReportsPage() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Auto-compute current snapshot for publishing
  const snapshot = useMemo(() => {
    const totalSavings = state.contributions.reduce((s, c) => s + c.amount, 0)
    const totalLoansIssued = state.loans.reduce((s, l) => s + l.amount, 0)
    const overdueAmount = state.loans.filter((l) => l.status === 'overdue').reduce((s, l) => s + l.balance, 0)
    const totalRepaid = state.repayments.reduce((s, r) => s + r.amount, 0)
    const cashPosition = totalSavings + totalRepaid - totalLoansIssued
    return { totalSavings, totalLoansIssued, overdueAmount, cashPosition }
  }, [state])

  const [form, setForm] = useState({
    title: '',
    period: '',
    notes: '',
  })

  function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.period.trim()) {
      setToast({ msg: 'Title and period are required', type: 'error' })
      return
    }
    dispatch({
      type: 'PUBLISH_REPORT',
      payload: {
        id: uuidv4(),
        title: form.title.trim(),
        period: form.period.trim(),
        publishedAt: new Date().toISOString(),
        totalSavings: snapshot.totalSavings,
        totalLoansIssued: snapshot.totalLoansIssued,
        overdueAmount: snapshot.overdueAmount,
        cashPosition: snapshot.cashPosition,
        notes: form.notes.trim() || undefined,
      },
    })
    setForm({ title: '', period: '', notes: '' })
    setShowForm(false)
    setToast({ msg: 'Report published — members can now view it', type: 'success' })
  }

  const sorted = useMemo(
    () => [...state.publishedReports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [state.publishedReports]
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Published Reports</h1>
          <p className="text-gray-500 mt-1">Reports shared with all members for transparency</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Publish Report
        </button>
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {sorted.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{r.title}</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  Period: {r.period} · Published {format(parseISO(r.publishedAt), 'dd MMM yyyy')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(r.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <TrendingUp className="w-4 h-4 text-green-600 mb-1" />
                <p className="text-xs text-gray-500">Total Savings</p>
                <p className="font-bold text-green-700 text-sm">{formatRWF(r.totalSavings)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <CreditCard className="w-4 h-4 text-blue-600 mb-1" />
                <p className="text-xs text-gray-500">Loans Issued</p>
                <p className="font-bold text-blue-700 text-sm">{formatRWF(r.totalLoansIssued)}</p>
              </div>
              <div className={`rounded-lg p-3 ${r.overdueAmount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <AlertTriangle className={`w-4 h-4 mb-1 ${r.overdueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <p className="text-xs text-gray-500">Overdue</p>
                <p className={`font-bold text-sm ${r.overdueAmount > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                  {formatRWF(r.overdueAmount)}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${r.cashPosition >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <Wallet className={`w-4 h-4 mb-1 ${r.cashPosition >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <p className="text-xs text-gray-500">Cash Position</p>
                <p className={`font-bold text-sm ${r.cashPosition >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatRWF(r.cashPosition)}
                </p>
              </div>
            </div>

            {r.notes && (
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-50">{r.notes}</p>
            )}
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No reports published yet.</p>
            <p className="text-sm mt-1">Publish a report to share group financials with members.</p>
          </div>
        )}
      </div>

      {/* Publish modal */}
      {showForm && (
        <Modal title="Publish Report" onClose={() => setShowForm(false)}>
          <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm space-y-1">
            <p className="font-semibold text-blue-900 mb-2">Current snapshot (auto-filled)</p>
            <div className="flex justify-between"><span className="text-gray-500">Total savings</span><span className="font-medium">{formatRWF(snapshot.totalSavings)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Loans issued</span><span className="font-medium">{formatRWF(snapshot.totalLoansIssued)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Overdue amount</span><span className={`font-medium ${snapshot.overdueAmount > 0 ? 'text-red-700' : ''}`}>{formatRWF(snapshot.overdueAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cash position</span><span className="font-medium">{formatRWF(snapshot.cashPosition)}</span></div>
          </div>
          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. May 2024 Weekly Report" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Covered *</label>
              <input type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. 01–31 May 2024" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentary / Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional summary or notes for members..." rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium">Publish to Members</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Retract Report" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-gray-600 mb-6">This will remove the report from the member portal.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium">Cancel</button>
            <button onClick={() => { dispatch({ type: 'DELETE_PUBLISHED_REPORT', payload: deleteConfirm }); setDeleteConfirm(null); setToast({ msg: 'Report retracted', type: 'success' }) }} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium">Retract</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
