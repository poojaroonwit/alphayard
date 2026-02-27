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
import IntegrationGuideDrawer from '@/components/applications/IntegrationGuideDrawer'
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
  logoUrl?: string
  appUrl?: string
  gaTrackingId?: string
  metaTitle?: string
  metaDescription?: string
  faviconUrl?: string
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
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  const sidebarSections = [
    {
      title: 'Core',
      items: [
        { value: 'general', icon: <SettingsIcon className="w-4 h-4" />, label: 'General' },
        { value: 'content', icon: <ServerIcon className="w-4 h-4" />, label: 'App Content' },
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
        { value: 'versions', icon: <RocketIcon className="w-4 h-4" />, label: 'Version Control' },
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
        { value: 'legal', icon: <ScaleIcon className="w-4 h-4" />, label: 'Legal & Compliance' },
        { value: 'billing', icon: <CreditCardIcon className="w-4 h-4" />, label: 'Billing & Subscriptions' },
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
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure your application&apos;s identity, branding, and metadata.</p>
              </div>
              <div className="flex items-center gap-2">
                {generalMsg && <span className={`text-xs font-medium ${generalMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{generalMsg}</span>}
                <Button onClick={handleSaveGeneral} disabled={generalSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  {generalSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo & Name */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/30 transition-colors cursor-pointer group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20 mb-3">
                    {application.logoUrl ? (
                      <img src={application.logoUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      application.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 group-hover:text-blue-500 transition-colors font-medium">Click to upload logo</p>
                  <input
                    type="text"
                    value={application.logoUrl || ''}
                    onChange={e => setApplication(prev => prev ? { ...prev, logoUrl: e.target.value } : prev)}
                    placeholder="Or paste logo URL"
                    className="mt-2 w-full px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Application Name</label>
                    <input
                      type="text"
                      value={application.name}
                      onChange={e => setApplication(prev => prev ? { ...prev, name: e.target.value } : prev)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Description</label>
                    <textarea
                      value={application.description}
                      onChange={e => setApplication(prev => prev ? { ...prev, description: e.target.value } : prev)}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Application URL</label>
                      <input
                        type="url"
                        value={application.appUrl || application.domain || ''}
                        onChange={e => setApplication(prev => prev ? { ...prev, appUrl: e.target.value } : prev)}
                        placeholder="https://your-app.com"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Status</label>
                      <select
                        value={application.status}
                        onChange={e => setApplication(prev => prev ? { ...prev, status: e.target.value as Application['status'] } : prev)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="development">Development</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics & Metadata */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Analytics & Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Google Analytics ID</label>
                    <input
                      type="text"
                      value={application.gaTrackingId || ''}
                      onChange={e => setApplication(prev => prev ? { ...prev, gaTrackingId: e.target.value } : prev)}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Favicon URL</label>
                    <input
                      type="url"
                      value={application.faviconUrl || ''}
                      onChange={e => setApplication(prev => prev ? { ...prev, faviconUrl: e.target.value } : prev)}
                      placeholder="https://your-app.com/favicon.ico"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={application.metaTitle || ''}
                      onChange={e => setApplication(prev => prev ? { ...prev, metaTitle: e.target.value } : prev)}
                      placeholder="Your App — Tagline"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Meta Description</label>
                    <input
                      type="text"
                      value={application.metaDescription || ''}
                      onChange={e => setApplication(prev => prev ? { ...prev, metaDescription: e.target.value } : prev)}
                      placeholder="A short description for search engines"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Application Info</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    <p className="text-gray-400 mb-0.5">App ID</p>
                    <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{appId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    <p className="text-gray-400 mb-0.5">Plan</p>
                    <p className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{application.plan}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    <p className="text-gray-400 mb-0.5">Created</p>
                    <p className="font-medium text-gray-700 dark:text-zinc-300">{new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    <p className="text-gray-400 mb-0.5">Users</p>
                    <p className="font-medium text-gray-700 dark:text-zinc-300">{application.users.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* App Version Control */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">App Version Control</h4>
                <AppUpdateSettings updates={appBranding.updates} setBranding={setAppBranding} />
              </div>
            </div>
          </div>
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

            <div className="space-y-8">
              {/* Web / Next.js Setup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                  <GlobeIcon className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Web / React / Next.js Integration</h4>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-zinc-400">1. Install the core identity package:</p>
                <div className="relative group">
                  <div className="absolute right-3 top-3">
                    <button 
                      onClick={() => handleCopy('npm install @appkit/identity-core', 'install-web')}
                      className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {copiedId === 'install-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                    <code>npm install @appkit/identity-core</code>
                  </pre>
                </div>

                <p className="text-sm text-gray-600 dark:text-zinc-400 pt-2">2. Initialize the client in your app using your Environment Variables:</p>
                <div className="relative group">
                  <div className="absolute right-3 top-3">
                    <button 
                      onClick={() => handleCopy(`NEXT_PUBLIC_APPKIT_DOMAIN="https://${application.domain || 'auth.your-app.com'}"\nNEXT_PUBLIC_APPKIT_CLIENT_ID="${appId}"`, 'env-web')}
                      className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
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
                    <button 
                      onClick={() => handleCopy(`import { AppKit } from '@appkit/identity-core';\n\nconst client = new AppKit({\n  clientId: process.env.NEXT_PUBLIC_APPKIT_CLIENT_ID,\n  domain: process.env.NEXT_PUBLIC_APPKIT_DOMAIN\n});\n\n// Trigger login\nawait client.login();`, 'code-web')}
                      className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {copiedId === 'code-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                    <span className="text-purple-400">import</span> {'{ AppKit }'} <span className="text-purple-400">from</span> <span className="text-green-300">'@appkit/identity-core'</span>;<br/><br/>
                    <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-yellow-200">AppKit</span>({'{'}<br/>
                    {'  '}clientId: process.env.<span className="text-blue-300">NEXT_PUBLIC_APPKIT_CLIENT_ID</span>,<br/>
                    {'  '}domain: process.env.<span className="text-blue-300">NEXT_PUBLIC_APPKIT_DOMAIN</span><br/>
                    {'}'});<br/><br/>
                    <span className="text-gray-500">// Trigger login</span><br/>
                    <span className="text-purple-400">await</span> client.<span className="text-blue-200">login</span>();
                  </pre>
                </div>
              </div>

              {/* React Native Setup */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                  <SmartphoneIcon className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">React Native / Expo Integration</h4>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-zinc-400">Use the official React Native wrapper for AppAuth to handle deep-linking automatically.</p>
                <div className="relative group">
                  <div className="absolute right-3 top-3">
                    <button 
                      onClick={() => handleCopy(`import { authorize } from 'react-native-app-auth';\n\nconst config = {\n  issuer: 'https://${application.domain || 'auth.your-app.com'}/oauth',\n  clientId: '${appId}',\n  redirectUrl: 'com.appkit.${application.name.toLowerCase().replace(/[^a-z0-9]/g, '')}:/oauth',\n  scopes: ['openid', 'profile', 'email', 'offline_access'],\n  usePKCE: true,\n};\n\nconst authState = await authorize(config);`, 'code-rn')}
                      className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {copiedId === 'code-rn' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                    <span className="text-purple-400">import</span> {'{ authorize }'} <span className="text-purple-400">from</span> <span className="text-green-300">'react-native-app-auth'</span>;<br/><br/>
                    <span className="text-purple-400">const</span> config = {'{'}<br/>
                    {'  '}issuer: <span className="text-green-300">'https://{application.domain || 'auth.your-app.com'}/oauth'</span>,<br/>
                    {'  '}clientId: <span className="text-green-300">'{appId}'</span>,<br/>
                    {'  '}redirectUrl: <span className="text-green-300">'com.appkit.{application.name.toLowerCase().replace(/[^a-z0-9]/g, '')}:/oauth'</span>,<br/>
                    {'  '}scopes: [<span className="text-green-300">'openid'</span>, <span className="text-green-300">'profile'</span>, <span className="text-green-300">'email'</span>, <span className="text-green-300">'offline_access'</span>],<br/>
                    {'  '}usePKCE: <span className="text-yellow-400">true</span>,<br/>
                    {'}'};<br/><br/>
                    <span className="text-purple-400">const</span> authState = <span className="text-purple-400">await</span> <span className="text-blue-200">authorize</span>(config);
                  </pre>
                </div>
              </div>

              {/* Signup Integration */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                  <UserPlusIcon className="w-5 h-5 text-violet-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Signup Integration</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Trigger the signup flow to register new users from your application.</p>
                <div className="relative group">
                  <div className="absolute right-3 top-3">
                    <button
                      onClick={() => handleCopy(`import { AppKit } from '@appkit/identity-core';\n\nconst client = new AppKit({\n  clientId: process.env.NEXT_PUBLIC_APPKIT_CLIENT_ID,\n  domain: process.env.NEXT_PUBLIC_APPKIT_DOMAIN\n});\n\n// Trigger signup\nawait client.signup({\n  email: 'user@example.com',\n  password: 'securePassword123',\n  name: 'John Doe',\n});`, 'code-signup')}
                      className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {copiedId === 'code-signup' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                    <span className="text-purple-400">import</span> {'{ AppKit }'} <span className="text-purple-400">from</span> <span className="text-green-300">&apos;@appkit/identity-core&apos;</span>;<br/><br/>
                    <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-yellow-200">AppKit</span>({'{'} ... {'}'});<br/><br/>
                    <span className="text-gray-500">// Trigger signup</span><br/>
                    <span className="text-purple-400">await</span> client.<span className="text-blue-200">signup</span>({'{'}<br/>
                    {'  '}email: <span className="text-green-300">&apos;user@example.com&apos;</span>,<br/>
                    {'  '}password: <span className="text-green-300">&apos;securePassword123&apos;</span>,<br/>
                    {'  '}name: <span className="text-green-300">&apos;John Doe&apos;</span>,<br/>
                    {'}'});
                  </pre>
                </div>
              </div>

              {/* Survey SDK */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                  <ClipboardListIcon className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Survey SDK</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Trigger in-app surveys to collect feedback from your users.</p>
                <div className="relative group">
                  <div className="absolute right-3 top-3">
                    <button
                      onClick={() => handleCopy(`// Show a survey by ID\nawait client.showSurvey('SURVEY_ID');\n\n// Listen for survey completion\nclient.on('survey:completed', (res) => {\n  console.log('Answers:', res.answers);\n});`, 'code-survey')}
                      className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {copiedId === 'code-survey' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800">
                    <span className="text-gray-500">// Show a survey by ID</span><br/>
                    <span className="text-purple-400">await</span> client.<span className="text-blue-200">showSurvey</span>(<span className="text-green-300">&apos;SURVEY_ID&apos;</span>);<br/><br/>
                    <span className="text-gray-500">// Listen for survey completion</span><br/>
                    client.<span className="text-blue-200">on</span>(<span className="text-green-300">&apos;survey:completed&apos;</span>, (res) ={'> {'}<br/>
                    {'  '}console.log(<span className="text-green-300">&apos;Answers:&apos;</span>, res.answers);<br/>
                    {'}'});
                  </pre>
                </div>
              </div>

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
        </TabsContent>

        {/* ==================== TAB: Surveys ==================== */}
        <TabsContent value="surveys" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Surveys</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Create and manage surveys to collect user feedback. Embed them via the SDK.</p>
            <SurveyBuilder appId={appId} />
          </div>
        </TabsContent>

        {/* ==================== TAB: User Attributes ==================== */}
        <TabsContent value="user-attributes" className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Attributes</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Manage custom data you collect from users. These can be used to segment your audience and personalize their experience.</p>
            <UserAttributesConfig appId={appId} mode="app" />
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
                      <button onClick={() => setSandboxResult(null)} className="text-gray-400 hover:text-gray-500">
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
        </TabsContent>

        {/* ==================== TAB: Branding ==================== */}
        <TabsContent value="branding" className="space-y-4">
          <BrandingSettings branding={appBranding} setBranding={setAppBranding} handleBrandingUpload={handleBrandingUpload} uploading={brandingUploading} />
          <details className="rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 select-none">
              <CodeIcon className="w-4 h-4" /> Dev Guide — Branding SDK
            </summary>
            <div className="px-5 pb-4 space-y-2">
              <p className="text-xs text-gray-600 dark:text-zinc-400">Load your app branding at runtime using the SDK:</p>
              <pre className="p-3 rounded-lg bg-[#0d1117] text-gray-300 text-xs overflow-x-auto border border-gray-800"><code>{`const branding = await client.getBranding();
// branding.appName, branding.logoUrl, branding.theme`}</code></pre>
            </div>
          </details>
        </TabsContent>

        {/* ==================== TAB: Banners ==================== */}
        <TabsContent value="banners" className="space-y-4">
          <AnnouncementSettings announcements={appBranding.announcements} setBranding={setAppBranding} />
          <details className="rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 select-none">
              <CodeIcon className="w-4 h-4" /> Dev Guide — Announcements SDK
            </summary>
            <div className="px-5 pb-4 space-y-2">
              <p className="text-xs text-gray-600 dark:text-zinc-400">Display banners and announcements in your app:</p>
              <pre className="p-3 rounded-lg bg-[#0d1117] text-gray-300 text-xs overflow-x-auto border border-gray-800"><code>{`const announcements = await client.getAnnouncements();
// Render announcements[0].text, .type, .linkUrl
client.on('announcement:dismiss', (id) => { ... });`}</code></pre>
            </div>
          </details>
        </TabsContent>

        {/* ==================== TAB: Links & Support ==================== */}
        <TabsContent value="links" className="space-y-4">
          <SocialSettings social={appBranding.social} setBranding={setAppBranding} />
          <details className="rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 select-none">
              <CodeIcon className="w-4 h-4" /> Dev Guide — Social &amp; Support Links
            </summary>
            <div className="px-5 pb-4 space-y-2">
              <p className="text-xs text-gray-600 dark:text-zinc-400">Fetch configured social and support links:</p>
              <pre className="p-3 rounded-lg bg-[#0d1117] text-gray-300 text-xs overflow-x-auto border border-gray-800"><code>{`const links = await client.getSocialLinks();
// links.supportEmail, links.whatsapp, links.instagram, ...`}</code></pre>
            </div>
          </details>
        </TabsContent>

        {/* ==================== TAB: Splash Screen ==================== */}
        <TabsContent value="splash" className="space-y-4">
          <SplashScreenSettings branding={appBranding} setBranding={setAppBranding} />
          <details className="rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 select-none">
              <CodeIcon className="w-4 h-4" /> Dev Guide — Splash Screen Config
            </summary>
            <div className="px-5 pb-4 space-y-2">
              <p className="text-xs text-gray-600 dark:text-zinc-400">Apply splash screen config in your React Native app:</p>
              <pre className="p-3 rounded-lg bg-[#0d1117] text-gray-300 text-xs overflow-x-auto border border-gray-800"><code>{`import { SplashScreen } from '@appkit/react-native';

<SplashScreen
  config={await client.getSplashConfig()}
  onReady={() => navigation.navigate('Home')}
/>`}</code></pre>
            </div>
          </details>
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
              <button onClick={() => setShowAddUser(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400">
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
    </div>
  )
}
