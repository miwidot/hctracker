'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Plus, Trash2, Users, Loader2 } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  color: string
  _count: { users: number; issues: number }
  users: Array<{
    user: { id: string; username: string; name: string | null; avatar: string | null }
  }>
}

export default function GroupsSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/board')
    }
  }, [session, router])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
  })

  const fetchGroups = async () => {
    const response = await fetch('/api/groups')
    const data = await response.json()
    if (data.success) {
      setGroups(data.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await response.json()
    if (data.success) {
      setGroups([...groups, data.data])
      setShowCreateForm(false)
      setFormData({ name: '', description: '', color: '#6366f1' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    const response = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
    if (response.ok) {
      setGroups(groups.filter((g) => g.id !== id))
    }
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  ]

  if (session?.user.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      <Header title="Groups Settings" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl">
          {/* Create Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Groups</h2>
              <p className="text-sm text-slate-400">
                Organize users and issues into groups
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Group
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          formData.color === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Create Group
                </button>
              </div>
            </form>
          )}

          {/* Groups List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.length === 0 ? (
                <div className="bg-slate-800 rounded-xl border border-slate-700 px-6 py-12 text-center text-slate-400">
                  No groups yet. Create your first group to get started.
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${group.color}20` }}
                        >
                          <Users className="w-5 h-5" style={{ color: group.color }} />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-slate-400">{group.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-1 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <span>{group._count.users} members</span>
                      <span>{group._count.issues} issues</span>
                    </div>

                    {group.users.length > 0 && (
                      <div className="flex -space-x-2 mt-4">
                        {group.users.slice(0, 5).map(({ user }) => (
                          <div
                            key={user.id}
                            className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800"
                            title={user.name || user.username}
                          >
                            {(user.name || user.username)[0].toUpperCase()}
                          </div>
                        ))}
                        {group.users.length > 5 && (
                          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800">
                            +{group.users.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
