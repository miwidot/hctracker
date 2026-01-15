# GitHub Tracker - Project Guidelines

## Project Overview
A bug tracking system built on GitHub Issues with custom UI, independent authentication, and extended features (tags, groups, Kanban board).

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL 8.0 (Docker)
- **Auth**: NextAuth.js with credentials provider
- **GitHub**: @octokit/rest for API integration
- **State**: Zustand for client state
- **DnD**: @hello-pangea/dnd for Kanban

## Quick Start

```bash
# 1. Start MySQL container
npm run docker:up

# 2. Push schema to database
npx prisma db push

# 3. Seed default data
npm run db:seed

# 4. Start development server
npm run dev
```

## Environment Variables (.env)
```
DATABASE_URL="mysql://tracker:trackerpassword@localhost:4030/githubtracker"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:4029"
GITHUB_TOKEN="ghp_your_token"
GITHUB_OWNER="your-username"
GITHUB_REPO="your-repo"
```

## Default Credentials
- Email: admin@example.com
- Password: admin123

## Key Directories
- `/src/app/(auth)` - Login/Register pages
- `/src/app/(dashboard)` - Protected dashboard pages
- `/src/app/api` - API routes
- `/src/components` - Reusable components
- `/src/lib` - Utilities (prisma, github, auth)
- `/src/stores` - Zustand stores
- `/prisma` - Database schema and seeds

## Development Commands
- `npm run dev` - Start dev server (port 4029)
- `npm run build` - Production build
- `npm run db:studio` - Prisma Studio
- `npm run docker:up` - Start MySQL
- `npm run docker:down` - Stop MySQL

## Architecture Notes
- GitHub Issues are the source of truth for issue data
- Local MySQL stores: users, tags, groups, assignments, board positions
- Issues sync bidirectionally with GitHub on create/update
- Moving to "Done" column auto-closes GitHub issue
