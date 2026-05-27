'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!state.currentUser) {
      router.push('/')
    }
  }, [state.currentUser, router])

  if (!state.currentUser) return null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
