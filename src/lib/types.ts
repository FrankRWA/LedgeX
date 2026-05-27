export interface Member {
  id: string
  name: string
  phone: string
  email: string
  role: 'admin' | 'treasurer' | 'member'
  joinedDate: string
  password?: string
}

export interface Contribution {
  id: string
  memberId: string
  amount: number
  date: string
  notes?: string
}

export interface Loan {
  id: string
  memberId: string
  amount: number
  balance: number
  status: 'active' | 'paid' | 'overdue'
  issuedDate: string
  dueDate: string
  purpose?: string
}

export interface Repayment {
  id: string
  loanId: string
  amount: number
  date: string
}

export interface AppState {
  members: Member[]
  contributions: Contribution[]
  loans: Loan[]
  repayments: Repayment[]
  groupName: string
  currentUser: { name: string; email: string } | null
  currentMemberId: string | null
}

export type AppAction =
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'ADD_CONTRIBUTION'; payload: Contribution }
  | { type: 'DELETE_CONTRIBUTION'; payload: string }
  | { type: 'ADD_LOAN'; payload: Loan }
  | { type: 'UPDATE_LOAN'; payload: Loan }
  | { type: 'ADD_REPAYMENT'; payload: Repayment }
  | { type: 'SET_CURRENT_USER'; payload: { name: string; email: string } }
  | { type: 'SET_CURRENT_MEMBER'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'LOGOUT_MEMBER' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RECALCULATE_LOANS' }
