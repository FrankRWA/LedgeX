'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AppState, AppAction, Member, Loan } from './types'
import { seedMembers, seedContributions, seedLoans, seedRepayments } from './seedData'

const STORAGE_KEY = 'ledgex_state'

function recalculateLoans(state: AppState): AppState {
  const today = new Date()
  const updatedLoans = state.loans.map((loan) => {
    const totalRepaid = state.repayments
      .filter((r) => r.loanId === loan.id)
      .reduce((sum, r) => sum + r.amount, 0)
    const balance = Math.max(0, loan.amount - totalRepaid)
    let status: Loan['status'] = balance === 0 ? 'paid' : 'active'
    if (balance > 0 && new Date(loan.dueDate) < today) {
      status = 'overdue'
    }
    return { ...loan, balance, status }
  })
  return { ...state, loans: updatedLoans }
}

function reducer(state: AppState, action: AppAction): AppState {
  let newState: AppState

  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload

    case 'SET_CURRENT_USER':
      newState = { ...state, currentUser: action.payload }
      break

    case 'LOGOUT':
      newState = { ...state, currentUser: null }
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
      const newRepayments = [...state.repayments, action.payload]
      const stateWithRepayment = { ...state, repayments: newRepayments }
      newState = recalculateLoans(stateWithRepayment)
      break
    }

    case 'RECALCULATE_LOANS':
      newState = recalculateLoans(state)
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
  groupName: 'IKIMINA Ubumwe',
  currentUser: null,
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
          dispatch({ type: 'LOAD_STATE', payload: parsed })
        } catch {
          // ignore parse errors, keep initial state
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

// Selector helpers
export function getMemberById(members: Member[], id: string) {
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

export function formatRWF(amount: number) {
  return `RWF ${amount.toLocaleString('en-RW')}`
}
