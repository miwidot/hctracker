'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Bug,
  LayoutDashboard,
  ListTodo,
  Tag,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Github,
} from 'lucide-react'
import clsx from 'clsx'

const navigation = [
  { name: 'Board', href: '/board', icon: LayoutDashboard },
  { name: 'Issues', href: '/issues', icon: ListTodo },
  { name: 'Tags', href: '/settings/tags', icon: Tag },
  { name: 'Groups', href: '/settings/groups', icon: Users },
  { name: 'Users', href: '/settings/users', icon: Users, adminOnly: true },
  { name: 'GitHub', href: '/settings/github', icon: Github, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bug className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-white">HC Tracker</span>
        </div>
      </div>

      {/* Repository Info - Admin only */}
      {session?.user?.role === 'ADMIN' && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Github className="w-4 h-4" />
            <span className="truncate">
              {process.env.NEXT_PUBLIC_GITHUB_OWNER || 'owner'}/
              {process.env.NEXT_PUBLIC_GITHUB_REPO || 'repo'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation
          .filter((item) => !item.adminOnly || session?.user?.role === 'ADMIN')
          .map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/50">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {session.user.name?.[0] || session.user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name || session.user.username}
              </p>
              <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
