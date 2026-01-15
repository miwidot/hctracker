import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Fetch all groups
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, issues: true },
        },
        users: {
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: groups })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST - Create a new group
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, color, userIds } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if group exists
    const existing = await prisma.group.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Group already exists' }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        color: color || '#6366f1',
        users: userIds?.length
          ? { create: userIds.map((userId: string) => ({ userId })) }
          : undefined,
      },
      include: {
        _count: { select: { users: true, issues: true } },
        users: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
