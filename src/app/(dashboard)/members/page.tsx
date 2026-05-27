'use client'

import { useState } from 'react'
import { useApp, formatRWF, getMemberContributions, getMemberLoans } from '@/lib/store'
import { Member } from '@/lib/types'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { Plus, Pencil, Trash2, Users, Shield, Coins } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { format, parseISO } from 'date-fns'

const ROLES: Member['role'][] = ['admin', 'treasurer', 'member']

const roleColors: Record<Member['role'], string> = {
  admin: 'bg-purple-100 text-purple-700',
  treasurer: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-700',
}

const roleIcons: Record<Member['role'], React.ElementType> = {
  admin: Shield,
  treasurer: Coins,
  member: Users,
}

function emptyForm() {
  return { name: '', phone: '', email: '', role: 'member' as Member['role'], joinedDate: format(new Date(), 'yyyy-MM-dd') }
}

export default function MembersPage() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(m: Member) {
    setEditTarget(m)
    setForm({ name: m.name, phone: m.phone, email: m.email, role: m.role, joinedDate: m.joinedDate })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setToast({ msg: 'Name is required', type: 'error' })
      return
    }
    if (editTarget) {
      dispatch({ type: 'UPDATE_MEMBER', payload: { ...editTarget, ...form } })
      setToast({ msg: 'Member updated successfully', type: 'success' })
    } else {
      dispatch({ type: 'ADD_MEMBER', payload: { id: uuidv4(), ...form } })
      setToast({ msg: 'Member added successfully', type: 'success' })
    }
    setShowForm(false)
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_MEMBER', payload: id })
    setDeleteConfirm(null)
    setToast({ msg: 'Member removed', type: 'success' })
  }

  const filtered = state.members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 mt-1">{state.members.length} members in {state.groupName}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members by name, phone, or email..."
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Contributions</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Active Loans</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((m) => {
              const contribs = getMemberContributions(state.contributions, m.id)
              const memberLoans = getMemberLoans(state.loans, m.id).filter((l) => l.status !== 'paid')
              const totalContrib = contribs.reduce((s, c) => s + c.amount, 0)
              const RoleIcon = roleIcons[m.role]
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-xs">
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-gray-400 text-xs">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[m.role]}`}>
                      <RoleIcon className="w-3 h-3" />
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">
                    {formatRWF(totalContrib)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {memberLoans.length > 0 ? (
                      <span className="text-blue-700 font-medium">{memberLoans.length}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {format(parseISO(m.joinedDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(m.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editTarget ? 'Edit Member' : 'Add New Member'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Uwimana Jean Pierre"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+250788000000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="member@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Member['role'] })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                <input
                  type="date"
                  value={form.joinedDate}
                  onChange={(e) => setForm({ ...form, joinedDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                {editTarget ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Remove Member" onClose={() => setDeleteConfirm(null)} size="sm">
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove{' '}
            <strong>{state.members.find((m) => m.id === deleteConfirm)?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              Remove
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
