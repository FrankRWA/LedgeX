'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp, formatRWF, getLoanRepayments } from '@/lib/store'
import {
  BookOpen,
  LogOut,
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCircle,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Loan } from '@/lib/types'

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

export default function MemberPortalPage() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const member = useMemo(
    () => state.members.find((m) => m.id === state.currentMemberId) ?? null,
    [state.members, state.currentMemberId]
  )

  useEffect(() => {
    if (!state.currentMemberId) {
      router.push('/member-login')
    }
  }, [state.currentMemberId, router])

  const myContributions = useMemo(
    () =>
      [...state.contributions]
        .filter((c) => c.memberId === state.currentMemberId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.contributions, state.currentMemberId]
  )

  const myLoans = useMemo(
    () =>
      [...state.loans]
        .filter((l) => l.memberId === state.currentMemberId)
        .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate)),
    [state.loans, state.currentMemberId]
  )

  const totalContributed = useMemo(
    () => myContributions.reduce((s, c) => s + c.amount, 0),
    [myContributions]
  )

  const totalOwed = useMemo(
    () => myLoans.filter((l) => l.status !== 'paid').reduce((s, l) => s + l.balance, 0),
    [myLoans]
  )

  const hasOverdue = myLoans.some((l) => l.status === 'overdue')

  function handleLogout() {
    dispatch({ type: 'LOGOUT_MEMBER' })
    router.push('/member-login')
  }

  if (!member) return null

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 opacity-80" />
            <div>
              <p className="font-bold text-sm leading-none">LedgeX</p>
              <p className="text-blue-300 text-xs">{state.groupName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-12">
        {/* Member card */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-2xl p-6 text-white mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Welcome back</p>
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <p className="text-blue-200 text-sm capitalize mt-0.5">{member.role} · Joined {format(parseISO(member.joinedDate), 'MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Overdue alert */}
        {hasOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">You have an overdue loan</p>
              <p className="text-red-600 text-sm mt-0.5">
                Please contact your group leader to arrange repayment.
              </p>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-green-700" />
            </div>
            <p className="text-gray-500 text-xs font-medium">My Contributions</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatRWF(totalContributed)}</p>
            <p className="text-gray-400 text-xs mt-1">{myContributions.length} payments</p>
          </div>
          <div className={`bg-white rounded-xl border p-4 ${totalOwed > 0 ? 'border-orange-100' : 'border-gray-100'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${totalOwed > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <CreditCard className={`w-4 h-4 ${totalOwed > 0 ? 'text-orange-700' : 'text-gray-500'}`} />
            </div>
            <p className="text-gray-500 text-xs font-medium">Loan Balance</p>
            <p className={`text-xl font-bold mt-1 ${totalOwed > 0 ? 'text-orange-700' : 'text-green-700'}`}>
              {formatRWF(totalOwed)}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {totalOwed === 0 ? 'All clear' : 'Outstanding'}
            </p>
          </div>
        </div>

        {/* My Loans */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-700" />
            My Loans
            {myLoans.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
                {myLoans.length}
              </span>
            )}
          </h2>

          {myLoans.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No loans on record</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLoans.map((loan) => {
                const repayments = getLoanRepayments(state.repayments, loan.id)
                const paidPct = loan.amount > 0 ? ((loan.amount - loan.balance) / loan.amount) * 100 : 100
                const StatusIcon = statusIcons[loan.status]
                const daysOverdue =
                  loan.status === 'overdue'
                    ? differenceInDays(new Date(), parseISO(loan.dueDate))
                    : 0

                return (
                  <div key={loan.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{formatRWF(loan.amount)}</p>
                        {loan.purpose && (
                          <p className="text-gray-500 text-sm">{loan.purpose}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[loan.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {loan.status}
                        {daysOverdue > 0 && ` · ${daysOverdue}d`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Repaid: {formatRWF(loan.amount - loan.balance)}</span>
                        <span>Remaining: {formatRWF(loan.balance)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            loan.status === 'paid'
                              ? 'bg-green-500'
                              : loan.status === 'overdue'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Issued: {format(parseISO(loan.issuedDate), 'dd MMM yyyy')}</span>
                      <span className={loan.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                        Due: {format(parseISO(loan.dueDate), 'dd MMM yyyy')}
                      </span>
                    </div>

                    {/* Repayment history */}
                    {repayments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                          Repayments
                        </p>
                        <div className="space-y-1">
                          {repayments.map((r) => (
                            <div key={r.id} className="flex justify-between text-sm">
                              <span className="text-gray-500">{format(parseISO(r.date), 'dd MMM yyyy')}</span>
                              <span className="font-medium text-green-700">{formatRWF(r.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* My Contributions */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            My Contributions
            {myContributions.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
                {myContributions.length}
              </span>
            )}
          </h2>

          {myContributions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No contributions recorded yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {myContributions.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < myContributions.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {format(parseISO(c.date), 'dd MMMM yyyy')}
                    </p>
                    {c.notes && <p className="text-gray-400 text-xs mt-0.5">{c.notes}</p>}
                  </div>
                  <span className="font-semibold text-green-700">{formatRWF(c.amount)}</span>
                </div>
              ))}
              <div className="px-4 py-3 bg-green-50 border-t border-green-100 flex justify-between">
                <span className="font-bold text-gray-700">Total</span>
                <span className="font-bold text-green-700">{formatRWF(totalContributed)}</span>
              </div>
            </div>
          )}
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 pt-2">
          For any discrepancies, contact your group leader · LedgeX
        </p>
      </div>
    </div>
  )
}
