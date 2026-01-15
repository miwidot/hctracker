import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create default tags
  const defaultTags = [
    // Type tags
    { name: 'bug', color: '#ef4444', category: 'type', description: 'Something is not working' },
    { name: 'feature', color: '#22c55e', category: 'type', description: 'New feature request' },
    { name: 'enhancement', color: '#3b82f6', category: 'type', description: 'Improvement to existing feature' },
    { name: 'documentation', color: '#8b5cf6', category: 'type', description: 'Documentation updates' },
    { name: 'refactor', color: '#58508a', category: 'type', description: 'Code refactoring' },
    { name: 'test', color: '#58508a', category: 'type', description: 'Testing related' },
    { name: 'chore', color: '#58508a', category: 'type', description: 'Maintenance tasks' },
    // Priority tags
    { name: 'urgent', color: '#ef4444', category: 'priority', description: 'Needs immediate attention' },
    { name: 'high-priority', color: '#f97316', category: 'priority', description: 'High priority' },
    { name: 'low-priority', color: '#58508a', category: 'priority', description: 'Low priority' },
    // Area tags
    { name: 'frontend', color: '#06b6d4', category: 'area', description: 'Frontend related' },
    { name: 'backend', color: '#f59e0b', category: 'area', description: 'Backend related' },
    { name: 'api', color: '#ec4899', category: 'area', description: 'API related' },
    { name: 'database', color: '#58508a', category: 'area', description: 'Database related' },
    { name: 'infrastructure', color: '#58508a', category: 'area', description: 'Infrastructure/DevOps' },
    { name: 'security', color: '#dc2626', category: 'area', description: 'Security related' },
    // Status tags
    { name: 'blocked', color: '#ef4444', category: 'status', description: 'Blocked by dependency' },
    { name: 'needs-review', color: '#58508a', category: 'status', description: 'Needs code review' },
    { name: 'wontfix', color: '#6b7280', category: 'status', description: 'Will not be fixed' },
    { name: 'duplicate', color: '#6b7280', category: 'status', description: 'Duplicate issue' },
    { name: 'help-wanted', color: '#58508a', category: 'status', description: 'Help wanted' },
    { name: 'good-first-issue', color: '#22c55e', category: 'status', description: 'Good for newcomers' },
  ]

  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    })
  }
  console.log('Created default tags')

  // Create default groups
  const defaultGroups = [
    { name: 'Engineering', color: '#3b82f6', description: 'Engineering team' },
    { name: 'Design', color: '#ec4899', description: 'Design team' },
    { name: 'QA', color: '#22c55e', description: 'Quality Assurance team' },
  ]

  for (const group of defaultGroups) {
    await prisma.group.upsert({
      where: { name: group.name },
      update: {},
      create: group,
    })
  }
  console.log('Created default groups')

  // Create board columns
  const boardColumns = [
    { name: 'Backlog', slug: 'backlog', color: '#64748b', position: 0, isDefault: true },
    { name: 'To Do', slug: 'todo', color: '#3b82f6', position: 1, mappedState: 'OPEN' as const },
    { name: 'In Progress', slug: 'in-progress', color: '#f59e0b', position: 2, mappedState: 'OPEN' as const },
    { name: 'Review', slug: 'review', color: '#8b5cf6', position: 3, mappedState: 'OPEN' as const },
    { name: 'Done', slug: 'done', color: '#22c55e', position: 4, mappedState: 'CLOSED' as const },
  ]

  for (const column of boardColumns) {
    await prisma.boardColumn.upsert({
      where: { slug: column.slug },
      update: {},
      create: column,
    })
  }
  console.log('Created board columns')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
