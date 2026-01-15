import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { github } from '@/lib/github'
import { prisma } from '@/lib/prisma'

// POST - Sync labels with GitHub (bidirectional)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { direction = 'both' } = await req.json().catch(() => ({}))

    const results = {
      imported: 0,
      exported: 0,
      errors: [] as string[],
    }

    // Get GitHub labels
    let githubLabels
    try {
      githubLabels = await github.getLabels()
    } catch (err) {
      console.error('Failed to get GitHub labels:', err)
      return NextResponse.json(
        { error: 'Failed to connect to GitHub. Check your repository configuration.' },
        { status: 500 }
      )
    }

    // Get local tags
    const localTags = await prisma.tag.findMany()

    // Import from GitHub (create local tags for GitHub labels that don't exist locally)
    if (direction === 'import' || direction === 'both') {
      for (const label of githubLabels) {
        const exists = localTags.find(
          (t) => t.name.toLowerCase() === label.name.toLowerCase()
        )
        if (!exists) {
          try {
            await prisma.tag.create({
              data: {
                name: label.name,
                color: `#${label.color}`,
                description: label.description || undefined,
                category: 'github',
              },
            })
            results.imported++
          } catch (err) {
            results.errors.push(`Failed to import "${label.name}"`)
          }
        }
      }
    }

    // Export to GitHub (create GitHub labels for local tags that don't exist on GitHub)
    if (direction === 'export' || direction === 'both') {
      for (const tag of localTags) {
        const exists = githubLabels.find(
          (l) => l.name.toLowerCase() === tag.name.toLowerCase()
        )
        if (!exists) {
          try {
            await github.createLabel(
              tag.name,
              tag.color,
              tag.description || undefined
            )
            results.exported++
          } catch (err) {
            results.errors.push(`Failed to export "${tag.name}"`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Error syncing labels:', error)
    return NextResponse.json(
      { error: 'Failed to sync labels' },
      { status: 500 }
    )
  }
}
