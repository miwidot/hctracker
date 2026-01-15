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
  Mail,
  Lock,
  User,
  Save,
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const [githubStatus, setGithubStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  // Profile form state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || '')
      setName(session.user.name || '')
    }
  }, [session])

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMessage(null)

    // Validate password confirmation
    if (newPassword && newPassword !== confirmPassword) {
      setProfileMessage({ type: 'error', text: 'New passwords do not match' })
      setProfileLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      } else {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // Update session
        await updateSession()
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setProfileLoading(false)
    }
  }

  const StatusIcon = ({ status }: { status: 'checking' | 'connected' | 'error' }) => {
    if (status === 'checking') return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
    if (status === 'connected') return <Check className="w-5 h-5 text-green-500" />
    return <X className="w-5 h-5 text-red-500" />
  }

  return (
    <>
      <Header title="Settings" />

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-medium flex-shrink-0">
                {session?.user?.name?.[0] || session?.user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">
                  {session?.user?.name || session?.user?.username}
                </p>
                <p className="text-slate-400 text-sm truncate">{session?.user?.email}</p>
                <p className="text-slate-500 text-xs mt-1">
                  Role: {session?.user?.role}
                </p>
              </div>
            </div>

            {/* Profile Edit Form */}
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {profileMessage && (
                <div
                  className={`px-3 sm:px-4 py-3 rounded-lg text-sm ${
                    profileMessage.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                      : 'bg-red-500/10 border border-red-500/50 text-red-400'
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-4 border-t border-slate-700">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Change Password</h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="New password"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  {profileLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Connection Status - Admin only */}
          {session?.user?.role === 'ADMIN' && (
            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Connections</h2>
              <div className="space-y-3 sm:space-y-4">
                {/* GitHub */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Github className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base">GitHub</p>
                      <p className="text-slate-400 text-xs sm:text-sm truncate">
                        {process.env.NEXT_PUBLIC_GITHUB_OWNER || 'owner'}/
                        {process.env.NEXT_PUBLIC_GITHUB_REPO || 'repo'}
                      </p>
                    </div>
                  </div>
                  <StatusIcon status={githubStatus} />
                </div>

                {/* Database */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Database className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base">MySQL Database</p>
                      <p className="text-slate-400 text-xs sm:text-sm">Local Development</p>
                    </div>
                  </div>
                  <StatusIcon status={dbStatus} />
                </div>
              </div>
            </div>
          )}

          {/* Sync Section - Admin only */}
          {session?.user?.role === 'ADMIN' && (
            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
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
