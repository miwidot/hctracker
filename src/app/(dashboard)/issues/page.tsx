'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { IssueDetailModal } from '@/components/issues/IssueDetailModal'
import { useIssueStore } from '@/stores/issueStore'
import {
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Filter,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const allIssues = useIssueStore((state) => state.issues)
  const filters = useIssueStore((state) => state.filters)
  const fetchIssues = useIssueStore((state) => state.fetchIssues)
  const setFilters = useIssueStore((state) => state.setFilters)

  // Memoize filtered issues
  const issues = useMemo(() => {
    return allIssues.filter((issue) => {
      if (filters.state && filters.state !== 'all') {
        if (issue.state !== filters.state) return false
      }
      if (filters.priority && filters.priority !== 'all') {
        if (issue.priority !== filters.priority) return false
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

  const selectedIssue = selectedIssueId
    ? allIssues.find((i) => i.id === selectedIssueId) || null
    : null

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  return (
    <>
      <Header
        title="Issues"
        onCreateIssue={() => setShowCreateModal(true)}
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
        </div>

        {/* Issue List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Issue
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
                    onClick={() => setSelectedIssueId(issue.id)}
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
                  <td colSpan={session?.user?.role === 'ADMIN' ? 6 : 5} className="px-4 py-12 text-center text-slate-400">
                    No issues found. Create your first issue to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateIssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <IssueDetailModal
        issue={selectedIssue}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </>
  )
}
