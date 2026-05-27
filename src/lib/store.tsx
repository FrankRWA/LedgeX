'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AppState, AppAction, Member, Loan } from './types'
import {
  seedMembers, seedContributions, seedLoans, seedRepayments,
  seedAnnouncements, seedAnnouncementComments, seedMeetings,
  seedPublishedReports, seedLoanRequests, seedFineSettings,
} from './seedData'

const STORAGE_KEY = 'ledgex_state'

function recalculateLoans(state: AppState): AppState {
  const today = new Date()
  const updatedLoans = state.loans.map((loan) => {
    const totalRepaid = state.repayments
      .filter((r) => r.loanId === loan.id)
      .reduce((sum, r) => sum + r.amount, 0)
    const balance = Math.max(0, loan.amount - totalRepaid)
    let status: Loan['status'] = balance === 0 ? 'paid' : 'active'
    if (balance > 0 && new Date(loan.dueDate) < today) status = 'overdue'
    return { ...loan, balance, status }
  })
  return { ...state, loans: updatedLoans }
}

function reducer(state: AppState, action: AppAction): AppState {
  let newState: AppState

  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload

    case 'UPDATE_GROUP_NAME':
      newState = { ...state, groupName: action.payload }
      break

    case 'UPDATE_FINE_SETTINGS':
      newState = { ...state, fineSettings: action.payload }
      break

    case 'SET_CURRENT_USER':
      newState = { ...state, currentUser: action.payload }
      break

    case 'SET_CURRENT_MEMBER':
      newState = { ...state, currentMemberId: action.payload }
      break

    case 'LOGOUT':
      newState = { ...state, currentUser: null }
      break

    case 'LOGOUT_MEMBER':
      newState = { ...state, currentMemberId: null }
      break

    case 'ADD_MEMBER':
      newState = { ...state, members: [...state.members, action.payload] }
      break

    case 'UPDATE_MEMBER':
      newState = {
        ...state,
        members: state.members.map((m) => (m.id === action.payload.id ? action.payload : m)),
      }
      break

    case 'DELETE_MEMBER':
      newState = { ...state, members: state.members.filter((m) => m.id !== action.payload) }
      break

    case 'ADD_CONTRIBUTION':
      newState = { ...state, contributions: [...state.contributions, action.payload] }
      break

    case 'DELETE_CONTRIBUTION':
      newState = { ...state, contributions: state.contributions.filter((c) => c.id !== action.payload) }
      break

    case 'ADD_LOAN':
      newState = { ...state, loans: [...state.loans, action.payload] }
      break

    case 'UPDATE_LOAN':
      newState = {
        ...state,
        loans: state.loans.map((l) => (l.id === action.payload.id ? action.payload : l)),
      }
      break

    case 'ADD_REPAYMENT': {
      const withRepayment = { ...state, repayments: [...state.repayments, action.payload] }
      newState = recalculateLoans(withRepayment)
      break
    }

    case 'RECALCULATE_LOANS':
      newState = recalculateLoans(state)
      break

    case 'ADD_ANNOUNCEMENT':
      newState = { ...state, announcements: [action.payload, ...state.announcements] }
      break

    case 'DELETE_ANNOUNCEMENT':
      newState = {
        ...state,
        announcements: state.announcements.filter((a) => a.id !== action.payload),
        announcementComments: state.announcementComments.filter((c) => c.announcementId !== action.payload),
      }
      break

    case 'PIN_ANNOUNCEMENT':
      newState = {
        ...state,
        announcements: state.announcements.map((a) =>
          a.id === action.payload ? { ...a, pinned: !a.pinned } : a
        ),
      }
      break

    case 'ADD_ANNOUNCEMENT_COMMENT':
      newState = { ...state, announcementComments: [...state.announcementComments, action.payload] }
      break

    case 'ADD_MEETING':
      newState = { ...state, meetings: [action.payload, ...state.meetings] }
      break

    case 'UPDATE_MEETING':
      newState = {
        ...state,
        meetings: state.meetings.map((m) => (m.id === action.payload.id ? action.payload : m)),
      }
      break

    case 'DELETE_MEETING':
      newState = { ...state, meetings: state.meetings.filter((m) => m.id !== action.payload) }
      break

    case 'PUBLISH_REPORT':
      newState = { ...state, publishedReports: [action.payload, ...state.publishedReports] }
      break

    case 'DELETE_PUBLISHED_REPORT':
      newState = { ...state, publishedReports: state.publishedReports.filter((r) => r.id !== action.payload) }
      break

    case 'ADD_LOAN_REQUEST':
      newState = { ...state, loanRequests: [action.payload, ...state.loanRequests] }
      break

    case 'UPDATE_LOAN_REQUEST':
      newState = {
        ...state,
        loanRequests: state.loanRequests.map((r) => (r.id === action.payload.id ? action.payload : r)),
      }
      break

    default:
      return state
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
  }
  return newState
}

const initialState: AppState = {
  members: seedMembers,
  contributions: seedContributions,
  loans: seedLoans,
  repayments: seedRepayments,
  announcements: seedAnnouncements,
  announcementComments: seedAnnouncementComments,
  meetings: seedMeetings,
  publishedReports: seedPublishedReports,
  loanRequests: seedLoanRequests,
  fineSettings: seedFineSettings,
  groupName: 'IKIMINA Ubumwe',
  currentUser: null,
  currentMemberId: null,
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as AppState
          // back-fill new fields that old stored state may lack
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              ...initialState,
              ...parsed,
              announcements: parsed.announcements ?? initialState.announcements,
              announcementComments: parsed.announcementComments ?? initialState.announcementComments,
              meetings: parsed.meetings ?? initialState.meetings,
              publishedReports: parsed.publishedReports ?? initialState.publishedReports,
              loanRequests: parsed.loanRequests ?? initialState.loanRequests,
              fineSettings: parsed.fineSettings ?? initialState.fineSettings,
            },
          })
        } catch {
          // ignore, keep initial state
        }
      }
    }
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

// ── Selector helpers ────────────────────────────────────────────────────────

export function getMemberById(members: AppState['members'], id: string) {
  return members.find((m) => m.id === id)
}

export function getTotalSavings(contributions: AppState['contributions']) {
  return contributions.reduce((sum, c) => sum + c.amount, 0)
}

export function getActiveLoans(loans: AppState['loans']) {
  return loans.filter((l) => l.status === 'active' || l.status === 'overdue')
}

export function getOverdueLoans(loans: AppState['loans']) {
  return loans.filter((l) => l.status === 'overdue')
}

export function getMemberContributions(contributions: AppState['contributions'], memberId: string) {
  return contributions.filter((c) => c.memberId === memberId)
}

export function getMemberLoans(loans: AppState['loans'], memberId: string) {
  return loans.filter((l) => l.memberId === memberId)
}

export function getLoanRepayments(repayments: AppState['repayments'], loanId: string) {
  return repayments.filter((r) => r.loanId === loanId)
}

export function getMemberRiskStatus(
  loans: AppState['loans'],
  repayments: AppState['repayments'],
  memberId: string
): 'HIGH RISK' | 'MEDIUM RISK' | 'ACTIVE' | 'NEW' {
  const memberLoans = loans.filter((l) => l.memberId === memberId)
  if (memberLoans.length === 0) return 'NEW'
  const overdue = memberLoans.filter((l) => l.status === 'overdue')
  if (overdue.length > 0) return 'HIGH RISK'
  const activeLoans = memberLoans.filter((l) => l.status === 'active')
  if (activeLoans.length > 0) {
    const anyPartlyRepaid = activeLoans.some((l) => {
      const paid = l.amount - l.balance
      return paid / l.amount < 0.3
    })
    if (anyPartlyRepaid) return 'MEDIUM RISK'
  }
  return 'ACTIVE'
}

export function formatRWF(amount: number) {
  return `RWF ${amount.toLocaleString('en-RW')}`
}
