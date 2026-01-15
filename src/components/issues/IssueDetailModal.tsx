'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  X,
  Loader2,
  Send,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  Save,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { Priority } from '@prisma/client'
import { IssueWithRelations } from '@/types'
import { useIssueStore } from '@/stores/issueStore'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import clsx from 'clsx'

interface IssueDetailModalProps {
  issue: IssueWithRelations | null
  isOpen: boolean
  onClose: () => void
}

interface Comment {
  id: number
  body: string
  createdAt: string
  user: {
    login: string
    avatarUrl: string
  }
}

interface Tag {
  id: string
  name: string
  color: string
}

const priorityConfig = {
  CRITICAL: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical' },
  HIGH: { icon: ArrowUp, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'High' },
  MEDIUM: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium' },
  LOW: { icon: ArrowDown, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Low' },
  NONE: { icon: Minus, color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'None' },
}

export function IssueDetailModal({ issue, isOpen, onClose }: IssueDetailModalProps) {
  const { data: session } = useSession()
  const { updateIssue } = useIssueStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updatingState, setUpdatingState] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ title: '', body: '', priority: 'MEDIUM' as Priority })
  const [saving, setSaving] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [currentState, setCurrentState] = useState<'OPEN' | 'CLOSED'>('OPEN')

  const isAdmin = session?.user?.role === 'ADMIN'

  // Fetch comments when issue changes
  useEffect(() => {
    if (issue && isOpen) {
      setLoadingComments(true)
      setCurrentState(issue.state)
      setEditData({
        title: issue.title,
        body: issue.body || '',
        priority: issue.priority,
      })
      setSelectedTagIds(issue.tags.map((t) => t.tag.id))

      // Fetch comments
      fetch(`/api/issues/${issue.id}/comments`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setComments(data.data)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingComments(false))

      // Fetch available tags
      fetch('/api/tags')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setAvailableTags(data.data)
          }
        })
        .catch(console.error)
    }
  }, [issue, isOpen])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !issue) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/issues/${issue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment }),
      })
      const data = await response.json()
      if (data.success) {
        setComments([...comments, data.data])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleToggleState = async () => {
    if (!issue) return

    setUpdatingState(true)
    try {
      const newState = currentState === 'OPEN' ? 'CLOSED' : 'OPEN'
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      })
      const data = await response.json()
      if (data.success) {
        setCurrentState(newState)
        updateIssue(data.data)
      }
    } catch (error) {
      console.error('Error updating issue state:', error)
    } finally {
      setUpdatingState(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!issue) return

    setSaving(true)
    try {
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title,
          body: editData.body,
          priority: editData.priority,
          tagIds: selectedTagIds,
        }),
      })
      const data = await response.json()
      if (data.success) {
        updateIssue(data.data)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving issue:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  if (!isOpen || !issue) return null

  const priority = priorityConfig[issue.priority]
  const PriorityIcon = priority.icon

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex-1 min-w-0 pr-4">
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <h2 className="text-lg font-semibold text-white">{issue.title}</h2>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
              <span>#{issue.githubId}</span>
              <span>Created {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
              {isAdmin && issue.githubUrl && (
                <a
                  href={issue.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  GitHub
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-white rounded"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6 border-r border-slate-700">
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
              {isEditing ? (
                <MarkdownEditor
                  value={editData.body}
                  onChange={(value) => setEditData({ ...editData, body: value })}
                  placeholder="Add a description..."
                  minHeight={200}
                />
              ) : (
                <div className="bg-slate-700/50 rounded-lg p-4 min-h-[100px]">
                  <MarkdownPreview content={issue.body || ''} />
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                Comments {comments.length > 0 && `(${comments.length})`}
              </h3>

              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4 text-center">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {comment.user.login[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{comment.user.login}</span>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-sm">
                          <MarkdownPreview content={comment.body || ''} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <MarkdownEditor
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Add a comment..."
                  minHeight={200}
                  preview="live"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 p-6 space-y-6">
            {/* State */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
              <button
                onClick={handleToggleState}
                disabled={updatingState}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm w-full justify-center transition-colors',
                  currentState === 'OPEN'
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                )}
              >
                {updatingState ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentState === 'OPEN' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Open
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Closed
                  </>
                )}
              </button>
            </div>

            {/* Priority */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Priority</h3>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as Priority[]).map((p) => {
                    const config = priorityConfig[p]
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditData({ ...editData, priority: p })}
                        className={clsx(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          editData.priority === p
                            ? 'bg-indigo-600 text-white'
                            : `${config.bg} ${config.color}`
                        )}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${priority.bg}`}>
                  <PriorityIcon className={`w-4 h-4 ${priority.color}`} />
                  <span className={`text-sm font-medium ${priority.color}`}>{priority.label}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Tags</h3>
              {isEditing ? (
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium transition-all',
                        selectedTagIds.includes(tag.id) && 'ring-2 ring-offset-1 ring-offset-slate-800'
                      )}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        ...(selectedTagIds.includes(tag.id) && { ringColor: tag.color }),
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : issue.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {issue.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No tags</p>
              )}
            </div>

            {/* Assignees */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Assignees</h3>
              {issue.assignments.length > 0 ? (
                <div className="space-y-2">
                  {issue.assignments.map(({ user }) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {(user.name || user.username)[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300">{user.name || user.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No assignees</p>
              )}
            </div>

            {/* Due Date */}
            {issue.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Due Date</h3>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(issue.dueDate), 'PPP')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
