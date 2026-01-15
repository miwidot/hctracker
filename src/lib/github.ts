import { Octokit } from '@octokit/rest'
import { prisma } from './prisma'

// Singleton GitHub client using server-side token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Get owner/repo from settings or env
export async function getRepoConfig() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'github_repo' },
    })
    if (setting?.value) {
      const config = setting.value as { owner: string; repo: string }
      if (config.owner && config.repo) {
        return { owner: config.owner, repo: config.repo }
      }
    }
  } catch {
    // Fallback to env if DB not ready
  }
  return {
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
  }
}

export interface GitHubIssue {
  number: number
  node_id: string
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  labels: Array<{
    id: number
    name: string
    color: string
    description: string | null
  }>
  assignees: Array<{
    login: string
    avatar_url: string
  }>
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  open_issues_count: number
  owner: {
    login: string
    avatar_url: string
    type: string
  }
}

export interface CreateIssueInput {
  title: string
  body?: string
  labels?: string[]
  assignees?: string[]
}

export interface UpdateIssueInput {
  title?: string
  body?: string
  state?: 'open' | 'closed'
  labels?: string[]
  assignees?: string[]
}

export const github = {
  // Get authenticated user info
  async getAuthenticatedUser() {
    const response = await octokit.users.getAuthenticated()
    return response.data
  },

  // List repositories for the authenticated user
  async listUserRepos(): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = []
    let page = 1

    while (true) {
      const response = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        page,
        sort: 'updated',
      })

      if (response.data.length === 0) break
      repos.push(...(response.data as GitHubRepo[]))
      if (response.data.length < 100) break
      page++
    }

    return repos
  },

  // List repositories for an organization
  async listOrgRepos(org: string): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = []
    let page = 1

    while (true) {
      const response = await octokit.repos.listForOrg({
        org,
        per_page: 100,
        page,
        sort: 'updated',
      })

      if (response.data.length === 0) break
      repos.push(...(response.data as GitHubRepo[]))
      if (response.data.length < 100) break
      page++
    }

    return repos
  },

  // List organizations the user belongs to
  async listOrgs() {
    const response = await octokit.orgs.listForAuthenticatedUser()
    return response.data
  },

  // Get all issues from the repository
  async getIssues(state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubIssue[]> {
    const { owner, repo } = await getRepoConfig()
    if (!owner || !repo) return []

    const issues: GitHubIssue[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await octokit.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: perPage,
        page,
      })

      if (response.data.length === 0) break

      // Filter out pull requests (they also appear in issues API)
      const issuesOnly = response.data.filter(
        (issue) => !issue.pull_request
      ) as GitHubIssue[]

      issues.push(...issuesOnly)

      if (response.data.length < perPage) break
      page++
    }

    return issues
  },

  // Get a single issue by number
  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    })
    return response.data as GitHubIssue
  },

  // Create a new issue
  async createIssue(input: CreateIssueInput): Promise<GitHubIssue> {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.create({
      owner,
      repo,
      title: input.title,
      body: input.body,
      labels: input.labels,
      assignees: input.assignees,
    })
    return response.data as GitHubIssue
  },

  // Update an existing issue
  async updateIssue(issueNumber: number, input: UpdateIssueInput): Promise<GitHubIssue> {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...input,
    })
    return response.data as GitHubIssue
  },

  // Close an issue
  async closeIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'closed' })
  },

  // Reopen an issue
  async reopenIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'open' })
  },

  // Get comments for an issue
  async getComments(issueNumber: number) {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
    })
    return response.data
  },

  // Add a comment to an issue
  async addComment(issueNumber: number, body: string) {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    })
    return response.data
  },

  // Get repository labels
  async getLabels() {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.listLabelsForRepo({
      owner,
      repo,
    })
    return response.data
  },

  // Create a label
  async createLabel(name: string, color: string, description?: string) {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.issues.createLabel({
      owner,
      repo,
      name,
      color: color.replace('#', ''),
      description,
    })
    return response.data
  },

  // Delete a label
  async deleteLabel(name: string) {
    const { owner, repo } = await getRepoConfig()
    await octokit.issues.deleteLabel({
      owner,
      repo,
      name,
    })
  },

  // Validate connection
  async validateConnection(): Promise<boolean> {
    try {
      const { owner, repo } = await getRepoConfig()
      if (!owner || !repo) return false
      await octokit.repos.get({ owner, repo })
      return true
    } catch {
      return false
    }
  },

  // Get repository info
  async getRepoInfo() {
    const { owner, repo } = await getRepoConfig()
    const response = await octokit.repos.get({ owner, repo })
    return response.data
  },

  // Save repo config to database
  async saveRepoConfig(owner: string, repo: string) {
    await prisma.setting.upsert({
      where: { key: 'github_repo' },
      update: { value: { owner, repo } },
      create: { key: 'github_repo', value: { owner, repo } },
    })
  },

  // Upload image to repository
  async uploadImage(filename: string, content: string): Promise<string> {
    const { owner, repo } = await getRepoConfig()
    if (!owner || !repo) {
      throw new Error('GitHub owner/repo not configured')
    }

    const path = `.github/images/${filename}`

    // Get default branch
    const repoInfo = await octokit.repos.get({ owner, repo })
    const branch = repoInfo.data.default_branch

    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Upload image: ${filename}`,
      content, // base64 encoded
      branch,
    })

    // Return the download URL from GitHub's response
    const downloadUrl = response.data.content?.download_url
    if (!downloadUrl) {
      throw new Error('Upload failed - no download URL in response')
    }

    return downloadUrl
  },
}

// Helper to hide GitHub URLs in content (for display in editor)
export function hideGitHubImageUrls(content: string, owner: string, repo: string): string {
  if (!content || !owner || !repo) return content
  const pattern = new RegExp(
    `https://raw\\.githubusercontent\\.com/${owner}/${repo}/main/\\.github/images/`,
    'g'
  )
  return content.replace(pattern, '/img/')
}

// Helper to expand short URLs to full GitHub URLs (for saving)
export function expandImageUrls(content: string, owner: string, repo: string): string {
  if (!content || !owner || !repo) return content
  const githubBase = `https://raw.githubusercontent.com/${owner}/${repo}/main/.github/images/`
  return content.replace(/!\[([^\]]*)\]\(\/img\/([^)]+)\)/g, `![$1](${githubBase}$2)`)
}
