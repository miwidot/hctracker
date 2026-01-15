'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Priority } from '@prisma/client'
import { useIssueStore } from '@/stores/issueStore'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'

interface CreateIssueModalProps {
  isOpen: boolean
  onClose: () => void
}

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

export function CreateIssueModal({ isOpen, onClose }: CreateIssueModalProps) {
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
    if (isOpen) {
      // Fetch tags and groups
      Promise.all([
        fetch('/api/tags').then((r) => r.json()),
        fetch('/api/groups').then((r) => r.json()),
      ]).then(([tagsData, groupsData]) => {
        if (tagsData.success) setTags(tagsData.data)
        if (groupsData.success) setGroups(groupsData.data)
      })
    }
  }, [isOpen])

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
        onClose()
        setFormData({
          title: '',
          body: '',
          priority: 'MEDIUM',
          tagIds: [],
          groupIds: [],
        })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Create New Issue</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Issue title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Markdown supported)
            </label>
            <MarkdownEditor
              value={formData.body}
              onChange={(value) => setFormData({ ...formData, body: value })}
              placeholder="Describe the issue..."
              minHeight={250}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as Priority[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.priority === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags {formData.tagIds.length > 0 && `(${formData.tagIds.length} selected)`}
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = formData.tagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? tag.color : `${tag.color}20`,
                        color: isSelected ? '#fff' : tag.color,
                        boxShadow: isSelected ? `0 0 0 2px ${tag.color}` : 'none',
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Groups {formData.groupIds.length > 0 && `(${formData.groupIds.length} selected)`}
              </label>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => {
                  const isSelected = formData.groupIds.includes(group.id)
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? group.color : `${group.color}20`,
                        color: isSelected ? '#fff' : group.color,
                        boxShadow: isSelected ? `0 0 0 2px ${group.color}` : 'none',
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
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
