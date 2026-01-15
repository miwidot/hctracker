import { create } from 'zustand'
import { IssueWithRelations, IssueFilters } from '@/types'

interface IssueStore {
  issues: IssueWithRelations[]
  loading: boolean
  error: string | null
  filters: IssueFilters

  setIssues: (issues: IssueWithRelations[]) => void
  addIssue: (issue: IssueWithRelations) => void
  updateIssue: (id: string, data: Partial<IssueWithRelations>) => void
  removeIssue: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<IssueFilters>) => void

  fetchIssues: (sync?: boolean) => Promise<void>
  moveIssue: (issueId: string, newColumn: string, newPosition: number) => Promise<void>
}

export const useIssueStore = create<IssueStore>((set, get) => ({
  issues: [],
  loading: false,
  error: null,
  filters: {
    state: 'OPEN',
    priority: 'all',
    tagIds: [],
    groupIds: [],
    assigneeIds: [],
    search: '',
  },

  setIssues: (issues) => set({ issues }),
  addIssue: (issue) => set((state) => ({ issues: [issue, ...state.issues] })),
  updateIssue: (id, data) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id ? { ...issue, ...data } : issue
      ),
    })),
  removeIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((issue) => issue.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  fetchIssues: async (sync = false) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/issues?sync=${sync}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch issues')
      }

      set({ issues: data.data, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch issues',
        loading: false,
      })
    }
  },

  moveIssue: async (issueId, newColumn, newPosition) => {
    const { issues } = get()
    const issue = issues.find((i) => i.id === issueId)
    if (!issue) return

    // Optimistic update
    set((state) => ({
      issues: state.issues.map((i) =>
        i.id === issueId
          ? { ...i, boardColumn: newColumn, boardPosition: newPosition }
          : i
      ),
    }))

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardColumn: newColumn,
          boardPosition: newPosition,
          // Auto-update state based on column
          state: newColumn === 'done' ? 'CLOSED' : 'OPEN',
        }),
      })

      if (!response.ok) {
        // Revert on error
        set((state) => ({
          issues: state.issues.map((i) =>
            i.id === issueId
              ? { ...i, boardColumn: issue.boardColumn, boardPosition: issue.boardPosition }
              : i
          ),
        }))
      }
    } catch {
      // Revert on error
      set((state) => ({
        issues: state.issues.map((i) =>
          i.id === issueId
            ? { ...i, boardColumn: issue.boardColumn, boardPosition: issue.boardPosition }
            : i
        ),
      }))
    }
  },
}))

// Selector for filtered issues
export const selectFilteredIssues = (state: IssueStore) => {
  const { issues, filters } = state

  return issues.filter((issue) => {
    // State filter
    if (filters.state && filters.state !== 'all') {
      if (issue.state !== filters.state) return false
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      if (issue.priority !== filters.priority) return false
    }

    // Tag filter
    if (filters.tagIds && filters.tagIds.length > 0) {
      const issueTagIds = issue.tags.map((t) => t.tag.id)
      if (!filters.tagIds.some((id) => issueTagIds.includes(id))) return false
    }

    // Group filter
    if (filters.groupIds && filters.groupIds.length > 0) {
      const issueGroupIds = issue.groups.map((g) => g.group.id)
      if (!filters.groupIds.some((id) => issueGroupIds.includes(id))) return false
    }

    // Assignee filter
    if (filters.assigneeIds && filters.assigneeIds.length > 0) {
      const issueAssigneeIds = issue.assignments.map((a) => a.user.id)
      if (!filters.assigneeIds.some((id) => issueAssigneeIds.includes(id))) return false
    }

    // Search filter
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
}

// Selector for issues grouped by column
export const selectIssuesByColumn = (state: IssueStore) => {
  const filtered = selectFilteredIssues(state)
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

  // Sort by position within each column
  Object.keys(columns).forEach((key) => {
    columns[key].sort((a, b) => a.boardPosition - b.boardPosition)
  })

  return columns
}
