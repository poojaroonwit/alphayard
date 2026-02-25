'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import UserDetailDrawer from '@/components/users/UserDetailDrawer'
import AuthMethodsConfigDrawer from '@/components/applications/AuthMethodsConfigDrawer'
import CommunicationConfigDrawer from '@/components/applications/CommunicationConfigDrawer'
import LegalConfigDrawer from '@/components/applications/LegalConfigDrawer'
import { 
  ServerIcon, 
  UsersIcon,
  GlobeIcon,
  ShieldCheckIcon,
  LockIcon,
  MessageSquareIcon,
  CogIcon,
  ArrowLeftIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  MailIcon,
  KeyIcon,
  SmartphoneIcon,
  MonitorIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ToggleLeftIcon,
  ClockIcon,
  EyeIcon,
  ScaleIcon,
  SettingsIcon,
} from 'lucide-react'

interface Application {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'development'
  users: number
  createdAt: string
  lastModified: string
  plan: 'free' | 'pro' | 'enterprise'
  domain?: string
}

interface ApplicationUser {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' | 'suspended'
  plan: string
  joinedAt: string
  lastActive: string
  avatar?: string
  phone?: string
  role?: string
}

export default function ApplicationConfigPage() {
  const params = useParams()
  const router = useRouter()
  const appId = (params?.id as string) || ''
  const [application, setApplication] = useState<Application | null>(null)
  const [users, setUsers] = useState<ApplicationUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)
  const [isCommDrawerOpen, setIsCommDrawerOpen] = useState(false)
  const [isLegalDrawerOpen, setIsLegalDrawerOpen] = useState(false)

  useEffect(() => {
    const loadAppData = async () => {
      try {
        const res = await fetch(`/api/v1/admin/applications/${appId}`)
        if (res.ok) {
          const data = await res.json()
          setApplication(data.application || data)
        } else {
          throw new Error('Failed to fetch')
        }
      } catch {
        setApplication({
          id: appId,
          name: 'E-Commerce Platform',
          description: 'Online shopping application with payment integration',
          status: 'active',
          users: 1250,
          createdAt: '2024-01-15',
          lastModified: '2024-02-20',
          plan: 'enterprise',
          domain: 'shop.example.com'
        })
      }

      try {
        const res = await fetch(`/api/v1/admin/applications/${appId}/users`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || data || [])
        } else {
          throw new Error('Failed to fetch')
        }
      } catch {
        setUsers([
          { id: '1', email: 'john.doe@example.com', name: 'John Doe', status: 'active', plan: 'Enterprise', joinedAt: '2024-01-15', lastActive: '2024-02-22', phone: '+1 555-0101', role: 'Admin' },
          { id: '2', email: 'jane.smith@example.com', name: 'Jane Smith', status: 'active', plan: 'Pro', joinedAt: '2024-01-20', lastActive: '2024-02-21', phone: '+1 555-0102', role: 'User' },
          { id: '3', email: 'bob.wilson@example.com', name: 'Bob Wilson', status: 'inactive', plan: 'Free', joinedAt: '2024-02-01', lastActive: '2024-02-10', role: 'User' },
          { id: '4', email: 'sarah.connor@example.com', name: 'Sarah Connor', status: 'active', plan: 'Pro', joinedAt: '2024-01-25', lastActive: '2024-02-22', phone: '+1 555-0104', role: 'Editor' },
          { id: '5', email: 'mike.ross@example.com', name: 'Mike Ross', status: 'suspended', plan: 'Free', joinedAt: '2024-02-05', lastActive: '2024-02-15', role: 'User' },
        ])
      }

      setIsLoading(false)
    }
    loadAppData()
  }, [appId])

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsDrawerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <ServerIcon className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Application not found</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">The application you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/applications')}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }
      case 'inactive': return { label: 'Inactive', dot: 'bg-gray-400', className: 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' }
      case 'suspended': return { label: 'Suspended', dot: 'bg-red-500', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' }
      case 'development': return { label: 'Development', dot: 'bg-blue-500', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' }
      default: return { label: status, dot: 'bg-gray-400', className: 'bg-gray-50 text-gray-600' }
    }
  }

  const getPlanConfig = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise': return { className: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' }
      case 'pro': return { className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' }
      case 'free': return { className: 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' }
      default: return { className: 'bg-gray-50 text-gray-600' }
    }
  }

  const appStatusConfig = getStatusConfig(application.status)

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  const tabItems = [
    { value: 'content', icon: <ServerIcon className="w-4 h-4" />, label: 'App Content' },
    { value: 'users', icon: <UsersIcon className="w-4 h-4" />, label: 'Users' },
    { value: 'identity', icon: <GlobeIcon className="w-4 h-4" />, label: 'Identity Scope' },
    { value: 'auth', icon: <ShieldCheckIcon className="w-4 h-4" />, label: 'Auth Methods' },
    { value: 'security', icon: <LockIcon className="w-4 h-4" />, label: 'Security & MFA' },
    { value: 'communication', icon: <MessageSquareIcon className="w-4 h-4" />, label: 'Communication' },
    { value: 'legal', icon: <ScaleIcon className="w-4 h-4" />, label: 'Legal & Compliance' },
    { value: 'sandbox', icon: <MonitorIcon className="w-4 h-4" />, label: 'Login Sandbox' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/applications')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            {application.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{application.name}</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{application.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${appStatusConfig.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${appStatusConfig.dot} mr-1.5`} />
            {appStatusConfig.label}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPlanConfig(application.plan).className}`}>
            {application.plan}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Users', value: application.users.toLocaleString(), icon: <UsersIcon className="w-4 h-4 text-blue-500" /> },
          { label: 'Domain', value: application.domain || 'Not set', icon: <GlobeIcon className="w-4 h-4 text-emerald-500" /> },
          { label: 'Created', value: new Date(application.createdAt).toLocaleDateString(), icon: <ClockIcon className="w-4 h-4 text-violet-500" /> },
          { label: 'Modified', value: new Date(application.lastModified).toLocaleDateString(), icon: <CogIcon className="w-4 h-4 text-amber-500" /> },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center space-x-2">
              {item.icon}
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-500">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Tabs */}
      <Tabs activeTab={activeTab} onChange={setActiveTab} className="space-y-4">
        <div className="border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
          <TabsList className="flex space-x-1 bg-transparent p-0 min-w-max">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 transition-all ${
                  activeTab === tab.value
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ==================== TAB 1: App Content ==================== */}
        <TabsContent value="content" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Application Content</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Manage your application&apos;s content, collections, pages, and appearance settings.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Collections', desc: 'Manage content types and entries', icon: <ServerIcon className="w-5 h-5" />, link: '/collections' },
                { title: 'Pages', desc: 'Build and manage pages', icon: <MonitorIcon className="w-5 h-5" />, link: '/pages' },
                { title: 'Appearance', desc: 'Theme and branding settings', icon: <EyeIcon className="w-5 h-5" />, link: '/appearance' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => router.push(item.link)}
                  className="flex items-start space-x-3 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 2: Users ==================== */}
        <TabsContent value="users" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
            {/* Users Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Application Users</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{filteredUsers.length} users found</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-48"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <FilterIcon className="w-4 h-4 mr-1.5" />
                  Filter
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  Add User
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Last Active</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                  {filteredUsers.map((user) => {
                    const statusConfig = getStatusConfig(user.status)
                    const planConfig = getPlanConfig(user.plan)
                    return (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusConfig.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1.5`} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${planConfig.className}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 dark:text-zinc-300">{user.role || 'User'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">{user.lastActive}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              handleUserClick(user.id)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">No users found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ==================== TAB 3: Global Identity Scope ==================== */}
        <TabsContent value="identity" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Global Identity Scope</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Configure how user identities are managed across this application.</p>

            <div className="space-y-6">
              {/* Identity Model */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <GlobeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Identity Model</h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Control how users are identified in this application</p>
                    </div>
                  </div>
                  <select className="text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option>Email-based</option>
                    <option>Username-based</option>
                    <option>Phone-based</option>
                    <option>Custom ID</option>
                  </select>
                </div>
              </div>

              {/* User Attributes */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">User Attributes</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Define required and optional user profile fields</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Email', 'First Name', 'Last Name', 'Phone Number', 'Avatar URL', 'Company'].map((attr, i) => (
                    <div key={attr} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{attr}</span>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-medium ${i < 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                          {i < 3 ? 'Required' : 'Optional'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={i < 4} />
                          <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope Settings */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <KeyIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Scope Configuration</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Define identity scopes and permissions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { scope: 'openid', desc: 'Basic OpenID Connect', enabled: true },
                    { scope: 'profile', desc: 'User profile information', enabled: true },
                    { scope: 'email', desc: 'Email address access', enabled: true },
                    { scope: 'phone', desc: 'Phone number access', enabled: false },
                    { scope: 'address', desc: 'Physical address', enabled: false },
                  ].map((s) => (
                    <div key={s.scope} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{s.scope}</span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400 ml-2">— {s.desc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={s.enabled} />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 4: Authentication Methods ==================== */}
        <TabsContent value="auth" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Authentication Methods</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure SSO providers, OAuth, and other authentication methods for this application.</p>
              </div>
              <Button onClick={() => setIsAuthDrawerOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Current Mode Badge */}
            <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Using Default Configuration</span>
              <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60">— Inherited from platform defaults</span>
            </div>

            {/* Summary Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Email & Password', icon: <MailIcon className="w-4 h-4" />, color: 'text-blue-500', enabled: true },
                { name: 'Google OAuth', icon: <GlobeIcon className="w-4 h-4" />, color: 'text-red-500', enabled: true },
                { name: 'GitHub OAuth', icon: <CogIcon className="w-4 h-4" />, color: 'text-gray-500', enabled: false },
                { name: 'SAML SSO', icon: <ShieldCheckIcon className="w-4 h-4" />, color: 'text-violet-500', enabled: false },
                { name: 'Magic Link', icon: <KeyIcon className="w-4 h-4" />, color: 'text-emerald-500', enabled: true },
                { name: 'SMS OTP', icon: <SmartphoneIcon className="w-4 h-4" />, color: 'text-amber-500', enabled: false },
              ].map((m) => (
                <div key={m.name} className="flex items-center space-x-2 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                  <span className={m.color}>{m.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 flex-1">{m.name}</span>
                  {m.enabled ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 5: Security & MFA ==================== */}
        <TabsContent value="security" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Security & MFA</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Configure multi-factor authentication, password policies, and session security.</p>

            <div className="space-y-6">
              {/* MFA Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3 flex items-center">
                  <LockIcon className="w-4 h-4 mr-2 text-violet-500" />
                  Multi-Factor Authentication
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'TOTP (Authenticator App)', desc: 'Google Authenticator, Authy, etc.', enabled: true },
                    { name: 'SMS Verification', desc: 'Send OTP via text message', enabled: false },
                    { name: 'Email Verification', desc: 'Send OTP via email', enabled: true },
                    { name: 'Hardware Key (FIDO2)', desc: 'YubiKey, Titan Security Key', enabled: false },
                  ].map((mfa) => (
                    <div key={mfa.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{mfa.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{mfa.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={mfa.enabled} />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Password Policy */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3 flex items-center">
                  <KeyIcon className="w-4 h-4 mr-2 text-amber-500" />
                  Password Policy
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Minimum Length', type: 'number', defaultValue: '8' },
                    { label: 'Max Login Attempts', type: 'number', defaultValue: '5' },
                    { label: 'Password Expiry (days)', type: 'number', defaultValue: '90' },
                    { label: 'Lockout Duration (min)', type: 'number', defaultValue: '30' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        defaultValue={field.defaultValue}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Require uppercase letter', checked: true },
                    { label: 'Require lowercase letter', checked: true },
                    { label: 'Require number', checked: true },
                    { label: 'Require special character', checked: false },
                  ].map((rule) => (
                    <label key={rule.label} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={rule.checked} className="w-4 h-4 text-blue-500 border-gray-300 dark:border-zinc-600 rounded focus:ring-blue-500/20" />
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{rule.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Session Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                  Session Management
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Session Timeout (min)</label>
                    <input type="number" defaultValue="60" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Max Concurrent Sessions</label>
                    <input type="number" defaultValue="3" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 6: Communication ==================== */}
        <TabsContent value="communication" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Communication Settings</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure email, SMS, push notifications, and templates for this application.</p>
              </div>
              <Button onClick={() => setIsCommDrawerOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Current Mode Badge */}
            <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Using Default Configuration</span>
              <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60">— Inherited from platform defaults</span>
            </div>

            {/* Summary Preview */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Channels</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Email', icon: <MailIcon className="w-4 h-4" />, color: 'text-blue-500', enabled: true },
                    { name: 'SMS', icon: <SmartphoneIcon className="w-4 h-4" />, color: 'text-red-500', enabled: false },
                    { name: 'Push', icon: <MonitorIcon className="w-4 h-4" />, color: 'text-amber-500', enabled: false },
                    { name: 'In-App', icon: <MessageSquareIcon className="w-4 h-4" />, color: 'text-violet-500', enabled: true },
                  ].map((ch) => (
                    <div key={ch.name} className="flex items-center space-x-2 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <span className={ch.color}>{ch.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 flex-1">{ch.name}</span>
                      {ch.enabled ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Email Templates</h4>
                <div className="flex flex-wrap gap-2">
                  {['Welcome Email', 'Password Reset', 'Email Verification', 'MFA Code'].map(t => (
                    <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[11px] font-medium">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      {t}
                    </span>
                  ))}
                  {['Account Locked', 'Plan Upgrade'].map(t => (
                    <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400 text-[11px] font-medium">
                      {t} (Draft)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 7: Legal & Compliance ==================== */}
        <TabsContent value="legal" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Legal & Compliance</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Manage legal documents and compliance settings for this application.</p>
              </div>
              <Button onClick={() => setIsLegalDrawerOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Current Mode Badge */}
            <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Using Default Configuration</span>
              <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60">— Inherited from platform defaults</span>
            </div>

            {/* Summary Preview */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Legal Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: 'Terms of Service', version: 'v2.1', status: 'Published' },
                    { name: 'Privacy Policy', version: 'v3.0', status: 'Published' },
                    { name: 'Cookie Policy', version: 'v1.2', status: 'Draft' },
                    { name: 'Data Processing Agreement', version: 'v1.0', status: 'Published' },
                  ].map(doc => (
                    <div key={doc.name} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <div className="flex items-center space-x-2">
                        <ScaleIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{doc.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">{doc.version}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          doc.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-zinc-400'
                        }`}>{doc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Compliance</h4>
                <div className="flex flex-wrap gap-2">
                  {['GDPR Mode', 'Cookie Consent', 'Right to Erasure', 'Data Export'].map(item => (
                    <span key={item} className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[11px] font-medium">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      {item}
                    </span>
                  ))}
                  {['Data Retention', 'Age Verification'].map(item => (
                    <span key={item} className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400 text-[11px] font-medium">
                      <XCircleIcon className="w-3 h-3 mr-1" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 7: Login Sandbox ==================== */}
        <TabsContent value="sandbox" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Login Sandbox</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Test and preview login flows in a safe sandbox environment.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-full max-w-sm space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 mx-auto mb-3">
                      {application.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Sign in to {application.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Enter your credentials to continue</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Email</label>
                    <input type="email" placeholder="user@example.com" className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                  </div>
                  <button className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                    Sign In
                  </button>
                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-gray-200 dark:border-zinc-700" />
                    <span className="px-3 text-xs text-gray-400">or</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-zinc-700" />
                  </div>
                  <button className="w-full py-2.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center">
                    <GlobeIcon className="w-4 h-4 mr-2" />
                    Continue with Google
                  </button>
                </div>
              </div>

              {/* Sandbox Controls */}
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Sandbox Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Test User Email</label>
                      <input type="email" defaultValue="test@sandbox.example.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Test User Password</label>
                      <input type="password" defaultValue="sandbox123" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Redirect URL</label>
                      <input type="url" defaultValue={`https://${application.domain || 'localhost:3000'}/callback`} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Test Scenarios</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Simulate Login Success', desc: 'Test successful authentication flow', icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> },
                      { label: 'Simulate Login Failure', desc: 'Test error handling and messages', icon: <XCircleIcon className="w-4 h-4 text-red-500" /> },
                      { label: 'Simulate MFA Challenge', desc: 'Test MFA verification step', icon: <ShieldCheckIcon className="w-4 h-4 text-violet-500" /> },
                      { label: 'Simulate Account Lockout', desc: 'Test lockout after failed attempts', icon: <AlertTriangleIcon className="w-4 h-4 text-amber-500" /> },
                    ].map((scenario) => (
                      <button
                        key={scenario.label}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all text-left"
                      >
                        {scenario.icon}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{scenario.label}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{scenario.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail Drawer */}
      {selectedUserId && (
        <UserDetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedUserId(null)
          }}
          userId={selectedUserId}
          applicationId={appId}
        />
      )}

      {/* Config Drawers */}
      <AuthMethodsConfigDrawer
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
        appId={appId}
        appName={application.name}
      />
      <CommunicationConfigDrawer
        isOpen={isCommDrawerOpen}
        onClose={() => setIsCommDrawerOpen(false)}
        appId={appId}
        appName={application.name}
      />
      <LegalConfigDrawer
        isOpen={isLegalDrawerOpen}
        onClose={() => setIsLegalDrawerOpen(false)}
        appId={appId}
        appName={application.name}
      />
    </div>
  )
}
