'use client'

import { useEffect, useMemo } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { useIssueStore } from '@/stores/issueStore'
import { IssueCard } from './IssueCard'
import { Loader2 } from 'lucide-react'
import { IssueWithRelations } from '@/types'

const COLUMNS = [
  { id: 'backlog', name: 'Backlog', color: 'bg-slate-500' },
  { id: 'todo', name: 'To Do', color: 'bg-blue-500' },
  { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-500' },
  { id: 'review', name: 'Review', color: 'bg-purple-500' },
  { id: 'done', name: 'Done', color: 'bg-green-500' },
]

interface KanbanBoardProps {
  onIssueClick?: (issueId: string) => void
}

export function KanbanBoard({ onIssueClick }: KanbanBoardProps) {
  const issues = useIssueStore((state) => state.issues)
  const filters = useIssueStore((state) => state.filters)
  const loading = useIssueStore((state) => state.loading)
  const error = useIssueStore((state) => state.error)
  const fetchIssues = useIssueStore((state) => state.fetchIssues)
  const moveIssue = useIssueStore((state) => state.moveIssue)

  // Memoize filtered and grouped issues
  const issuesByColumn = useMemo(() => {
    // Filter issues
    const filtered = issues.filter((issue) => {
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

    // Group by column
    const columns: Record<string, IssueWithRelations[]> = {
      backlog: [],
      todo: [],
      'in-progress': [],
      review: [],
      done: [],
    }

    filtered.forEach((issue) => {
      const column = issue.boardColumn || 'backlog'
      if (columns[column]) {
        columns[column].push(issue)
      } else {
        columns.backlog.push(issue)
      }
    })

    // Sort by position
    Object.keys(columns).forEach((key) => {
      columns[key].sort((a, b) => a.boardPosition - b.boardPosition)
    })

    return columns
  }, [issues, filters])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    moveIssue(draggableId, destination.droppableId, destination.index)
  }

  if (loading && !Object.values(issuesByColumn).some((col) => col.length > 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => fetchIssues()}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full p-6 overflow-x-auto">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-medium text-slate-200">{column.name}</h3>
              <span className="text-sm text-slate-400 ml-auto">
                {issuesByColumn[column.id]?.length || 0}
              </span>
            </div>

            {/* Column Content */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg p-2 transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-slate-700/50'
                      : 'bg-slate-800/50'
                  }`}
                >
                  <div className="space-y-3">
                    {issuesByColumn[column.id]?.map((issue, index) => (
                      <Draggable
                        key={issue.id}
                        draggableId={issue.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onIssueClick?.(issue.id)}
                          >
                            <IssueCard
                              issue={issue}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
