'use client'

import { useState, useMemo } from 'react'
import { useApp, formatRWF, getMemberRiskStatus } from '@/lib/store'
import { LoanRequest } from '@/lib/types'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { InboxIcon, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

const statusConfig: Record<LoanRequest['status'], { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
}

const riskColors: Record<string, string> = {
  'HIGH RISK': 'bg-red-100 text-red-700',
  'MEDIUM RISK': 'bg-orange-100 text-orange-700',
  'ACTIVE': 'bg-green-100 text-green-700',
  'NEW': 'bg-gray-100 text-gray-600',
}

export default function LoanRequestsPage() {
  const { state, dispatch } = useApp()
  const [filterStatus, setFilterStatus] = useState<LoanRequest['status'] | ''>('')
  const [reviewModal, setReviewModal] = useState<LoanRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const sorted = useMemo(
    () =>
      [...state.loanRequests]
        .filter((r) => !filterStatus || r.status === filterStatus)
        .sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1
          if (b.status === 'pending' && a.status !== 'pending') return 1
          return b.requestedAt.localeCompare(a.requestedAt)
        }),
    [state.loanRequests, filterStatus]
  )

  const pendingCount = state.loanRequests.filter((r) => r.status === 'pending').length

  function getMember(id: string) {
    return state.members.find((m) => m.id === id)
  }

  function handleDecision(decision: 'approved' | 'rejected') {
    if (!reviewModal) return
    const notes = reviewNotes.trim() || undefined
    const member = state.members.find((m) => m.id === reviewModal.memberId)
    dispatch({
      type: 'UPDATE_LOAN_REQUEST',
      payload: { ...reviewModal, status: decision, reviewNotes: notes },
    })
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: uuidv4(),
        memberId: reviewModal.memberId,
        type: decision === 'approved' ? 'loan_approved' : 'loan_rejected',
        title: decision === 'approved' ? 'Loan Request Approved' : 'Loan Request Declined',
        message: decision === 'approved'
          ? `Your loan request of RWF ${reviewModal.amount.toLocaleString()} has been approved.${notes ? ` Note: ${notes}` : ''}`
          : `Your loan request of RWF ${reviewModal.amount.toLocaleString()} was not approved at this time.${notes ? ` Reason: ${notes}` : ''}`,
        date: new Date().toISOString(),
        read: false,
      },
    })
    setToast({ msg: `Loan request ${decision} — ${member?.name} notified`, type: decision === 'approved' ? 'success' : 'error' })
    setReviewModal(null)
    setReviewNotes('')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Loan Requests
            {pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">{state.loanRequests.length} total requests</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s ? 'bg-blue-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((req) => {
          const member = getMember(req.memberId)
          const risk = getMemberRiskStatus(state.loans, state.repayments, req.memberId)
          const cfg = statusConfig[req.status]
          const StatusIcon = cfg.icon
          const isExpanded = expanded === req.id
          const initials = member?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'

          return (
            <div key={req.id} className={`bg-white rounded-xl border overflow-hidden ${req.status === 'pending' ? 'border-orange-200' : 'border-gray-100'}`}>
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(isExpanded ? null : req.id)}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-sm">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{member?.name ?? 'Unknown'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${riskColors[risk]}`}>{risk}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5 truncate">{req.purpose}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">{formatRWF(req.amount)}</p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-gray-400">Requested</p><p className="font-medium">{format(parseISO(req.requestedAt), 'dd MMM yyyy · HH:mm')}</p></div>
                    <div><p className="text-gray-400">Member since</p><p className="font-medium">{member ? format(parseISO(member.joinedDate), 'dd MMM yyyy') : '—'}</p></div>
                    <div className="col-span-2"><p className="text-gray-400">Purpose</p><p className="font-medium">{req.purpose}</p></div>
                  </div>
                  {req.reviewNotes && (
                    <div className={`rounded-lg px-3 py-2 text-sm ${req.status === 'approved' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-semibold text-xs mb-0.5">Review note</p>
                      {req.reviewNotes}
                    </div>
                  )}
                  {req.status === 'pending' && (
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => { setReviewModal(req); setReviewNotes('') }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
                      >
                        Review & Decide
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <InboxIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No loan requests found</p>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewModal && (
        <Modal title="Review Loan Request" onClose={() => setReviewModal(null)}>
          {(() => {
            const member = getMember(reviewModal.memberId)
            const risk = getMemberRiskStatus(state.loans, state.repayments, reviewModal.memberId)
            const memberLoans = state.loans.filter((l) => l.memberId === reviewModal.memberId)
            const totalContrib = state.contributions.filter((c) => c.memberId === reviewModal.memberId).reduce((s, c) => s + c.amount, 0)
            return (
              <div className="space-y-4">
                {/* Member summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member</span>
                    <span className="font-semibold">{member?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested amount</span>
                    <span className="font-bold text-blue-700">{formatRWF(reviewModal.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purpose</span>
                    <span className="font-medium">{reviewModal.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Risk status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${riskColors[risk]}`}>{risk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total contributed</span>
                    <span className="font-medium text-green-700">{formatRWF(totalContrib)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active / overdue loans</span>
                    <span className="font-medium">
                      {memberLoans.filter((l) => l.status === 'active').length} active,{' '}
                      {memberLoans.filter((l) => l.status === 'overdue').length} overdue
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Note (optional)</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add a note for the member..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => handleDecision('rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm">
                    Reject
                  </button>
                  <button onClick={() => handleDecision('approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm">
                    Approve
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
