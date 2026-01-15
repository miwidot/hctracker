'use client'

import { useState } from 'react'
import { Search, Plus, RefreshCw, Bell } from 'lucide-react'
import { useIssueStore } from '@/stores/issueStore'

interface HeaderProps {
  title: string
  onCreateIssue?: () => void
}

export function Header({ title, onCreateIssue }: HeaderProps) {
  const { fetchIssues, loading, setFilters, filters } = useIssueStore()
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [showSearch, setShowSearch] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: searchValue })
  }

  const handleSync = () => {
    fetchIssues(true)
  }

  return (
    <header className="h-14 sm:h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-3 sm:px-6">
      {/* Title with left padding for hamburger menu on mobile */}
      <h1 className="text-lg sm:text-xl font-semibold text-white pl-10 lg:pl-0 truncate">{title}</h1>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search - Hidden on mobile, toggle with button */}
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search issues..."
            className="w-48 md:w-64 bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        {/* Mobile search button */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          title="Sync with GitHub"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Notifications - Hidden on very small screens */}
        <button
          className="hidden xs:flex p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Create Issue */}
        {onCreateIssue && (
          <button
            onClick={onCreateIssue}
            className="flex items-center gap-1 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Issue</span>
          </button>
        )}
      </div>

      {/* Mobile search bar - slides down */}
      {showSearch && (
        <div className="sm:hidden absolute top-14 left-0 right-0 bg-slate-800 border-b border-slate-700 p-3 z-30">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search issues..."
              autoFocus
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </form>
        </div>
      )}
    </header>
  )
}
