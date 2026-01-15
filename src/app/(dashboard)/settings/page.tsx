'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { useSession } from 'next-auth/react'
import {
  Github,
  Database,
  Check,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [githubStatus, setGithubStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    // Check GitHub connection
    fetch('/api/health/github')
      .then((r) => r.json())
      .then((data) => {
        setGithubStatus(data.connected ? 'connected' : 'error')
      })
      .catch(() => setGithubStatus('error'))

    // Check DB connection
    fetch('/api/health/db')
      .then((r) => r.json())
      .then((data) => {
        setDbStatus(data.connected ? 'connected' : 'error')
      })
      .catch(() => setDbStatus('error'))
  }, [])

  const StatusIcon = ({ status }: { status: 'checking' | 'connected' | 'error' }) => {
    if (status === 'checking') return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
    if (status === 'connected') return <Check className="w-5 h-5 text-green-500" />
    return <X className="w-5 h-5 text-red-500" />
  }

  return (
    <>
      <Header title="Settings" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                {session?.user?.name?.[0] || session?.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">
                  {session?.user?.name || session?.user?.username}
                </p>
                <p className="text-slate-400 text-sm">{session?.user?.email}</p>
                <p className="text-slate-500 text-xs mt-1">
                  Role: {session?.user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status - Admin only */}
          {session?.user?.role === 'ADMIN' && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Connections</h2>
              <div className="space-y-4">
                {/* GitHub */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                      <Github className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">GitHub</p>
                      <p className="text-slate-400 text-sm">
                        {process.env.NEXT_PUBLIC_GITHUB_OWNER || 'owner'}/
                        {process.env.NEXT_PUBLIC_GITHUB_REPO || 'repo'}
                      </p>
                    </div>
                  </div>
                  <StatusIcon status={githubStatus} />
                </div>

                {/* Database */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">MySQL Database</p>
                      <p className="text-slate-400 text-sm">Local Development</p>
                    </div>
                  </div>
                  <StatusIcon status={dbStatus} />
                </div>
              </div>
            </div>
          )}

          {/* Sync Section - Admin only */}
          {session?.user?.role === 'ADMIN' && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Data Sync</h2>
              <p className="text-slate-400 text-sm mb-4">
                Sync issues from GitHub to update your local database with the latest data.
              </p>
              <button
                onClick={() => {
                  fetch('/api/issues?sync=true')
                    .then(() => alert('Sync completed!'))
                    .catch(() => alert('Sync failed'))
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Sync with GitHub
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
