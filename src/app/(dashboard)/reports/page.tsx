'use client'

import { useMemo } from 'react'
import { useApp, formatRWF } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { Printer, TrendingUp, CreditCard, Wallet } from 'lucide-react'

export default function ReportsPage() {
  const { state } = useApp()

  function getMemberName(id: string) {
    return state.members.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  const totalSavings = useMemo(
    () => state.contributions.reduce((s, c) => s + c.amount, 0),
    [state.contributions]
  )

  // Per-member contribution summary
  const memberContribSummary = useMemo(() => {
    const map: Record<string, number> = {}
    state.contributions.forEach((c) => {
      map[c.memberId] = (map[c.memberId] || 0) + c.amount
    })
    return state.members
      .map((m) => ({ member: m, total: map[m.id] ?? 0 }))
      .sort((a, b) => b.total - a.total)
  }, [state.members, state.contributions])

  // Loan summary
  const loanSummary = useMemo(
    () => ({
      total: state.loans.length,
      totalIssued: state.loans.reduce((s, l) => s + l.amount, 0),
      totalOutstanding: state.loans.filter((l) => l.status !== 'paid').reduce((s, l) => s + l.balance, 0),
      totalRepaid: state.loans.reduce((s, l) => s + (l.amount - l.balance), 0),
      active: state.loans.filter((l) => l.status === 'active').length,
      paid: state.loans.filter((l) => l.status === 'paid').length,
      overdue: state.loans.filter((l) => l.status === 'overdue').length,
    }),
    [state.loans]
  )

  // Cash position
  const cashPosition = useMemo(() => {
    const totalIn = totalSavings + loanSummary.totalRepaid
    const totalOut = loanSummary.totalIssued
    return { totalIn, totalOut, netPosition: totalIn - totalOut }
  }, [totalSavings, loanSummary])

  const today = format(new Date(), 'dd MMMM yyyy')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generated on {today}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      {/* Print header (only visible on print) */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{state.groupName}</h1>
        <p className="text-gray-600 text-lg">Financial Report — {today}</p>
        <hr className="mt-4 border-gray-300" />
      </div>

      {/* 1. Cash Position Summary */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-700" />
          Cash Position
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-gray-500 text-sm">Total Inflows</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatRWF(cashPosition.totalIn)}</p>
            <p className="text-xs text-gray-400 mt-1">Contributions + Repayments</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-gray-500 text-sm">Total Outflows</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{formatRWF(cashPosition.totalOut)}</p>
            <p className="text-xs text-gray-400 mt-1">Loans Issued</p>
          </div>
          <div className={`text-center p-4 rounded-lg ${cashPosition.netPosition >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <p className="text-gray-500 text-sm">Net Position</p>
            <p className={`text-2xl font-bold mt-1 ${cashPosition.netPosition >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatRWF(cashPosition.netPosition)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Cash on hand</p>
          </div>
        </div>
      </section>

      {/* 2. Contribution Summary */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Contribution Summary
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-semibold text-gray-600">Member</th>
              <th className="text-left py-2 font-semibold text-gray-600">Role</th>
              <th className="text-right py-2 font-semibold text-gray-600">Contributions</th>
              <th className="text-right py-2 font-semibold text-gray-600">Total Amount</th>
              <th className="text-right py-2 font-semibold text-gray-600">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {memberContribSummary.map(({ member, total }) => {
              const count = state.contributions.filter((c) => c.memberId === member.id).length
              const pct = totalSavings > 0 ? ((total / totalSavings) * 100).toFixed(1) : '0'
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{member.name}</td>
                  <td className="py-2.5 text-gray-500 capitalize">{member.role}</td>
                  <td className="py-2.5 text-right text-gray-600">{count}</td>
                  <td className="py-2.5 text-right font-semibold text-green-700">{formatRWF(total)}</td>
                  <td className="py-2.5 text-right text-gray-500">{pct}%</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="py-2.5 font-bold text-gray-900">Total</td>
              <td className="py-2.5 text-right font-bold text-green-700">{formatRWF(totalSavings)}</td>
              <td className="py-2.5 text-right font-bold text-gray-900">100%</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* 3. Loan Summary */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-700" />
          Loan Summary
        </h2>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Issued', value: formatRWF(loanSummary.totalIssued) },
            { label: 'Total Repaid', value: formatRWF(loanSummary.totalRepaid), color: 'text-green-700' },
            { label: 'Outstanding', value: formatRWF(loanSummary.totalOutstanding), color: 'text-blue-700' },
            { label: 'Overdue', value: formatRWF(state.loans.filter((l) => l.status === 'overdue').reduce((s, l) => s + l.balance, 0)), color: loanSummary.overdue > 0 ? 'text-red-700' : 'text-gray-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className={`font-bold mt-1 ${color ?? 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Loan table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-semibold text-gray-600">Member</th>
              <th className="text-left py-2 font-semibold text-gray-600">Purpose</th>
              <th className="text-right py-2 font-semibold text-gray-600">Amount</th>
              <th className="text-right py-2 font-semibold text-gray-600">Balance</th>
              <th className="text-right py-2 font-semibold text-gray-600">Due Date</th>
              <th className="text-center py-2 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {state.loans.map((loan) => (
              <tr key={loan.id} className={`hover:bg-gray-50 ${loan.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                <td className="py-2.5 font-medium text-gray-900">{getMemberName(loan.memberId)}</td>
                <td className="py-2.5 text-gray-500 text-xs">{loan.purpose ?? '—'}</td>
                <td className="py-2.5 text-right">{formatRWF(loan.amount)}</td>
                <td className={`py-2.5 text-right font-semibold ${loan.balance > 0 ? 'text-blue-700' : 'text-green-700'}`}>
                  {formatRWF(loan.balance)}
                </td>
                <td className={`py-2.5 text-right text-sm ${loan.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {format(parseISO(loan.dueDate), 'dd MMM yyyy')}
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      loan.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : loan.status === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-center text-gray-400 text-xs pb-4">
        LedgeX — Smart Digital Ledger for IKIMINA Groups • Report generated {today}
      </p>
    </div>
  )
}
