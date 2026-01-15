'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { useIssueStore } from '@/stores/issueStore'
import {
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Filter,
  X,
  Tag,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface TagData {
  id: string
  name: string
  color: string
}

const priorityConfig = {
  CRITICAL: { icon: AlertCircle, color: 'text-red-500', label: 'Critical' },
  HIGH: { icon: ArrowUp, color: 'text-orange-500', label: 'High' },
  MEDIUM: { icon: Minus, color: 'text-yellow-500', label: 'Medium' },
  LOW: { icon: ArrowDown, color: 'text-blue-500', label: 'Low' },
  NONE: { icon: Minus, color: 'text-slate-500', label: 'None' },
}

const stateStyles = {
  OPEN: 'bg-green-500/10 text-green-400 border-green-500/30',
  CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

export default function IssuesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [availableTags, setAvailableTags] = useState<TagData[]>([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const allIssues = useIssueStore((state) => state.issues)
  const filters = useIssueStore((state) => state.filters)
  const fetchIssues = useIssueStore((state) => state.fetchIssues)
  const setFilters = useIssueStore((state) => state.setFilters)

  // Fetch available tags
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAvailableTags(data.data)
      })
  }, [])

  // Close tag dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Memoize filtered issues
  const issues = useMemo(() => {
    return allIssues.filter((issue) => {
      if (filters.state && filters.state !== 'all') {
        if (issue.state !== filters.state) return false
      }
      if (filters.priority && filters.priority !== 'all') {
        if (issue.priority !== filters.priority) return false
      }
      // Tag filter
      if (filters.tagIds && filters.tagIds.length > 0) {
        const issueTagIds = issue.tags.map((t) => t.tag.id)
        if (!filters.tagIds.some((id) => issueTagIds.includes(id))) return false
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        if (
          !issue.title.toLowerCase().includes(search) &&
          !issue.body?.toLowerCase().includes(search)
        ) {
          return false
        }
      }
      return true
    })
  }, [allIssues, filters])

  const toggleTagFilter = (tagId: string) => {
    const currentTags = filters.tagIds || []
    if (currentTags.includes(tagId)) {
      setFilters({ tagIds: currentTags.filter((id) => id !== tagId) })
    } else {
      setFilters({ tagIds: [...currentTags, tagId] })
    }
  }

  const clearTagFilters = () => {
    setFilters({ tagIds: [] })
  }

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  return (
    <>
      <Header
        title="Issues"
        onCreateIssue={() => router.push('/issues/new')}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Filters:</span>
          </div>

          <select
            value={filters.state || 'all'}
            onChange={(e) => setFilters({ state: e.target.value as 'OPEN' | 'CLOSED' | 'all' })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All States</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filters.priority || 'all'}
            onChange={(e) => setFilters({ priority: e.target.value as 'all' })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Tag Filter */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className={clsx(
                'flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500',
                filters.tagIds && filters.tagIds.length > 0 && 'ring-2 ring-indigo-500'
              )}
            >
              <Tag className="w-4 h-4" />
              Tags
              {filters.tagIds && filters.tagIds.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs px-1.5 rounded-full">
                  {filters.tagIds.length}
                </span>
              )}
            </button>

            {showTagDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
                  <span className="text-sm font-medium text-white">Filter by Tag</span>
                  {filters.tagIds && filters.tagIds.length > 0 && (
                    <button
                      onClick={clearTagFilters}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {availableTags.length === 0 ? (
                    <p className="text-sm text-slate-400 px-2 py-3 text-center">No tags available</p>
                  ) : (
                    availableTags.map((tag) => {
                      const isSelected = filters.tagIds?.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTagFilter(tag.id)}
                          className={clsx(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                            isSelected ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                          )}
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-white flex-1 text-left">{tag.name}</span>
                          {isSelected && (
                            <X className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active tag filters */}
          {filters.tagIds && filters.tagIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.tagIds.map((tagId) => {
                const tag = availableTags.find((t) => t.id === tagId)
                if (!tag) return null
                return (
                  <span
                    key={tagId}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                    <button
                      onClick={() => toggleTagFilter(tagId)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Issue List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Issue
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-28">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                  State
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-28">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-32">
                  Tags
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-32">
                  Updated
                </th>
                {session?.user?.role === 'ADMIN' && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {issues.map((issue) => {
                const priority = priorityConfig[issue.priority]
                const PriorityIcon = priority.icon

                return (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/issues/${issue.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm">
                          #{issue.githubId}
                        </span>
                        <span className="text-white font-medium">
                          {issue.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {issue.author ? (
                        <span className="text-sm text-slate-300">
                          {issue.author.name || issue.author.username}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full border',
                          stateStyles[issue.state]
                        )}
                      >
                        {issue.state}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PriorityIcon className={`w-4 h-4 ${priority.color}`} />
                        <span className="text-sm text-slate-300">
                          {priority.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {issue.tags.slice(0, 2).map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {issue.tags.length > 2 && (
                          <span className="text-xs text-slate-400">
                            +{issue.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDistanceToNow(new Date(issue.updatedAt), {
                        addSuffix: true,
                      })}
                    </td>
                    {session?.user?.role === 'ADMIN' && (
                      <td className="px-4 py-3">
                        <a
                          href={issue.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    )}
                  </tr>
                )
              })}

              {issues.length === 0 && (
                <tr>
                  <td colSpan={session?.user?.role === 'ADMIN' ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                    No issues found. Create your first issue to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </>
  )
}
