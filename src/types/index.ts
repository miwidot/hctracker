import { Issue, Tag, Group, User, Priority, IssueState } from '@prisma/client'

// Extended Issue type with relations
export interface IssueWithRelations extends Issue {
  author?: Pick<User, 'id' | 'username' | 'name' | 'avatar'> | null
  tags: Array<{
    tag: Tag
  }>
  groups: Array<{
    group: Group
  }>
  assignments: Array<{
    user: Pick<User, 'id' | 'username' | 'name' | 'avatar'>
  }>
}

// Board column type
export interface BoardColumn {
  id: string
  name: string
  slug: string
  color: string
  issues: IssueWithRelations[]
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Form types
export interface CreateIssueForm {
  title: string
  body?: string
  priority: Priority
  tags?: string[]
  groupIds?: string[]
  assigneeIds?: string[]
}

export interface UpdateIssueForm {
  title?: string
  body?: string
  priority?: Priority
  state?: IssueState
  boardColumn?: string
  tags?: string[]
  groupIds?: string[]
  assigneeIds?: string[]
  dueDate?: Date | null
  estimatedHours?: number | null
}

// Filter types
export interface IssueFilters {
  state?: IssueState | 'all'
  priority?: Priority | 'all'
  tagIds?: string[]
  groupIds?: string[]
  assigneeIds?: string[]
  search?: string
}

// Stats type
export interface DashboardStats {
  totalIssues: number
  openIssues: number
  closedIssues: number
  criticalIssues: number
  issuesByPriority: Record<Priority, number>
  issuesByColumn: Record<string, number>
  recentActivity: number
}

// User session type
export interface UserSession {
  id: string
  email: string
  username: string
  name: string | null
  avatar: string | null
  role: string
}
