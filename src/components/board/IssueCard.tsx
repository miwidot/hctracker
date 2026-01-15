'use client'

import { IssueWithRelations } from '@/types'
import {
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

interface IssueCardProps {
  issue: IssueWithRelations
  isDragging?: boolean
}

const priorityConfig = {
  CRITICAL: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  HIGH: { icon: ArrowUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  MEDIUM: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  LOW: { icon: ArrowDown, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  NONE: { icon: Minus, color: 'text-slate-500', bg: 'bg-slate-500/10' },
}

export function IssueCard({ issue, isDragging }: IssueCardProps) {
  const { data: session } = useSession()
  const priority = priorityConfig[issue.priority]
  const PriorityIcon = priority.icon
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div
      className={clsx(
        'bg-slate-700 rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-650 border border-transparent',
        isDragging && 'shadow-lg border-indigo-500/50 rotate-2'
      )}
    >
      {/* Header with Priority & GitHub Link (Admin only) */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`p-1 rounded ${priority.bg}`}>
          <PriorityIcon className={`w-4 h-4 ${priority.color}`} />
        </div>
        {isAdmin && (
          <a
            href={issue.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-slate-400 hover:text-white"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-white text-sm mb-2 line-clamp-2">
        {issue.title}
      </h4>

      {/* Tags */}
      {issue.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.tags.slice(0, 3).map(({ tag }) => (
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
          {issue.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-600 text-slate-300">
              +{issue.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">#{issue.githubId}</span>
          {issue.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Assignees */}
        {issue.assignments.length > 0 && (
          <div className="flex -space-x-2">
            {issue.assignments.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-slate-700"
                title={user.name || user.username}
              >
                {(user.name || user.username)[0].toUpperCase()}
              </div>
            ))}
            {issue.assignments.length > 3 && (
              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-slate-700">
                +{issue.assignments.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
