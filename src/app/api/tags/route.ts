import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Fetch all tags
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { issues: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST - Create a new tag
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, color, icon, category } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if tag exists
    const existing = await prisma.tag.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        icon,
        category,
      },
      include: {
        _count: {
          select: { issues: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: tag })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
