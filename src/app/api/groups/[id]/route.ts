import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// DELETE - Delete a group
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

    await prisma.group.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}

// PATCH - Update a group
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
    const { name, description, color, userIds } = body

    // Update group
    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
        color,
      },
    })

    // Update users if provided
    if (userIds) {
      await prisma.userGroup.deleteMany({ where: { groupId: id } })
      if (userIds.length > 0) {
        await prisma.userGroup.createMany({
          data: userIds.map((userId: string) => ({ groupId: id, userId })),
        })
      }
    }

    // Fetch updated group with relations
    const updatedGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, issues: true } },
        users: {
          include: {
            user: { select: { id: true, username: true, name: true, avatar: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: updatedGroup })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}
