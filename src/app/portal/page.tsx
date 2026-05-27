'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp, formatRWF, getLoanRepayments, getMemberRiskStatus } from '@/lib/store'
import { Loan } from '@/lib/types'
import {
  BookOpen, LogOut, TrendingUp, CreditCard, CheckCircle,
  AlertTriangle, Clock, BarChart3, Megaphone, Send, MessageCircle,
  Wallet, ChevronDown, ChevronUp, Bell, X, Camera,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import Toast from '@/components/Toast'

type Tab = 'overview' | 'announcements' | 'reports' | 'loan-request'

const statusColors: Record<Loan['status'], string> = {
  active: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}
const statusIcons: Record<Loan['status'], React.ElementType> = {
  active: Clock, paid: CheckCircle, overdue: AlertTriangle,
}

const riskConfig: Record<string, { color: string; bg: string; desc: string }> = {
  'HIGH RISK':   { color: 'text-red-700',    bg: 'bg-red-100',    desc: 'You have an overdue loan. Please contact your group leader.' },
  'MEDIUM RISK': { color: 'text-orange-700', bg: 'bg-orange-100', desc: 'You have an active loan with less than 30% repaid.' },
  'ACTIVE':      { color: 'text-green-700',  bg: 'bg-green-100',  desc: 'Your account is in good standing.' },
  'NEW':         { color: 'text-gray-600',   bg: 'bg-gray-100',   desc: 'Welcome! You have no loan history yet.' },
}

export default function MemberPortalPage() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null)
  const [expandedAnn, setExpandedAnn] = useState<string | null>(
    state.announcements.find((a) => a.pinned)?.id ?? state.announcements[0]?.id ?? null
  )
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [loanReqForm, setLoanReqForm] = useState({ amount: '', purpose: '' })
  const avatarInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return
    const reader = new FileReader()
    reader.onload = () => {
      dispatch({ type: 'UPDATE_MEMBER', payload: { ...member, avatar: reader.result as string } })
      setToast({ msg: 'Profile picture updated', type: 'success' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const member = useMemo(
    () => state.members.find((m) => m.id === state.currentMemberId) ?? null,
    [state.members, state.currentMemberId]
  )

  useEffect(() => {
    if (!state.currentMemberId) router.push('/member-login')
  }, [state.currentMemberId, router])

  const myContributions = useMemo(
    () => [...state.contributions].filter((c) => c.memberId === state.currentMemberId).sort((a, b) => b.date.localeCompare(a.date)),
    [state.contributions, state.currentMemberId]
  )
  const myLoans = useMemo(
    () => [...state.loans].filter((l) => l.memberId === state.currentMemberId).sort((a, b) => b.issuedDate.localeCompare(a.issuedDate)),
    [state.loans, state.currentMemberId]
  )
  const totalContributed = useMemo(() => myContributions.reduce((s, c) => s + c.amount, 0), [myContributions])
  const totalOwed = useMemo(() => myLoans.filter((l) => l.status !== 'paid').reduce((s, l) => s + l.balance, 0), [myLoans])
  const risk = useMemo(() => getMemberRiskStatus(state.loans, state.repayments, state.currentMemberId ?? ''), [state.loans, state.repayments, state.currentMemberId])
  const riskCfg = riskConfig[risk]

  const sortedAnnouncements = useMemo(
    () => [...state.announcements].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.publishedAt.localeCompare(a.publishedAt)
    }),
    [state.announcements]
  )

  const myRequests = useMemo(
    () => [...state.loanRequests].filter((r) => r.memberId === state.currentMemberId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [state.loanRequests, state.currentMemberId]
  )
  const hasPendingRequest = myRequests.some((r) => r.status === 'pending')

  const myNotifications = useMemo(
    () => [...(state.notifications ?? [])].filter((n) => n.memberId === state.currentMemberId).sort((a, b) => b.date.localeCompare(a.date)),
    [state.notifications, state.currentMemberId]
  )
  const unreadCount = myNotifications.filter((n) => !n.read).length

  const myFines = useMemo(
    () => (state.fines ?? []).filter((f) => f.memberId === state.currentMemberId),
    [state.fines, state.currentMemberId]
  )
  const unsettledFines = myFines.filter((f) => !f.settled)
  const totalFineBalance = unsettledFines.reduce((s, f) => s + f.amount, 0)

  function getMemberName(id: string) {
    return state.members.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  function handleComment(announcementId: string) {
    const text = (commentText[announcementId] ?? '').trim()
    if (!text || !state.currentMemberId) return
    dispatch({
      type: 'ADD_ANNOUNCEMENT_COMMENT',
      payload: { id: uuidv4(), announcementId, memberId: state.currentMemberId, content: text, date: new Date().toISOString() },
    })
    setCommentText((prev) => ({ ...prev, [announcementId]: '' }))
    setToast({ msg: 'Comment posted', type: 'success' })
  }

  function handleLoanRequest(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(loanReqForm.amount)
    if (!amount || amount <= 0) { setToast({ msg: 'Enter a valid amount', type: 'error' }); return }
    if (!loanReqForm.purpose.trim()) { setToast({ msg: 'Enter the purpose', type: 'error' }); return }
    if (hasPendingRequest) { setToast({ msg: 'You already have a pending loan request', type: 'error' }); return }
    dispatch({
      type: 'ADD_LOAN_REQUEST',
      payload: { id: uuidv4(), memberId: state.currentMemberId!, amount, purpose: loanReqForm.purpose.trim(), requestedAt: new Date().toISOString(), status: 'pending' },
    })
    setLoanReqForm({ amount: '', purpose: '' })
    setToast({ msg: 'Loan request submitted successfully!', type: 'success' })
    setTab('overview')
  }

  if (!member) return null

  const initials = member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'announcements', label: 'News', icon: Megaphone },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'loan-request', label: 'Request Loan', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {state.groupLogo ? (
                <img src={state.groupLogo} alt="Group logo" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-4 h-4 opacity-80" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm leading-none">LedgeX</p>
              <p className="text-blue-300 text-xs">{state.groupName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                if (!showNotifications && unreadCount > 0) {
                  dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ', payload: state.currentMemberId! })
                }
              }}
              className="relative text-blue-200 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => { dispatch({ type: 'LOGOUT_MEMBER' }); router.push('/member-login') }} className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm">
              <LogOut className="w-4 h-4" />Logout
            </button>
          </div>
        </div>
      </header>

      {/* Notification panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-30 flex items-start justify-center pt-16 px-4 bg-black/40" onClick={() => setShowNotifications(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {myNotifications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                myNotifications.map((n) => (
                  <div key={n.id} className={`px-5 py-4 border-b border-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        n.type === 'fine' ? 'bg-orange-100' : n.type === 'loan_approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {n.type === 'fine' ? <AlertTriangle className="w-4 h-4 text-orange-600" /> :
                         n.type === 'loan_approved' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         <X className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{n.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(parseISO(n.date), 'dd MMM yyyy · HH:mm')}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto pb-12">
        {/* Member card */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-4 pt-5 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
                title="Change profile picture"
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1">
              <p className="text-blue-200 text-sm">Welcome back</p>
              <h1 className="text-xl font-bold text-white">{member.name}</h1>
              <p className="text-blue-200 text-xs capitalize mt-0.5">{member.role} · Joined {format(parseISO(member.joinedDate), 'MMM yyyy')}</p>
            </div>
            {/* Risk badge */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${riskCfg.bg} ${riskCfg.color}`}>
              {risk}
            </span>
          </div>
          <p className="text-blue-200 text-xs bg-white/10 rounded-lg px-3 py-2">{riskCfg.desc}</p>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10">
          <div className="flex overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === id ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'loan-request' && hasPendingRequest && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3"><TrendingUp className="w-4 h-4 text-green-700" /></div>
                  <p className="text-gray-500 text-xs font-medium">My Contributions</p>
                  <p className="text-xl font-bold text-green-700 mt-1">{formatRWF(totalContributed)}</p>
                  <p className="text-gray-400 text-xs mt-1">{myContributions.length} payments</p>
                </div>
                <div className={`bg-white rounded-xl border p-4 ${totalOwed > 0 ? 'border-orange-100' : 'border-gray-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${totalOwed > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <CreditCard className={`w-4 h-4 ${totalOwed > 0 ? 'text-orange-700' : 'text-gray-500'}`} />
                  </div>
                  <p className="text-gray-500 text-xs font-medium">Loan Balance</p>
                  <p className={`text-xl font-bold mt-1 ${totalOwed > 0 ? 'text-orange-700' : 'text-green-700'}`}>{formatRWF(totalOwed)}</p>
                  <p className="text-gray-400 text-xs mt-1">{totalOwed === 0 ? 'All clear' : 'Outstanding'}</p>
                </div>
              </div>

              {/* Outstanding fines */}
              {unsettledFines.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <p className="font-semibold text-orange-900 text-sm">Outstanding Attendance Fines</p>
                  </div>
                  <div className="space-y-2">
                    {unsettledFines.map((f) => (
                      <div key={f.id} className="flex justify-between text-sm">
                        <span className="text-orange-800">{f.meetingTitle}</span>
                        <span className="font-semibold text-orange-700">{formatRWF(f.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-sm mt-3 pt-2 border-t border-orange-200">
                    <span className="text-orange-900">Total fines</span>
                    <span className="text-orange-700">{formatRWF(totalFineBalance)}</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">These fines have been added to your loan balance. Contact your group leader to settle.</p>
                </div>
              )}

              {/* My Loans */}
              <section>
                <h2 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />My Loans
                </h2>
                {myLoans.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No loans on record</div>
                ) : (
                  <div className="space-y-3">
                    {myLoans.map((loan) => {
                      const repayments = getLoanRepayments(state.repayments, loan.id)
                      const pct = loan.amount > 0 ? ((loan.amount - loan.balance) / loan.amount) * 100 : 100
                      const StatusIcon = statusIcons[loan.status]
                      const daysOverdue = loan.status === 'overdue' ? differenceInDays(new Date(), parseISO(loan.dueDate)) : 0
                      const isExp = expandedLoan === loan.id
                      return (
                        <div key={loan.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <div className="p-4 cursor-pointer" onClick={() => setExpandedLoan(isExp ? null : loan.id)}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{formatRWF(loan.amount)}</p>
                                {loan.purpose && <p className="text-gray-500 text-sm">{loan.purpose}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[loan.status]}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {loan.status}{daysOverdue > 0 && ` · ${daysOverdue}d`}
                                </span>
                                {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Repaid: {formatRWF(loan.amount - loan.balance)}</span>
                              <span>Remaining: {formatRWF(loan.balance)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${loan.status === 'paid' ? 'bg-green-500' : loan.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          {isExp && (
                            <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                                <span>Issued: {format(parseISO(loan.issuedDate), 'dd MMM yyyy')}</span>
                                <span className={loan.status === 'overdue' ? 'text-red-600 font-medium' : ''}>Due: {format(parseISO(loan.dueDate), 'dd MMM yyyy')}</span>
                              </div>
                              {repayments.length > 0 && (
                                <>
                                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Repayments</p>
                                  {repayments.map((r) => (
                                    <div key={r.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                      <span className="text-gray-500">{format(parseISO(r.date), 'dd MMM yyyy')}</span>
                                      <span className="font-medium text-green-700">{formatRWF(r.amount)}</span>
                                    </div>
                                  ))}
                                </>
                              )}
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
                <h2 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />My Contributions
                </h2>
                {myContributions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">No contributions recorded</div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {myContributions.map((c, i) => (
                      <div key={c.id} className={`flex items-center justify-between px-4 py-3 ${i < myContributions.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{format(parseISO(c.date), 'dd MMMM yyyy')}</p>
                          {c.notes && <p className="text-gray-400 text-xs">{c.notes}</p>}
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
            </>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {tab === 'announcements' && (
            <div className="space-y-3">
              {sortedAnnouncements.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
                  <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No announcements yet</p>
                </div>
              )}
              {sortedAnnouncements.map((ann) => {
                const comments = state.announcementComments.filter((c) => c.announcementId === ann.id)
                const isExp = expandedAnn === ann.id
                return (
                  <div key={ann.id} className={`bg-white rounded-xl border overflow-hidden ${ann.pinned ? 'border-blue-200' : 'border-gray-100'}`}>
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedAnn(isExp ? null : ann.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{ann.title}</p>
                            {ann.pinned && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Pinned</span>}
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {format(parseISO(ann.publishedAt), 'dd MMM yyyy')} ·{' '}
                            <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comments.length}</span>
                          </p>
                        </div>
                        {isExp ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      </div>
                    </div>

                    {isExp && (
                      <div className="px-4 pb-4 border-t border-gray-50">
                        <p className="text-gray-700 text-sm leading-relaxed pt-4 whitespace-pre-wrap">{ann.content}</p>

                        {/* Comments */}
                        <div className="mt-4 pt-3 border-t border-gray-50">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Discussion ({comments.length})
                          </p>
                          <div className="space-y-3 mb-4">
                            {comments.map((c) => {
                              const isMe = c.memberId === state.currentMemberId
                              return (
                                <div key={c.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {getMemberName(c.memberId).split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div className={`rounded-xl px-3 py-2 max-w-[80%] ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-800'}`}>
                                    {!isMe && <p className="text-xs font-semibold mb-0.5 opacity-70">{getMemberName(c.memberId)}</p>}
                                    <p className="text-sm">{c.content}</p>
                                    <p className={`text-xs mt-1 opacity-60`}>{format(parseISO(c.date), 'HH:mm · dd MMM')}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {/* Comment input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText[ann.id] ?? ''}
                              onChange={(e) => setCommentText((prev) => ({ ...prev, [ann.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleComment(ann.id) }}
                              placeholder="Share your idea or question…"
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleComment(ann.id)}
                              disabled={!(commentText[ann.id] ?? '').trim()}
                              className="px-3 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white rounded-lg transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── REPORTS ── */}
          {tab === 'reports' && (
            <div className="space-y-4">
              {state.publishedReports.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No reports published yet</p>
                </div>
              )}
              {[...state.publishedReports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="font-bold text-gray-900">{r.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 mb-4">
                    {r.period} · Published {format(parseISO(r.publishedAt), 'dd MMM yyyy')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Savings</p>
                      <p className="font-bold text-green-700">{formatRWF(r.totalSavings)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Loans Issued</p>
                      <p className="font-bold text-blue-700">{formatRWF(r.totalLoansIssued)}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${r.overdueAmount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-500">Overdue</p>
                      <p className={`font-bold ${r.overdueAmount > 0 ? 'text-red-700' : 'text-gray-600'}`}>{formatRWF(r.overdueAmount)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Cash Position</p>
                      <p className="font-bold text-blue-700">{formatRWF(r.cashPosition)}</p>
                    </div>
                  </div>
                  {r.notes && <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── LOAN REQUEST ── */}
          {tab === 'loan-request' && (
            <div className="space-y-4">
              {/* Past requests */}
              {myRequests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">My Requests</p>
                  {myRequests.map((req) => (
                    <div key={req.id} className={`bg-white rounded-xl border p-4 ${req.status === 'pending' ? 'border-orange-200' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{formatRWF(req.amount)}</p>
                          <p className="text-gray-500 text-sm">{req.purpose}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{format(parseISO(req.requestedAt), 'dd MMM yyyy · HH:mm')}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                          req.status === 'pending' ? 'bg-orange-100 text-orange-700'
                          : req.status === 'approved' ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        }`}>{req.status}</span>
                      </div>
                      {req.reviewNotes && (
                        <p className={`text-sm mt-2 pt-2 border-t border-gray-50 ${req.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                          Leader note: {req.reviewNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Request form */}
              {hasPendingRequest ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
                  <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="font-semibold text-orange-800">Request Under Review</p>
                  <p className="text-orange-600 text-sm mt-1">Your pending loan request is being reviewed by the group leader. You will be notified of the decision.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-1">Submit a Loan Request</h2>
                  <p className="text-gray-500 text-sm mb-4">Your request will be reviewed by the group leader.</p>

                  {risk === 'HIGH RISK' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                      <strong>Note:</strong> Your account is HIGH RISK due to an overdue loan. Loan requests may be declined until outstanding balances are settled.
                    </div>
                  )}

                  <form onSubmit={handleLoanRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested (RWF) *</label>
                      <input
                        type="number"
                        value={loanReqForm.amount}
                        onChange={(e) => setLoanReqForm({ ...loanReqForm, amount: e.target.value })}
                        placeholder="e.g. 100000"
                        min="1"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                      <textarea
                        value={loanReqForm.purpose}
                        onChange={(e) => setLoanReqForm({ ...loanReqForm, purpose: e.target.value })}
                        placeholder="Explain why you need this loan and how you will repay it…"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      />
                    </div>
                    <button type="submit" className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg font-semibold transition-colors">
                      Submit Request
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
