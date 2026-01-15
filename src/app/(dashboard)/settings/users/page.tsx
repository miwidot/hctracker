'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Plus, Trash2, Loader2, Eye, EyeOff, Pencil, X } from 'lucide-react'
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
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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

  const resetForm = () => {
    setFormData({ email: '', username: '', password: '', name: '', role: 'MEMBER' })
    setShowPassword(false)
    setError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setSaving(false)
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
      resetForm()
    } catch {
      setError('Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setError('')
    setSaving(true)

    // Password validation only if password is being changed
    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          name: formData.name,
          role: formData.role,
          password: formData.password || undefined,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update user')
        return
      }

      fetchUsers()
      setEditingUser(null)
      resetForm()
    } catch {
      setError('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      username: user.username,
      name: user.name || '',
      role: user.role,
      password: '',
    })
    setError('')
    setShowPassword(false)
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return

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

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Users</h2>
              <p className="text-sm text-slate-400">
                Manage user accounts and permissions
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true)
                resetForm()
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New User
            </button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Create New User</h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      resetForm()
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="p-4 space-y-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="MEMBER">Member</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Edit User</h3>
                  <button
                    onClick={() => {
                      setEditingUser(null)
                      resetForm()
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEdit} className="p-4 space-y-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        disabled={editingUser.id === session?.user.id}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="MEMBER">Member</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {editingUser.id === session?.user.id && (
                        <p className="text-xs text-slate-500 mt-1">Cannot change your own role</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                      <span className="text-slate-500 font-normal ml-1">(leave empty to keep current)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Min. 8 characters"
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

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(null)
                        resetForm()
                      }}
                      className="px-4 py-2 text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
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
                      <th className="w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                              {(user.name || user.username)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">
                                {user.name || user.username}
                              </p>
                              <p className="text-sm text-slate-400 truncate">{user.email}</p>
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400"
                              title="Edit user"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {user.id !== session?.user.id && (
                              <button
                                onClick={() => handleDelete(user.id, user.username)}
                                className="p-1.5 text-slate-400 hover:text-red-400"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-slate-700">
                {users.map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                          {(user.name || user.username)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">
                            {user.name || user.username}
                          </p>
                          <p className="text-sm text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-slate-400 hover:text-indigo-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.id !== session?.user.id && (
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            className="p-2 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
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
                      <span className="text-xs text-slate-500">
                        {user._count.assignedIssues} issues
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
