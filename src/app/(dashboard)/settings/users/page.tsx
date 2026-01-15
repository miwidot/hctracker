'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Plus, Trash2, Shield, User, Loader2, Eye, EyeOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface UserData {
  id: string
  email: string
  username: string
  name: string | null
  role: string
  createdAt: string
  _count: { groups: number; assignedIssues: number }
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  MANAGER: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  MEMBER: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  VIEWER: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

export default function UsersSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    name: '',
    role: 'MEMBER',
  })

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/board')
    }
  }, [session, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create user')
        return
      }

      fetchUsers()
      setShowCreateForm(false)
      setFormData({ email: '', username: '', password: '', name: '', role: 'MEMBER' })
    } catch (err) {
      setError('Failed to create user')
    }
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return

    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== id))
      }
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
      }
    } catch (err) {
      console.error('Error updating role:', err)
    }
  }

  if (session?.user.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      <Header title="User Management" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Users</h2>
              <p className="text-sm text-slate-400">
                Manage user accounts and permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New User
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6"
            >
              <h3 className="text-white font-medium mb-4">Create New User</h3>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setError('')
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase w-32">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase w-28">
                      Issues
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase w-32">
                      Joined
                    </th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                            {(user.name || user.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.name || user.username}
                            </p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === session?.user.id}
                          className={`px-2 py-1 text-xs font-medium rounded-lg border bg-transparent focus:outline-none ${roleColors[user.role]} ${
                            user.id === session?.user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="MEMBER">Member</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {user._count.assignedIssues}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        {user.id !== session?.user.id && (
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            className="p-1 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
