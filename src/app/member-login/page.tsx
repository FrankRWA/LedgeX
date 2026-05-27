'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/store'
import { BookOpen, UserCircle, ArrowLeft } from 'lucide-react'

export default function MemberLoginPage() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedId) {
      setError('Please select your name')
      return
    }

    const member = state.members.find((m) => m.id === selectedId)
    if (!member) {
      setError('Member not found')
      return
    }

    if (!member.password) {
      setError('Your account has no password set. Ask your group leader to set one.')
      return
    }

    if (password !== member.password) {
      setError('Incorrect password. Please try again or contact your group leader.')
      return
    }

    dispatch({ type: 'SET_CURRENT_MEMBER', payload: member.id })
    router.push('/portal')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leader Login
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-800 px-8 pt-8 pb-6 text-white text-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-8 h-8" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 opacity-70" />
              <span className="text-blue-200 text-sm font-medium">LedgeX</span>
            </div>
            <h1 className="text-2xl font-bold">Member Login</h1>
            <p className="text-blue-200 text-sm mt-1">{state.groupName}</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Your Name
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => { setSelectedId(e.target.value); setError('') }}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="">Choose your name...</option>
                  {state.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Password provided by your group leader
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                View My Account
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Don&apos;t have a password?{' '}
              <span className="font-medium">Contact {state.groupName} leader</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
