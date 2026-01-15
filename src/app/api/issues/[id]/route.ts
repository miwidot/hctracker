import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { github, getRepoConfig, expandImageUrls, hideGitHubImageUrls } from '@/lib/github'
import { notifyAllUsers, notifyIssueAssignees } from '@/lib/notifications'

// GET - Fetch single issue
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        groups: { include: { group: true } },
        assignments: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Hide GitHub URLs in body for display
    const { owner, repo } = await getRepoConfig()
    const issueWithHiddenUrls = {
      ...issue,
      body: hideGitHubImageUrls(issue.body || '', owner, repo),
    }

    return NextResponse.json({ success: true, data: issueWithHiddenUrls })
  } catch (error) {
    console.error('Error fetching issue:', error)
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 })
  }
}

// PATCH - Update issue
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      title,
      body: issueBody,
      state,
      priority,
      boardColumn,
      boardPosition,
      tagIds,
      groupIds,
      assigneeIds,
      dueDate,
      estimatedHours,
    } = body

    // Get current issue
    const currentIssue = await prisma.issue.findUnique({ where: { id } })
    if (!currentIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Expand short image URLs to full GitHub URLs before saving
    const { owner, repo } = await getRepoConfig()
    const expandedBody = issueBody !== undefined ? expandImageUrls(issueBody || '', owner, repo) : undefined

    // Update on GitHub if title or body changed
    if (title || issueBody !== undefined || state) {
      await github.updateIssue(currentIssue.githubId, {
        title: title || undefined,
        body: expandedBody,
        state: state === 'CLOSED' ? 'closed' : state === 'OPEN' ? 'open' : undefined,
      })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title) updateData.title = title
    if (expandedBody !== undefined) updateData.body = expandedBody
    if (state) updateData.state = state
    if (priority) updateData.priority = priority
    if (boardColumn) updateData.boardColumn = boardColumn
    if (boardPosition !== undefined) updateData.boardPosition = boardPosition
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours

    // Update issue
    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        tags: { include: { tag: true } },
        groups: { include: { group: true } },
        assignments: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
      },
    })

    // Update tags if provided
    if (tagIds) {
      await prisma.issueTag.deleteMany({ where: { issueId: id } })
      if (tagIds.length > 0) {
        await prisma.issueTag.createMany({
          data: tagIds.map((tagId: string) => ({ issueId: id, tagId })),
        })
      }
    }

    // Update groups if provided
    if (groupIds) {
      await prisma.issueGroup.deleteMany({ where: { issueId: id } })
      if (groupIds.length > 0) {
        await prisma.issueGroup.createMany({
          data: groupIds.map((groupId: string) => ({ issueId: id, groupId })),
        })
      }
    }

    // Update assignments if provided
    if (assigneeIds) {
      await prisma.issueAssignment.deleteMany({ where: { issueId: id } })
      if (assigneeIds.length > 0) {
        await prisma.issueAssignment.createMany({
          data: assigneeIds.map((userId: string) => ({ issueId: id, userId })),
        })
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        issueId: id,
        userId: session.user.id,
        action: 'ISSUE_UPDATED',
        details: body,
      },
    })

    // Send notifications for board column changes (moved issues)
    if (boardColumn && boardColumn !== currentIssue.boardColumn) {
      await notifyAllUsers(
        'ISSUE_MOVED',
        `Issue moved: ${issue.title}`,
        `Moved from ${currentIssue.boardColumn} to ${boardColumn}`,
        id,
        session.user.id
      )
    }

    // Notify assignees when issue is assigned
    if (assigneeIds && assigneeIds.length > 0) {
      await notifyIssueAssignees(
        id,
        'ISSUE_ASSIGNED',
        `You were assigned to: ${issue.title}`,
        `Issue #${issue.githubId}`,
        session.user.id
      )
    }

    // Fetch updated issue with relations
    const updatedIssue = await prisma.issue.findUnique({
      where: { id },
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

    // Hide GitHub URLs in response
    const responseIssue = updatedIssue ? {
      ...updatedIssue,
      body: hideGitHubImageUrls(updatedIssue.body || '', owner, repo),
    } : null

    return NextResponse.json({ success: true, data: responseIssue })
  } catch (error) {
    console.error('Error updating issue:', error)
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 })
  }
}

// DELETE - Delete issue (closes on GitHub)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const issue = await prisma.issue.findUnique({ where: { id } })
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Close issue on GitHub (GitHub doesn't allow deletion via API)
    await github.closeIssue(issue.githubId)

    // Delete from local DB
    await prisma.issue.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting issue:', error)
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 })
  }
}
