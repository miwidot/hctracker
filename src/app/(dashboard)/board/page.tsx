'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { KanbanBoard } from '@/components/board/KanbanBoard'

export default function BoardPage() {
  const router = useRouter()

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
