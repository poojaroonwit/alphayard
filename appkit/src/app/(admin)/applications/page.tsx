'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  ServerIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  GlobeIcon,
  MoreVerticalIcon,
  Trash2Icon,
  CopyIcon,
  ShieldIcon,
  ChevronDownIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from 'lucide-react'
import { adminService } from '@/services/adminService'

interface Application {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'development'
  users: number
  onlineUsers?: number
  createdAt: string
  lastModified: string
  plan: 'free' | 'pro' | 'enterprise'
  domain?: string
  settings?: any
}

interface AppEnvironment {
  id: string
  name: string
  type: 'development' | 'staging' | 'production' | 'custom'
  apiKey: string
  variables: { key: string; value: string }[]
  createdAt: string
}

const ENV_TYPE_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  production:  { badge: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',  dot: 'bg-green-500',  label: 'Production' },
  staging:     { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',  dot: 'bg-amber-500',  label: 'Staging' },
  development: { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30',    dot: 'bg-blue-500',   label: 'Development' },
  custom:      { badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800', dot: 'bg-purple-500', label: 'Custom' },
}

const ENV_FILTER_OPTIONS = [
  { value: 'all', label: 'All Environments' },
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
  { value: 'custom', label: 'Custom' },
]

const fallbackApps: Application[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'E-Commerce Platform', description: 'Online shopping application with payment integration', status: 'active', users: 8500, createdAt: '2024-01-15', lastModified: '2024-02-20', plan: 'enterprise', domain: 'shop.example.com' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'SaaS Dashboard', description: 'Analytics and reporting dashboard for businesses', status: 'active', users: 6200, createdAt: '2024-02-01', lastModified: '2024-02-22', plan: 'pro', domain: 'dash.example.com' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Mobile Banking App', description: 'Digital banking and financial services', status: 'active', users: 4800, createdAt: '2024-01-20', lastModified: '2024-02-18', plan: 'enterprise', domain: 'bank.example.com' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Healthcare Portal', description: 'Patient management and telemedicine platform', status: 'development', users: 320, createdAt: '2024-02-10', lastModified: '2024-02-21', plan: 'pro' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Education Hub', description: 'Online learning management system', status: 'inactive', users: 0, createdAt: '2024-01-05', lastModified: '2024-01-15', plan: 'free' },
]

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [appEnvironments, setAppEnvironments] = useState<Record<string, AppEnvironment[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Environment filter
  const [selectedEnvName, setSelectedEnvName] = useState('All Environments')
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false)
  const envDropdownRef = useRef<HTMLDivElement>(null)

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Clone modal
  const [cloneModal, setCloneModal] = useState<{ id: string; name: string } | null>(null)
  const [cloneEnvId, setCloneEnvId] = useState('')
  const [cloning, setCloning] = useState(false)
  const [cloneSuccess, setCloneSuccess] = useState(false)

  // Permissions modal
  const [permModal, setPermModal] = useState<{ id: string; name: string } | null>(null)

  // Load apps
  const loadApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const apiApps = await adminService.getApplications()
      const mapped: Application[] = (apiApps && apiApps.length > 0 ? apiApps : fallbackApps).map((app: any) => ({
        id: app.id,
        name: app.name || app.slug || 'Unnamed App',
        description: app.description || '',
        status: app.isActive === false ? 'inactive' : 'active',
        users: app.users ?? app.user_count ?? 0,
        onlineUsers: app.onlineUsers ?? app.online_users ?? 0,
        createdAt: app.createdAt || app.created_at || '',
        lastModified: app.updatedAt || app.updated_at || '',
        plan: app.plan || 'free',
        domain: app.slug ? `${app.slug}.appkit.com` : undefined,
        settings: app.settings,
      }))
      setApplications(mapped)

      // Collect environments from all apps
      const envMap: Record<string, AppEnvironment[]> = {}
      mapped.forEach(app => {
        const settings = typeof app.settings === 'string' ? JSON.parse(app.settings || '{}') : (app.settings || {})
        envMap[app.id] = Array.isArray(settings.environments) ? settings.environments : []
      })
      setAppEnvironments(envMap)
    } catch (error) {
      console.error('Failed to load applications:', error)
      setApplications(fallbackApps)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadApplications() }, [loadApplications])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Close env dropdown
      if (envDropdownRef.current && !envDropdownRef.current.contains(e.target as Node)) {
        setEnvDropdownOpen(false)
      }
      // Close card menus
      if (openMenuId) {
        const ref = menuRefs.current[openMenuId]
        if (ref && !ref.contains(e.target as Node)) setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  // Get unique environment names across all apps for the global selector
  const allUniqueEnvs = React.useMemo(() => {
    const names = new Set<string>()
    Object.values(appEnvironments).flat().forEach(e => names.add(e.name))
    return Array.from(names).sort()
  }, [appEnvironments])

  // Filter apps by search + selected environment name
  const filteredApps = applications.filter(app => {
    const matchesSearch =
      (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (selectedEnvName === 'All Environments') return true
    
    const envs = appEnvironments[app.id] || []
    return envs.some(e => e.name === selectedEnvName)
  })

  const getStatusConfig = (status: Application['status']) => {
    switch (status) {
      case 'active':      return { label: 'Active',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' }
      case 'inactive':    return { label: 'Inactive',    className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
      case 'development': return { label: 'Development', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' }
      default:            return { label: status,        className: 'bg-gray-50 text-gray-600 border-gray-200' }
    }
  }

  const getPlanConfig = (plan: Application['plan']) => {
    switch (plan) {
      case 'enterprise': return { label: 'Enterprise', className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' }
      case 'pro':        return { label: 'Pro',        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' }
      case 'free':       return { label: 'Free',       className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
      default:           return { label: plan,         className: 'bg-gray-50 text-gray-600 border-gray-200' }
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await adminService.deleteApplication(deleteModal.id)
      setDeleteModal(null)
      await loadApplications()
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Clone handler
  const handleClone = async () => {
    if (!cloneModal) return
    setCloning(true)
    try {
      await adminService.cloneApplication(cloneModal.id, {
        targetEnvironmentId: cloneEnvId || undefined
      })
      setCloneSuccess(true)
      setTimeout(() => {
        setCloneModal(null)
        setCloneEnvId('')
        setCloneSuccess(false)
        loadApplications()
      }, 1200)
    } catch (e: any) {
      alert(`Clone failed: ${e.message}`)
    } finally {
      setCloning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{filteredApps.length} of {applications.length} applications</p>
            {selectedEnvName !== 'All Environments' && (
              <button 
                onClick={() => setSelectedEnvName('All Environments')}
                className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Environment Filter Dropdown */}
          <div className="relative" ref={envDropdownRef}>
            <button
              onClick={() => setEnvDropdownOpen(v => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors shadow-sm"
            >
              <ServerIcon className="w-3.5 h-3.5 text-gray-400" />
              {selectedEnvName}
              <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform ${envDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {envDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-40 py-1 overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                  Select Environment
                </div>
                <button
                  onClick={() => { setSelectedEnvName('All Environments'); setEnvDropdownOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    selectedEnvName === 'All Environments'
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  All Environments
                </button>
                {allUniqueEnvs.map(name => (
                  <button
                    key={name}
                    onClick={() => { setSelectedEnvName(name); setEnvDropdownOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      selectedEnvName === name
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {name}
                    {selectedEnvName === name && <CheckCircle2Icon className="w-3.5 h-3.5 ml-auto text-blue-500" />}
                  </button>
                ))}
                <div className="border-t border-gray-100 dark:border-zinc-800 mt-1 pt-1">
                   <button
                    onClick={() => { setEnvDropdownOpen(false); alert('Redirecting to global environment settings...') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create New Environment
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0"
            onClick={() => router.push('/applications/new')}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Application Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredApps.map(app => {
          const statusConfig = getStatusConfig(app.status)
          const planConfig = getPlanConfig(app.plan)
          const envs = appEnvironments[app.id] || []
          const isMenuOpen = openMenuId === app.id

          return (
            <div
              key={app.id}
              className="group relative rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-blue-200 dark:hover:border-blue-500/30"
            >
              {/* App Icon + Name */}
              <div
                className="flex items-start space-x-3 mb-3 cursor-pointer"
                onClick={() => router.push(`/applications/${app.id}`)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex-shrink-0">
                  {app.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{app.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{app.description}</p>
                </div>
              </div>

              {/* 3-dot menu button */}
              <div
                className="absolute top-4 right-4"
                ref={el => { menuRefs.current[app.id] = el }}
              >
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : app.id) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <MoreVerticalIcon className="w-4 h-4" />
                </button>

                {/* Popover menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-30 py-1 overflow-hidden">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setOpenMenuId(null)
                        router.push(`/applications/${app.id}?tab=users`)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      Users
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setOpenMenuId(null)
                        const cloneEnvs = appEnvironments[app.id] || []
                        setCloneEnvId(cloneEnvs[0]?.id || '')
                        setCloneModal({ id: app.id, name: app.name })
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <CopyIcon className="w-4 h-4 text-gray-400" />
                      Clone
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setOpenMenuId(null)
                        setPermModal({ id: app.id, name: app.name })
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ShieldIcon className="w-4 h-4 text-gray-400" />
                      Manage Permissions
                    </button>
                    <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setOpenMenuId(null)
                        setDeleteModal({ id: app.id, name: app.name })
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2Icon className="w-4 h-4" />
                      Remove Application
                    </button>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div
                className="flex items-center flex-wrap gap-1.5 mb-3 cursor-pointer"
                onClick={() => router.push(`/applications/${app.id}`)}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.className}`}>
                  {statusConfig.label}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${planConfig.className}`}>
                  {planConfig.label}
                </span>
                {envs.slice(0, 3).map(env => {
                  const s = ENV_TYPE_STYLES[env.type] || ENV_TYPE_STYLES.custom
                  return (
                    <span key={env.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {env.name}
                    </span>
                  )
                })}
                {envs.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                    +{envs.length - 3} more
                  </span>
                )}
              </div>

              {/* Stats */}
              <div
                className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800 cursor-pointer"
                onClick={() => router.push(`/applications/${app.id}`)}
              >
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Users</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    <UsersIcon className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    {app.users.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Online</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Number(app.onlineUsers || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Domain</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center truncate">
                    <GlobeIcon className="w-3.5 h-3.5 mr-1 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{app.domain || '—'}</span>
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-16">
          <ServerIcon className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No applications found</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {selectedEnvName !== 'All Environments'
              ? `No applications have a ${selectedEnvName} environment. Try a different filter.`
              : 'Try adjusting your search or create a new application.'}
          </p>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Remove Application</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">{deleteModal.name}</span>? All associated data will be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {deleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Trash2Icon className="w-4 h-4" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clone Modal ── */}
      {cloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            {cloneSuccess ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <CheckCircle2Icon className="w-12 h-12 text-green-500" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Cloned successfully!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <CopyIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clone Application</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{cloneModal.name}</p>
                  </div>
                </div>

                {(() => {
                  const envs = appEnvironments[cloneModal.id] || []
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                          Copy environment configuration from
                        </label>
                        {envs.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-zinc-500 italic">No environments configured — clone will copy app settings only.</p>
                        ) : (
                          <div className="space-y-2">
                             <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                              <input
                                type="radio"
                                name="cloneEnv"
                                value=""
                                checked={cloneEnvId === ''}
                                onChange={() => setCloneEnvId('')}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-zinc-400">None (app settings only)</span>
                            </label>
                            {envs.map(env => {
                              const s = ENV_TYPE_STYLES[env.type] || ENV_TYPE_STYLES.custom
                              return (
                                <label key={env.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                  <input
                                    type="radio"
                                    name="cloneEnv"
                                    value={env.id}
                                    checked={cloneEnvId === env.id}
                                    onChange={() => setCloneEnvId(env.id)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{env.name}</span>
                                      <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${s.badge}`}>{s.label}</span>
                                    </div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setCloneModal(null); setCloneEnvId('') }}
                    disabled={cloning}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClone}
                    disabled={cloning}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors border-0 shadow-lg shadow-blue-500/20"
                  >
                    {cloning ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <CopyIcon className="w-4 h-4" />}
                    Confirm Clone
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Manage Permissions Modal ── */}
      {permModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <ShieldIcon className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manage Permissions</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{permModal.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'View application config', checked: true },
                { label: 'Edit application settings', checked: true },
                { label: 'Manage users', checked: true },
                { label: 'Manage billing', checked: false },
                { label: 'Delete application', checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-zinc-300">{item.label}</span>
                </label>
              ))}
            </div>

            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Full permission management is available inside the application config page.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setPermModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setPermModal(null); router.push(`/applications/${permModal.id}`) }}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-colors border-0 shadow-lg shadow-violet-500/20"
              >
                Open Full Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
