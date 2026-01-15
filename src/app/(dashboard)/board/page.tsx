'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import { IssueDetailModal } from '@/components/issues/IssueDetailModal'
import { useIssueStore } from '@/stores/issueStore'

export default function BoardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const issues = useIssueStore((state) => state.issues)

  const selectedIssue = selectedIssueId
    ? issues.find((i) => i.id === selectedIssueId) || null
    : null

  return (
    <>
      <Header
        title="Board"
        onCreateIssue={() => setShowCreateModal(true)}
      />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard onIssueClick={(id) => setSelectedIssueId(id)} />
      </div>
      <CreateIssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <IssueDetailModal
        issue={selectedIssue}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </>
  )
}
