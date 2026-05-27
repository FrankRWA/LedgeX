'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import {
  BookOpen,
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  CreditCard,
  FileBarChart,
  Megaphone,
  CalendarCheck,
  BarChart3,
  InboxIcon,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/contributions', label: 'Contributions', icon: ArrowDownCircle },
  { href: '/loans', label: 'Loans', icon: CreditCard },
  { href: '/loan-requests', label: 'Loan Requests', icon: InboxIcon },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/published-reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state, dispatch } = useApp()

  function handleLogout() {
    dispatch({ type: 'LOGOUT' })
    router.push('/')
  }

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-800" />
          </div>
          <div>
            <p className="font-bold text-lg leading-none">LedgeX</p>
            <p className="text-blue-300 text-xs mt-0.5 leading-none">{state.groupName}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 font-medium">{label}</span>
              {active && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-blue-800">
        {state.currentUser && (
          <div className="mb-3 px-3">
            <p className="text-white font-medium text-sm truncate">{state.currentUser.name}</p>
            <p className="text-blue-400 text-xs truncate">{state.currentUser.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
