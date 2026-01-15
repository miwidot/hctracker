'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Priority } from '@prisma/client'
import { Header } from '@/components/layout/Header'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { useIssueStore } from '@/stores/issueStore'

interface Tag {
  id: string
  name: string
  color: string
}

interface Group {
  id: string
  name: string
  color: string
}

export default function NewIssuePage() {
  const router = useRouter()
  const { addIssue } = useIssueStore()
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'MEDIUM' as Priority,
    tagIds: [] as string[],
    groupIds: [] as string[],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/tags').then((r) => r.json()),
      fetch('/api/groups').then((r) => r.json()),
    ]).then(([tagsData, groupsData]) => {
      if (tagsData.success) setTags(tagsData.data)
      if (groupsData.success) setGroups(groupsData.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        addIssue(data.data)
        router.push('/issues')
      }
    } catch (error) {
      console.error('Error creating issue:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  const toggleGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }))
  }

  return (
    <>
      <Header title="Create Issue" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Back link */}
          <Link
            href="/issues"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Issues
          </Link>

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-700">
              <h1 className="text-xl font-semibold text-white">New Issue</h1>
              <p className="text-sm text-slate-400 mt-1">Create a new issue to track</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <MarkdownEditor
                  value={formData.body}
                  onChange={(value) => setFormData({ ...formData, body: value })}
                  placeholder="Describe the issue in detail..."
                  minHeight={300}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.priority === p
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Tags {formData.tagIds.length > 0 && (
                      <span className="text-indigo-400">({formData.tagIds.length} selected)</span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = formData.tagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{
                            backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                            color: isSelected ? '#fff' : tag.color,
                            boxShadow: isSelected ? `0 4px 14px ${tag.color}40` : 'none',
                          }}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Groups */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Groups {formData.groupIds.length > 0 && (
                      <span className="text-indigo-400">({formData.groupIds.length} selected)</span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((group) => {
                      const isSelected = formData.groupIds.includes(group.id)
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{
                            backgroundColor: isSelected ? group.color : `${group.color}15`,
                            color: isSelected ? '#fff' : group.color,
                            boxShadow: isSelected ? `0 4px 14px ${group.color}40` : 'none',
                          }}
                        >
                          {group.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-700">
                <Link
                  href="/issues"
                  className="px-6 py-3 text-center text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
