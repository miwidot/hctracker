import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { github } from '@/lib/github'
import { Priority } from '@prisma/client'
import { notifyAllUsers } from '@/lib/notifications'

// GET - Fetch all issues (synced with GitHub)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sync = searchParams.get('sync') === 'true'

    // Optionally sync with GitHub first
    if (sync) {
      await syncIssuesFromGitHub()
    }

    // Fetch issues with relations
    const issues = await prisma.issue.findMany({
      include: {
        author: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        tags: {
          include: { tag: true },
        },
        groups: {
          include: { group: true },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { githubId: 'desc' },
    })

    return NextResponse.json({ success: true, data: issues })
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
  }
}

// POST - Create a new issue (creates on GitHub and local DB)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, body: issueBody, priority, tagIds, groupIds, assigneeIds } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get tag names for GitHub labels
    let labelNames: string[] = []
    if (tagIds?.length) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { name: true },
      })
      labelNames = tags.map((t) => t.name)
    }

    // Create issue on GitHub (with labels)
    const githubIssue = await github.createIssue({
      title,
      body: issueBody,
      labels: labelNames.length > 0 ? labelNames : undefined,
    })

    // Create local issue record
    const issue = await prisma.issue.create({
      data: {
        githubId: githubIssue.number,
        githubNodeId: githubIssue.node_id,
        title: githubIssue.title,
        body: githubIssue.body,
        state: 'OPEN',
        githubUrl: githubIssue.html_url,
        priority: (priority as Priority) || 'MEDIUM',
        boardColumn: 'backlog',
        boardPosition: 0,
        authorId: session.user.id,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
        groups: groupIds?.length
          ? { create: groupIds.map((groupId: string) => ({ groupId })) }
          : undefined,
        assignments: assigneeIds?.length
          ? { create: assigneeIds.map((userId: string) => ({ userId })) }
          : undefined,
      },
      include: {
        author: { select: { id: true, username: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        groups: { include: { group: true } },
        assignments: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        issueId: issue.id,
        userId: session.user.id,
        action: 'ISSUE_CREATED',
        details: { title: issue.title },
      },
    })

    // Notify all users about new issue
    await notifyAllUsers(
      'ISSUE_CREATED',
      `New issue: ${issue.title}`,
      `Issue #${issue.githubId} was created`,
      issue.id,
      session.user.id // exclude creator
    )

    return NextResponse.json({ success: true, data: issue })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 })
  }
}

// Helper: Sync issues from GitHub
async function syncIssuesFromGitHub() {
  const githubIssues = await github.getIssues('all')

  // Get all GitHub issue numbers from current repo
  const githubIssueNumbers = githubIssues.map((i) => i.number)

  // Delete local issues that don't exist in current GitHub repo
  await prisma.issue.deleteMany({
    where: {
      githubId: {
        notIn: githubIssueNumbers.length > 0 ? githubIssueNumbers : [-1],
      },
    },
  })

  for (const ghIssue of githubIssues) {
    // Upsert the issue
    const issue = await prisma.issue.upsert({
      where: { githubId: ghIssue.number },
      update: {
        title: ghIssue.title,
        body: ghIssue.body,
        state: ghIssue.state === 'open' ? 'OPEN' : 'CLOSED',
        githubUrl: ghIssue.html_url,
        syncedAt: new Date(),
      },
      create: {
        githubId: ghIssue.number,
        githubNodeId: ghIssue.node_id,
        title: ghIssue.title,
        body: ghIssue.body,
        state: ghIssue.state === 'open' ? 'OPEN' : 'CLOSED',
        githubUrl: ghIssue.html_url,
        priority: 'MEDIUM',
        boardColumn: ghIssue.state === 'open' ? 'backlog' : 'done',
      },
    })

    // Sync labels as tags
    if (ghIssue.labels && ghIssue.labels.length > 0) {
      // Get or create tags for each label
      const tagIds: string[] = []
      for (const label of ghIssue.labels) {
        // Find existing tag or create new one
        let tag = await prisma.tag.findUnique({
          where: { name: label.name },
        })
        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: label.name,
              color: `#${label.color}`,
              description: label.description || undefined,
              category: 'github',
            },
          })
        }
        tagIds.push(tag.id)
      }

      // Remove existing tag links and create new ones
      await prisma.issueTag.deleteMany({ where: { issueId: issue.id } })
      if (tagIds.length > 0) {
        await prisma.issueTag.createMany({
          data: tagIds.map((tagId) => ({ issueId: issue.id, tagId })),
          skipDuplicates: true,
        })
      }
    }
  }
}
