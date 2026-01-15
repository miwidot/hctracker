'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import {
  Github,
  Building2,
  User,
  Check,
  Loader2,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-react'
import clsx from 'clsx'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  open_issues_count: number
  owner: {
    login: string
    avatar_url: string
    type: string
  }
}

interface Org {
  login: string
  avatar_url: string
}

interface GitHubUser {
  login: string
  avatar_url: string
  type: string
}

export default function GitHubSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [user, setUser] = useState<GitHubUser | null>(null)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedOwner, setSelectedOwner] = useState<string>('')
  const [currentConfig, setCurrentConfig] = useState<{ owner: string; repo: string } | null>(null)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      router.push('/board')
    }
  }, [session, router])

  const fetchRepos = async (org?: string) => {
    setLoading(true)
    setError('')
    try {
      const url = org ? `/api/github/repos?org=${org}` : '/api/github/repos'
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch')
      }

      setUser(data.data.user)
      setOrgs(data.data.orgs)
      setRepos(data.data.repos)
      setCurrentConfig(data.data.currentConfig)

      if (!selectedOwner) {
        setSelectedOwner(data.data.user.login)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GitHub data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepos()
  }, [])

  const handleOwnerChange = (owner: string) => {
    setSelectedOwner(owner)
    if (owner === user?.login) {
      fetchRepos()
    } else {
      fetchRepos(owner)
    }
  }

  const handleSelectRepo = async (repo: Repo) => {
    setSaving(true)
    try {
      const response = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setCurrentConfig({ owner: repo.owner.login, repo: repo.name })
    } catch (err) {
      setError('Failed to save repository selection')
    } finally {
      setSaving(false)
    }
  }

  if (session?.user.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      <Header title="GitHub Repository" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl">
          {/* Current Selection */}
          {currentConfig?.owner && currentConfig?.repo && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Active Repository</p>
                  <p className="text-green-300 text-sm">
                    {currentConfig.owner}/{currentConfig.repo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Owner Selection */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
            <h3 className="text-white font-medium mb-3">Select Owner</h3>
            <div className="flex flex-wrap gap-2">
              {/* User */}
              {user && (
                <button
                  onClick={() => handleOwnerChange(user.login)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    selectedOwner === user.login
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  )}
                >
                  <User className="w-4 h-4" />
                  {user.login}
                </button>
              )}

              {/* Organizations */}
              {orgs.map((org) => (
                <button
                  key={org.login}
                  onClick={() => handleOwnerChange(org.login)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    selectedOwner === org.login
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  {org.login}
                </button>
              ))}
            </div>
          </div>

          {/* Repository List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-white font-medium">
                Repositories
                {!loading && (
                  <span className="text-slate-400 font-normal ml-2">
                    ({repos.length})
                  </span>
                )}
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : repos.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400">
                No repositories found
              </div>
            ) : (
              <div className="divide-y divide-slate-700 max-h-[500px] overflow-y-auto">
                {repos.map((repo) => {
                  const isSelected =
                    currentConfig?.owner === repo.owner.login &&
                    currentConfig?.repo === repo.name

                  return (
                    <div
                      key={repo.id}
                      className={clsx(
                        'flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors',
                        isSelected && 'bg-indigo-600/10'
                      )}
                      onClick={() => handleSelectRepo(repo)}
                    >
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {repo.name}
                            </span>
                            {repo.private ? (
                              <Lock className="w-3 h-3 text-yellow-500" />
                            ) : (
                              <Globe className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-slate-400 truncate max-w-md">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">
                          {repo.open_issues_count} issues
                        </span>
                        {isSelected ? (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-slate-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {saving && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-white">Saving...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
