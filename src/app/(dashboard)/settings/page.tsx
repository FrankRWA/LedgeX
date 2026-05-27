'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/lib/store'
import Toast from '@/components/Toast'
import { Settings, BookOpen, KeyRound, Eye, EyeOff, Save, Check, AlertCircle, Camera } from 'lucide-react'

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Group name
  const [groupName, setGroupName] = useState(state.groupName)
  const [groupNameSaved, setGroupNameSaved] = useState(false)

  // Group logo
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      dispatch({ type: 'SET_GROUP_LOGO', payload: reader.result as string })
      setToast({ msg: 'Group logo updated', type: 'success' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Fine settings
  const [fines, setFines] = useState(state.fineSettings)
  const [finesSaved, setFinesSaved] = useState(false)

  function saveFines(e: React.FormEvent) {
    e.preventDefault()
    if (fines.missedAttendanceFine < 0 || fines.latePaymentInterestRate < 0) {
      setToast({ msg: 'Values cannot be negative', type: 'error' })
      return
    }
    dispatch({ type: 'UPDATE_FINE_SETTINGS', payload: fines })
    setFinesSaved(true)
    setTimeout(() => setFinesSaved(false), 2000)
    setToast({ msg: 'Fine settings updated', type: 'success' })
  }

  function saveGroupName(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = groupName.trim()
    if (!trimmed) {
      setToast({ msg: 'Group name cannot be empty', type: 'error' })
      return
    }
    dispatch({ type: 'UPDATE_GROUP_NAME', payload: trimmed })
    setGroupNameSaved(true)
    setTimeout(() => setGroupNameSaved(false), 2000)
    setToast({ msg: 'Group name updated', type: 'success' })
  }

  // Per-member password state: { [memberId]: { value, show, saved } }
  const [pwdState, setPwdState] = useState<
    Record<string, { value: string; show: boolean; saved: boolean }>
  >(
    () =>
      Object.fromEntries(
        state.members.map((m) => [m.id, { value: m.password ?? '', show: false, saved: false }])
      )
  )

  function setPwd(id: string, value: string) {
    setPwdState((prev) => ({ ...prev, [id]: { ...prev[id], value } }))
  }

  function toggleShow(id: string) {
    setPwdState((prev) => ({ ...prev, [id]: { ...prev[id], show: !prev[id].show } }))
  }

  function savePwd(id: string) {
    const val = pwdState[id]?.value.trim()
    if (!val) {
      setToast({ msg: 'Password cannot be empty', type: 'error' })
      return
    }
    const member = state.members.find((m) => m.id === id)
    if (!member) return
    dispatch({ type: 'UPDATE_MEMBER', payload: { ...member, password: val } })
    setPwdState((prev) => ({ ...prev, [id]: { ...prev[id], saved: true } }))
    setTimeout(() =>
      setPwdState((prev) => ({ ...prev, [id]: { ...prev[id], saved: false } })),
      2000
    )
    setToast({ msg: `Password updated for ${member.name}`, type: 'success' })
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    treasurer: 'bg-blue-100 text-blue-700',
    member: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-500" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your group configuration and member access</p>
      </div>

      {/* Group Settings */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Group Information</h2>
            <p className="text-gray-400 text-xs">Shown across the platform and member portal</p>
          </div>
        </div>

        {/* Logo upload */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-blue-200">
              {state.groupLogo ? (
                <img src={state.groupLogo} alt="Group logo" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-8 h-8 text-blue-500" />
              )}
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-800 hover:bg-blue-900 rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Upload logo"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Group Logo</p>
            <p className="text-gray-400 text-xs mt-0.5">Shown in the sidebar and member portal</p>
            <button type="button" onClick={() => logoInputRef.current?.click()} className="mt-2 text-xs text-blue-700 hover:underline font-medium">
              {state.groupLogo ? 'Change logo' : 'Upload logo'}
            </button>
            {state.groupLogo && (
              <button type="button" onClick={() => { dispatch({ type: 'SET_GROUP_LOGO', payload: null }); setToast({ msg: 'Logo removed', type: 'success' }) }} className="ml-3 text-xs text-red-500 hover:underline">
                Remove
              </button>
            )}
          </div>
        </div>

        <form onSubmit={saveGroupName} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setGroupNameSaved(false) }}
              placeholder="e.g. IKIMINA Ubumwe"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              groupNameSaved
                ? 'bg-green-600 text-white'
                : 'bg-blue-800 hover:bg-blue-900 text-white'
            }`}
          >
            {groupNameSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </form>
      </section>

      {/* Member Passwords */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-orange-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Member Portal Passwords</h2>
            <p className="text-gray-400 text-xs">Set or update the password each member uses to log into their personal portal</p>
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4 mb-5">
          Share passwords privately with each member. They use their name + this password at the Member Login page.
        </p>

        <div className="space-y-3">
          {state.members.map((m) => {
            const pwd = pwdState[m.id] ?? { value: m.password ?? '', show: false, saved: false }
            const initials = m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div key={m.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                {/* Avatar */}
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-xs">{initials}</span>
                </div>

                {/* Name + role */}
                <div className="w-44 flex-shrink-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{m.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${roleColors[m.role]}`}>
                    {m.role}
                  </span>
                </div>

                {/* Password input */}
                <div className="flex-1 relative">
                  <input
                    type={pwd.show ? 'text' : 'password'}
                    value={pwd.value}
                    onChange={(e) => setPwd(m.id, e.target.value)}
                    placeholder="Set a password…"
                    className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); savePwd(m.id) } }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(m.id)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {pwd.show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={() => savePwd(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0 transition-all ${
                    pwd.saved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700'
                  }`}
                >
                  {pwd.saved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Fines & Interest */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Fines &amp; Interest Rates</h2>
            <p className="text-gray-400 text-xs">Applied automatically in attendance and loan calculations</p>
          </div>
        </div>

        <form onSubmit={saveFines} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Missed Attendance Fine (RWF)
              </label>
              <input
                type="number"
                min="0"
                value={fines.missedAttendanceFine}
                onChange={(e) => setFines({ ...fines, missedAttendanceFine: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Charged per member per missed meeting</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Late Payment Interest Rate (% / month)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={fines.latePaymentInterestRate}
                onChange={(e) => setFines({ ...fines, latePaymentInterestRate: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Applied to overdue loan balances monthly</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-500">
            Currently: <strong className="text-gray-700">RWF {state.fineSettings.missedAttendanceFine.toLocaleString()}</strong> per absence ·{' '}
            <strong className="text-gray-700">{state.fineSettings.latePaymentInterestRate}%/month</strong> late interest
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                finesSaved ? 'bg-green-600 text-white' : 'bg-blue-800 hover:bg-blue-900 text-white'
              }`}
            >
              {finesSaved ? <><Check className="w-4 h-4" />Saved</> : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </form>
      </section>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
