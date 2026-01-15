'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft,
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
  X,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { Priority } from '@prisma/client'
import { Header } from '@/components/layout/Header'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useIssueStore } from '@/stores/issueStore'
import clsx from 'clsx'

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

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const { issues, updateIssue, fetchIssues } = useIssueStore()

  const [loading, setLoading] = useState(true)
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

  const issue = issues.find((i) => i.id === id)
  const isAdmin = session?.user?.role === 'ADMIN'

  // Fetch issue if not in store
  useEffect(() => {
    if (issues.length === 0) {
      fetchIssues().then(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [issues.length, fetchIssues])

  // Initialize data when issue loads
  useEffect(() => {
    if (issue) {
      setCurrentState(issue.state)
      setEditData({
        title: issue.title,
        body: issue.body || '',
        priority: issue.priority,
      })
      setSelectedTagIds(issue.tags.map((t) => t.tag.id))

      // Fetch comments
      setLoadingComments(true)
      fetch(`/api/issues/${issue.id}/comments`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setComments(data.data)
        })
        .catch(console.error)
        .finally(() => setLoadingComments(false))

      // Fetch available tags
      fetch('/api/tags')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setAvailableTags(data.data)
        })
        .catch(console.error)
    }
  }, [issue])

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
        updateIssue(issue.id, data.data)
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
        updateIssue(issue.id, data.data)
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

  if (loading) {
    return (
      <>
        <Header title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </>
    )
  }

  if (!issue) {
    return (
      <>
        <Header title="Issue Not Found" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Issue not found</h2>
            <p className="text-slate-400 mb-4">The issue you're looking for doesn't exist.</p>
            <Link
              href="/issues"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Back to Issues
            </Link>
          </div>
        </div>
      </>
    )
  }

  const priority = priorityConfig[issue.priority]
  const PriorityIcon = priority.icon

  return (
    <>
      <Header title={`Issue #${issue.githubId}`} />

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {/* Back link */}
          <Link
            href="/issues"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Issues
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-slate-800 rounded-2xl border border-slate-700">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.title}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <h1 className="text-xl font-semibold text-white">{issue.title}</h1>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                        <span className="font-mono">#{issue.githubId}</span>
                        {issue.author && (
                          <span>by <span className="text-indigo-400">{issue.author.name || issue.author.username}</span></span>
                        )}
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

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 sm:p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-400">Description</h3>
                    {isEditing && (
                      <ImageUpload
                        onUpload={(url) => {
                          const imageMarkdown = `\n![image](${url})\n`
                          setEditData({ ...editData, body: editData.body + imageMarkdown })
                        }}
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <MarkdownEditor
                      value={editData.body}
                      onChange={(value) => setEditData({ ...editData, body: value })}
                      placeholder="Add a description..."
                      minHeight={250}
                    />
                  ) : (
                    <div className="bg-slate-700/30 rounded-xl p-4 min-h-[100px]">
                      {issue.body ? (
                        <MarkdownPreview content={issue.body} />
                      ) : (
                        <p className="text-slate-500 italic">No description provided</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-4">
                    Comments {comments.length > 0 && `(${comments.length})`}
                  </h3>

                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      {comments.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">No comments yet</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-700/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {comment.user.login[0].toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-white">{comment.user.login}</span>
                              <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="text-sm pl-10">
                              <MarkdownPreview content={comment.body || ''} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="space-y-4">
                    <MarkdownEditor
                      value={newComment}
                      onChange={setNewComment}
                      placeholder="Add a comment..."
                      minHeight={150}
                    />
                    <div className="flex justify-between items-center">
                      <ImageUpload
                        onUpload={(url) => {
                          const imageMarkdown = `\n![image](${url})\n`
                          setNewComment(newComment + imageMarkdown)
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-5 py-2.5 rounded-xl transition-colors"
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
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 space-y-4">
              {/* Status */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Status</h3>
                <button
                  onClick={handleToggleState}
                  disabled={updatingState}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm w-full justify-center transition-all',
                    currentState === 'OPEN'
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                  )}
                >
                  {updatingState ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : currentState === 'OPEN' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Open
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Closed
                    </>
                  )}
                </button>
              </div>

              {/* Priority */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Priority</h3>
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
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
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
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${priority.bg}`}>
                    <PriorityIcon className={`w-5 h-5 ${priority.color}`} />
                    <span className={`text-sm font-medium ${priority.color}`}>{priority.label}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Tags</h3>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : `${tag.color}20`,
                          color: selectedTagIds.includes(tag.id) ? '#fff' : tag.color,
                          boxShadow: selectedTagIds.includes(tag.id) ? `0 0 0 2px ${tag.color}` : 'none',
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                ) : issue.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {issue.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
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

              {/* Author */}
              {issue.author && (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Created by</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(issue.author.name || issue.author.username)[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300">{issue.author.name || issue.author.username}</span>
                  </div>
                </div>
              )}

              {/* Assignees */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Assignees</h3>
                {issue.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {issue.assignments.map(({ user }) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Due Date</h3>
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
    </>
  )
}
