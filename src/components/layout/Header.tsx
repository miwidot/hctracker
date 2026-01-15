'use client'

import { useState } from 'react'
import { Search, Plus, RefreshCw, Filter, Bell } from 'lucide-react'
import { useIssueStore } from '@/stores/issueStore'

interface HeaderProps {
  title: string
  onCreateIssue?: () => void
}

export function Header({ title, onCreateIssue }: HeaderProps) {
  const { fetchIssues, loading, setFilters, filters } = useIssueStore()
  const [searchValue, setSearchValue] = useState(filters.search || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: searchValue })
  }

  const handleSync = () => {
    fetchIssues(true)
  }

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search issues..."
            className="w-64 bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Sync with GitHub"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Notifications */}
        <button
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Create Issue */}
        {onCreateIssue && (
          <button
            onClick={onCreateIssue}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Issue
          </button>
        )}
      </div>
    </header>
  )
}
