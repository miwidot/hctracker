'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { ShieldAlert } from 'lucide-react'

export default function BoardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.push('/issues')
    }
  }, [status, isAdmin, router])

  // Show access denied for non-admin
  if (status === 'authenticated' && !isAdmin) {
    return (
      <>
        <Header title="Access Denied" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-400">You don't have permission to access this page.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Board"
        onCreateIssue={() => router.push('/issues/new')}
      />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard onIssueClick={(id) => router.push(`/issues/${id}`)} />
      </div>
    </>
  )
}
