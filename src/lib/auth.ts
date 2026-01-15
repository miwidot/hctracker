import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(
  email: string,
  username: string,
  password: string,
  name?: string
) {
  const hashedPassword = await hashPassword(password)

  return prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      name,
    },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return null

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null

  return user
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  })
}
