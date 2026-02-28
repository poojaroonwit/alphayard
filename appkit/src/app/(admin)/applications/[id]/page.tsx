'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import UserDetailDrawer from '@/components/users/UserDetailDrawer'
import AuthMethodsConfigDrawer from '@/components/applications/AuthMethodsConfigDrawer'
import CommunicationConfigDrawer from '@/components/applications/CommunicationConfigDrawer'
import LegalConfigDrawer from '@/components/applications/LegalConfigDrawer'
import IntegrationGuideDrawer from '@/components/applications/IntegrationGuideDrawer'
import DevGuideDrawer from '@/components/applications/DevGuideDrawer'
import SurveyBuilder from '@/components/applications/SurveyBuilder'
import UserAttributesConfig from '@/components/applications/UserAttributesConfig'
import BillingConfigDrawer from '@/components/applications/BillingConfigDrawer'
import AuthStyleConfig from '@/components/applications/AuthStyleConfig'
import { adminService } from '@/services/adminService'
import { AnnouncementSettings } from '@/components/appearance/AnnouncementSettings'
import { SocialSettings } from '@/components/appearance/SocialSettings'
import { SplashScreenSettings } from '@/components/appearance/SplashScreenSettings'
import { AppUpdateSettings } from '@/components/appearance/AppUpdateSettings'
import { BrandingSettings } from '@/components/appearance/BrandingSettings'
import { 
  ServerIcon, 
  UsersIcon,
  GlobeIcon,
  ShieldIcon,
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
  CodeIcon,
  CopyIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  ImageIcon,
  StarIcon,
  XIcon,
  Loader2Icon,
  SaveIcon,
  UserPlusIcon,
  ClipboardListIcon,
  MegaphoneIcon,
  LinkIcon as LinksIcon,
  SparklesIcon,
  RocketIcon,
  PaintbrushIcon,
  CreditCardIcon,
  LogInIcon,
  WebhookIcon,
  ActivityIcon,
  Trash2Icon,
  RefreshCwIcon,
  AlertCircleIcon,
  HashIcon,
  DownloadIcon,
} from 'lucide-react'

interface Application {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'development'
  platform: 'web' | 'mobile'
  users: number
  createdAt: string
  lastModified: string
  plan: 'free' | 'pro' | 'enterprise'
  domain?: string
  logoUrl?: string
  appUrl?: string
  gaTrackingId?: string
  metaTitle?: string
  metaDescription?: string
  faviconUrl?: string
  bundleId?: string
  deepLinkScheme?: string
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
  const [activeTab, setActiveTab] = useState('general')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)
  const [isCommDrawerOpen, setIsCommDrawerOpen] = useState(false)
  const [isLegalDrawerOpen, setIsLegalDrawerOpen] = useState(false)
  const [isIntegrateDrawerOpen, setIsIntegrateDrawerOpen] = useState(false)
  const [isBillingDrawerOpen, setIsBillingDrawerOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Add User modal
  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserForm, setAddUserForm] = useState({ email: '', name: '', role: 'User', plan: 'Free' })
  const [addingUser, setAddingUser] = useState(false)
  // Sandbox mode
  const [sandboxMode, setSandboxMode] = useState<'login' | 'signup'>('login')
  const [sandboxResult, setSandboxResult] = useState<any>(null)
  const [sandboxRunning, setSandboxRunning] = useState(false)
  // General tab
  const [generalSaving, setGeneralSaving] = useState(false)
  const [generalMsg, setGeneralMsg] = useState('')
  // Branding state for appearance components
  const [appBranding, setAppBranding] = useState<any>({
    appName: '',
    logoUrl: '',
    announcements: { enabled: false, text: '', linkUrl: '', type: 'info' as const, isDismissible: true },
    social: { supportEmail: '', helpDeskUrl: '', whatsapp: '', instagram: '', facebook: '', line: '', twitter: '', linkedin: '', discord: '', appStoreId: '', playStoreId: '' },
    splash: { backgroundColor: '#FFFFFF', spinnerColor: '#3B82F6', spinnerType: 'circle' as const, showAppName: true, showLogo: true, resizeMode: 'cover', logoAnimation: 'none' },
    updates: { minVersion: '1.0.0', storeUrl: '', forceUpdate: false },
  })
  const [brandingUploading, setBrandingUploading] = useState(false)
  // Legal configuration state
  const [legalConfig, setLegalConfig] = useState<any>(null)
  const [legalUseDefault, setLegalUseDefault] = useState(true)
  const [legalLoading, setLegalLoading] = useState(true)
  // Security & MFA state (controlled)
  const [securityConfig, setSecurityConfig] = useState({
    mfa: { totp: true, sms: false, email: true, fido2: false },
    password: { minLength: 8, maxAttempts: 5, expiryDays: 90, lockoutMinutes: 30, requireUppercase: true, requireLowercase: true, requireNumber: true, requireSpecial: false },
    session: { timeoutMinutes: 60, maxConcurrent: 3 },
  })
  const [securitySaving, setSecuritySaving] = useState(false)
  const [securityMsg, setSecurityMsg] = useState('')
  // Identity Scope state (controlled)
  const [identityConfig, setIdentityConfig] = useState({
    model: 'Email-based',
    scopes: { openid: true, profile: true, email: true, phone: false, address: false },
  })
  const [identitySaving, setIdentitySaving] = useState(false)
  const [identityMsg, setIdentityMsg] = useState('')
  // API Key
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [apiKey] = useState(`ak_live_${appId.substring(0, 8)}...${Math.random().toString(36).substring(2, 10)}`)
  // Webhooks
  const [webhooks, setWebhooks] = useState([
    { id: '1', url: 'https://api.example.com/webhooks/appkit', events: ['user.created', 'user.login'], status: 'active' as const, lastTriggered: '2024-02-22T10:30:00Z' },
    { id: '2', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['user.signup'], status: 'active' as const, lastTriggered: '2024-02-21T15:45:00Z' },
  ])
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  // Activity Log
  const [activityLog, setActivityLog] = useState<{ id: string; action: string; user: string; timestamp: string; type: 'config' | 'user' | 'webhook' | 'security' }[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityFilter, setActivityFilter] = useState<'all' | 'config' | 'user' | 'webhook' | 'security'>('all')

  const loadActivityLog = useCallback(async () => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivityLog(data.entries || data)
      } else { throw new Error('Failed') }
    } catch {
      setActivityLog([
        { id: '1', action: 'Auth config updated', user: 'admin@example.com', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'config' },
        { id: '2', action: 'User john.doe@example.com created', user: 'admin@example.com', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'user' },
        { id: '3', action: 'Webhook endpoint added', user: 'admin@example.com', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'webhook' },
        { id: '4', action: 'MFA settings updated', user: 'admin@example.com', timestamp: new Date(Date.now() - 90000000).toISOString(), type: 'security' },
        { id: '5', action: 'Branding logo uploaded', user: 'admin@example.com', timestamp: new Date(Date.now() - 172800000).toISOString(), type: 'config' },
        { id: '6', action: 'Legal documents updated', user: 'admin@example.com', timestamp: new Date(Date.now() - 180000000).toISOString(), type: 'config' },
        { id: '7', action: 'User mike.ross@example.com suspended', user: 'admin@example.com', timestamp: new Date(Date.now() - 259200000).toISOString(), type: 'user' },
        { id: '8', action: 'Application status changed to active', user: 'admin@example.com', timestamp: new Date(Date.now() - 345600000).toISOString(), type: 'config' },
        { id: '9', action: 'Identity scope updated to include phone', user: 'admin@example.com', timestamp: new Date(Date.now() - 432000000).toISOString(), type: 'security' },
        { id: '10', action: 'Webhook https://hooks.slack.com/... removed', user: 'admin@example.com', timestamp: new Date(Date.now() - 518400000).toISOString(), type: 'webhook' },
      ])
    } finally { setActivityLoading(false) }
  }, [appId])

  useEffect(() => { loadActivityLog() }, [loadActivityLog])

  const filteredActivityLog = activityFilter === 'all' ? activityLog : activityLog.filter(l => l.type === activityFilter)

  const handleExportActivity = () => {
    const csv = ['timestamp,type,action,user', ...filteredActivityLog.map(l => `"${l.timestamp}","${l.type}","${l.action.replace(/"/g, '""')}","${l.user}"`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `activity-log-${appId}-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }
  // Dev Guide Drawers
  const [activeDevGuide, setActiveDevGuide] = useState<string | null>(null)
  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleBrandingUpload = async (field: string, file: File) => {
    setBrandingUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/v1/admin/applications/${appId}/upload`, { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setAppBranding((prev: any) => ({ ...prev, [field]: data.url || URL.createObjectURL(file) }))
      } else {
        setAppBranding((prev: any) => ({ ...prev, [field]: URL.createObjectURL(file) }))
      }
    } catch {
      setAppBranding((prev: any) => ({ ...prev, [field]: URL.createObjectURL(file) }))
    } finally {
      setBrandingUploading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
          platform: 'web',
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

      try {
        setLegalLoading(true)
        const res = await adminService.getAppConfigOverride(appId, 'legal')
        setLegalUseDefault(res.useDefault)
        
        const defaults = await adminService.getDefaultLegalConfig()
        const activeConfig = (!res.useDefault && res.config) ? res.config : defaults.config
        setLegalConfig(activeConfig)
      } catch (err) {
        console.error('Failed to load legal config:', err)
      } finally {
        setLegalLoading(false)
      }

      setIsLoading(false)
    }
    loadAppData()
  }, [appId, isLegalDrawerOpen])

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsDrawerOpen(true)
  }

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.name) return
    try {
      setAddingUser(true)
      await fetch(`/api/v1/admin/applications/${appId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      })
      const newUser: ApplicationUser = {
        id: Date.now().toString(),
        email: addUserForm.email,
        name: addUserForm.name,
        status: 'active',
        plan: addUserForm.plan,
        joinedAt: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
        role: addUserForm.role,
      }
      setUsers(prev => [newUser, ...prev])
      setShowAddUser(false)
      setAddUserForm({ email: '', name: '', role: 'User', plan: 'Free' })
    } catch (err) {
      console.error('Failed to add user:', err)
    } finally {
      setAddingUser(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!application) return
    try {
      setGeneralSaving(true)
      await fetch(`/api/v1/admin/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      })
      setGeneralMsg('Saved!')
      setTimeout(() => setGeneralMsg(''), 3000)
    } catch {
      setGeneralMsg('Failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setGeneralSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    try {
      setSecuritySaving(true)
      await fetch(`/api/v1/admin/applications/${appId}/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securityConfig),
      })
      setSecurityMsg('Saved!')
      setTimeout(() => setSecurityMsg(''), 3000)
    } catch {
      setSecurityMsg('Failed')
      setTimeout(() => setSecurityMsg(''), 3000)
    } finally {
      setSecuritySaving(false)
    }
  }

  const handleSaveIdentity = async () => {
    try {
      setIdentitySaving(true)
      await fetch(`/api/v1/admin/applications/${appId}/identity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identityConfig),
      })
      setIdentityMsg('Saved!')
      setTimeout(() => setIdentityMsg(''), 3000)
    } catch {
      setIdentityMsg('Failed')
      setTimeout(() => setIdentityMsg(''), 3000)
    } finally {
      setIdentitySaving(false)
    }
  }

  const handleAddWebhook = () => {
    if (!newWebhookUrl) return
    setWebhooks(prev => [...prev, { id: Date.now().toString(), url: newWebhookUrl, events: ['user.created'], status: 'active' as const, lastTriggered: '' }])
    setNewWebhookUrl('')
    setShowAddWebhook(false)
  }

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  const handleDeleteApp = async () => {
    try {
      await fetch(`/api/v1/admin/applications/${appId}`, { method: 'DELETE' })
      router.push('/applications')
    } catch {
      setGeneralMsg('Delete failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    }
  }

  const handleSandboxSimulate = (type: string) => {
    setSandboxRunning(true)
    setTimeout(() => {
      setSandboxRunning(false)
      if (type.includes('Success')) {
        setSandboxResult({
          status: 200,
          body: {
            success: true,
            user: { id: 'usr_sandbox_001', email: 'test@sandbox.example.com', name: 'Sandbox User' },
            tokens: { access_token: 'eyJhbGciOiJSUzI1NiIs...', refresh_token: 'dGhpcyBpcyBhIHRlc3Q...', expires_in: 3600 },
          },
        })
      } else if (type.includes('Failure') || type.includes('Lockout')) {
        setSandboxResult({
          status: 401,
          body: { success: false, error: type.includes('Lockout') ? 'Account locked. Try again in 30 minutes.' : 'Invalid credentials.' },
        })
      } else if (type.includes('MFA')) {
        setSandboxResult({
          status: 200,
          body: { success: true, mfa_required: true, mfa_token: 'mfa_challenge_abc123', methods: ['totp', 'email'] },
        })
      } else if (type.includes('Verification')) {
        setSandboxResult({
          status: 200,
          body: { success: true, message: 'Verification email sent to test@sandbox.example.com', verification_token: 'verify_xyz789' },
        })
      }
    }, 800)
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
    (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  const sidebarSections = [
    {
      title: 'Core',
      items: [
        { value: 'general', icon: <SettingsIcon className="w-4 h-4" />, label: 'General' },
        { value: 'integration', icon: <CodeIcon className="w-4 h-4" />, label: 'Integration Guide' },
        { value: 'users', icon: <UsersIcon className="w-4 h-4" />, label: 'Users' },
        { value: 'surveys', icon: <ClipboardListIcon className="w-4 h-4" />, label: 'Surveys' },
      ],
    },
    {
      title: 'App Experience',
      items: [
        { value: 'branding', icon: <PaintbrushIcon className="w-4 h-4" />, label: 'Branding' },
        { value: 'banners', icon: <MegaphoneIcon className="w-4 h-4" />, label: 'Banners' },
        { value: 'links', icon: <LinksIcon className="w-4 h-4" />, label: 'Links & Support' },
        { value: 'splash', icon: <SparklesIcon className="w-4 h-4" />, label: 'Splash Screen' },
        { value: 'auth-style', icon: <LogInIcon className="w-4 h-4" />, label: 'Auth Page Style' },
      ],
    },
    {
      title: 'Identity & Security',
      items: [
        { value: 'identity', icon: <GlobeIcon className="w-4 h-4" />, label: 'Identity Scope' },
        { value: 'user-attributes', icon: <UsersIcon className="w-4 h-4" />, label: 'User Attributes' },
        { value: 'auth', icon: <ShieldCheckIcon className="w-4 h-4" />, label: 'Auth Methods' },
        { value: 'security', icon: <LockIcon className="w-4 h-4" />, label: 'Security & MFA' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { value: 'communication', icon: <MessageSquareIcon className="w-4 h-4" />, label: 'Communication' },
        { value: 'webhooks', icon: <WebhookIcon className="w-4 h-4" />, label: 'Webhooks' },
        { value: 'legal', icon: <ScaleIcon className="w-4 h-4" />, label: 'Legal & Compliance' },
        { value: 'billing', icon: <CreditCardIcon className="w-4 h-4" />, label: 'Billing & Subscriptions' },
        { value: 'activity', icon: <ActivityIcon className="w-4 h-4" />, label: 'Activity Log' },
        { value: 'sandbox', icon: <MonitorIcon className="w-4 h-4" />, label: 'Login Sandbox' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/applications')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title="Back to applications"
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

      {/* Vertical Sidebar + Content Layout */}
      <div className="flex gap-6">
        {/* Vertical Sidebar */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-4 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3 space-y-4">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1.5">{section.title}</h4>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        if (item.value === 'billing') {
                          setIsBillingDrawerOpen(true)
                        } else {
                          setActiveTab(item.value)
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === item.value
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <TabsList className="hidden"><TabsTrigger value={activeTab}>{activeTab}</TabsTrigger></TabsList>

        {/* ==================== TAB: General Settings ==================== */}
        <TabsContent value="general" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">General Settings</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure your application&apos;s identity, platform, and metadata.</p>
              </div>
              <div className="flex items-center gap-2">
                {generalMsg && <span className={`text-xs font-medium ${generalMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{generalMsg}</span>}
                <Button onClick={handleSaveGeneral} disabled={generalSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  {generalSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Platform Selector */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Platform Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setApplication(prev => prev ? { ...prev, platform: 'web' } : prev)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${application.platform === 'web' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${application.platform === 'web' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                    <MonitorIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${application.platform === 'web' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-zinc-300'}`}>Web Application</p>
                    <p className="text-[10px] text-gray-400">React, Next.js, Vue, Angular</p>
                  </div>
                </button>
                <button
                  onClick={() => setApplication(prev => prev ? { ...prev, platform: 'mobile' } : prev)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${application.platform === 'mobile' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${application.platform === 'mobile' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                    <SmartphoneIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${application.platform === 'mobile' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'}`}>Mobile Application</p>
                    <p className="text-[10px] text-gray-400">React Native, Flutter, Swift, Kotlin</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Identity & Branding */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identity & Branding</h4>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/30 transition-colors cursor-pointer group shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                      {application.logoUrl ? (
                        <img src={application.logoUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        application.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <input
                      type="text"
                      value={application.logoUrl || ''}
                      onChange={e => setApplication(prev => prev ? { ...prev, logoUrl: e.target.value } : prev)}
                      placeholder="Logo URL"
                      className="mt-2 w-24 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[9px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Application Name</label>
                      <input type="text" title="Application name" value={application.name} onChange={e => setApplication(prev => prev ? { ...prev, name: e.target.value } : prev)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Description</label>
                      <textarea title="Application description" value={application.description} onChange={e => setApplication(prev => prev ? { ...prev, description: e.target.value } : prev)} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">{application.platform === 'web' ? 'Application URL' : 'App Store URL'}</label>
                    <input type="url" value={application.appUrl || application.domain || ''} onChange={e => setApplication(prev => prev ? { ...prev, appUrl: e.target.value } : prev)} placeholder={application.platform === 'web' ? 'https://your-app.com' : 'https://apps.apple.com/...'} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Status</label>
                    <select title="Application status" value={application.status} onChange={e => setApplication(prev => prev ? { ...prev, status: e.target.value as Application['status'] } : prev)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                </div>

                {application.platform === 'mobile' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Bundle ID</label>
                      <input type="text" value={application.bundleId || ''} onChange={e => setApplication(prev => prev ? { ...prev, bundleId: e.target.value } : prev)} placeholder="com.yourapp.mobile" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Deep Link Scheme</label>
                      <input type="text" value={application.deepLinkScheme || ''} onChange={e => setApplication(prev => prev ? { ...prev, deepLinkScheme: e.target.value } : prev)} placeholder="myapp://" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                )}

                {application.platform === 'web' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">{application.platform === 'web' ? 'Domain' : 'Bundle ID'}</label>
                      <input type="text" value={application.domain || ''} onChange={e => setApplication(prev => prev ? { ...prev, domain: e.target.value } : prev)} placeholder="your-app.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Favicon URL</label>
                      <input type="url" value={application.faviconUrl || ''} onChange={e => setApplication(prev => prev ? { ...prev, faviconUrl: e.target.value } : prev)} placeholder="https://your-app.com/favicon.ico" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                )}

                {/* API Key */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">API Key</h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                    <KeyIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <code className="flex-1 text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">
                      {apiKeyVisible ? apiKey : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title={apiKeyVisible ? 'Hide API key' : 'Show API key'}>
                      <EyeIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleCopy(apiKey, 'apikey')} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy API key">
                      {copiedId === 'apikey' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-2">Keep this secret. Never expose it in client-side code.</p>
                </div>
              </div>

              {/* Right Column: Metadata & Info */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{application.platform === 'web' ? 'SEO & Analytics' : 'App Store Metadata'}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">{application.platform === 'web' ? 'Google Analytics ID' : 'Firebase Analytics ID'}</label>
                    <input type="text" value={application.gaTrackingId || ''} onChange={e => setApplication(prev => prev ? { ...prev, gaTrackingId: e.target.value } : prev)} placeholder={application.platform === 'web' ? 'G-XXXXXXXXXX' : 'firebase-project-id'} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Meta Title</label>
                    <input type="text" value={application.metaTitle || ''} onChange={e => setApplication(prev => prev ? { ...prev, metaTitle: e.target.value } : prev)} placeholder="Your App — Tagline" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Meta Description</label>
                    <input type="text" value={application.metaDescription || ''} onChange={e => setApplication(prev => prev ? { ...prev, metaDescription: e.target.value } : prev)} placeholder="A short description for search engines" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>

                {/* App Info */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Application Info</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <p className="text-gray-400 mb-0.5">App ID</p>
                      <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{appId}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <p className="text-gray-400 mb-0.5">Platform</p>
                      <p className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{application.platform === 'web' ? '🌐 Web App' : '📱 Mobile App'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <p className="text-gray-400 mb-0.5">Plan</p>
                      <p className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{application.plan}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <p className="text-gray-400 mb-0.5">Users</p>
                      <p className="font-medium text-gray-700 dark:text-zinc-300">{application.users.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* App Version Control */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">App Version Control</h4>
                  <AppUpdateSettings updates={appBranding.updates} setBranding={setAppBranding} />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200/80 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-6">
            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
              <AlertCircleIcon className="w-4 h-4" /> Danger Zone
            </h4>
            <p className="text-xs text-red-600/70 dark:text-red-400/60 mb-4">Deleting this application is permanent and cannot be undone. All users, data, and configuration will be lost.</p>
            {!showDeleteConfirm ? (
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2Icon className="w-4 h-4 mr-1.5" /> Delete Application
              </Button>
            ) : (
              <div className="space-y-3 p-4 rounded-lg border border-red-200 dark:border-red-500/20 bg-white dark:bg-zinc-900">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">Type <code className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/10 rounded font-mono text-[10px]">{application.name}</code> to confirm:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={application.name}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-red-200 dark:border-red-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="text-xs">Cancel</Button>
                  <Button onClick={handleDeleteApp} disabled={deleteConfirmText !== application.name} className="bg-red-600 text-white border-0 hover:bg-red-700 disabled:opacity-40 text-xs">
                    <Trash2Icon className="w-3.5 h-3.5 mr-1" /> Permanently Delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setActiveDevGuide('app-metadata')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Application Metadata
          </button>
        </TabsContent>

        {/* ==================== TAB: Integration Guide ==================== */}
        <TabsContent value="integration" className="space-y-6">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Integration Guide</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Initialize the AppKit SDK with this application&apos;s specific configuration to start authenticating users.</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/dev-hub')} className="shrink-0 flex items-center gap-2">
                <ExternalLinkIcon className="w-4 h-4" />
                Full Dev Docs
              </Button>
            </div>

            {/* Platform Tabs */}
            <div className="flex items-center gap-1.5 mb-6 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg w-fit">
              <button
                onClick={() => setApplication(prev => prev ? { ...prev, platform: 'web' } : prev)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${application.platform === 'web' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'}`}
              >
                <GlobeIcon className="w-4 h-4" /> Web App
              </button>
              <button
                onClick={() => setApplication(prev => prev ? { ...prev, platform: 'mobile' } : prev)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${application.platform === 'mobile' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'}`}
              >
                <SmartphoneIcon className="w-4 h-4" /> Mobile App
              </button>
            </div>

            <div className="space-y-8">
              {/* Web App Integration */}
              {application.platform === 'web' && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <GlobeIcon className="w-5 h-5 text-blue-500" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Web / React / Next.js Integration</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">1. Install the core identity package:</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy('npm install @appkit/identity-core', 'install-web')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'install-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800"><code>npm install @appkit/identity-core</code></pre>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 pt-2">2. Add your Environment Variables:</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`NEXT_PUBLIC_APPKIT_DOMAIN="https://${application.domain || 'auth.your-app.com'}"\nNEXT_PUBLIC_APPKIT_CLIENT_ID="${appId}"`, 'env-web')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'env-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <code className="text-blue-300">NEXT_PUBLIC_APPKIT_DOMAIN</code><span className="text-gray-400">="https://{application.domain || 'auth.your-app.com'}"</span>{'\n'}
                        <code className="text-blue-300">NEXT_PUBLIC_APPKIT_CLIENT_ID</code><span className="text-gray-400">="{appId}"</span>
                      </pre>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 pt-2">3. Trigger the login flow:</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`import { AppKit } from '@appkit/identity-core';\n\nconst client = new AppKit({\n  clientId: process.env.NEXT_PUBLIC_APPKIT_CLIENT_ID,\n  domain: process.env.NEXT_PUBLIC_APPKIT_DOMAIN\n});\n\nawait client.login();`, 'code-web')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'code-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <span className="text-purple-400">import</span> {'{ AppKit }'} <span className="text-purple-400">from</span> <span className="text-green-300">&apos;@appkit/identity-core&apos;</span>;<br/><br/>
                        <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-yellow-200">AppKit</span>({'{'}<br/>
                        {'  '}clientId: process.env.<span className="text-blue-300">NEXT_PUBLIC_APPKIT_CLIENT_ID</span>,<br/>
                        {'  '}domain: process.env.<span className="text-blue-300">NEXT_PUBLIC_APPKIT_DOMAIN</span><br/>
                        {'}'});<br/><br/>
                        <span className="text-purple-400">await</span> client.<span className="text-blue-200">login</span>();
                      </pre>
                    </div>
                  </div>

                  {/* Web Signup */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <UserPlusIcon className="w-5 h-5 text-violet-500" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Signup Integration</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Register new users from your web application.</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`await client.signup({\n  email: 'user@example.com',\n  password: 'securePassword123',\n  name: 'John Doe',\n});`, 'code-signup')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'code-signup' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <span className="text-purple-400">await</span> client.<span className="text-blue-200">signup</span>({'{'}<br/>
                        {'  '}email: <span className="text-green-300">&apos;user@example.com&apos;</span>,<br/>
                        {'  '}password: <span className="text-green-300">&apos;securePassword123&apos;</span>,<br/>
                        {'  '}name: <span className="text-green-300">&apos;John Doe&apos;</span>,<br/>
                        {'}'});
                      </pre>
                    </div>
                  </div>

                  {/* Web Survey SDK */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <ClipboardListIcon className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Survey SDK</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Trigger in-app surveys to collect feedback from your web users.</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`await client.showSurvey('SURVEY_ID');\nclient.on('survey:completed', (res) => {\n  console.log('Answers:', res.answers);\n});`, 'code-survey')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'code-survey' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <span className="text-purple-400">await</span> client.<span className="text-blue-200">showSurvey</span>(<span className="text-green-300">&apos;SURVEY_ID&apos;</span>);<br/><br/>
                        client.<span className="text-blue-200">on</span>(<span className="text-green-300">&apos;survey:completed&apos;</span>, (res) ={'> {'}<br/>
                        {'  '}console.log(<span className="text-green-300">&apos;Answers:&apos;</span>, res.answers);<br/>
                        {'}'});
                      </pre>
                    </div>
                  </div>
                </>
              )}

              {/* Mobile App Integration */}
              {application.platform === 'mobile' && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <SmartphoneIcon className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">React Native / Expo Integration</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">1. Install the React Native SDK:</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy('npm install @appkit/react-native react-native-app-auth', 'install-rn')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'install-rn' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800"><code>npm install @appkit/react-native react-native-app-auth</code></pre>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 pt-2">2. Configure OAuth with deep linking:</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`import { authorize } from 'react-native-app-auth';\n\nconst config = {\n  issuer: 'https://${application.domain || 'auth.your-app.com'}/oauth',\n  clientId: '${appId}',\n  redirectUrl: '${application.deepLinkScheme || 'com.appkit.' + application.name.toLowerCase().replace(/[^a-z0-9]/g, '')}://oauth',\n  scopes: ['openid', 'profile', 'email', 'offline_access'],\n  usePKCE: true,\n};\n\nconst authState = await authorize(config);`, 'code-rn')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'code-rn' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <span className="text-purple-400">import</span> {'{ authorize }'} <span className="text-purple-400">from</span> <span className="text-green-300">&apos;react-native-app-auth&apos;</span>;<br/><br/>
                        <span className="text-purple-400">const</span> config = {'{'}<br/>
                        {'  '}issuer: <span className="text-green-300">&apos;https://{application.domain || 'auth.your-app.com'}/oauth&apos;</span>,<br/>
                        {'  '}clientId: <span className="text-green-300">&apos;{appId}&apos;</span>,<br/>
                        {'  '}redirectUrl: <span className="text-green-300">&apos;{application.deepLinkScheme || 'com.appkit.' + application.name.toLowerCase().replace(/[^a-z0-9]/g, '')}://oauth&apos;</span>,<br/>
                        {'  '}scopes: [<span className="text-green-300">&apos;openid&apos;</span>, <span className="text-green-300">&apos;profile&apos;</span>, <span className="text-green-300">&apos;email&apos;</span>, <span className="text-green-300">&apos;offline_access&apos;</span>],<br/>
                        {'  '}usePKCE: <span className="text-yellow-400">true</span>,<br/>
                        {'}'};<br/><br/>
                        <span className="text-purple-400">const</span> authState = <span className="text-purple-400">await</span> <span className="text-blue-200">authorize</span>(config);
                      </pre>
                    </div>
                  </div>

                  {/* Mobile Signup */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <UserPlusIcon className="w-5 h-5 text-violet-500" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Mobile Signup</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Register new users from your mobile application with biometric support.</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`import { useAuth } from '@appkit/react-native';\n\nconst { signup } = useAuth();\n\nawait signup({\n  email: 'user@example.com',\n  password: 'securePassword123',\n  name: 'John Doe',\n  enableBiometric: true,\n});`, 'code-signup-rn')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'code-signup-rn' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <span className="text-purple-400">import</span> {'{ useAuth }'} <span className="text-purple-400">from</span> <span className="text-green-300">&apos;@appkit/react-native&apos;</span>;<br/><br/>
                        <span className="text-purple-400">const</span> {'{ signup }'} = <span className="text-blue-200">useAuth</span>();<br/><br/>
                        <span className="text-purple-400">await</span> <span className="text-blue-200">signup</span>({'{'}<br/>
                        {'  '}email: <span className="text-green-300">&apos;user@example.com&apos;</span>,<br/>
                        {'  '}password: <span className="text-green-300">&apos;securePassword123&apos;</span>,<br/>
                        {'  '}name: <span className="text-green-300">&apos;John Doe&apos;</span>,<br/>
                        {'  '}enableBiometric: <span className="text-yellow-400">true</span>,<br/>
                        {'}'});
                      </pre>
                    </div>
                  </div>

                  {/* Mobile Survey SDK */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                      <ClipboardListIcon className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Mobile Survey SDK</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Present surveys as native bottom sheets in your mobile app.</p>
                    <div className="relative group">
                      <div className="absolute right-3 top-3">
                        <button onClick={() => handleCopy(`import { SurveySheet } from '@appkit/react-native';\n\n<SurveySheet\n  surveyId="SURVEY_ID"\n  onComplete={(answers) => console.log(answers)}\n  onDismiss={() => console.log('dismissed')}\n/>`, 'code-survey-rn')} className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                          {copiedId === 'code-survey-rn' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                        <span className="text-purple-400">import</span> {'{ SurveySheet }'} <span className="text-purple-400">from</span> <span className="text-green-300">&apos;@appkit/react-native&apos;</span>;<br/><br/>
                        {'<'}<span className="text-yellow-200">SurveySheet</span><br/>
                        {'  '}surveyId=<span className="text-green-300">&quot;SURVEY_ID&quot;</span><br/>
                        {'  '}onComplete={'{'} (answers) ={'>'} console.log(answers) {'}'}<br/>
                        {'  '}onDismiss={'{'} () ={'>'} console.log(&apos;dismissed&apos;) {'}'}<br/>
                        {'/>'}
                      </pre>
                    </div>
                  </div>
                </>
              )}

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
                <Button variant="outline" size="sm" onClick={() => setIsIntegrateDrawerOpen(true)} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <CodeIcon className="w-4 h-4 mr-1.5" />
                  Integration Guide
                </Button>
                <Button size="sm" onClick={() => setShowAddUser(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  <UserPlusIcon className="w-4 h-4 mr-1.5" />
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
          <button onClick={() => setActiveDevGuide('users')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Users API
          </button>
        </TabsContent>

        {/* ==================== TAB: Surveys ==================== */}
        <TabsContent value="surveys" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Surveys</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Create and manage surveys to collect user feedback. Embed them via the SDK.</p>
            <SurveyBuilder appId={appId} />
          </div>
          <button onClick={() => setActiveDevGuide('surveys')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Surveys Integration
          </button>
        </TabsContent>

        {/* ==================== TAB: User Attributes ==================== */}
        <TabsContent value="user-attributes" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Attributes</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Manage custom data you collect from users. These can be used to segment your audience and personalize their experience.</p>
            <UserAttributesConfig appId={appId} mode="app" />
          </div>
          <button onClick={() => setActiveDevGuide('user-attrs')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — User Attributes API
          </button>
        </TabsContent>

        {/* ==================== TAB 3: Global Identity Scope ==================== */}
        <TabsContent value="identity" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Global Identity Scope</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure how user identities are managed across this application.</p>
              </div>
              <div className="flex items-center gap-2">
                {identityMsg && <span className={`text-xs font-medium ${identityMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{identityMsg}</span>}
                <Button onClick={handleSaveIdentity} disabled={identitySaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  {identitySaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>

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
                  <select
                    title="Identity model"
                    value={identityConfig.model}
                    onChange={e => setIdentityConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>Email-based</option>
                    <option>Username-based</option>
                    <option>Phone-based</option>
                    <option>Custom ID</option>
                  </select>
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
                  {([
                    { scope: 'openid' as const, desc: 'Basic OpenID Connect' },
                    { scope: 'profile' as const, desc: 'User profile information' },
                    { scope: 'email' as const, desc: 'Email address access' },
                    { scope: 'phone' as const, desc: 'Phone number access' },
                    { scope: 'address' as const, desc: 'Physical address' },
                  ]).map((s) => (
                    <div key={s.scope} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{s.scope}</span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400 ml-2">— {s.desc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          title={`Toggle ${s.scope} scope`}
                          checked={identityConfig.scopes[s.scope]}
                          onChange={e => setIdentityConfig(prev => ({ ...prev, scopes: { ...prev.scopes, [s.scope]: e.target.checked } }))}
                        />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveDevGuide('identity')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Identity Scope Integration
          </button>
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
          <button onClick={() => setActiveDevGuide('auth-methods')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Auth Methods Integration
          </button>
        </TabsContent>

        {/* ==================== TAB 5: Security & MFA ==================== */}
        <TabsContent value="security" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Security & MFA</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure multi-factor authentication, password policies, and session security.</p>
              </div>
              <div className="flex items-center gap-2">
                {securityMsg && <span className={`text-xs font-medium ${securityMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{securityMsg}</span>}
                <Button onClick={handleSaveSecurity} disabled={securitySaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  {securitySaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* MFA Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3 flex items-center">
                  <LockIcon className="w-4 h-4 mr-2 text-violet-500" />
                  Multi-Factor Authentication
                </h4>
                <div className="space-y-3">
                  {([
                    { key: 'totp' as const, name: 'TOTP (Authenticator App)', desc: 'Google Authenticator, Authy, etc.' },
                    { key: 'sms' as const, name: 'SMS Verification', desc: 'Send OTP via text message' },
                    { key: 'email' as const, name: 'Email Verification', desc: 'Send OTP via email' },
                    { key: 'fido2' as const, name: 'Hardware Key (FIDO2)', desc: 'YubiKey, Titan Security Key' },
                  ]).map((mfa) => (
                    <div key={mfa.key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{mfa.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{mfa.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          title={`Toggle ${mfa.name}`}
                          checked={securityConfig.mfa[mfa.key]}
                          onChange={e => setSecurityConfig(prev => ({ ...prev, mfa: { ...prev.mfa, [mfa.key]: e.target.checked } }))}
                        />
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
                  {([
                    { label: 'Minimum Length', key: 'minLength' as const },
                    { label: 'Max Login Attempts', key: 'maxAttempts' as const },
                    { label: 'Password Expiry (days)', key: 'expiryDays' as const },
                    { label: 'Lockout Duration (min)', key: 'lockoutMinutes' as const },
                  ]).map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">{field.label}</label>
                      <input
                        type="number"
                        title={field.label}
                        value={securityConfig.password[field.key]}
                        onChange={e => setSecurityConfig(prev => ({ ...prev, password: { ...prev.password, [field.key]: parseInt(e.target.value) || 0 } }))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {([
                    { label: 'Require uppercase letter', key: 'requireUppercase' as const },
                    { label: 'Require lowercase letter', key: 'requireLowercase' as const },
                    { label: 'Require number', key: 'requireNumber' as const },
                    { label: 'Require special character', key: 'requireSpecial' as const },
                  ]).map((rule) => (
                    <label key={rule.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securityConfig.password[rule.key]}
                        onChange={e => setSecurityConfig(prev => ({ ...prev, password: { ...prev.password, [rule.key]: e.target.checked } }))}
                        className="w-4 h-4 text-blue-500 border-gray-300 dark:border-zinc-600 rounded focus:ring-blue-500/20"
                      />
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
                    <input
                      type="number"
                      title="Session timeout in minutes"
                      value={securityConfig.session.timeoutMinutes}
                      onChange={e => setSecurityConfig(prev => ({ ...prev, session: { ...prev.session, timeoutMinutes: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Max Concurrent Sessions</label>
                    <input
                      type="number"
                      title="Max concurrent sessions"
                      value={securityConfig.session.maxConcurrent}
                      onChange={e => setSecurityConfig(prev => ({ ...prev, session: { ...prev.session, maxConcurrent: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setActiveDevGuide('security')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Security & MFA Integration
          </button>
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
                <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Channels &amp; Providers</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Email', icon: <MailIcon className="w-4 h-4" />, color: 'text-blue-500', enabled: true, provider: 'SendGrid' },
                    { name: 'SMS', icon: <SmartphoneIcon className="w-4 h-4" />, color: 'text-red-500', enabled: false, provider: 'Twilio' },
                    { name: 'Push', icon: <MonitorIcon className="w-4 h-4" />, color: 'text-amber-500', enabled: false, provider: 'Firebase' },
                    { name: 'In-App', icon: <MessageSquareIcon className="w-4 h-4" />, color: 'text-violet-500', enabled: true, provider: 'Built-in' },
                  ].map((ch) => (
                    <div key={ch.name} className="flex flex-col p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                      <div className="flex items-center space-x-2">
                        <span className={ch.color}>{ch.icon}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 flex-1">{ch.name}</span>
                        {ch.enabled ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600" />
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 pl-6">{ch.provider}</span>
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
          <button onClick={() => setActiveDevGuide('communication')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Communication API
          </button>
        </TabsContent>

        {/* ==================== TAB: Webhooks ==================== */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Webhooks</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Receive real-time notifications when events occur in your application.</p>
              </div>
              <Button onClick={() => setShowAddWebhook(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                <PlusIcon className="w-4 h-4 mr-1.5" /> Add Endpoint
              </Button>
            </div>

            {/* Add Webhook Form */}
            {showAddWebhook && (
              <div className="mb-4 p-4 rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 space-y-3">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block">Endpoint URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={e => setNewWebhookUrl(e.target.value)}
                    placeholder="https://api.example.com/webhooks"
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button onClick={handleAddWebhook} disabled={!newWebhookUrl} className="bg-blue-600 text-white border-0">Add</Button>
                  <Button variant="outline" onClick={() => { setShowAddWebhook(false); setNewWebhookUrl('') }}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Webhook List */}
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${wh.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      <code className="text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">{wh.url}</code>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {wh.events.map(ev => (
                        <span key={ev} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">{ev}</span>
                      ))}
                      {wh.lastTriggered && <span className="text-[10px] text-gray-400 ml-1">Last: {new Date(wh.lastTriggered).toLocaleString()}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteWebhook(wh.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors" title="Delete webhook">
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {webhooks.length === 0 && (
                <div className="text-center py-10">
                  <WebhookIcon className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">No webhook endpoints configured</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Add an endpoint to start receiving event notifications</p>
                </div>
              )}
            </div>

            {/* Available Events */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Available Events</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['user.created', 'user.login', 'user.signup', 'user.updated', 'user.deleted', 'auth.mfa_enabled', 'session.created', 'session.expired'].map(ev => (
                  <span key={ev} className="inline-flex items-center px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-[10px] font-mono text-gray-600 dark:text-zinc-400">
                    <HashIcon className="w-3 h-3 mr-1 text-gray-400" />{ev}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setActiveDevGuide('webhooks')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Webhooks API
          </button>
        </TabsContent>

        {/* ==================== TAB: Activity Log ==================== */}
        <TabsContent value="activity" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Activity Log</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Audit trail of all configuration changes and admin actions.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportActivity} title="Export activity log as CSV">
                  <DownloadIcon className="w-4 h-4 mr-1.5" /> Export
                </Button>
                <Button variant="outline" onClick={loadActivityLog} disabled={activityLoading} title="Refresh activity log">
                  {activityLoading ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCwIcon className="w-4 h-4 mr-1.5" />} Refresh
                </Button>
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800/50">
              {(['all', 'config', 'user', 'webhook', 'security'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActivityFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activityFilter === t ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:text-zinc-400'}`}
                >
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)} {t !== 'all' && <span className="ml-1 text-[10px] opacity-60">({activityLog.filter(l => l.type === t).length})</span>}
                </button>
              ))}
            </div>

            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2Icon className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredActivityLog.length === 0 ? (
              <div className="text-center py-10">
                <ActivityIcon className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">{activityFilter === 'all' ? 'No activity recorded yet' : `No ${activityFilter} events found`}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredActivityLog.map((log, i) => {
                  const typeColors: Record<string, string> = {
                    config: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
                    user: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                    webhook: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                    security: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
                  }
                  return (
                    <div key={log.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-zinc-800/20' : ''}`}>
                      <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${typeColors[log.type] || 'bg-gray-100 text-gray-500'}`}>
                        {log.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-zinc-200">{log.action}</p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                          by <span className="font-medium">{log.user}</span> · {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">{filteredActivityLog.length} of {activityLog.length} entries</p>
            </div>
          </div>
          <button onClick={() => setActiveDevGuide('activity')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Activity Log API
          </button>
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
            <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg border transition-colors ${
              legalUseDefault 
                ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/20' 
                : 'bg-violet-50/50 dark:bg-violet-500/5 border-violet-200/50 dark:border-violet-500/20'
            }`}>
              {legalUseDefault ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Using Default Configuration</span>
                  <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60">— Inherited from platform defaults</span>
                </>
              ) : (
                <>
                  <ShieldIcon className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-violet-700 dark:text-violet-400">Using Custom Configuration</span>
                  <span className="text-xs text-violet-600/60 dark:text-violet-400/60">— Individual overrides applied</span>
                </>
              )}
            </div>

            {/* Summary Preview */}
            <div className="space-y-4">
              {legalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                  <span className="text-xs text-gray-500">Loading configuration...</span>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Legal Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(legalConfig?.documents || []).length > 0 ? (
                        legalConfig.documents.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                            <div className="flex items-center space-x-2">
                              <ScaleIcon className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{doc.title}</span>
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
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic col-span-2">No documents configured</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Compliance</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(legalConfig?.compliance || {}).length > 0 ? (
                        Object.entries(legalConfig.compliance).map(([key, val]) => {
                          const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                          return (
                            <span key={key} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              val 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {val ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <XCircleIcon className="w-3 h-3 mr-1" />}
                              {name}
                            </span>
                          )
                        })
                      ) : (
                        <p className="text-xs text-gray-400 italic">No compliance settings configured</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Data Retention</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'User Data', value: legalConfig?.retention?.userData, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                        { label: 'Audit Logs', value: legalConfig?.retention?.auditLog, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                        { label: 'Sessions', value: legalConfig?.retention?.sessionData, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                      ].map(item => (
                        <div key={item.label} className={`p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800/50 ${item.bg}`}>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">{item.label}</p>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-sm font-bold ${item.color}`}>{item.value || '0'}</span>
                            <span className="text-[10px] text-gray-500 dark:text-zinc-500">days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setActiveDevGuide('legal')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Legal & Compliance API
          </button>
        </TabsContent>

        {/* ==================== TAB: Login Sandbox ==================== */}
        <TabsContent value="sandbox" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Login Sandbox</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Test and preview login & signup flows in a safe sandbox environment.</p>
              </div>
              <div className="flex items-center rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
                {(['login', 'signup'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setSandboxMode(mode); setSandboxResult(null) }}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      sandboxMode === mode
                        ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
                    }`}
                  >
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 p-8 flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-full max-w-sm space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 mx-auto mb-3">
                      {application.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {sandboxMode === 'login' ? `Sign in to ${application.name}` : `Create your ${application.name} account`}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      {sandboxMode === 'login' ? 'Enter your credentials to continue' : 'Fill in the details below to get started'}
                    </p>
                  </div>
                  {sandboxMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Full Name</label>
                      <input type="text" placeholder="John Doe" className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Email</label>
                    <input type="email" placeholder="user@example.com" className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Password</label>
                    <input type="password" placeholder={'••••••••'} className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                  </div>
                  {sandboxMode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Confirm Password</label>
                        <input type="password" placeholder={'••••••••'} className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5 mt-0.5 text-blue-500 border-gray-300 dark:border-zinc-600 rounded" />
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400">I agree to the Terms of Service and Privacy Policy</span>
                      </label>
                    </>
                  )}
                  <button className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                    {sandboxMode === 'login' ? 'Sign In' : 'Create Account'}
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
                  <p className="text-center text-[11px] text-gray-400 mt-2">
                    {sandboxMode === 'login'
                      ? <span>Don&apos;t have an account? <button onClick={() => setSandboxMode('signup')} className="text-blue-500 font-medium">Sign up</button></span>
                      : <span>Already have an account? <button onClick={() => setSandboxMode('login')} className="text-blue-500 font-medium">Sign in</button></span>
                    }
                  </p>
                </div>
              </div>

              {/* Controls & Response */}
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Sandbox Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Test User Email</label>
                      <input type="email" defaultValue="test@sandbox.example.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Redirect URL</label>
                      <input type="url" defaultValue={`https://${application.domain || 'localhost:3000'}/callback`} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Test Scenarios</h4>
                  <div className="space-y-2">
                    {(sandboxMode === 'login' ? [
                      { label: 'Simulate Login Success', desc: 'Successful auth flow', icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> },
                      { label: 'Simulate Login Failure', desc: 'Error handling', icon: <XCircleIcon className="w-4 h-4 text-red-500" /> },
                      { label: 'Simulate MFA Challenge', desc: 'MFA verification', icon: <ShieldCheckIcon className="w-4 h-4 text-violet-500" /> },
                      { label: 'Simulate Account Lockout', desc: 'Lockout flow', icon: <AlertTriangleIcon className="w-4 h-4 text-amber-500" /> },
                    ] : [
                      { label: 'Simulate Signup Success', desc: 'Successful registration', icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> },
                      { label: 'Simulate Signup Failure', desc: 'Validation errors', icon: <XCircleIcon className="w-4 h-4 text-red-500" /> },
                      { label: 'Simulate Email Verification', desc: 'Email verification step', icon: <MailIcon className="w-4 h-4 text-blue-500" /> },
                    ]).map((scenario) => (
                      <button
                        key={scenario.label}
                        onClick={() => handleSandboxSimulate(scenario.label)}
                        disabled={sandboxRunning}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
                      >
                        {scenario.icon}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{scenario.label}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{scenario.desc}</p>
                        </div>
                        {sandboxRunning && <Loader2Icon className="w-4 h-4 animate-spin text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {sandboxResult && (
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${sandboxResult.status === 200 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">Response ({sandboxResult.status})</span>
                      </div>
                      <button onClick={() => setSandboxResult(null)} title="Dismiss result" className="text-gray-400 hover:text-gray-500">
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="p-4 bg-[#0d1117] text-gray-300 text-xs overflow-x-auto max-h-48">
                      <code>{JSON.stringify(sandboxResult.body, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setActiveDevGuide('sandbox')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Login Sandbox API
          </button>
        </TabsContent>

        {/* ==================== TAB: Branding ==================== */}
        <TabsContent value="branding" className="space-y-4">
          <BrandingSettings branding={appBranding} setBranding={setAppBranding} handleBrandingUpload={handleBrandingUpload} uploading={brandingUploading} />
          <button onClick={() => setActiveDevGuide('branding')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Branding SDK
          </button>
        </TabsContent>

        {/* ==================== TAB: Banners ==================== */}
        <TabsContent value="banners" className="space-y-4">
          <AnnouncementSettings announcements={appBranding.announcements} setBranding={setAppBranding} />
          <button onClick={() => setActiveDevGuide('announcements')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Announcements SDK
          </button>
        </TabsContent>

        {/* ==================== TAB: Links & Support ==================== */}
        <TabsContent value="links" className="space-y-4">
          <SocialSettings social={appBranding.social} setBranding={setAppBranding} />
          <button onClick={() => setActiveDevGuide('social-links')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Social & Support Links
          </button>
        </TabsContent>

        {/* ==================== TAB: Splash Screen ==================== */}
        <TabsContent value="splash" className="space-y-4">
          <SplashScreenSettings branding={appBranding} setBranding={setAppBranding} />
          <button onClick={() => setActiveDevGuide('splash')} className="w-full rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <CodeIcon className="w-4 h-4" /> Dev Guide — Splash Screen Config
          </button>
        </TabsContent>


        {/* ==================== TAB: Auth Page Style ==================== */}
        <TabsContent value="auth-style" className="space-y-4">
          <AuthStyleConfig appId={appId} appName={application.name} />
        </TabsContent>

        </Tabs>
        </main>
      </div>

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
        appName={application?.name || 'Application'}
      />
      <IntegrationGuideDrawer
        isOpen={isIntegrateDrawerOpen}
        onClose={() => setIsIntegrateDrawerOpen(false)}
        appId={appId}
        appName={application?.name || 'Application'}
        appDomain={application?.domain}
      />
      <BillingConfigDrawer
        isOpen={isBillingDrawerOpen}
        onClose={() => setIsBillingDrawerOpen(false)}
        appId={appId}
        appName={application.name}
      />

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddUser(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800/80 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New User</h3>
              <button onClick={() => setShowAddUser(false)} title="Close modal" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Email Address</label>
                <input
                  type="email"
                  value={addUserForm.email}
                  onChange={e => setAddUserForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Full Name</label>
                <input
                  type="text"
                  value={addUserForm.name}
                  onChange={e => setAddUserForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Role</label>
                  <select
                    title="User role"
                    value={addUserForm.role}
                    onChange={e => setAddUserForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>User</option>
                    <option>Editor</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Plan</label>
                  <select
                    title="User plan"
                    value={addUserForm.plan}
                    onChange={e => setAddUserForm(p => ({ ...p, plan: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>Free</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
              <Button onClick={handleAddUser} disabled={addingUser || !addUserForm.email || !addUserForm.name} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                {addingUser ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <UserPlusIcon className="w-4 h-4 mr-1.5" />}
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== Dev Guide Drawers ==================== */}
      <DevGuideDrawer
        open={activeDevGuide === 'app-metadata'}
        onClose={() => setActiveDevGuide(null)}
        title="Application Metadata"
        description="Fetch and update application settings programmatically."
        platform="both"
        webContent={[
          { description: 'Web SDK — Fetch & update app metadata:', code: `import { AppKit } from '@appkit/web';\n\nconst client = new AppKit({ apiKey: 'ak_...' });\nconst app = await client.getApplication();\n// { id, name, domain, platform, status, apiKey, ... }\n\nawait client.updateApplication({\n  name: 'My App',\n  domain: 'myapp.com',\n  platform: 'web',\n});\n\nconst { apiKey } = await client.regenerateApiKey();` },
        ]}
        mobileContent={[
          { description: 'React Native SDK — Fetch & update app metadata:', code: `import { AppKit } from '@appkit/react-native';\n\nconst client = new AppKit({ apiKey: 'ak_...' });\nconst app = await client.getApplication();\n// { id, name, bundleId, platform, status, ... }\n\nawait client.updateApplication({\n  name: 'My Mobile App',\n  bundleId: 'com.myapp.mobile',\n  deepLinkScheme: 'myapp://',\n});` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}\nPUT  /api/v1/applications/{appId}\nPOST /api/v1/applications/{appId}/regenerate-key`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'users'}
        onClose={() => setActiveDevGuide(null)}
        title="Users API"
        description="Manage users programmatically via the API."
        sharedContent={[
          { description: 'List, get, update, and delete users:', code: `const { users, total } = await client.users.list({\n  page: 1, limit: 20,\n  search: 'john', status: 'active',\n});\n\nconst user = await client.users.get(userId);\n\nawait client.users.update(userId, {\n  displayName: 'John Doe',\n  metadata: { plan: 'pro' },\n});\n\nawait client.users.deactivate(userId);\nawait client.users.delete(userId);` },
        ]}
        apiEndpoints={`GET    /api/v1/applications/{appId}/users\nGET    /api/v1/applications/{appId}/users/:id\nPATCH  /api/v1/applications/{appId}/users/:id\nDELETE /api/v1/applications/{appId}/users/:id`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'surveys'}
        onClose={() => setActiveDevGuide(null)}
        title="Surveys Integration"
        description="Trigger and collect survey responses via the SDK."
        platform="both"
        webContent={[
          { description: 'Web SDK — Show surveys and collect responses:', code: `import { AppKit } from '@appkit/web';\n\nawait client.surveys.show(surveyId);\n\nawait client.surveys.submit(surveyId, {\n  answers: [\n    { questionId: 'q1', value: 5 },\n    { questionId: 'q2', value: 'Great!' },\n  ],\n});\n\nconst results = await client.surveys.getResults(surveyId);` },
        ]}
        mobileContent={[
          { description: 'React Native — Present surveys as bottom sheets:', code: `import { SurveySheet } from '@appkit/react-native';\n\n<SurveySheet\n  surveyId={surveyId}\n  onComplete={(answers) => console.log(answers)}\n  onDismiss={() => console.log('dismissed')}\n/>\n\n// Or programmatically:\nawait client.surveys.show(surveyId, { presentation: 'modal' });` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/surveys\nGET  /api/v1/applications/{appId}/surveys/:id\nPOST /api/v1/applications/{appId}/surveys/:id/respond\nGET  /api/v1/applications/{appId}/surveys/:id/results`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'user-attrs'}
        onClose={() => setActiveDevGuide(null)}
        title="User Attributes API"
        description="Read and write custom user attributes via the SDK."
        sharedContent={[
          { description: 'Set, get, and use attributes for segmentation:', code: `await client.user.setAttributes({\n  plan: 'pro',\n  onboarded: true,\n  company: 'Acme Inc',\n});\n\nconst attrs = await client.user.getAttributes();\n// { plan: 'pro', onboarded: true, company: 'Acme Inc' }\n\nconst segment = await client.segments.evaluate(userId);\n// { segments: ['power-users', 'paying'] }` },
        ]}
        apiEndpoints={`GET   /api/v1/applications/{appId}/users/:id/attributes\nPATCH /api/v1/applications/{appId}/users/:id/attributes\nGET   /api/v1/applications/{appId}/attributes/schema`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'identity'}
        onClose={() => setActiveDevGuide(null)}
        title="Identity Scope Integration"
        description="Request and inspect identity scopes during authentication."
        platform="both"
        webContent={[
          { description: 'Web — Request scopes during sign-in:', code: `const session = await client.auth.signIn({\n  email: 'user@example.com',\n  password: '***',\n  scopes: ['openid', 'profile', 'email'],\n});\n\nconst token = await client.auth.getAccessToken();\nconst decoded = client.auth.decodeToken(token);\n// decoded.scope === 'openid profile email'\n\nconst scopes = await client.identity.getScopes();` },
        ]}
        mobileContent={[
          { description: 'Mobile — Request scopes with biometric auth:', code: `import { AppKit } from '@appkit/react-native';\n\nconst session = await client.auth.signIn({\n  email: 'user@example.com',\n  password: '***',\n  scopes: ['openid', 'profile', 'email'],\n  biometricPrompt: true,\n});\n\nconst scopes = await client.identity.getScopes();\n// [{ name: 'openid', enabled: true }, ...]` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/identity/scopes\nPUT  /api/v1/applications/{appId}/identity/scopes\nGET  /api/v1/applications/{appId}/identity/model`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'auth-methods'}
        onClose={() => setActiveDevGuide(null)}
        title="Auth Methods Integration"
        description="Fetch enabled authentication providers and initiate auth flows."
        platform="both"
        webContent={[
          { description: 'Web — OAuth, email/password, and magic link:', code: `const methods = await client.getAuthMethods();\n\nawait client.auth.startOAuth('google-oauth', {\n  redirectUri: 'https://yourapp.com/callback',\n  scope: 'openid email profile',\n});\n\nconst session = await client.auth.signIn({\n  email: 'user@example.com',\n  password: '***',\n});\n\nawait client.auth.sendMagicLink('user@example.com');\nconst user = await client.auth.getCurrentUser();` },
        ]}
        mobileContent={[
          { description: 'React Native — OAuth with deep linking:', code: `import { AppKit, useAuth } from '@appkit/react-native';\n\nconst { signIn, signInWithOAuth } = useAuth();\n\n// OAuth with deep link callback\nawait signInWithOAuth('google', {\n  redirectUri: 'myapp://auth/callback',\n});\n\n// Email & password\nawait signIn({ email, password });\n\n// Biometric authentication\nawait signIn({ biometric: true });` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/auth/methods\nPOST /api/v1/applications/{appId}/auth/signin\nPOST /api/v1/applications/{appId}/auth/oauth/start\nPOST /api/v1/applications/{appId}/auth/magic-link`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'security'}
        onClose={() => setActiveDevGuide(null)}
        title="Security & MFA Integration"
        description="Integrate MFA enrollment and verification in your app."
        platform="both"
        webContent={[
          { description: 'Web — MFA, password policy, sessions:', code: `const mfaStatus = await client.mfa.getStatus();\n\nconst { secret, qrCodeUrl } = await client.mfa.enrollTOTP();\nawait client.mfa.verifyTOTP({ code: '123456' });\n\nawait client.mfa.sendEmailOTP();\nawait client.mfa.verifyEmailOTP({ code: '654321' });\n\nconst policy = await client.security.getPasswordPolicy();\nconst result = client.security.validatePassword('P@ss1', policy);\n\nconst sessions = await client.sessions.list();\nawait client.sessions.revokeAll();` },
        ]}
        mobileContent={[
          { description: 'React Native — MFA with biometrics:', code: `import { useMFA } from '@appkit/react-native';\n\nconst { status, enrollTOTP, verifyTOTP } = useMFA();\n\n// Enroll with QR code scanner\nconst { qrCodeUrl } = await enrollTOTP();\n// Show QR in <QRCode value={qrCodeUrl} />\n\n// Verify with biometric fallback\nawait verifyTOTP({\n  code: '123456',\n  biometricFallback: true,\n});\n\n// Push notification MFA\nawait client.mfa.sendPushChallenge();` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/security/mfa/status\nPOST /api/v1/applications/{appId}/security/mfa/enroll\nPOST /api/v1/applications/{appId}/security/mfa/verify\nGET  /api/v1/applications/{appId}/security/password-policy\nGET  /api/v1/applications/{appId}/sessions\nDEL  /api/v1/applications/{appId}/sessions/:id`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'communication'}
        onClose={() => setActiveDevGuide(null)}
        title="Communication API"
        description="Send emails, SMS, and push notifications via the API."
        platform="both"
        webContent={[
          { description: 'Web — Email and in-app messaging:', code: `await client.communication.sendEmail({\n  to: 'user@example.com',\n  template: 'welcome-email',\n  data: { name: 'John', activationUrl: '...' },\n});\n\nconst templates = await client.communication.listTemplates();` },
        ]}
        mobileContent={[
          { description: 'React Native — Push notifications and SMS:', code: `import { usePush } from '@appkit/react-native';\n\nconst { requestPermission, token } = usePush();\nawait requestPermission();\n\n// Register device token\nawait client.communication.registerDevice(token);\n\nawait client.communication.sendPush(userId, {\n  title: 'New message',\n  body: 'You have a new notification',\n  data: { deepLink: '/messages/123' },\n});\n\nawait client.communication.sendSMS({\n  to: '+1234567890',\n  template: 'otp-code',\n  data: { code: '123456' },\n});` },
        ]}
        apiEndpoints={`POST /api/v1/applications/{appId}/communication/email\nPOST /api/v1/applications/{appId}/communication/push\nPOST /api/v1/applications/{appId}/communication/sms\nGET  /api/v1/applications/{appId}/communication/templates`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'webhooks'}
        onClose={() => setActiveDevGuide(null)}
        title="Webhooks API"
        description="Configure and manage webhook endpoints programmatically."
        sharedContent={[
          { description: 'Create, list, and delete webhook endpoints:', code: `const hooks = await client.webhooks.list();\n\nawait client.webhooks.create({\n  url: 'https://api.example.com/webhooks',\n  events: ['user.created', 'user.login'],\n});\n\nawait client.webhooks.delete(webhookId);\n\n// Webhook payload format\n{\n  "event": "user.created",\n  "timestamp": "2024-02-22T10:30:00Z",\n  "data": { "userId": "usr_001", "email": "..." }\n}` },
        ]}
        apiEndpoints={`GET    /api/v1/applications/{appId}/webhooks\nPOST   /api/v1/applications/{appId}/webhooks\nDELETE /api/v1/applications/{appId}/webhooks/:id`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'activity'}
        onClose={() => setActiveDevGuide(null)}
        title="Activity Log API"
        description="Query the audit log for compliance and debugging."
        sharedContent={[
          { description: 'Fetch and export activity logs:', code: `const logs = await client.activity.list({\n  page: 1, limit: 50,\n  type: 'config', // or 'user', 'security', 'webhook'\n  from: '2024-02-01',\n  to: '2024-02-28',\n});\n\nconst csv = await client.activity.export({ format: 'csv' });` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/activity\nGET  /api/v1/applications/{appId}/activity/export`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'legal'}
        onClose={() => setActiveDevGuide(null)}
        title="Legal & Compliance API"
        description="Manage legal documents, consent tracking, and data compliance."
        sharedContent={[
          { description: 'Fetch documents, record consent, handle GDPR:', code: `const docs = await client.legal.getDocuments();\n\nawait client.legal.recordConsent(userId, {\n  documentType: 'terms',\n  version: '2.1',\n  accepted: true,\n});\n\nconst consent = await client.legal.getConsent(userId);\n\nawait client.legal.requestDataDeletion(userId);` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/legal/documents\nPOST /api/v1/applications/{appId}/legal/consent\nGET  /api/v1/applications/{appId}/legal/consent/:userId\nPOST /api/v1/applications/{appId}/legal/data-deletion`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'sandbox'}
        onClose={() => setActiveDevGuide(null)}
        title="Login Sandbox API"
        description="Use the sandbox API for testing auth flows in development."
        sharedContent={[
          { description: 'Create test users and simulate auth scenarios:', code: `const testUser = await client.sandbox.createUser({\n  email: 'test@sandbox.example.com',\n  password: 'test123',\n});\n\nawait client.sandbox.simulate('login-success');\nawait client.sandbox.simulate('login-failure');\nawait client.sandbox.simulate('mfa-challenge');\nawait client.sandbox.simulate('account-lockout');\n\nconst logs = await client.sandbox.getLogs();` },
        ]}
        apiEndpoints={`POST /api/v1/applications/{appId}/sandbox/users\nPOST /api/v1/applications/{appId}/sandbox/simulate\nGET  /api/v1/applications/{appId}/sandbox/logs`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'branding'}
        onClose={() => setActiveDevGuide(null)}
        title="Branding SDK"
        description="Load your app branding at runtime using the SDK."
        platform="both"
        webContent={[
          { description: 'Web — Load branding configuration:', code: `import { AppKit } from '@appkit/web';\n\nconst branding = await client.getBranding();\n// branding.appName, branding.logoUrl, branding.theme\n\n// Apply theme\ndocument.documentElement.style.setProperty(\n  '--primary-color', branding.theme.primaryColor\n);` },
        ]}
        mobileContent={[
          { description: 'React Native — Apply branding theme:', code: `import { useBranding } from '@appkit/react-native';\n\nconst { branding, isLoading } = useBranding();\n\n// Auto-applies theme to all AppKit components\n<AppKitProvider branding={branding}>\n  <App />\n</AppKitProvider>` },
        ]}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'announcements'}
        onClose={() => setActiveDevGuide(null)}
        title="Announcements SDK"
        description="Display banners and announcements in your app."
        platform="both"
        webContent={[
          { description: 'Web — Fetch and display announcements:', code: `const announcements = await client.getAnnouncements();\n// Render announcements[0].text, .type, .linkUrl\n\nclient.on('announcement:dismiss', (id) => {\n  console.log('Dismissed', id);\n});` },
        ]}
        mobileContent={[
          { description: 'React Native — Show announcement banners:', code: `import { AnnouncementBanner } from '@appkit/react-native';\n\n<AnnouncementBanner\n  position="top"\n  onDismiss={(id) => console.log('dismissed', id)}\n  onAction={(id, url) => Linking.openURL(url)}\n/>` },
        ]}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'social-links'}
        onClose={() => setActiveDevGuide(null)}
        title="Social & Support Links"
        description="Fetch configured social and support links."
        sharedContent={[
          { description: 'Retrieve social and support link configuration:', code: `const links = await client.getSocialLinks();\n// links.supportEmail, links.whatsapp, links.instagram, ...` },
        ]}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'splash'}
        onClose={() => setActiveDevGuide(null)}
        title="Splash Screen Config"
        description="Apply splash screen configuration in your mobile app."
        platform="mobile"
        mobileContent={[
          { description: 'React Native — Configure splash screen:', code: `import { SplashScreen } from '@appkit/react-native';\n\n<SplashScreen\n  config={await client.getSplashConfig()}\n  onReady={() => navigation.navigate('Home')}\n/>` },
        ]}
      />
    </div>
  )
}
