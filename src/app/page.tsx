'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { BookOpen, Shield, TrendingUp, Users } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { dispatch } = useApp()
  const router = useRouter()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    const displayName = name || email.split('@')[0]
    dispatch({ type: 'SET_CURRENT_USER', payload: { name: displayName, email } })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left — brand panel */}
        <div className="bg-blue-900 text-white p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-800" />
              </div>
              <span className="text-2xl font-bold">LedgeX</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Smart Digital Ledger for IKIMINA Groups
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Replace paper-based bookkeeping with a transparent, automated ledger that builds trust in your community.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {[
              { icon: Users, text: 'Member & role management' },
              { icon: TrendingUp, text: 'Automatic contribution tracking' },
              { icon: Shield, text: 'Transparent loan management' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-blue-100">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <p className="text-blue-400 text-sm mt-8">
            Demo: enter any email and password to continue
          </p>
        </div>

        {/* Right — login form */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your group dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jean Pierre"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              This is a demo application. Data is stored locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
