import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { github } from '@/lib/github'
import { prisma } from '@/lib/prisma'

// GET - Get comments for an issue
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

    // Get issue to find GitHub ID
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { githubId: true },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const comments = await github.getComments(issue.githubId)

    return NextResponse.json({
      success: true,
      data: comments.map((c) => {
        // Parse username from comment body if it follows our format: **username** commented:
        let displayName = c.user?.login || 'unknown'
        let displayBody = c.body || ''

        const match = displayBody.match(/^\*\*(.+?)\*\* commented:\n\n/)
        if (match) {
          displayName = match[1]
          displayBody = displayBody.replace(/^\*\*(.+?)\*\* commented:\n\n/, '')
        }

        return {
          id: c.id,
          body: displayBody,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          user: {
            login: displayName,
            avatarUrl: c.user?.avatar_url || '',
          },
        }
      }),
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { body } = await req.json()

    if (!body?.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    // Get issue to find GitHub ID
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { githubId: true },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Add comment with user attribution
    const commentBody = `**${session.user.name || session.user.username}** commented:\n\n${body}`
    const comment = await github.addComment(issue.githubId, commentBody)

    return NextResponse.json({
      success: true,
      data: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          login: comment.user?.login || 'unknown',
          avatarUrl: comment.user?.avatar_url || '',
        },
      },
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
