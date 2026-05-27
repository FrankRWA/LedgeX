import {
  Member, Contribution, Loan, Repayment,
  Announcement, AnnouncementComment, Meeting,
  PublishedReport, LoanRequest, FineSettings,
} from './types'

export const seedMembers: Member[] = [
  { id: 'm1', name: 'Uwimana Jean Pierre', phone: '+250788123456', email: 'jean@example.com', role: 'admin', joinedDate: '2024-01-15', password: 'jean2024' },
  { id: 'm2', name: 'Mukamana Grace', phone: '+250788234567', email: 'grace@example.com', role: 'treasurer', joinedDate: '2024-01-15', password: 'grace2024' },
  { id: 'm3', name: 'Habimana Patrick', phone: '+250788345678', email: 'patrick@example.com', role: 'member', joinedDate: '2024-01-20', password: 'patrick2024' },
  { id: 'm4', name: 'Umurungi Celestine', phone: '+250788456789', email: 'celestine@example.com', role: 'member', joinedDate: '2024-02-01', password: 'celestine2024' },
  { id: 'm5', name: 'Nkurunziza Eric', phone: '+250788567890', email: 'eric@example.com', role: 'member', joinedDate: '2024-02-01', password: 'eric2024' },
  { id: 'm6', name: 'Iradukunda Alice', phone: '+250788678901', email: 'alice@example.com', role: 'member', joinedDate: '2024-02-10', password: 'alice2024' },
  { id: 'm7', name: 'Mutabazi David', phone: '+250788789012', email: 'david@example.com', role: 'member', joinedDate: '2024-03-01', password: 'david2024' },
  { id: 'm8', name: 'Nyirahabimana Rose', phone: '+250788890123', email: 'rose@example.com', role: 'member', joinedDate: '2024-03-15', password: 'rose2024' },
]

export const seedContributions: Contribution[] = [
  { id: 'c1', memberId: 'm1', amount: 50000, date: '2024-01-31', notes: 'January contribution' },
  { id: 'c2', memberId: 'm2', amount: 50000, date: '2024-01-31', notes: 'January contribution' },
  { id: 'c3', memberId: 'm3', amount: 50000, date: '2024-01-31', notes: 'January contribution' },
  { id: 'c4', memberId: 'm4', amount: 50000, date: '2024-01-31', notes: 'January contribution' },
  { id: 'c5', memberId: 'm5', amount: 50000, date: '2024-01-31', notes: 'January contribution' },
  { id: 'c6', memberId: 'm6', amount: 50000, date: '2024-01-31', notes: 'January contribution' },
  { id: 'c7', memberId: 'm1', amount: 50000, date: '2024-02-29', notes: 'February contribution' },
  { id: 'c8', memberId: 'm2', amount: 50000, date: '2024-02-29', notes: 'February contribution' },
  { id: 'c9', memberId: 'm3', amount: 50000, date: '2024-02-29', notes: 'February contribution' },
  { id: 'c10', memberId: 'm4', amount: 50000, date: '2024-02-29', notes: 'February contribution' },
  { id: 'c11', memberId: 'm5', amount: 50000, date: '2024-02-29', notes: 'February contribution' },
  { id: 'c12', memberId: 'm7', amount: 50000, date: '2024-03-31', notes: 'March contribution' },
  { id: 'c13', memberId: 'm8', amount: 50000, date: '2024-03-31', notes: 'March contribution' },
  { id: 'c14', memberId: 'm1', amount: 50000, date: '2024-03-31', notes: 'March contribution' },
  { id: 'c15', memberId: 'm2', amount: 50000, date: '2024-03-31', notes: 'March contribution' },
  { id: 'c16', memberId: 'm3', amount: 75000, date: '2024-04-30', notes: 'April contribution' },
  { id: 'c17', memberId: 'm6', amount: 50000, date: '2024-04-30', notes: 'April contribution' },
  { id: 'c18', memberId: 'm1', amount: 50000, date: '2024-04-30', notes: 'April contribution' },
]

export const seedLoans: Loan[] = [
  { id: 'l1', memberId: 'm3', amount: 200000, balance: 80000, status: 'active', issuedDate: '2024-02-15', dueDate: '2024-08-15', purpose: 'Business capital' },
  { id: 'l2', memberId: 'm5', amount: 150000, balance: 0, status: 'paid', issuedDate: '2024-01-20', dueDate: '2024-04-20', purpose: 'School fees' },
  { id: 'l3', memberId: 'm7', amount: 100000, balance: 100000, status: 'overdue', issuedDate: '2024-01-10', dueDate: '2024-03-10', purpose: 'Medical expenses' },
  { id: 'l4', memberId: 'm4', amount: 300000, balance: 250000, status: 'active', issuedDate: '2024-04-01', dueDate: '2024-10-01', purpose: 'Home improvement' },
  { id: 'l5', memberId: 'm8', amount: 80000, balance: 80000, status: 'overdue', issuedDate: '2024-02-01', dueDate: '2024-04-01', purpose: 'Agricultural inputs' },
]

export const seedRepayments: Repayment[] = [
  { id: 'r1', loanId: 'l1', amount: 60000, date: '2024-03-15' },
  { id: 'r2', loanId: 'l1', amount: 60000, date: '2024-04-15' },
  { id: 'r3', loanId: 'l2', amount: 50000, date: '2024-02-20' },
  { id: 'r4', loanId: 'l2', amount: 50000, date: '2024-03-20' },
  { id: 'r5', loanId: 'l2', amount: 50000, date: '2024-04-20' },
  { id: 'r6', loanId: 'l4', amount: 50000, date: '2024-05-01' },
]

export const seedAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'Monthly meeting — May 2024',
    content: 'Our monthly meeting will be held on Saturday 25 May 2024 at 10:00 AM at the community hall. All members are required to attend. Agenda: review April contributions, discuss pending loan requests, and elect a new committee member.',
    publishedAt: '2024-05-18T09:00:00Z',
    pinned: true,
  },
  {
    id: 'a2',
    title: 'Reminder: April contributions due',
    content: 'This is a reminder that April contributions of RWF 50,000 are due by 30 April 2024. Members who miss the deadline will be subject to a late fine as per group rules. Please contact Grace (Treasurer) to confirm payment.',
    publishedAt: '2024-04-22T08:30:00Z',
    pinned: false,
  },
  {
    id: 'a3',
    title: 'Welcome new members!',
    content: 'We are pleased to welcome Mutabazi David and Nyirahabimana Rose to IKIMINA Ubumwe. Please join us in welcoming them to our savings group. Their first contribution cycle begins in March 2024.',
    publishedAt: '2024-03-02T10:00:00Z',
    pinned: false,
  },
]

export const seedAnnouncementComments: AnnouncementComment[] = [
  { id: 'ac1', announcementId: 'a1', memberId: 'm3', content: 'Confirmed, I will attend. Will the loan request forms be available at the meeting?', date: '2024-05-18T11:20:00Z' },
  { id: 'ac2', announcementId: 'a1', memberId: 'm5', content: 'I will be there. Can we also discuss increasing the monthly contribution to grow our fund faster?', date: '2024-05-19T07:45:00Z' },
  { id: 'ac3', announcementId: 'a1', memberId: 'm6', content: 'Noted. I suggest we also discuss setting up an emergency fund for members facing hardship.', date: '2024-05-19T14:10:00Z' },
  { id: 'ac4', announcementId: 'a2', memberId: 'm4', content: 'Already paid. Thank you for the reminder!', date: '2024-04-23T09:00:00Z' },
]

export const seedMeetings: Meeting[] = [
  { id: 'mt1', title: 'January General Meeting', date: '2024-01-27', description: 'Inaugural meeting, election of officers, group rules discussion', attendees: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] },
  { id: 'mt2', title: 'February General Meeting', date: '2024-02-24', description: 'Review January contributions, approve first loan requests', attendees: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] },
  { id: 'mt3', title: 'March General Meeting', date: '2024-03-30', description: 'Welcome new members, review financials', attendees: ['m1', 'm2', 'm3', 'm4', 'm6', 'm7', 'm8'] },
  { id: 'mt4', title: 'April General Meeting', date: '2024-04-27', description: 'Quarterly review, loan repayment updates', attendees: ['m1', 'm2', 'm3', 'm5', 'm6', 'm7', 'm8'] },
]

export const seedPublishedReports: PublishedReport[] = [
  {
    id: 'pr1',
    title: 'Q1 2024 Financial Report',
    period: 'January – March 2024',
    publishedAt: '2024-04-01T10:00:00Z',
    totalSavings: 650000,
    totalLoansIssued: 450000,
    overdueAmount: 100000,
    cashPosition: 200000,
    notes: 'Strong first quarter. Loan repayment rate stands at 78%. Two loans currently overdue — follow-up in progress.',
  },
]

export const seedLoanRequests: LoanRequest[] = [
  { id: 'lr1', memberId: 'm6', amount: 120000, purpose: 'Purchase sewing machine for tailoring business', requestedAt: '2024-05-10T09:00:00Z', status: 'pending' },
  { id: 'lr2', memberId: 'm2', amount: 200000, purpose: 'School fees for university semester', requestedAt: '2024-05-12T14:30:00Z', status: 'pending' },
  { id: 'lr3', memberId: 'm5', amount: 80000, purpose: 'Medical bill for family member', requestedAt: '2024-04-15T11:00:00Z', status: 'approved', reviewNotes: 'Approved. Good repayment history.' },
]

export const seedFineSettings: FineSettings = {
  missedAttendanceFine: 5000,
  latePaymentInterestRate: 5,
}
