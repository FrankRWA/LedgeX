export interface Member {
  id: string
  name: string
  phone: string
  email: string
  role: 'admin' | 'treasurer' | 'member'
  joinedDate: string
  password?: string
  avatar?: string
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

export interface Announcement {
  id: string
  title: string
  content: string
  publishedAt: string
  pinned: boolean
}

export interface AnnouncementComment {
  id: string
  announcementId: string
  memberId: string
  content: string
  date: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  description?: string
  attendees: string[]
  finesIssued: boolean
}

export interface Fine {
  id: string
  memberId: string
  meetingId: string
  meetingTitle: string
  amount: number
  date: string
  settled: boolean
}

export interface Notification {
  id: string
  memberId: string
  type: 'fine' | 'loan_approved' | 'loan_rejected'
  title: string
  message: string
  date: string
  read: boolean
}

export interface PublishedReport {
  id: string
  title: string
  period: string
  publishedAt: string
  totalSavings: number
  totalLoansIssued: number
  overdueAmount: number
  cashPosition: number
  notes?: string
}

export interface LoanRequest {
  id: string
  memberId: string
  amount: number
  purpose: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewNotes?: string
}

export interface FineSettings {
  missedAttendanceFine: number
  latePaymentInterestRate: number
}

export interface AppState {
  members: Member[]
  contributions: Contribution[]
  loans: Loan[]
  repayments: Repayment[]
  announcements: Announcement[]
  announcementComments: AnnouncementComment[]
  meetings: Meeting[]
  publishedReports: PublishedReport[]
  loanRequests: LoanRequest[]
  fines: Fine[]
  notifications: Notification[]
  fineSettings: FineSettings
  groupName: string
  groupLogo: string | null
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
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'DELETE_ANNOUNCEMENT'; payload: string }
  | { type: 'PIN_ANNOUNCEMENT'; payload: string }
  | { type: 'ADD_ANNOUNCEMENT_COMMENT'; payload: AnnouncementComment }
  | { type: 'ADD_MEETING'; payload: Meeting }
  | { type: 'UPDATE_MEETING'; payload: Meeting }
  | { type: 'DELETE_MEETING'; payload: string }
  | { type: 'PUBLISH_REPORT'; payload: PublishedReport }
  | { type: 'DELETE_PUBLISHED_REPORT'; payload: string }
  | { type: 'ADD_LOAN_REQUEST'; payload: LoanRequest }
  | { type: 'UPDATE_LOAN_REQUEST'; payload: LoanRequest }
  | { type: 'ISSUE_MEETING_FINES'; payload: { meetingId: string; fines: Fine[]; notifications: Notification[] } }
  | { type: 'SETTLE_FINE'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ'; payload: string }
  | { type: 'UPDATE_FINE_SETTINGS'; payload: FineSettings }
  | { type: 'UPDATE_GROUP_NAME'; payload: string }
  | { type: 'SET_GROUP_LOGO'; payload: string | null }
  | { type: 'SET_CURRENT_USER'; payload: { name: string; email: string } }
  | { type: 'SET_CURRENT_MEMBER'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'LOGOUT_MEMBER' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RECALCULATE_LOANS' }
