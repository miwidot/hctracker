import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message?: string
  issueId?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, issueId } = params

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      issueId,
    },
  })
}

export async function notifyAllUsers(
  type: NotificationType,
  title: string,
  message?: string,
  issueId?: string,
  excludeUserId?: string
) {
  const users = await prisma.user.findMany({
    where: excludeUserId ? { id: { not: excludeUserId } } : undefined,
    select: { id: true },
  })

  const notifications = users.map((user) => ({
    userId: user.id,
    type,
    title,
    message,
    issueId,
  }))

  return prisma.notification.createMany({
    data: notifications,
  })
}

export async function notifyIssueAssignees(
  issueId: string,
  type: NotificationType,
  title: string,
  message?: string,
  excludeUserId?: string
) {
  const assignments = await prisma.issueAssignment.findMany({
    where: { issueId },
    select: { userId: true },
  })

  const userIds = assignments
    .map((a) => a.userId)
    .filter((id) => id !== excludeUserId)

  if (userIds.length === 0) return

  const notifications = userIds.map((userId) => ({
    userId,
    type,
    title,
    message,
    issueId,
  }))

  return prisma.notification.createMany({
    data: notifications,
  })
}
