'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ServerIcon, 
  PlusIcon, 
  SearchIcon,
  UsersIcon,
  GlobeIcon,
  ArrowRightIcon,
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
}

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
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const loadApplications = async () => {
      try {
        // Use adminService which includes auth headers automatically
        const apiApps = await adminService.getApplications()
        if (apiApps && apiApps.length > 0) {
          // Map API response to our Application interface
          setApplications(apiApps.map((app: any) => ({
            id: app.id,
            name: app.name || app.slug || 'Unnamed App',
            description: app.description || '',
            status: app.is_active === false ? 'inactive' : 'active',
            users: app.user_count || 0,
            onlineUsers: app.onlineUsers || app.online_users || 0,
            createdAt: app.createdAt || app.created_at || '',
            lastModified: app.updatedAt || app.updated_at || '',
            plan: app.plan || 'free',
            domain: app.domain || app.slug,
          })))
        } else {
          setApplications(fallbackApps)
        }
      } catch {
        setApplications(fallbackApps)
      }
      setIsLoading(false)
    }
    loadApplications()
  }, [])

  const getStatusConfig = (status: Application['status']) => {
    switch (status) {
      case 'active': return { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' }
      case 'inactive': return { label: 'Inactive', className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
      case 'development': return { label: 'Development', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' }
      default: return { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' }
    }
  }

  const getPlanConfig = (plan: Application['plan']) => {
    switch (plan) {
      case 'enterprise': return { label: 'Enterprise', className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' }
      case 'pro': return { label: 'Pro', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' }
      case 'free': return { label: 'Free', className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
      default: return { label: plan, className: 'bg-gray-50 text-gray-600 border-gray-200' }
    }
  }

  const filteredApps = applications.filter(app => 
    (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{applications.length} applications registered</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Application Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredApps.map((app) => {
          const statusConfig = getStatusConfig(app.status)
          const planConfig = getPlanConfig(app.plan)
          return (
            <div
              key={app.id}
              onClick={() => router.push(`/applications/${app.id}`)}
              className="group relative rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-blue-200 dark:hover:border-blue-500/30"
            >
              {/* App Icon + Name */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex-shrink-0">
                  {app.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{app.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{app.description}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center space-x-2 mb-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.className}`}>
                  {statusConfig.label}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${planConfig.className}`}>
                  {planConfig.label}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
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

              {/* Hover Arrow */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRightIcon className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          )
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-16">
          <ServerIcon className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No applications found</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Try adjusting your search or create a new application.</p>
        </div>
      )}
    </div>
  )
}
