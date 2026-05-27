'use client'

import { useMemo } from 'react'
import { useApp, formatRWF, getOverdueLoans } from '@/lib/store'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import { Users, TrendingUp, CreditCard, AlertTriangle, Clock, InboxIcon } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export default function DashboardPage() {
  const { state } = useApp()
  const { members, contributions, loans, repayments } = state

  const totalSavings = useMemo(
    () => contributions.reduce((s, c) => s + c.amount, 0),
    [contributions]
  )

  const activeLoans = useMemo(() => loans.filter((l) => l.status !== 'paid'), [loans])
  const overdueLoans = useMemo(() => getOverdueLoans(loans), [loans])
  const totalLoanBalance = useMemo(() => activeLoans.reduce((s, l) => s + l.balance, 0), [activeLoans])
  const pendingRequests = useMemo(() => state.loanRequests.filter((r) => r.status === 'pending'), [state.loanRequests])

  // Monthly contributions chart data
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    contributions.forEach((c) => {
      const month = format(parseISO(c.date), 'MMM yyyy')
      byMonth[month] = (byMonth[month] || 0) + c.amount
    })
    return Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }))
  }, [contributions])

  // Loan status pie data
  const loanStatusData = useMemo(() => {
    const counts: Record<string, number> = { active: 0, paid: 0, overdue: 0 }
    loans.forEach((l) => counts[l.status]++)
    return [
      { name: 'Active', value: counts.active, color: '#2563eb' },
      { name: 'Paid', value: counts.paid, color: '#16a34a' },
      { name: 'Overdue', value: counts.overdue, color: '#dc2626' },
    ].filter((d) => d.value > 0)
  }, [loans])

  // Recent activity (last 6 items sorted by date)
  const recentActivity = useMemo(() => {
    const events = [
      ...contributions.map((c) => ({
        id: c.id,
        type: 'contribution' as const,
        date: c.date,
        amount: c.amount,
        memberId: c.memberId,
      })),
      ...repayments.map((r) => {
        const loan = loans.find((l) => l.id === r.loanId)
        return {
          id: r.id,
          type: 'repayment' as const,
          date: r.date,
          amount: r.amount,
          memberId: loan?.memberId ?? '',
        }
      }),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
    return events
  }, [contributions, repayments, loans])

  function getMemberName(id: string) {
    return members.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{state.groupName}</h1>
        <p className="text-gray-500 mt-1">Group financial overview</p>
      </div>

      {/* Alert banners */}
      <div className="space-y-3">
        {overdueLoans.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                {overdueLoans.length} loan{overdueLoans.length > 1 ? 's' : ''} overdue
              </p>
              <p className="text-red-600 text-sm">
                Total overdue: {formatRWF(overdueLoans.reduce((s, l) => s + l.balance, 0))} — follow up required
              </p>
            </div>
          </div>
        )}
        {pendingRequests.length > 0 && (
          <Link href="/loan-requests" className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 hover:bg-orange-100 transition-colors">
            <InboxIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800">
                {pendingRequests.length} loan request{pendingRequests.length > 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-orange-600 text-sm">
                {pendingRequests.map((r) => members.find((m) => m.id === r.memberId)?.name ?? '').filter(Boolean).join(', ')}
              </p>
            </div>
            <span className="text-orange-600 text-sm font-medium flex-shrink-0">Review →</span>
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Savings"
          value={formatRWF(totalSavings)}
          subtitle={`${contributions.length} contributions`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Active Loans"
          value={activeLoans.length.toString()}
          subtitle={formatRWF(totalLoanBalance) + ' outstanding'}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Overdue Payments"
          value={overdueLoans.length.toString()}
          subtitle={overdueLoans.length > 0 ? 'Needs attention' : 'All on time'}
          icon={AlertTriangle}
          color={overdueLoans.length > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Members"
          value={members.length.toString()}
          subtitle={`${members.filter((m) => m.role !== 'member').length} officers`}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly contributions bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Contributions</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [formatRWF(value), 'Contributions']} />
              <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Loan status pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Loan Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {loanStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={10} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity + overdue loans */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'contribution' ? 'bg-green-100' : 'bg-blue-100'
                  }`}
                >
                  {item.type === 'contribution' ? (
                    <TrendingUp className="w-4 h-4 text-green-700" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-blue-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{getMemberName(item.memberId)}</p>
                  <p className="text-xs text-gray-500">
                    {item.type === 'contribution' ? 'Contribution' : 'Loan repayment'} •{' '}
                    {format(parseISO(item.date), 'dd MMM yyyy')}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    item.type === 'contribution' ? 'text-green-700' : 'text-blue-700'
                  }`}
                >
                  {formatRWF(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue loans */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Overdue Loans{' '}
            {overdueLoans.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {overdueLoans.length}
              </span>
            )}
          </h2>
          {overdueLoans.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No overdue loans</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueLoans.map((loan) => {
                const member = members.find((m) => m.id === loan.memberId)
                const daysOverdue = Math.floor(
                  (Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                )
                const missedCount = repayments.filter((r) => r.loanId === loan.id).length
                return (
                  <div key={loan.id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm">{member?.name}</p>
                      {missedCount < 2 ? (
                        <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                          MEDIUM RISK
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          HIGH RISK
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-red-700 font-semibold">{formatRWF(loan.balance)} outstanding</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} • Due{' '}
                      {format(parseISO(loan.dueDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
