'use client'

import { useState, useMemo } from 'react'
import { useApp, formatRWF, getLoanRepayments } from '@/lib/store'
import { Loan } from '@/lib/types'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { Plus, CreditCard, ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { format, parseISO, differenceInDays } from 'date-fns'

function emptyLoanForm() {
  return {
    memberId: '',
    amount: '',
    issuedDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    purpose: '',
  }
}

function emptyRepaymentForm() {
  return { amount: '', date: format(new Date(), 'yyyy-MM-dd') }
}

const statusColors: Record<Loan['status'], string> = {
  active: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

const statusIcons: Record<Loan['status'], React.ElementType> = {
  active: Clock,
  paid: CheckCircle,
  overdue: AlertTriangle,
}

export default function LoansPage() {
  const { state, dispatch } = useApp()
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanForm, setLoanForm] = useState(emptyLoanForm())
  const [showRepaymentFor, setShowRepaymentFor] = useState<string | null>(null)
  const [repaymentForm, setRepaymentForm] = useState(emptyRepaymentForm())
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Loan['status'] | ''>('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function getMemberName(id: string) {
    return state.members.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  const filtered = useMemo(
    () =>
      [...state.loans]
        .filter((l) => !filterStatus || l.status === filterStatus)
        .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate)),
    [state.loans, filterStatus]
  )

  const totalOutstanding = useMemo(
    () => state.loans.filter((l) => l.status !== 'paid').reduce((s, l) => s + l.balance, 0),
    [state.loans]
  )

  function handleIssueLoan(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(loanForm.amount)
    if (!loanForm.memberId) return setToast({ msg: 'Select a member', type: 'error' })
    if (!amount || amount <= 0) return setToast({ msg: 'Enter valid amount', type: 'error' })
    if (!loanForm.dueDate) return setToast({ msg: 'Enter due date', type: 'error' })

    const today = new Date()
    const status: Loan['status'] =
      new Date(loanForm.dueDate) < today ? 'overdue' : 'active'

    dispatch({
      type: 'ADD_LOAN',
      payload: {
        id: uuidv4(),
        memberId: loanForm.memberId,
        amount,
        balance: amount,
        status,
        issuedDate: loanForm.issuedDate,
        dueDate: loanForm.dueDate,
        purpose: loanForm.purpose || undefined,
      },
    })
    setToast({ msg: 'Loan issued successfully', type: 'success' })
    setShowLoanForm(false)
    setLoanForm(emptyLoanForm())
  }

  function handleRepayment(e: React.FormEvent) {
    e.preventDefault()
    if (!showRepaymentFor) return
    const amount = parseFloat(repaymentForm.amount)
    if (!amount || amount <= 0) return setToast({ msg: 'Enter valid amount', type: 'error' })

    const loan = state.loans.find((l) => l.id === showRepaymentFor)
    if (!loan) return
    if (amount > loan.balance) {
      return setToast({ msg: `Amount exceeds balance (${formatRWF(loan.balance)})`, type: 'error' })
    }

    dispatch({
      type: 'ADD_REPAYMENT',
      payload: { id: uuidv4(), loanId: showRepaymentFor, amount, date: repaymentForm.date },
    })
    setToast({ msg: 'Repayment recorded. Balance updated automatically.', type: 'success' })
    setShowRepaymentFor(null)
    setRepaymentForm(emptyRepaymentForm())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-gray-500 mt-1">
            {state.loans.length} total — {formatRWF(totalOutstanding)} outstanding
          </p>
        </div>
        <button
          onClick={() => setShowLoanForm(true)}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Issue Loan
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['active', 'paid', 'overdue'] as Loan['status'][]).map((s) => {
          const count = state.loans.filter((l) => l.status === s).length
          const StatusIcon = statusIcons[s]
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                filterStatus === s ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${statusColors[s]}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 capitalize mt-0.5">{s} loans</p>
            </button>
          )
        })}
      </div>

      {/* Loans list */}
      <div className="space-y-3">
        {filtered.map((loan) => {
          const member = state.members.find((m) => m.id === loan.memberId)
          const repayments = getLoanRepayments(state.repayments, loan.id)
          const expanded = expandedLoan === loan.id
          const paidPct = loan.amount > 0 ? ((loan.amount - loan.balance) / loan.amount) * 100 : 100
          const StatusIcon = statusIcons[loan.status]
          const daysOverdue =
            loan.status === 'overdue'
              ? differenceInDays(new Date(), parseISO(loan.dueDate))
              : 0

          return (
            <div key={loan.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedLoan(expanded ? null : loan.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-gray-900">{member?.name ?? 'Unknown'}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[loan.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {loan.status}
                        {daysOverdue > 0 && ` · ${daysOverdue}d`}
                      </span>
                      {repayments.length < 2 && loan.status === 'overdue' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          HIGH RISK
                        </span>
                      )}
                    </div>
                    {loan.purpose && (
                      <p className="text-gray-500 text-sm mt-0.5">{loan.purpose}</p>
                    )}
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          loan.status === 'paid' ? 'bg-green-500' : loan.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{formatRWF(loan.balance)}</p>
                    <p className="text-xs text-gray-400">of {formatRWF(loan.amount)}</p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </div>

              {expanded && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <div className="grid grid-cols-3 gap-4 py-3 text-sm">
                    <div>
                      <p className="text-gray-500">Issued</p>
                      <p className="font-medium">{format(parseISO(loan.issuedDate), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className={`font-medium ${loan.status === 'overdue' ? 'text-red-600' : ''}`}>
                        {format(parseISO(loan.dueDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Repaid</p>
                      <p className="font-medium text-green-700">{formatRWF(loan.amount - loan.balance)}</p>
                    </div>
                  </div>

                  {/* Repayments history */}
                  {repayments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Repayment History
                      </p>
                      <div className="space-y-1">
                        {repayments.map((r) => (
                          <div key={r.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500">{format(parseISO(r.date), 'dd MMM yyyy')}</span>
                            <span className="font-medium text-green-700">{formatRWF(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loan.status !== 'paid' && (
                    <button
                      onClick={() => {
                        setShowRepaymentFor(loan.id)
                        setRepaymentForm(emptyRepaymentForm())
                      }}
                      className="mt-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      + Record Repayment
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            No loans found
          </div>
        )}
      </div>

      {/* Issue Loan modal */}
      {showLoanForm && (
        <Modal title="Issue Loan" onClose={() => setShowLoanForm(false)}>
          <form onSubmit={handleIssueLoan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={loanForm.memberId}
                onChange={(e) => setLoanForm({ ...loanForm, memberId: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (RWF) *</label>
              <input
                type="number"
                value={loanForm.amount}
                onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                placeholder="200000"
                min="1"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={loanForm.issuedDate}
                  onChange={(e) => setLoanForm({ ...loanForm, issuedDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={loanForm.dueDate}
                  onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input
                type="text"
                value={loanForm.purpose}
                onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                placeholder="e.g. Business capital, School fees..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLoanForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium"
              >
                Issue Loan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Repayment modal */}
      {showRepaymentFor && (
        <Modal title="Record Repayment" onClose={() => setShowRepaymentFor(null)}>
          {(() => {
            const loan = state.loans.find((l) => l.id === showRepaymentFor)
            const member = state.members.find((m) => m.id === loan?.memberId)
            return (
              <form onSubmit={handleRepayment} className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900">{member?.name}</p>
                  <p className="text-blue-600">Outstanding balance: {formatRWF(loan?.balance ?? 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF) *</label>
                  <input
                    type="number"
                    value={repaymentForm.amount}
                    onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
                    placeholder={String(loan?.balance ?? '')}
                    min="1"
                    max={loan?.balance}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={repaymentForm.date}
                    onChange={(e) => setRepaymentForm({ ...repaymentForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRepaymentFor(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium"
                  >
                    Record Repayment
                  </button>
                </div>
              </form>
            )
          })()}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
