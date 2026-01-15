'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Plus, Trash2, Edit2, X, Check, Loader2, RefreshCw, Github, ShieldAlert } from 'lucide-react'

interface Tag {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  category: string | null
  _count: { issues: number }
}

export default function TagsSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ imported: number; exported: number; deleted: number } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    category: '',
  })

  const isAdmin = session?.user?.role === 'ADMIN'

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.push('/board')
    }
  }, [status, isAdmin, router])

  // Show access denied for non-admin
  if (status === 'authenticated' && !isAdmin) {
    return (
      <>
        <Header title="Access Denied" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-400">You don't have permission to access this page.</p>
          </div>
        </div>
      </>
    )
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/tags/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'both' }),
      })
      const data = await response.json()
      if (data.success) {
        setSyncResult(data.data)
        fetchTags() // Refresh tags list
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  const fetchTags = async () => {
    const response = await fetch('/api/tags')
    const data = await response.json()
    if (data.success) {
      setTags(data.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await response.json()
    if (data.success) {
      setTags([...tags, data.data])
      setShowCreateForm(false)
      setFormData({ name: '', description: '', color: '#3b82f6', category: '' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    if (response.ok) {
      setTags(tags.filter((t) => t.id !== id))
    }
  }

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  ]

  return (
    <>
      <Header title="Tags Settings" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl">
          {/* Sync Result Message */}
          {syncResult && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <p className="text-green-400">
                Sync complete: {syncResult.imported} imported, {syncResult.exported} exported, {syncResult.deleted} deleted from GitHub
              </p>
            </div>
          )}

          {/* Header with buttons */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Tags</h2>
              <p className="text-sm text-slate-400">
                Manage custom tags for organizing issues
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Github className="w-4 h-4" />
                  )}
                  Sync with GitHub
                </button>
              )}
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Tag
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., type, priority, status"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  Create Tag
                </button>
              </div>
            </form>
          )}

          {/* Tags List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {tags.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  No tags yet. Create your first tag to get started.
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{tag.name}</span>
                            {tag.category && (
                              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                                {tag.category}
                              </span>
                            )}
                          </div>
                          {tag.description && (
                            <p className="text-sm text-slate-400">{tag.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">
                          {tag._count.issues} issues
                        </span>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
