'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import UserDetailDrawer from '@/components/users/UserDetailDrawer'
import AuthMethodsConfigDrawer, { PROVIDER_META, PROVIDER_GROUP, mergeWithFallbacks } from '@/components/applications/AuthMethodsConfigDrawer'
import CommunicationConfigDrawer from '@/components/applications/CommunicationConfigDrawer'
import LegalConfigDrawer from '@/components/applications/LegalConfigDrawer'
import BillingConfigDrawer from '@/components/applications/BillingConfigDrawer'
import DevGuideDrawer from '@/components/applications/DevGuideDrawer'
import SurveyBuilder from '@/components/applications/SurveyBuilder'
import UserAttributesConfig from '@/components/applications/UserAttributesConfig'
import AuthStyleConfig from '@/components/applications/AuthStyleConfig'
import { adminService } from '@/services/adminService'
import { AnnouncementSettings } from '@/components/appearance/AnnouncementSettings'
import { SocialSettings } from '@/components/appearance/SocialSettings'
// import { SplashScreenSettings } from '@/components/appearance/SplashScreenSettings'
import { AppUpdateSettings } from '@/components/appearance/AppUpdateSettings'
import { BrandingSettings } from '@/components/appearance/BrandingSettings'
import { 
  ServerIcon, 
  UsersIcon,
  GlobeIcon,
  ShieldIcon,
  ShieldCheckIcon,
  BellIcon,
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
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
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
  oauthClientId?: string | null
  oauthClientType?: string | null
  oauthClientSecretConfigured?: boolean
  oauthRedirectUris?: string[]
  oauthPrimaryRedirectUri?: string | null
  circleBillingMode?: 'perCircleLevel' | 'perAccount'
  authBehavior?: {
    signupEnabled: boolean
    emailVerificationRequired: boolean
    inviteOnly: boolean
    allowedEmailDomains: string[]
    postLoginRedirect: string
    postSignupRedirect: string
  }
  securityConfig?: {
    mfa: { totp: boolean; sms: boolean; email: boolean; fido2: boolean }
    password: { minLength: number; maxAttempts: number; expiryDays: number; lockoutMinutes: number; requireUppercase: boolean; requireLowercase: boolean; requireNumber: boolean; requireSpecial: boolean }
    session: { timeoutMinutes: number; maxConcurrent: number }
  }
  identityConfig?: {
    model: string
    scopes: { openid: boolean; profile: boolean; email: boolean; phone: boolean; address: boolean }
  }
  brandingConfig?: {
    appName: string
    logoUrl: string
    announcements: { enabled: boolean; text: string; linkUrl: string; type: 'info' | 'success' | 'warning' | 'error'; isDismissible: boolean }
    social: { supportEmail: string; helpDeskUrl: string; githubRepo: string; gitlabRepo: string; docsUrl: string; whatsapp: string; instagram: string; facebook: string; line: string; twitter: string; linkedin: string; discord: string; appStoreId: string; playStoreId: string }
    splash: { backgroundColor: string; spinnerColor: string; spinnerType: string; showAppName: boolean; showLogo: boolean; resizeMode: string; logoAnimation: string }
    updates: { minVersion: string; storeUrl: string; forceUpdate: boolean }
  }
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

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  lastTriggered: string
}

interface AppCircle {
  id: string
  name: string
  description?: string | null
  circleType: string
  parentId?: string | null
  pinCode?: string | null
  circleCode?: string | null
  members?: Array<{
    id: string
    userId: string
    role: string
    isInherited: boolean
    user?: { id: string; email: string; firstName: string; lastName: string }
  }>
  owners?: Array<{
    id: string
    userId: string
    role: string
    user?: { id: string; email: string; firstName: string; lastName: string }
  }>
  billingAssignees?: Array<{
    id: string
    userId: string
    isPrimary: boolean
    user?: { id: string; email: string; firstName: string; lastName: string }
  }>
}

interface AppEmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  htmlContent?: string | null
  textContent?: string | null
  isActive: boolean
  updatedAt: string
}

interface AppBillingConfig {
  enabled: boolean
  provider: string
  mode: 'test' | 'live'
  currency: string
  providerEnabled?: Record<string, boolean>
  providerConfig?: Record<string, Record<string, string>>
}

const WEBHOOK_EVENTS = [
  'user.created',
  'user.login',
  'user.signup',
  'user.updated',
  'user.deleted',
  'auth.mfa_enabled',
  'session.created',
  'session.expired',
] as const

const BILLING_PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'paddle', label: 'Paddle' },
  { value: 'lemonsqueezy', label: 'Lemon Squeezy' },
] as const

export default function ApplicationConfigPage() {
  const params = useParams()
  const router = useRouter()
  const appId = (params?.id as string) || ''
  const [application, setApplication] = useState<Application | null>(null)
  const [users, setUsers] = useState<ApplicationUser[]>([])
  // Auth Config
  const [authProviders, setAuthProviders] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<string | null>(null)
  const [isCommDrawerOpen, setIsCommDrawerOpen] = useState(false)
  const [selectedCommChannel, setSelectedCommChannel] = useState<'email' | 'sms' | 'push' | 'inApp' | null>(null)
  const [isLegalDrawerOpen, setIsLegalDrawerOpen] = useState(false)
  const [isBillingDrawerOpen, setIsBillingDrawerOpen] = useState(false)
  const [selectedBillingProvider, setSelectedBillingProvider] = useState<string | null>(null)
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
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingMsg, setBrandingMsg] = useState('')
  const [generatedClientId, setGeneratedClientId] = useState<string | null>(null)
  const [generatedClientSecret, setGeneratedClientSecret] = useState<string | null>(null)
  const [showGeneratedClientSecret, setShowGeneratedClientSecret] = useState(false)
  const [generateClientIdOnSave, setGenerateClientIdOnSave] = useState(false)
  const [showRotateSecretConfirm, setShowRotateSecretConfirm] = useState(false)
  const [newRedirectUri, setNewRedirectUri] = useState('')
  const [draggedRedirectUri, setDraggedRedirectUri] = useState<string | null>(null)
  const [dragOverRedirectUri, setDragOverRedirectUri] = useState<string | null>(null)
  // Branding state for appearance components
  const [appBranding, setAppBranding] = useState<any>({
    appName: '',
    logoUrl: '',
    announcements: { enabled: false, text: '', linkUrl: '', type: 'info' as const, isDismissible: true },
    social: { supportEmail: '', helpDeskUrl: '', githubRepo: '', gitlabRepo: '', docsUrl: '', whatsapp: '', instagram: '', facebook: '', line: '', twitter: '', linkedin: '', discord: '', appStoreId: '', playStoreId: '' },
    splash: { backgroundColor: '#FFFFFF', spinnerColor: '#3B82F6', spinnerType: 'circle' as const, showAppName: true, showLogo: true, resizeMode: 'cover', logoAnimation: 'none' },
    updates: { minVersion: '1.0.0', storeUrl: '', forceUpdate: false },
  })
  const [brandingUploading, setBrandingUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoFileInputRef = useRef<HTMLInputElement | null>(null)
  // Legal configuration state
  const [legalConfig, setLegalConfig] = useState<any>(null)
  const [legalUseDefault, setLegalUseDefault] = useState(true)
  const [legalLoading, setLegalLoading] = useState(true)
  // Communication configuration state
  const [commConfig, setCommConfig] = useState<{ channels: Record<string, boolean> }>({ 
    channels: { email: false, sms: false, push: false, inApp: false } 
  })
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
  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['user.created'])
  const [webhookMsg, setWebhookMsg] = useState('')
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null)
  const [editingWebhookUrl, setEditingWebhookUrl] = useState('')
  const [editingWebhookEvents, setEditingWebhookEvents] = useState<string[]>([])
  const [editingWebhookStatus, setEditingWebhookStatus] = useState<'active' | 'inactive'>('active')
  // Circles
  const [circles, setCircles] = useState<AppCircle[]>([])
  const [circlesLoading, setCirclesLoading] = useState(false)
  const [createCircleDrawerOpen, setCreateCircleDrawerOpen] = useState(false)
  const [newCircleName, setNewCircleName] = useState('')
  const [newCircleType, setNewCircleType] = useState('team')
  const [newCircleParentId, setNewCircleParentId] = useState<string>('')
  const [newCircleDescription, setNewCircleDescription] = useState('')
  const [newCirclePinCode, setNewCirclePinCode] = useState('')
  const [newCircleCode, setNewCircleCode] = useState('')
  const [circleMsg, setCircleMsg] = useState('')
  const [circleUserSearch, setCircleUserSearch] = useState('')
  const [circleSelectedUserId, setCircleSelectedUserId] = useState('')
  const [circleSelectedRole, setCircleSelectedRole] = useState<'member' | 'owner'>('member')
  const [circleBillingUserSearch, setCircleBillingUserSearch] = useState('')
  const [circleSelectedBillingUserId, setCircleSelectedBillingUserId] = useState('')
  const [circleBillingModeSaving, setCircleBillingModeSaving] = useState(false)
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [selectedCircle, setSelectedCircle] = useState<AppCircle | null>(null)
  const [circleDrawerOpen, setCircleDrawerOpen] = useState(false)
  const [circleDrawerLoading, setCircleDrawerLoading] = useState(false)
  const [circleDetailTab, setCircleDetailTab] = useState<'info' | 'members' | 'billing'>('info')
  const [expandedCircleIds, setExpandedCircleIds] = useState<string[]>([])
  const [draggingCircleId, setDraggingCircleId] = useState<string | null>(null)
  const [circleDetailDraft, setCircleDetailDraft] = useState({
    name: '',
    description: '',
    circleType: 'team',
    parentId: '',
    pinCode: '',
    circleCode: '',
  })
  // Billing
  const [billingConfig, setBillingConfig] = useState<AppBillingConfig>({
    enabled: false,
    provider: 'stripe',
    mode: 'test',
    currency: 'USD',
    providerEnabled: {},
    providerConfig: {},
  })
  // Email templates
  const [emailTemplates, setEmailTemplates] = useState<AppEmailTemplate[]>([])
  const [defaultEmailTemplates, setDefaultEmailTemplates] = useState<AppEmailTemplate[]>([])
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateScope, setSelectedTemplateScope] = useState<'app' | 'default'>('app')
  const [selectedDefaultTemplateToAssign, setSelectedDefaultTemplateToAssign] = useState('')
  const [templateEditor, setTemplateEditor] = useState({
    name: '',
    slug: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true,
  })
  const [templateMsg, setTemplateMsg] = useState('')
  const faviconFileInputRef = useRef<HTMLInputElement | null>(null)
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
    } catch (err) {
      console.error('Failed to load activity log:', err)
      setActivityLog([])
    } finally { setActivityLoading(false) }
  }, [appId])

  useEffect(() => { loadActivityLog() }, [loadActivityLog])

  const filteredActivityLog = activityFilter === 'all' ? activityLog : activityLog.filter(l => l.type === activityFilter)

  const circleChildrenMap = useMemo(() => {
    const map = new Map<string, AppCircle[]>()
    circles.forEach((circle) => {
      const key = circle.parentId || 'root'
      const bucket = map.get(key) || []
      bucket.push(circle)
      map.set(key, bucket)
    })
    return map
  }, [circles])

  const rootCircles = useMemo(() => circleChildrenMap.get('root') || [], [circleChildrenMap])

  const renderTabHeader = (title: string, guideKey: string, actions?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveDevGuide(guideKey)}
          className="inline-flex rounded-lg border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
        >
          <CodeIcon className="w-3.5 h-3.5" /> Dev Guide
        </button>
        {actions}
      </div>
    </div>
  )

  const handleExportActivity = () => {
    const csv = ['timestamp,type,action,user', ...filteredActivityLog.map(l => `"${l.timestamp}","${l.type}","${l.action.replace(/"/g, '""')}","${l.user}"`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `activity-log-${appId}-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const loadCommConfig = useCallback(async () => {
    if (!appId) return
    try {
      const res = await adminService.getAppConfigOverride(appId, 'comm')
      if (res && res.config) {
        setCommConfig(res.config)
      }
    } catch (err) {
      console.error('Failed to load comm config:', err)
    }
  }, [appId])

  useEffect(() => {
    loadCommConfig()
  }, [loadCommConfig])

  const loadCircles = useCallback(async () => {
    if (!appId) return
    setCirclesLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load circles')
      setCircles(Array.isArray(data?.circles) ? data.circles : [])
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to load circles')
      setTimeout(() => setCircleMsg(''), 3000)
    } finally {
      setCirclesLoading(false)
    }
  }, [appId])

  const createCircle = async () => {
    if (!newCircleName.trim()) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCircleName.trim(),
          circleType: newCircleType,
          parentId: newCircleParentId || null,
          description: newCircleDescription.trim(),
          pinCode: newCirclePinCode.trim(),
          circleCode: newCircleCode.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to create circle')
      setNewCircleName('')
      setNewCircleDescription('')
      setNewCirclePinCode('')
      setNewCircleCode('')
      setNewCircleParentId('')
      setNewCircleType('team')
      await loadCircles()
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to create circle')
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const assignCircleRole = async (circleId: string, userId: string, role: 'member' | 'owner') => {
    if (!userId.trim()) return
    const endpoint = role === 'owner' ? 'owners' : 'members'
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${circleId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed to assign ${role}`)
      await loadCircles()
      if (selectedCircleId === circleId) {
        await refreshSelectedCircle()
      }
    } catch (error: any) {
      setCircleMsg(error?.message || `Failed to assign ${role}`)
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const assignSelectedCircleUser = async (circleId: string) => {
    if (!circleSelectedUserId) return
    await assignCircleRole(circleId, circleSelectedUserId, circleSelectedRole)
    setCircleSelectedUserId('')
    setCircleUserSearch('')
  }

  const assignCircleBilling = async (circleId: string) => {
    if (!circleSelectedBillingUserId.trim()) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${circleId}/billing-assignee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: circleSelectedBillingUserId.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to assign billing user')
      setCircleSelectedBillingUserId('')
      setCircleBillingUserSearch('')
      await loadCircles()
      if (selectedCircleId === circleId) {
        await refreshSelectedCircle()
      }
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to assign billing user')
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const removeCircleRole = async (userId: string, role: 'member' | 'owner') => {
    if (!selectedCircleId) return
    const endpoint = role === 'owner' ? 'owners' : 'members'
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${selectedCircleId}/${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed to remove ${role}`)
      await Promise.all([loadCircles(), refreshSelectedCircle()])
    } catch (error: any) {
      setCircleMsg(error?.message || `Failed to remove ${role}`)
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const switchCircleUserRole = async (userId: string, fromRole: 'member' | 'owner', toRole: 'member' | 'owner') => {
    if (fromRole === toRole || !selectedCircleId) return
    try {
      await removeCircleRole(userId, fromRole)
      await assignCircleRole(selectedCircleId, userId, toRole)
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to switch role')
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const saveCircleBillingMode = async (mode: 'perCircleLevel' | 'perAccount') => {
    try {
      setCircleBillingModeSaving(true)
      const res = await fetch(`/api/v1/admin/applications/${appId}/billing-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMode: mode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save billing mode')
      setApplication(prev => prev ? { ...prev, circleBillingMode: mode } : prev)
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to save billing mode')
      setTimeout(() => setCircleMsg(''), 3000)
    } finally {
      setCircleBillingModeSaving(false)
    }
  }

  const toggleCircleExpanded = (circleId: string) => {
    setExpandedCircleIds(prev => prev.includes(circleId) ? prev.filter(id => id !== circleId) : [...prev, circleId])
  }

  const reparentCircle = async (circleId: string, parentId: string | null) => {
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${circleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to move circle')
      await loadCircles()
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to move circle')
      setTimeout(() => setCircleMsg(''), 3000)
    } finally {
      setDraggingCircleId(null)
    }
  }

  const openCircleDetail = async (circleId: string) => {
    setSelectedCircleId(circleId)
    setCircleDrawerOpen(true)
    setCircleDrawerLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${circleId}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load circle detail')
      const detail = data?.circle as AppCircle
      setSelectedCircle(detail)
      setCircleDetailDraft({
        name: detail?.name || '',
        description: detail?.description || '',
        circleType: detail?.circleType || 'team',
        parentId: detail?.parentId || '',
        pinCode: detail?.pinCode || '',
        circleCode: detail?.circleCode || '',
      })
      setCircleDetailTab('info')
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to load circle detail')
      setTimeout(() => setCircleMsg(''), 3000)
      setCircleDrawerOpen(false)
    } finally {
      setCircleDrawerLoading(false)
    }
  }

  const refreshSelectedCircle = async () => {
    if (!selectedCircleId) return
    const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${selectedCircleId}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'Failed to refresh circle detail')
    const detail = data?.circle as AppCircle
    setSelectedCircle(detail)
  }

  const saveCircleDetail = async () => {
    if (!selectedCircleId) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${selectedCircleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: circleDetailDraft.name.trim(),
          description: circleDetailDraft.description.trim(),
          circleType: circleDetailDraft.circleType,
          parentId: circleDetailDraft.parentId || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save circle detail')
      await Promise.all([loadCircles(), refreshSelectedCircle()])
      setCircleMsg('Circle updated')
      setTimeout(() => setCircleMsg(''), 2000)
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to save circle detail')
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const removeCircleMember = async (userId: string) => {
    await removeCircleRole(userId, 'member')
  }

  const removeCircleOwner = async (userId: string) => {
    await removeCircleRole(userId, 'owner')
  }

  const removeCircleBillingAssignee = async (userId: string) => {
    if (!selectedCircleId) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${selectedCircleId}/billing-assignee`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to remove billing assignee')
      await Promise.all([loadCircles(), refreshSelectedCircle()])
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to remove billing assignee')
      setTimeout(() => setCircleMsg(''), 3000)
    }
  }

  const loadBillingConfig = useCallback(async () => {
    try {
      const appRes = await adminService.getAppConfigOverride(appId, 'billing')
      const defaultRes = await adminService.getDefaultBillingConfig().catch(() => ({ config: null }))
      const defaults: AppBillingConfig = {
        enabled: false,
        provider: 'stripe',
        mode: 'test',
        currency: 'USD',
        providerConfig: {},
        ...(defaultRes?.config || {}),
      }
      setBillingConfig({
        ...defaults,
        ...(appRes.config || {}),
        providerConfig: {
          ...(defaults.providerConfig || {}),
          ...((appRes.config?.providerConfig as Record<string, Record<string, string>>) || {}),
        },
      })
    } catch (error) {
      console.error('Failed to load billing config:', error)
      setBillingConfig({
        enabled: false,
        provider: 'stripe',
        mode: 'test',
        currency: 'USD',
        providerEnabled: {},
        providerConfig: {},
      })
    }
  }, [appId])

  const loadEmailTemplates = useCallback(async () => {
    if (!appId) return
    setEmailTemplatesLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/email-templates`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load templates')
      const templates = Array.isArray(data?.templates) ? data.templates : []
      const defaults = Array.isArray(data?.defaultTemplates) ? data.defaultTemplates : []
      setEmailTemplates(templates)
      setDefaultEmailTemplates(defaults)
      if (templates.length > 0 && !selectedTemplateId) {
        const first = templates[0]
        setSelectedTemplateScope('app')
        setSelectedTemplateId(first.id)
        setTemplateEditor({
          name: first.name || '',
          slug: first.slug || '',
          subject: first.subject || '',
          htmlContent: first.htmlContent || '',
          textContent: first.textContent || '',
          isActive: first.isActive !== false,
        })
      }
    } catch (error: any) {
      setTemplateMsg(error?.message || 'Failed to load templates')
      setTimeout(() => setTemplateMsg(''), 3000)
    } finally {
      setEmailTemplatesLoading(false)
    }
  }, [appId, selectedTemplateId])

  const selectTemplate = (template: AppEmailTemplate) => {
    setSelectedTemplateScope('app')
    setSelectedTemplateId(template.id)
    setTemplateEditor({
      name: template.name || '',
      slug: template.slug || '',
      subject: template.subject || '',
      htmlContent: template.htmlContent || '',
      textContent: template.textContent || '',
      isActive: template.isActive !== false,
    })
  }

  const selectDefaultTemplate = (template: AppEmailTemplate) => {
    setSelectedTemplateScope('default')
    setSelectedTemplateId(template.id)
    setTemplateEditor({
      name: template.name || '',
      slug: template.slug || '',
      subject: template.subject || '',
      htmlContent: template.htmlContent || '',
      textContent: template.textContent || '',
      isActive: template.isActive !== false,
    })
  }

  const saveTemplate = async () => {
    try {
      const endpoint = selectedTemplateId
        ? selectedTemplateScope === 'default'
          ? `/api/v1/admin/config/email-templates/${selectedTemplateId}`
          : `/api/v1/admin/applications/${appId}/email-templates/${selectedTemplateId}`
        : selectedTemplateScope === 'default'
          ? '/api/v1/admin/config/email-templates'
          : `/api/v1/admin/applications/${appId}/email-templates`
      const method = selectedTemplateId ? 'PATCH' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateEditor),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save template')
      setTemplateMsg('Saved!')
      setTimeout(() => setTemplateMsg(''), 3000)
      await loadEmailTemplates()
    } catch (error: any) {
      setTemplateMsg(error?.message || 'Failed to save template')
      setTimeout(() => setTemplateMsg(''), 3000)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const endpoint = selectedTemplateScope === 'default'
        ? `/api/v1/admin/config/email-templates/${templateId}`
        : `/api/v1/admin/applications/${appId}/email-templates/${templateId}`
      const res = await fetch(endpoint, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to delete template')
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null)
        setTemplateEditor({ name: '', slug: '', subject: '', htmlContent: '', textContent: '', isActive: true })
      }
      await loadEmailTemplates()
    } catch (error: any) {
      setTemplateMsg(error?.message || 'Failed to delete template')
      setTimeout(() => setTemplateMsg(''), 3000)
    }
  }

  const assignDefaultTemplateToApp = async () => {
    if (!selectedDefaultTemplateToAssign) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/email-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignDefaultTemplateId: selectedDefaultTemplateToAssign }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to assign default template')
      setTemplateMsg('Assigned to app. You can now override it.')
      setSelectedDefaultTemplateToAssign('')
      setTimeout(() => setTemplateMsg(''), 3000)
      await loadEmailTemplates()
    } catch (error: any) {
      setTemplateMsg(error?.message || 'Failed to assign default template')
      setTimeout(() => setTemplateMsg(''), 3000)
    }
  }

  const handleFaviconUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/v1/admin/applications/${appId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to upload icon')
      setApplication(prev => prev ? { ...prev, faviconUrl: data?.url || prev.faviconUrl } : prev)
      setGeneralMsg('Icon uploaded')
      setTimeout(() => setGeneralMsg(''), 2000)
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Icon upload failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    }
  }
  // Dev Guide Drawers
  const [activeDevGuide, setActiveDevGuide] = useState<string | null>(null)
  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const maskSecret = (secret: string) => {
    if (!secret) return ''
    if (secret.length <= 4) return '•'.repeat(secret.length)

    // Mask ~80% of the secret and reveal ~20% (split at start/end).
    const visibleTotal = Math.max(2, Math.floor(secret.length * 0.2))
    const visibleStart = Math.ceil(visibleTotal / 2)
    const visibleEnd = Math.floor(visibleTotal / 2)
    const maskedCount = Math.max(1, secret.length - visibleStart - visibleEnd)

    return `${secret.slice(0, visibleStart)}${'•'.repeat(maskedCount)}${secret.slice(secret.length - visibleEnd)}`
  }

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
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Upload failed')
      }
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Upload failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setBrandingUploading(false)
    }
  }

  const handleGeneralLogoUpload = async (file: File) => {
    if (!application) return
    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/v1/admin/applications/${appId}/upload`, { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Logo upload failed')
      }
      setApplication(prev => prev ? { ...prev, logoUrl: data.url } : prev)
      setGeneralMsg('Logo uploaded. Click Save Changes to persist.')
      setTimeout(() => setGeneralMsg(''), 3000)
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Logo upload failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setLogoUploading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isValidRedirectUri = (uri: string) => {
    if (!uri) return false
    const trimmed = uri.trim()

    // Accept standard web callback URLs.
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return true
    } catch {
      // Continue to custom scheme validation.
    }

    // Accept mobile deep-link callbacks like "myapp://auth/callback".
    return /^[a-z][a-z0-9+.-]*:\/\/.+/i.test(trimmed)
  }

  const isValidPostAuthRedirect = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return true
    if (trimmed.startsWith('/')) return true
    try {
      const parsed = new URL(trimmed)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleAddRedirectUri = () => {
    if (!application) return

    const candidate = newRedirectUri.trim()
    if (!candidate) return
    if (!isValidRedirectUri(candidate)) {
      setGeneralMsg('Invalid Redirect URI')
      setTimeout(() => setGeneralMsg(''), 3000)
      return
    }

    const current = application.oauthRedirectUris || []
    if (current.includes(candidate)) {
      setGeneralMsg('Redirect URI already exists')
      setTimeout(() => setGeneralMsg(''), 3000)
      return
    }

    setApplication(prev => prev ? { ...prev, oauthRedirectUris: [...current, candidate] } : prev)
    setNewRedirectUri('')
  }

  const handleRemoveRedirectUri = (uri: string) => {
    if (!application) return
    setApplication(prev => prev ? { ...prev, oauthRedirectUris: (prev.oauthRedirectUris || []).filter(item => item !== uri) } : prev)
  }

  const handleMoveRedirectUri = (uri: string, direction: 'up' | 'down') => {
    if (!application) return
    const current = [...(application.oauthRedirectUris || [])]
    const index = current.indexOf(uri)
    if (index < 0) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= current.length) return

    const [item] = current.splice(index, 1)
    current.splice(targetIndex, 0, item)
    setApplication(prev => prev ? { ...prev, oauthRedirectUris: current } : prev)
  }

  const handleRedirectUriDragStart = (uri: string) => {
    setDraggedRedirectUri(uri)
  }

  const handleRedirectUriDragOver = (event: React.DragEvent, uri: string) => {
    event.preventDefault()
    if (draggedRedirectUri && draggedRedirectUri !== uri) {
      setDragOverRedirectUri(uri)
    }
  }

  const handleRedirectUriDrop = (event: React.DragEvent, targetUri: string) => {
    event.preventDefault()
    if (!application || !draggedRedirectUri || draggedRedirectUri === targetUri) {
      setDragOverRedirectUri(null)
      return
    }

    const current = [...(application.oauthRedirectUris || [])]
    const sourceIndex = current.indexOf(draggedRedirectUri)
    const targetIndex = current.indexOf(targetUri)
    if (sourceIndex < 0 || targetIndex < 0) {
      setDragOverRedirectUri(null)
      return
    }

    const [item] = current.splice(sourceIndex, 1)
    current.splice(targetIndex, 0, item)
    setApplication(prev => prev ? { ...prev, oauthRedirectUris: current } : prev)
    setDragOverRedirectUri(null)
  }

  const handleRedirectUriDragEnd = () => {
    setDraggedRedirectUri(null)
    setDragOverRedirectUri(null)
  }

  useEffect(() => {
    const loadAppData = async () => {
      try {
        const res = await fetch(`/api/v1/admin/applications/${appId}`)
        if (res.ok) {
          const data = await res.json()
          const appData = data.application || data
          setApplication(appData)
          if (appData?.brandingConfig) {
            setAppBranding(appData.brandingConfig)
          }
          if (appData?.securityConfig) {
            setSecurityConfig(appData.securityConfig)
          }
          if (appData?.identityConfig) {
            setIdentityConfig(appData.identityConfig)
          }
        } else {
          throw new Error('Failed to fetch')
        }
      } catch (err) {
        console.error('Failed to load application data:', err)
        setApplication(null)
        setGeneralMsg('Failed to load application')
        setTimeout(() => setGeneralMsg(''), 3000)
      }

      try {
        const res = await fetch(`/api/v1/admin/applications/${appId}/users`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || data || [])
        } else {
          throw new Error('Failed to fetch')
        }
      } catch (err) {
        console.error('Failed to load users:', err)
        setUsers([])
      }

      try {
        const res = await fetch(`/api/v1/admin/applications/${appId}/webhooks`)
        if (res.ok) {
          const data = await res.json()
          setWebhooks(Array.isArray(data?.webhooks) ? data.webhooks : [])
        } else {
          throw new Error('Failed to fetch')
        }
      } catch (err) {
        console.error('Failed to load webhooks:', err)
        setWebhooks([])
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

      try {
        const authRes = await adminService.getAppConfigOverride(appId, 'auth')
        const apiConfig = Array.isArray(authRes.config) ? authRes.config : []
        setAuthProviders(mergeWithFallbacks(apiConfig))
      } catch (err) {
        console.error('Failed to load auth config:', err)
        setAuthProviders(mergeWithFallbacks([]))
      }

      setIsLoading(false)
    }
    loadAppData()
  }, [appId, isLegalDrawerOpen])

  useEffect(() => {
    if (application?.oauthPrimaryRedirectUri && !newRedirectUri) {
      setNewRedirectUri(application.oauthPrimaryRedirectUri)
    }
  }, [application?.oauthPrimaryRedirectUri])

  useEffect(() => {
    loadCircles()
    loadEmailTemplates()
    loadBillingConfig()
  }, [loadCircles, loadEmailTemplates, loadBillingConfig])

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsDrawerOpen(true)
  }

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.name) return
    try {
      setAddingUser(true)
      const res = await fetch(`/api/v1/admin/applications/${appId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to add user')
      }
      const data = await res.json().catch(() => ({}))
      const newUser: ApplicationUser = data?.user || {
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
      setGeneralMsg(err instanceof Error ? err.message : 'Failed to add user')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setAddingUser(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!application) return
    const pendingRedirect = newRedirectUri.trim()
    const mergedRedirectUris = [...(application.oauthRedirectUris || [])]
    if (pendingRedirect) {
      if (!isValidRedirectUri(pendingRedirect)) {
        setGeneralMsg('Invalid redirect URI format')
        setTimeout(() => setGeneralMsg(''), 3000)
        return
      }
      if (!mergedRedirectUris.includes(pendingRedirect)) {
        mergedRedirectUris.push(pendingRedirect)
      }
    }
    const behavior = application.authBehavior || {
      signupEnabled: true,
      emailVerificationRequired: false,
      inviteOnly: false,
      allowedEmailDomains: [],
      postLoginRedirect: '',
      postSignupRedirect: ''
    }
    if (!isValidPostAuthRedirect(behavior.postLoginRedirect || '') || !isValidPostAuthRedirect(behavior.postSignupRedirect || '')) {
      setGeneralMsg('Invalid post-auth redirect URL/path')
      setTimeout(() => setGeneralMsg(''), 3000)
      return
    }
    try {
      setGeneralSaving(true)
      setGeneratedClientId(null)
      setGeneratedClientSecret(null)
      const res = await fetch(`/api/v1/admin/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...application,
          brandingConfig: appBranding,
          oauthRedirectUris: mergedRedirectUris,
          oauthClientId: application.oauthClientId,
          generateClientId: generateClientIdOnSave
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save application')
      }
      if (data?.application) {
        setApplication(data.application)
      }
      if (pendingRedirect) {
        setNewRedirectUri('')
      }
      if (data?.generatedClientId) {
        setGeneratedClientId(data.generatedClientId)
        setGenerateClientIdOnSave(false)
      }
      if (data?.generatedClientSecret) {
        setGeneratedClientSecret(data.generatedClientSecret)
        setShowGeneratedClientSecret(false)
      }
      setGeneralMsg(data?.warning ? `Saved: ${data.warning}` : 'Saved!')
      setTimeout(() => setGeneralMsg(''), 3000)
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setGeneralSaving(false)
    }
  }

  const handleRotateClientSecretNow = async () => {
    if (!application) return
    try {
      setGeneralSaving(true)
      setGeneratedClientSecret(null)
      const res = await fetch(`/api/v1/admin/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oauthClientId: application.oauthClientId,
          rotateClientSecret: true
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to rotate client secret')
      }
      if (data?.application) {
        setApplication(data.application)
      }
      if (data?.generatedClientId) {
        setGeneratedClientId(data.generatedClientId)
      }
      if (data?.generatedClientSecret) {
        setGeneratedClientSecret(data.generatedClientSecret)
        setShowGeneratedClientSecret(false)
      }
      setGeneralMsg('Client secret rotated')
      setTimeout(() => setGeneralMsg(''), 3000)
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Failed to rotate secret')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setGeneralSaving(false)
    }
  }

  const handleSaveBrandingConfig = async () => {
    if (!application) return
    try {
      setBrandingSaving(true)
      const res = await fetch(`/api/v1/admin/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandingConfig: appBranding
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save branding settings')
      }
      if (data?.application) {
        setApplication(data.application)
        if (data.application.brandingConfig) {
          setAppBranding(data.application.brandingConfig)
        }
      }
      setBrandingMsg('Saved!')
      setTimeout(() => setBrandingMsg(''), 3000)
    } catch (error: any) {
      setBrandingMsg(error?.message || 'Failed')
      setTimeout(() => setBrandingMsg(''), 3000)
    } finally {
      setBrandingSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    try {
      setSecuritySaving(true)
      const res = await fetch(`/api/v1/admin/applications/${appId}/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securityConfig),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save security settings')
      }
      const data = await res.json().catch(() => null)
      if (data?.securityConfig) {
        setSecurityConfig(data.securityConfig)
      }
      setSecurityMsg('Saved!')
      setTimeout(() => setSecurityMsg(''), 3000)
    } catch (error: any) {
      setSecurityMsg(error?.message || 'Failed')
      setTimeout(() => setSecurityMsg(''), 3000)
    } finally {
      setSecuritySaving(false)
    }
  }

  const handleSaveIdentity = async () => {
    try {
      setIdentitySaving(true)
      const res = await fetch(`/api/v1/admin/applications/${appId}/identity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identityConfig),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save identity settings')
      }
      const data = await res.json().catch(() => null)
      if (data?.identityConfig) {
        setIdentityConfig(data.identityConfig)
      }
      setIdentityMsg('Saved!')
      setTimeout(() => setIdentityMsg(''), 3000)
    } catch (error: any) {
      setIdentityMsg(error?.message || 'Failed')
      setTimeout(() => setIdentityMsg(''), 3000)
    } finally {
      setIdentitySaving(false)
    }
  }

  const handleAddWebhook = async () => {
    if (!newWebhookUrl) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add webhook')
      }
      setWebhooks(Array.isArray(data?.webhooks) ? data.webhooks : [])
      setNewWebhookUrl('')
      setNewWebhookEvents(['user.created'])
      setShowAddWebhook(false)
      setWebhookMsg('Webhook added')
      setTimeout(() => setWebhookMsg(''), 3000)
    } catch (error: any) {
      setWebhookMsg(error?.message || 'Failed to add webhook')
      setTimeout(() => setWebhookMsg(''), 3000)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/webhooks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete webhook')
      }
      setWebhooks(Array.isArray(data?.webhooks) ? data.webhooks : [])
      setWebhookMsg('Webhook deleted')
      setTimeout(() => setWebhookMsg(''), 3000)
    } catch (error: any) {
      setWebhookMsg(error?.message || 'Failed to delete webhook')
      setTimeout(() => setWebhookMsg(''), 3000)
    }
  }

  const handleStartWebhookEdit = (webhook: WebhookEndpoint) => {
    setEditingWebhookId(webhook.id)
    setEditingWebhookUrl(webhook.url)
    setEditingWebhookEvents(webhook.events)
    setEditingWebhookStatus(webhook.status)
  }

  const handleCancelWebhookEdit = () => {
    setEditingWebhookId(null)
    setEditingWebhookUrl('')
    setEditingWebhookEvents([])
    setEditingWebhookStatus('active')
  }

  const handleSaveWebhookEdit = async () => {
    if (!editingWebhookId) return
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/webhooks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWebhookId,
          url: editingWebhookUrl,
          events: editingWebhookEvents,
          status: editingWebhookStatus
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update webhook')
      }
      setWebhooks(Array.isArray(data?.webhooks) ? data.webhooks : [])
      handleCancelWebhookEdit()
      setWebhookMsg('Webhook updated')
      setTimeout(() => setWebhookMsg(''), 3000)
    } catch (error: any) {
      setWebhookMsg(error?.message || 'Failed to update webhook')
      setTimeout(() => setWebhookMsg(''), 3000)
    }
  }

  const handleToggleAuthMethod = async (providerName: string, currentlyEnabled: boolean) => {
    try {
      const updatedProviders = authProviders.map((p: any) => 
        p.providerName === providerName ? { ...p, isEnabled: !currentlyEnabled } : p
      )
      setAuthProviders(updatedProviders)
      await adminService.saveAppConfig(appId, 'auth', updatedProviders)
      setGeneralMsg('Auth method updated')
      setTimeout(() => setGeneralMsg(''), 2000)
    } catch (err: any) {
      console.error('Failed to update auth method:', err)
      setGeneralMsg('Failed to update auth method')
      // Revert optimism
      setAuthProviders(prev => prev.map(p => p.providerName === providerName ? { ...p, isEnabled: currentlyEnabled } : p))
      setTimeout(() => setGeneralMsg(''), 3000)
    }
  }

  const handleToggleCommChannel = async (channelType: 'email' | 'sms' | 'push' | 'inApp', currentlyEnabled: boolean) => {
    if (!commConfig) return
    try {
      const updatedConfig = {
        ...commConfig,
        channels: {
          ...commConfig.channels,
          [channelType]: !currentlyEnabled
        }
      }
      setCommConfig(updatedConfig)
      await adminService.saveAppConfig(appId, 'comm', updatedConfig)
      setGeneralMsg('Communication channel updated')
      setTimeout(() => setGeneralMsg(''), 2000)
    } catch (err: any) {
      console.error('Failed to update comm channel:', err)
      setGeneralMsg('Failed to update communication channel')
      // Revert optimism
      setCommConfig(prev => prev ? ({
        ...prev,
        channels: { ...prev.channels, [channelType]: currentlyEnabled }
      }) : prev)
      setTimeout(() => setGeneralMsg(''), 3000)
    }
  }

  const handleDeleteApp = async () => {
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Delete failed')
      }
      router.push('/applications')
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Delete failed')
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

  const canonicalRedirectUri =
    application.oauthRedirectUris?.[0] ||
    application.oauthPrimaryRedirectUri ||
    (application.domain ? `https://${application.domain}/callback` : 'https://localhost:3000/callback')
  const authBehavior = application.authBehavior || {
    signupEnabled: true,
    emailVerificationRequired: false,
    inviteOnly: false,
    allowedEmailDomains: [],
    postLoginRedirect: '',
    postSignupRedirect: ''
  }
  const isPostLoginRedirectValid = isValidPostAuthRedirect(authBehavior.postLoginRedirect || '')
  const isPostSignupRedirectValid = isValidPostAuthRedirect(authBehavior.postSignupRedirect || '')
  const hasInvalidPostAuthRedirect = !isPostLoginRedirectValid || !isPostSignupRedirectValid

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

  const circleUserOptions = users.filter((u) => {
    const q = circleUserSearch.trim().toLowerCase()
    if (!q) return true
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const circleBillingUserOptions = users.filter((u) => {
    const q = circleBillingUserSearch.trim().toLowerCase()
    if (!q) return true
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const sidebarSections = [
    {
      title: 'Core',
      items: [
        { value: 'general', icon: <SettingsIcon className="w-4 h-4" />, label: 'General' },
        { value: 'users', icon: <UsersIcon className="w-4 h-4" />, label: 'Users' },
        { value: 'billing', icon: <CreditCardIcon className="w-4 h-4" />, label: 'Billing & Subscriptions' },
        { value: 'circles', icon: <GlobeIcon className="w-4 h-4" />, label: 'Circles' },
        { value: 'surveys', icon: <ClipboardListIcon className="w-4 h-4" />, label: 'Surveys' },
        { value: 'user-attributes', icon: <UsersIcon className="w-4 h-4" />, label: 'User Attributes' },
      ],
    },
    {
      title: 'App Experience',
      items: [
        { value: 'branding', icon: <PaintbrushIcon className="w-4 h-4" />, label: 'Identity & Brand' },
        { value: 'banners', icon: <MegaphoneIcon className="w-4 h-4" />, label: 'Banners' },
        { value: 'links', icon: <LinksIcon className="w-4 h-4" />, label: 'Links & Support' },
        { value: 'auth-style', icon: <LogInIcon className="w-4 h-4" />, label: 'Auth Page Style' },
      ],
    },
    {
      title: 'Identity & Security',
      items: [
        { value: 'identity', icon: <GlobeIcon className="w-4 h-4" />, label: 'Identity Scope' },
        { value: 'auth', icon: <ShieldCheckIcon className="w-4 h-4" />, label: 'Auth Methods' },
        { value: 'security', icon: <LockIcon className="w-4 h-4" />, label: 'Security & MFA' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { value: 'communication', icon: <MessageSquareIcon className="w-4 h-4" />, label: 'Communication' },
        { value: 'email-templates', icon: <MailIcon className="w-4 h-4" />, label: 'Email Templates' },
        { value: 'webhooks', icon: <WebhookIcon className="w-4 h-4" />, label: 'Webhooks' },
        { value: 'legal', icon: <ScaleIcon className="w-4 h-4" />, label: 'Legal & Compliance' },
        { value: 'activity', icon: <ActivityIcon className="w-4 h-4" />, label: 'Activity Log' },
      ],
    },
  ]

  const renderCircleRows = (items: AppCircle[], depth = 0): React.ReactNode[] =>
    items.flatMap((circle) => {
      const children = circleChildrenMap.get(circle.id) || []
      const isExpanded = expandedCircleIds.includes(circle.id)
      const expandable = children.length > 0
      const depthPaddingClass = ['pl-3', 'pl-8', 'pl-12', 'pl-16', 'pl-20', 'pl-24'][Math.min(depth, 5)]

      const row = (
        <div
          key={circle.id}
          className={`group grid grid-cols-[minmax(0,1fr)_110px_80px_80px_130px_120px] gap-2 items-center ${depthPaddingClass} pr-3 py-2.5 border-b border-gray-100 dark:border-zinc-800/80 hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 ${draggingCircleId === circle.id ? 'opacity-40' : ''}`}
          draggable
          onDragStart={() => setDraggingCircleId(circle.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (!draggingCircleId || draggingCircleId === circle.id) return
            void reparentCircle(draggingCircleId, circle.id)
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {expandable ? (
              <button
                title="Toggle child circles"
                onClick={() => toggleCircleExpanded(circle.id)}
                className="p-0.5 rounded hover:bg-gray-200/70 dark:hover:bg-zinc-700"
              >
                {isExpanded ? <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRightIcon className="w-3.5 h-3.5 text-gray-500" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <GripVerticalIcon className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{circle.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{circle.parentId ? 'Child circle' : 'Root circle'}</p>
            </div>
          </div>
          <div className="text-xs capitalize text-gray-600 dark:text-zinc-300">{circle.circleType}</div>
          <div className="text-xs text-gray-600 dark:text-zinc-300">{(circle.members || []).length}</div>
          <div className="text-xs text-gray-600 dark:text-zinc-300">{(circle.owners || []).length}</div>
          <div className="text-xs text-gray-600 dark:text-zinc-300">
            {application.circleBillingMode === 'perCircleLevel' ? `${(circle.billingAssignees || []).length} assignee(s)` : 'Per user'}
          </div>
          <div className="text-right">
            <Button size="sm" variant="outline" onClick={() => openCircleDetail(circle.id)}>Details</Button>
          </div>
        </div>
      )

      if (expandable && isExpanded) {
        return [row, ...renderCircleRows(children, depth + 1)]
      }
      return [row]
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
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
        <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-2">
          <Button variant="outline" onClick={() => router.push('/dev-hub')} className="shrink-0 flex items-center gap-2 h-8">
            <ExternalLinkIcon className="w-4 h-4" />
            Open Full Dev Docs
          </Button>
          <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${appStatusConfig.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${appStatusConfig.dot} mr-1.5`} />
              {appStatusConfig.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPlanConfig(application.plan).className}`}>
              {application.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Sidebar + Content Layout */}
      <div className="flex gap-6">
        {/* Vertical Sidebar */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-4 rounded-xl p-3 space-y-4">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1.5">{section.title}</h4>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setActiveTab(item.value)}
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
          {renderTabHeader('General Settings', 'app-metadata')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">General Settings</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Configure your application&apos;s identity, platform, and metadata.</p>
              </div>
              <div className="flex items-center gap-2">
                {generalMsg && <span className={`text-xs font-medium ${generalMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{generalMsg}</span>}
                <Button onClick={handleSaveGeneral} disabled={generalSaving || hasInvalidPostAuthRedirect} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  {generalSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Platform Type</label>
              <select
                title="Platform type"
                value={application.platform}
                onChange={e => setApplication(prev => prev ? { ...prev, platform: e.target.value as Application['platform'] } : prev)}
                className="w-full max-w-xs px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile Application</option>
              </select>
            </div>

            {/* Single-column layout: label left, config right */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Identity</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Logo, app name, and description</p>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/30 transition-colors cursor-pointer group shrink-0"
                    onClick={() => logoFileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                      {application.logoUrl ? (
                        <img src={application.logoUrl} alt={`${application.name} logo`} className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        application.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <p className="mt-2 text-[9px] text-gray-500 dark:text-zinc-400 text-center">
                      {logoUploading ? 'Uploading...' : 'Click to upload logo'}
                    </p>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      title="Upload application logo"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleGeneralLogoUpload(file)
                        e.currentTarget.value = ''
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={logoUploading}
                        title="Upload application logo"
                      >
                        {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                        Logo must be uploaded from file (URL input disabled)
                      </span>
                    </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">URLs & Status</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Login & Signup Behavior</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Control signup policy and post-auth redirects.</p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={authBehavior.signupEnabled}
                        onChange={e => setApplication(prev => prev ? { ...prev, authBehavior: { ...authBehavior, signupEnabled: e.target.checked } } : prev)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600"
                      />
                      Signup enabled
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={authBehavior.emailVerificationRequired}
                        onChange={e => setApplication(prev => prev ? { ...prev, authBehavior: { ...authBehavior, emailVerificationRequired: e.target.checked } } : prev)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600"
                      />
                      Require email verification
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={authBehavior.inviteOnly}
                        onChange={e => setApplication(prev => prev ? { ...prev, authBehavior: { ...authBehavior, inviteOnly: e.target.checked } } : prev)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600"
                      />
                      Invite only
                    </label>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Allowed Email Domains (comma-separated)</label>
                    <input
                      type="text"
                      value={(authBehavior.allowedEmailDomains || []).join(', ')}
                      onChange={e => setApplication(prev => prev ? {
                        ...prev,
                        authBehavior: {
                          ...authBehavior,
                          allowedEmailDomains: e.target.value
                            .split(',')
                            .map(v => v.trim().toLowerCase())
                            .filter(Boolean)
                        }
                      } : prev)}
                      placeholder="example.com, company.org"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Post Login Redirect</label>
                      <input
                        type="text"
                        value={authBehavior.postLoginRedirect || ''}
                        onChange={e => setApplication(prev => prev ? { ...prev, authBehavior: { ...authBehavior, postLoginRedirect: e.target.value } } : prev)}
                        placeholder="/dashboard"
                        className={`w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          isPostLoginRedirectValid
                            ? 'border-gray-200 dark:border-zinc-700 focus:ring-blue-500/20'
                            : 'border-red-300 dark:border-red-600 focus:ring-red-500/20'
                        }`}
                      />
                      {!isPostLoginRedirectValid && (
                        <p className="mt-1 text-xs text-red-500">Use a relative path like `/dashboard` or an absolute `https://...` URL.</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Post Signup Redirect</label>
                      <input
                        type="text"
                        value={authBehavior.postSignupRedirect || ''}
                        onChange={e => setApplication(prev => prev ? { ...prev, authBehavior: { ...authBehavior, postSignupRedirect: e.target.value } } : prev)}
                        placeholder="/welcome"
                        className={`w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          isPostSignupRedirectValid
                            ? 'border-gray-200 dark:border-zinc-700 focus:ring-blue-500/20'
                            : 'border-red-300 dark:border-red-600 focus:ring-red-500/20'
                        }`}
                      />
                      {!isPostSignupRedirectValid && (
                        <p className="mt-1 text-xs text-red-500">Use a relative path like `/welcome` or an absolute `https://...` URL.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Redirect URIs</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">OAuth callback URIs for this app client</p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newRedirectUri}
                      onChange={e => setNewRedirectUri(e.target.value)}
                      placeholder="https://yourapp.com/auth/callback or myapp://auth/callback"
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button type="button" variant="outline" onClick={handleAddRedirectUri} className="shrink-0">
                      <PlusIcon className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">Drag rows by the handle to reorder. The top URI is canonical.</p>
                  <div className="space-y-2">
                    {(application.oauthRedirectUris || []).length > 0 ? (
                      (application.oauthRedirectUris || []).map((uri, index, arr) => (
                        <div
                          key={uri}
                          draggable
                          onDragStart={() => handleRedirectUriDragStart(uri)}
                          onDragOver={(event) => handleRedirectUriDragOver(event, uri)}
                          onDrop={(event) => handleRedirectUriDrop(event, uri)}
                          onDragEnd={handleRedirectUriDragEnd}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            dragOverRedirectUri === uri
                              ? 'border-blue-400 dark:border-blue-500'
                              : 'border-gray-200 dark:border-zinc-700'
                          }`}
                        >
                          <button
                            type="button"
                            draggable
                            onDragStart={() => handleRedirectUriDragStart(uri)}
                            className="p-1 rounded-md cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                            title="Drag to reorder"
                          >
                            <GripVerticalIcon className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveRedirectUri(uri, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ChevronUpIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveRedirectUri(uri, 'down')}
                              disabled={index === arr.length - 1}
                              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ChevronDownIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <code className="flex-1 text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">{uri}</code>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                              canonical
                            </span>
                          )}
                          <button onClick={() => handleCopy(uri, `redirect-${uri}`)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Redirect URI">
                            {copiedId === `redirect-${uri}` ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleRemoveRedirectUri(uri)} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Remove Redirect URI">
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-zinc-400">No redirect URIs configured yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {application.platform === 'mobile' && (
                <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                  <div className="md:pr-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Mobile Config</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Bundle ID</label>
                      <input type="text" value={application.bundleId || ''} onChange={e => setApplication(prev => prev ? { ...prev, bundleId: e.target.value } : prev)} placeholder="com.yourapp.mobile" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Deep Link Scheme</label>
                      <input type="text" value={application.deepLinkScheme || ''} onChange={e => setApplication(prev => prev ? { ...prev, deepLinkScheme: e.target.value } : prev)} placeholder="myapp://" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                </div>
              )}

              {application.platform === 'web' && (
                <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                  <div className="md:pr-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Web Config</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Domain</label>
                      <input type="text" value={application.domain || ''} onChange={e => setApplication(prev => prev ? { ...prev, domain: e.target.value } : prev)} placeholder="your-app.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Favicon URL</label>
                      <div className="space-y-2">
                        <input type="url" value={application.faviconUrl || ''} onChange={e => setApplication(prev => prev ? { ...prev, faviconUrl: e.target.value } : prev)} placeholder="https://your-app.com/favicon.ico" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => faviconFileInputRef.current?.click()}>
                            Upload Icon
                          </Button>
                          <input
                            ref={faviconFileInputRef}
                            type="file"
                            accept="image/*"
                            title="Upload favicon icon"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFaviconUpload(file)
                              e.currentTarget.value = ''
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{application.platform === 'web' ? 'SEO & Analytics' : 'App Metadata'}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">API Key</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <KeyIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <code className="flex-1 text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">
                      {apiKeyVisible ? 'Not available in this UI' : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title={apiKeyVisible ? 'Hide placeholder' : 'Show placeholder'}>
                      <EyeIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-2">API key management is not available on this screen yet. Use backend tooling or Dev Hub APIs once enabled.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div className="md:pr-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Application Info</p>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                    <p className="text-gray-500">App ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{appId}</p>
                      <button onClick={() => handleCopy(appId, 'app-id')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy App ID">
                        {copiedId === 'app-id' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                    <p className="text-gray-500">Platform</p>
                    <p className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{application.platform === 'web' ? '🌐 Web App' : '📱 Mobile App'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start">
                    <p className="text-gray-500 pt-1">Client ID</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={application.oauthClientId || ''}
                          onChange={e => setApplication(prev => prev ? { ...prev, oauthClientId: e.target.value } : prev)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md text-xs font-mono text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="client_id"
                          title="OAuth Client ID"
                        />
                        {application.oauthClientId && (
                          <button onClick={() => handleCopy(application.oauthClientId!, 'client-id')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Client ID">
                            {copiedId === 'client-id' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={generateClientIdOnSave ? 'primary' : 'outline'}
                          className="h-7 px-2.5 text-xs"
                          onClick={() => setGenerateClientIdOnSave(v => !v)}
                          title="Generate new Client ID on next save"
                        >
                          <RefreshCwIcon className="w-3.5 h-3.5 mr-1" />
                          {generateClientIdOnSave ? 'Will generate on save' : 'Generate on save'}
                        </Button>
                      </div>
                      {generatedClientId && (
                        <div className="mt-2 p-2 rounded-md border border-blue-200 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/20">
                          <p className="text-[10px] text-blue-700 dark:text-blue-300 mb-1">Generated Client ID:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-[11px] font-mono text-blue-800 dark:text-blue-200 break-all">{generatedClientId}</code>
                            <button onClick={() => handleCopy(generatedClientId, 'generated-client-id')} className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-300 transition-colors" title="Copy generated client ID">
                              {copiedId === 'generated-client-id' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500">Client ID can be edited or generated on save.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start">
                    <p className="text-gray-500 pt-1">Client Secret</p>
                    <div>
                    <p className={`font-medium ${application.oauthClientSecretConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {application.oauthClientSecretConfigured ? 'Configured' : 'Not configured'}
                    </p>
                    {application.oauthClientType && (
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 capitalize">
                        Type: {application.oauthClientType}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40">
                      <code className="flex-1 text-[11px] font-mono text-gray-700 dark:text-zinc-300 break-all">
                        {generatedClientSecret
                          ? (showGeneratedClientSecret ? generatedClientSecret : maskSecret(generatedClientSecret))
                          : (application.oauthClientSecretConfigured ? '••••••••••••••••••••' : 'Not configured')}
                      </code>
                      {generatedClientSecret && (
                        <>
                          <button
                            onClick={() => setShowGeneratedClientSecret(v => !v)}
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors"
                            title={showGeneratedClientSecret ? 'Hide client secret' : 'Show client secret'}
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleCopy(generatedClientSecret, 'generated-client-secret')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy new client secret">
                            {copiedId === 'generated-client-secret' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setShowRotateSecretConfirm(true)}
                        title="Rotate client secret now"
                        disabled={generalSaving}
                      >
                        <RefreshCwIcon className="w-3.5 h-3.5 mr-1" />
                        Rotate secret now
                      </Button>
                    </div>
                    {generatedClientSecret && (
                      <div className="mt-2 p-2 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20">
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 mb-1">New secret (shown once):</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-300">
                          The secret value is masked by default above. Use the eye icon to reveal, then copy.
                        </p>
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start">
                    <p className="text-gray-500">OAuth Notes</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                      Rotating secret invalidates old integrations unless they are updated with the new value.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                    <p className="text-gray-500">Client ID Copy</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{application.oauthClientId || 'Not configured'}</p>
                      {application.oauthClientId && (
                        <button onClick={() => handleCopy(application.oauthClientId!, 'client-id-compact')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Client ID">
                          {copiedId === 'client-id-compact' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                    <p className="text-gray-500">Redirect URI (Canonical)</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{canonicalRedirectUri}</p>
                      <button onClick={() => handleCopy(canonicalRedirectUri, 'redirect-uri')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Redirect URI">
                        {copiedId === 'redirect-uri' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                    <p className="text-gray-500">Plan</p>
                    <p className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{application.plan}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                    <p className="text-gray-500">Users</p>
                    <p className="font-medium text-gray-700 dark:text-zinc-300">{application.users.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <AppUpdateSettings updates={appBranding.updates} setBranding={setAppBranding} />
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

        </TabsContent>

        

        {/* ==================== TAB 2: Users ==================== */}
        <TabsContent value="users" className="space-y-4">
          {renderTabHeader('Users', 'users')}
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Last Active</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                  {filteredUsers.map((user) => {
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
                          <span className="text-sm text-gray-700 dark:text-zinc-300">{user.role || 'User'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">{new Date(user.lastActive).toLocaleString()}</span>
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

        {/* ==================== TAB: Circles ==================== */}
        <TabsContent value="circles" className="space-y-4">
          {renderTabHeader(
            'Circles',
            'circles',
            <Button
              size="sm"
              onClick={() => setCreateCircleDrawerOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
            >
              <PlusIcon className="w-3.5 h-3.5 mr-1" />
              Create Circle
            </Button>
          )}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
            {circleMsg && <span className="text-xs text-red-500">{circleMsg}</span>}

            <div className="rounded-lg border border-gray-200 dark:border-zinc-800">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Billing Mode</h4>
                <div className="flex items-center gap-2">
                  <select
                    title="Circle billing mode"
                    value={application.circleBillingMode || 'perAccount'}
                    onChange={(e) => saveCircleBillingMode(e.target.value as 'perCircleLevel' | 'perAccount')}
                    disabled={circleBillingModeSaving}
                    className="px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg"
                  >
                    <option value="perAccount">Per Account</option>
                    <option value="perCircleLevel">Per Circle Level</option>
                  </select>
                </div>
              </div>
              <div className="p-4 text-xs text-gray-500 dark:text-zinc-400">
                {application.circleBillingMode === 'perCircleLevel'
                  ? 'Billing is configured by circle-level assignee.'
                  : 'Billing is configured per user account.'}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
              {circlesLoading ? (
                <div className="p-6 text-sm text-gray-500">Loading circles...</div>
              ) : circles.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No circles created yet.</div>
              ) : (
                <>
                  <div className="grid grid-cols-[minmax(0,1fr)_110px_80px_80px_130px_120px] gap-2 items-center px-3 py-2 text-[11px] font-semibold text-gray-500 bg-gray-50 dark:bg-zinc-800/60 uppercase tracking-wide">
                    <div>Circle</div>
                    <div>Type</div>
                    <div>Members</div>
                    <div>Owners</div>
                    <div>Billing</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div
                    className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-zinc-800/80 bg-blue-50/40 dark:bg-blue-500/5"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggingCircleId) void reparentCircle(draggingCircleId, null)
                    }}
                  >
                    Drop here to move a circle to root level
                  </div>
                  <div>{renderCircleRows(rootCircles)}</div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB: Surveys ==================== */}
        <TabsContent value="surveys" className="space-y-4">
          {renderTabHeader('Surveys', 'surveys')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Surveys</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Create and manage surveys to collect user feedback. Embed them via the SDK.</p>
            <SurveyBuilder appId={appId} />
          </div>
        </TabsContent>

        {/* ==================== TAB: User Attributes ==================== */}
        <TabsContent value="user-attributes" className="space-y-4">
          {renderTabHeader('User Attributes', 'user-attrs')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Attributes</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Manage custom data you collect from users. These can be used to segment your audience and personalize their experience.</p>
            <UserAttributesConfig appId={appId} mode="app" />
          </div>
        </TabsContent>

        {/* ==================== TAB 3: Global Identity Scope ==================== */}
        <TabsContent value="identity" className="space-y-4">
          {renderTabHeader('Identity', 'identity')}
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
        </TabsContent>

        {/* ==================== TAB 4: Authentication Methods ==================== */}
        <TabsContent value="auth" className="space-y-4">
          {renderTabHeader('Auth Methods', 'auth-methods')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Authentication Methods</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Enable methods and configure settings for this application.</p>
            </div>
            <div className="space-y-3">
              {authProviders.map((provider) => {
                const meta = PROVIDER_META[provider.providerName] || {
                  icon: <CogIcon className="w-5 h-5" />,
                  color: 'bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400',
                }
                const group = PROVIDER_GROUP[provider.providerName] || 'General'

                return (
                  <div
                    key={provider.providerName}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedAuthMethod(provider.providerName)
                      setIsAuthDrawerOpen(true)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                        {meta.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{provider.displayName}</p>
                          <Badge variant={provider.isEnabled ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                            {provider.isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 capitalize">{group}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Configure
                      </Button>
                      <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          title={`Toggle ${provider.displayName}`}
                          checked={provider.isEnabled}
                          onChange={() => handleToggleAuthMethod(provider.providerName, provider.isEnabled)}
                        />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 5: Security & MFA ==================== */}
        <TabsContent value="security" className="space-y-4">
          {renderTabHeader('Security', 'security')}
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Multi-Factor Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Choose which second-factor methods are available.</p>
                </div>
                <div className="space-y-3">
                  {([
                    { key: 'totp' as const, name: 'TOTP (Authenticator App)', desc: 'Google Authenticator, Authy, etc.' },
                    { key: 'sms' as const, name: 'SMS Verification', desc: 'Send OTP via text message' },
                    { key: 'email' as const, name: 'Email Verification', desc: 'Send OTP via email' },
                    { key: 'fido2' as const, name: 'Hardware Key (FIDO2)', desc: 'YubiKey, Titan Security Key' },
                  ]).map((mfa) => (
                    <div
                      key={mfa.key}
                      className="w-full text-left flex items-center justify-between border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setSecurityConfig(prev => ({ ...prev, mfa: { ...prev.mfa, [mfa.key]: !prev.mfa[mfa.key] } }))}
                        className="text-left flex-1"
                        title={`Configure ${mfa.name}`}
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{mfa.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{mfa.desc}</p>
                      </button>
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

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Password Policy</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Set strength requirements and lockout behavior.</p>
                </div>
                <div className="space-y-3">
                  {([
                    { label: 'Minimum Length', key: 'minLength' as const },
                    { label: 'Max Login Attempts', key: 'maxAttempts' as const },
                    { label: 'Password Expiry (days)', key: 'expiryDays' as const },
                    { label: 'Lockout Duration (min)', key: 'lockoutMinutes' as const },
                  ]).map((field) => (
                    <div key={field.key} className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-2 items-center">
                      <label className="text-sm text-gray-700 dark:text-zinc-300">{field.label}</label>
                      <input
                        type="number"
                        title={field.label}
                        value={securityConfig.password[field.key]}
                        onChange={e => setSecurityConfig(prev => ({ ...prev, password: { ...prev.password, [field.key]: parseInt(e.target.value) || 0 } }))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  ))}
                  {([
                    { label: 'Require uppercase letter', key: 'requireUppercase' as const },
                    { label: 'Require lowercase letter', key: 'requireLowercase' as const },
                    { label: 'Require number', key: 'requireNumber' as const },
                    { label: 'Require special character', key: 'requireSpecial' as const },
                  ]).map((rule) => (
                    <label key={rule.key} className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-2 items-center cursor-pointer">
                      <span className="text-sm text-gray-700 dark:text-zinc-300">{rule.label}</span>
                      <span>
                        <input
                          type="checkbox"
                          checked={securityConfig.password[rule.key]}
                          onChange={e => setSecurityConfig(prev => ({ ...prev, password: { ...prev.password, [rule.key]: e.target.checked } }))}
                          className="w-4 h-4 text-blue-500 border-gray-300 dark:border-zinc-600 rounded focus:ring-blue-500/20"
                          title={rule.label}
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Session Management</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Control timeout and concurrent sessions.</p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-2 items-center">
                    <label className="text-sm text-gray-700 dark:text-zinc-300">Session Timeout (min)</label>
                    <input
                      type="number"
                      title="Session timeout in minutes"
                      value={securityConfig.session.timeoutMinutes}
                      onChange={e => setSecurityConfig(prev => ({ ...prev, session: { ...prev.session, timeoutMinutes: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-2 items-center">
                    <label className="text-sm text-gray-700 dark:text-zinc-300">Max Concurrent Sessions</label>
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
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          {renderTabHeader('Communication', 'communication')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-blue-600 mb-6 shadow-sm border border-blue-100 dark:border-blue-500/20">
                <BellIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Communication Hub</h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-8">
                Manage all outgoing notifications, including Email, SMS, Push, and In-App messaging. 
                Configure providers like SendGrid, Twilio, and Firebase Messaging in one place.
              </p>
            </div>
            
            <div className="p-6 pt-0 space-y-3 max-w-2xl mx-auto">
              {[
                { name: 'Email', key: 'email', icon: <MailIcon className="w-5 h-5" />, active: commConfig.channels.email, color: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10' },
                { name: 'SMS', key: 'sms', icon: <SmartphoneIcon className="w-5 h-5" />, active: commConfig.channels.sms, color: 'bg-green-50 text-green-600 dark:bg-green-500/10' },
                { name: 'Push', key: 'push', icon: <BellIcon className="w-5 h-5" />, active: commConfig.channels.push, color: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' },
                { name: 'In-App', key: 'inApp', icon: <MessageSquareIcon className="w-5 h-5" />, active: commConfig.channels.inApp, color: 'bg-violet-50 text-violet-500 dark:bg-violet-500/10' },
              ].map(item => (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-all cursor-pointer group"
                  onClick={() => { setSelectedCommChannel(item.key as any); setIsCommDrawerOpen(true) }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        <Badge variant={item.active ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                          {item.active ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 capitalize">Channel</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Configure
                    </Button>
                    <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        title={`Toggle ${item.name} channel`}
                        checked={item.active}
                        onChange={() => handleToggleCommChannel(item.key as any, item.active)}
                      />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 pt-4 flex flex-col items-center text-center max-w-2xl mx-auto">

              <Button 
                onClick={() => { setSelectedCommChannel('email'); setIsCommDrawerOpen(true) }}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/25 px-8 hover:scale-[1.02] transition-transform"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Manage Communication Channels
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB: Billing ==================== */}
        <TabsContent value="billing" className="space-y-4">
          {renderTabHeader('Billing & Subscriptions', 'billing')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Billing Method Scope</h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Choose whether billing is charged per user account or per circle level.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    title="Billing method scope"
                    value={application.circleBillingMode || 'perAccount'}
                    onChange={(e) => saveCircleBillingMode(e.target.value as 'perCircleLevel' | 'perAccount')}
                    disabled={circleBillingModeSaving}
                    className="px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg"
                  >
                    <option value="perAccount">Per User</option>
                    <option value="perCircleLevel">Per Circle</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Available Billing Methods</h4>
                <span className="text-[11px] text-gray-500 dark:text-zinc-400">Click a method card to configure</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BILLING_PROVIDERS.map((provider) => {
                  const isActive = billingConfig.provider === provider.value
                  const isEnabled = !!billingConfig.providerEnabled?.[provider.value]
                  return (
                    <button
                      key={provider.value}
                      onClick={() => {
                        setSelectedBillingProvider(provider.value)
                        setIsBillingDrawerOpen(true)
                      }}
                      className={`text-left rounded-lg border p-3 transition-colors ${
                        isActive
                          ? 'border-blue-300 bg-blue-50/30 dark:border-blue-500/40 dark:bg-blue-500/10'
                          : 'border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/20 dark:hover:bg-blue-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{provider.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase ${isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          {isActive && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Selected</span>}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {isActive ? `Mode: ${billingConfig.mode} · Currency: ${billingConfig.currency}` : 'Click to configure this method'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </TabsContent>

        {/* ==================== TAB: Email Templates ==================== */}
        <TabsContent value="email-templates" className="space-y-4">
          {renderTabHeader(
            'Email Templates',
            'email-templates',
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedTemplateScope('default')
                  setSelectedTemplateId(null)
                  setTemplateEditor({ name: '', slug: '', subject: '', htmlContent: '', textContent: '', isActive: true })
                }}
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Create Default
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedTemplateScope('app')
                  setSelectedTemplateId(null)
                  setTemplateEditor({ name: '', slug: '', subject: '', htmlContent: '', textContent: '', isActive: true })
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Add App Template
              </Button>
            </div>
          )}
          {emailTemplatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading templates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4" style={{ minHeight: 520 }}>
              {/* Template List Sidebar */}
              <div className="col-span-4 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
                {/* Assign default template */}
                <div className="p-3 border-b border-gray-100 dark:border-zinc-800 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assign Default to App</p>
                  <div className="flex gap-2">
                    <select
                      title="Select default template to assign"
                      value={selectedDefaultTemplateToAssign}
                      onChange={(e) => setSelectedDefaultTemplateToAssign(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs"
                    >
                      <option value="">Select template...</option>
                      {defaultEmailTemplates
                        .filter((tpl) => !emailTemplates.some((assigned) => assigned.slug === tpl.slug))
                        .map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                        ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={assignDefaultTemplateToApp}
                      disabled={!selectedDefaultTemplateToAssign}
                      className="bg-blue-600 text-white border-0 shrink-0"
                    >
                      Assign
                    </Button>
                  </div>
                  {templateMsg && (
                    <p className={`text-[11px] font-medium ${templateMsg === 'Saved!' || templateMsg.startsWith('Assigned') ? 'text-emerald-600' : 'text-red-500'}`}>{templateMsg}</p>
                  )}
                </div>
                {/* Template lists */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">App Templates</p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                    {emailTemplates.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400">No app templates yet.</p>
                    ) : emailTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => selectTemplate(t)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          selectedTemplateId === t.id && selectedTemplateScope === 'app'
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{t.slug}</p>
                        </div>
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase shrink-0 ml-2">App</span>
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pt-4 pb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Templates</p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                    {defaultEmailTemplates.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400">No default templates.</p>
                    ) : defaultEmailTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => selectDefaultTemplate(t)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          selectedTemplateId === t.id && selectedTemplateScope === 'default'
                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{t.slug}</p>
                        </div>
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 uppercase shrink-0 ml-2">Default</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor + Preview */}
              <div className="col-span-8 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
                {(selectedTemplateId !== null || templateEditor.name || templateEditor.htmlContent) ? (
                  <>
                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Template Name</label>
                          <input
                            type="text"
                            title="Template name"
                            value={templateEditor.name}
                            onChange={(e) => setTemplateEditor(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Slug</label>
                          <input
                            type="text"
                            title="Template slug"
                            value={templateEditor.slug}
                            onChange={(e) => setTemplateEditor(prev => ({ ...prev, slug: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Subject Line</label>
                        <input
                          type="text"
                          title="Subject line"
                          value={templateEditor.subject}
                          onChange={(e) => setTemplateEditor(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100 dark:divide-zinc-800" style={{ minHeight: 0 }}>
                      {/* HTML Editor */}
                      <div className="flex flex-col">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
                          <CodeIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500">HTML Editor</span>
                        </div>
                        <textarea
                          value={templateEditor.htmlContent}
                          onChange={(e) => setTemplateEditor(prev => ({ ...prev, htmlContent: e.target.value }))}
                          className="flex-1 p-4 bg-gray-50 dark:bg-zinc-950 text-xs font-mono text-gray-800 dark:text-zinc-300 resize-none focus:outline-none"
                          spellCheck={false}
                        />
                      </div>
                      {/* Preview */}
                      <div className="flex flex-col">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
                          <EyeIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500">Preview</span>
                        </div>
                        <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900">
                          <iframe
                            title="Email preview"
                            srcDoc={templateEditor.htmlContent || '<p style="color:#999;padding:20px;font-family:sans-serif;">No HTML content yet.</p>'}
                            className="w-full h-full border-0"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                        <input type="checkbox" title="Template active status" checked={templateEditor.isActive} onChange={(e) => setTemplateEditor(prev => ({ ...prev, isActive: e.target.checked }))} />
                        Active
                      </label>
                      <div className="flex items-center gap-2">
                        {templateMsg && (
                          <span className={`text-xs font-medium ${templateMsg === 'Saved!' || templateMsg.startsWith('Assigned') ? 'text-emerald-600' : 'text-red-500'}`}>{templateMsg}</span>
                        )}
                        {selectedTemplateId && (
                          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteTemplate(selectedTemplateId)}>
                            Delete
                          </Button>
                        )}
                        <Button onClick={saveTemplate} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                          {selectedTemplateScope === 'default' ? 'Save Default' : 'Save App Template'}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                    <p className="text-sm">Select a template to edit</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== TAB: Webhooks ==================== */}
        <TabsContent value="webhooks" className="space-y-4">
          {renderTabHeader('Webhooks', 'webhooks')}
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
            {webhookMsg && (
              <div className="mb-4 text-xs text-gray-600 dark:text-zinc-400">{webhookMsg}</div>
            )}

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
                  <Button onClick={handleAddWebhook} disabled={!newWebhookUrl || newWebhookEvents.length === 0} className="bg-blue-600 text-white border-0">Add</Button>
                  <Button variant="outline" onClick={() => { setShowAddWebhook(false); setNewWebhookUrl(''); setNewWebhookEvents(['user.created']) }}>Cancel</Button>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-2">Events</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {WEBHOOK_EVENTS.map((eventName) => {
                      const checked = newWebhookEvents.includes(eventName)
                      return (
                        <label key={eventName} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-2 py-1.5 text-[11px] text-gray-700 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setNewWebhookEvents((prev) => {
                                if (e.target.checked) return Array.from(new Set([...prev, eventName]))
                                return prev.filter((item) => item !== eventName)
                              })
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                          />
                          <span className="font-mono">{eventName}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Webhook List */}
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                  {editingWebhookId === wh.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={editingWebhookUrl}
                          onChange={(e) => setEditingWebhookUrl(e.target.value)}
                          placeholder="https://api.example.com/webhooks"
                          className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <select
                          value={editingWebhookStatus}
                          onChange={(e) => setEditingWebhookStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                          className="px-2.5 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          title="Webhook status"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {WEBHOOK_EVENTS.map((eventName) => {
                          const checked = editingWebhookEvents.includes(eventName)
                          return (
                            <label key={eventName} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-2 py-1.5 text-[11px] text-gray-700 dark:text-zinc-300">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setEditingWebhookEvents((prev) => {
                                    if (e.target.checked) return Array.from(new Set([...prev, eventName]))
                                    return prev.filter((item) => item !== eventName)
                                  })
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                              />
                              <span className="font-mono">{eventName}</span>
                            </label>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelWebhookEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveWebhookEdit}
                          disabled={!editingWebhookUrl || editingWebhookEvents.length === 0}
                          className="bg-blue-600 text-white border-0"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
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
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleStartWebhookEdit(wh)} className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors" title="Edit webhook">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteWebhook(wh.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors" title="Delete webhook">
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
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
                {WEBHOOK_EVENTS.map(ev => (
                  <span key={ev} className="inline-flex items-center px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-[10px] font-mono text-gray-600 dark:text-zinc-400">
                    <HashIcon className="w-3 h-3 mr-1 text-gray-400" />{ev}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB: Activity Log ==================== */}
        <TabsContent value="activity" className="space-y-4">
          {renderTabHeader('Activity', 'activity')}
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
        </TabsContent>

        {/* ==================== TAB 7: Legal & Compliance ==================== */}
        <TabsContent value="legal" className="space-y-4">
          {renderTabHeader('Legal & Compliance', 'legal')}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Legal & Compliance</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Legal & Compliance list. Click an item to edit in drawer.</p>
              </div>
              <Button onClick={() => setIsLegalDrawerOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: 'Legal Documents',
                  detail: `${(legalConfig?.documents || []).length} docs configured`,
                  group: 'Documents',
                },
                {
                  name: 'Compliance Methods',
                  detail: legalUseDefault ? 'Using default values' : 'App override active',
                  group: 'Compliance',
                },
                {
                  name: 'Data Retention',
                  detail: `User: ${legalConfig?.retention?.userData || 0}d · Audit: ${legalConfig?.retention?.auditLog || 0}d · Session: ${legalConfig?.retention?.sessionData || 0}d`,
                  group: 'Retention',
                },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setIsLegalDrawerOpen(true)}
                  className="w-full text-left rounded-lg border border-gray-200 dark:border-zinc-800 px-3 py-2.5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      {item.group}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{item.detail}</p>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB: Login Sandbox ==================== */}
        <TabsContent value="sandbox" className="space-y-4">
          {renderTabHeader('Sandbox', 'sandbox')}
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
                        <input type="checkbox" title="Agree to terms and privacy policy" className="w-3.5 h-3.5 mt-0.5 text-blue-500 border-gray-300 dark:border-zinc-600 rounded" />
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
                      <input title="Sandbox test user email" type="email" defaultValue="test@sandbox.example.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Redirect URL</label>
                      <input title="Sandbox redirect URL" type="url" defaultValue={canonicalRedirectUri} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
        </TabsContent>

        {/* ==================== TAB: Branding ==================== */}
        <TabsContent value="branding" className="space-y-4">
          {renderTabHeader(
            'Identity & Brand',
            'branding',
            <>
              {brandingMsg && <span className={`text-xs font-medium ${brandingMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{brandingMsg}</span>}
              <Button onClick={handleSaveBrandingConfig} disabled={brandingSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                {brandingSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                Save Branding
              </Button>
            </>
          )}
          <BrandingSettings branding={appBranding} setBranding={setAppBranding} handleBrandingUpload={handleBrandingUpload} uploading={brandingUploading} />
        </TabsContent>

        {/* ==================== TAB: Banners ==================== */}
        <TabsContent value="banners" className="space-y-4">
          {renderTabHeader(
            'Banners',
            'announcements',
            <>
              {brandingMsg && <span className={`text-xs font-medium ${brandingMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{brandingMsg}</span>}
              <Button onClick={handleSaveBrandingConfig} disabled={brandingSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                {brandingSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                Save Branding
              </Button>
            </>
          )}
          <AnnouncementSettings announcements={appBranding.announcements} setBranding={setAppBranding} />
        </TabsContent>

        {/* ==================== TAB: Links & Support ==================== */}
        <TabsContent value="links" className="space-y-4">
          {renderTabHeader(
            'Links & Support',
            'social-links',
            <>
              {brandingMsg && <span className={`text-xs font-medium ${brandingMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{brandingMsg}</span>}
              <Button onClick={handleSaveBrandingConfig} disabled={brandingSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                {brandingSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                Save Branding
              </Button>
            </>
          )}
          <SocialSettings social={appBranding.social} setBranding={setAppBranding} />
        </TabsContent>




        {/* ==================== TAB: Auth Page Style ==================== */}
        <TabsContent value="auth-style" className="space-y-4">
          <AuthStyleConfig appId={appId} appName={application.name} />
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Integrated Login Sandbox</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Test login/signup outcomes inside the same auth style workspace.</p>
              </div>
              <div className="flex items-center rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
                {(['login', 'signup'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setSandboxMode(mode); setSandboxResult(null) }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(sandboxMode === 'login' ? [
                { label: 'Simulate Login Success', icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> },
                { label: 'Simulate Login Failure', icon: <XCircleIcon className="w-4 h-4 text-red-500" /> },
                { label: 'Simulate MFA Challenge', icon: <ShieldCheckIcon className="w-4 h-4 text-violet-500" /> },
              ] : [
                { label: 'Simulate Signup Success', icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> },
                { label: 'Simulate Signup Failure', icon: <XCircleIcon className="w-4 h-4 text-red-500" /> },
                { label: 'Simulate Email Verification', icon: <MailIcon className="w-4 h-4 text-blue-500" /> },
              ]).map((scenario) => (
                <button
                  key={scenario.label}
                  onClick={() => handleSandboxSimulate(scenario.label)}
                  disabled={sandboxRunning}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
                >
                  {scenario.icon}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{scenario.label}</span>
                  {sandboxRunning && <Loader2Icon className="w-4 h-4 animate-spin text-blue-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
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

      {/* Create Circle Drawer */}
      {createCircleDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateCircleDrawerOpen(false)} />
          <div className="absolute right-4 top-4 bottom-4 w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Circle</h3>
              <button title="Close create circle drawer" onClick={() => setCreateCircleDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                <XIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Circle Name</label>
                <input
                  type="text"
                  title="Create circle name"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="Engineering Team"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Circle Type</label>
                <select
                  title="Create circle type"
                  value={newCircleType}
                  onChange={(e) => setNewCircleType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                >
                  <option value="organization">Organization</option>
                  <option value="department">Department</option>
                  <option value="team">Team</option>
                  <option value="family">Family</option>
                  <option value="household">Household</option>
                  <option value="friend-group">Friend Group</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Pin Code</label>
                  <input
                    type="text"
                    title="Create circle pin code"
                    value={newCirclePinCode}
                    onChange={(e) => setNewCirclePinCode(e.target.value)}
                    placeholder="1234"
                    maxLength={10}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Circle Code (Ref)</label>
                  <input
                    type="text"
                    title="Create circle ref code"
                    value={newCircleCode}
                    onChange={(e) => setNewCircleCode(e.target.value)}
                    placeholder="ENG-2024"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Parent Circle</label>
                <select
                  title="Create parent circle"
                  value={newCircleParentId}
                  onChange={(e) => setNewCircleParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                >
                  <option value="">None (root)</option>
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>{circle.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Description</label>
                <textarea
                  title="Create circle description"
                  value={newCircleDescription}
                  onChange={(e) => setNewCircleDescription(e.target.value)}
                  rows={4}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-y"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateCircleDrawerOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  await createCircle()
                  setCreateCircleDrawerOpen(false)
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
              >
                Create Circle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Circle Detail Drawer */}
      {circleDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCircleDrawerOpen(false)} />
          <div className="absolute right-4 top-4 bottom-4 w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Circle Details</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{selectedCircle?.id}</p>
              </div>
              <button title="Close circle drawer" onClick={() => setCircleDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                <XIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {circleDrawerLoading || !selectedCircle ? (
                <div className="text-sm text-gray-500">Loading circle detail...</div>
              ) : (
                <>
                  <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800">
                    <button onClick={() => setCircleDetailTab('info')} className={`px-3 py-2 text-xs font-medium border-b-2 ${circleDetailTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Circle Info</button>
                    <button onClick={() => setCircleDetailTab('members')} className={`px-3 py-2 text-xs font-medium border-b-2 ${circleDetailTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Members</button>
                    <button onClick={() => setCircleDetailTab('billing')} className={`px-3 py-2 text-xs font-medium border-b-2 ${circleDetailTab === 'billing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Billing</button>
                  </div>

                  {circleDetailTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Circle Name</label>
                        <input type="text" title="Circle detail name" value={circleDetailDraft.name} onChange={(e) => setCircleDetailDraft(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Circle Type</label>
                        <select title="Circle detail type" value={circleDetailDraft.circleType} onChange={(e) => setCircleDetailDraft(prev => ({ ...prev, circleType: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm">
                          <option value="organization">Organization</option>
                          <option value="department">Department</option>
                          <option value="team">Team</option>
                          <option value="family">Family</option>
                          <option value="household">Household</option>
                          <option value="friend-group">Friend Group</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Parent Circle</label>
                        <select title="Circle detail parent" value={circleDetailDraft.parentId} onChange={(e) => setCircleDetailDraft(prev => ({ ...prev, parentId: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm">
                          <option value="">None</option>
                          {circles.filter((c) => c.id !== selectedCircle.id).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Pin Code</label>
                        <input
                          type="text"
                          title="Circle detail pin code"
                          value={circleDetailDraft.pinCode || ''}
                          onChange={(e) => setCircleDetailDraft(prev => ({ ...prev, pinCode: e.target.value }))}
                          placeholder="1234"
                          maxLength={10}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Circle Code (Ref)</label>
                        <input
                          type="text"
                          title="Circle detail ref code"
                          value={circleDetailDraft.circleCode || ''}
                          onChange={(e) => setCircleDetailDraft(prev => ({ ...prev, circleCode: e.target.value }))}
                          placeholder="ENG-2024"
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Description</label>
                        <textarea
                          title="Circle detail description"
                          value={circleDetailDraft.description}
                          onChange={(e) => setCircleDetailDraft(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {circleDetailTab === 'members' && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-zinc-200">Manage Members and Owners</p>
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_130px_110px] gap-2">
                          <div className="space-y-1">
                            <input
                              type="text"
                              list="circle-users-datalist"
                              value={circleUserSearch}
                              onChange={(e) => {
                                setCircleUserSearch(e.target.value)
                                const match = circleUserOptions.find(u => `${u.name || 'Unknown'} (${u.email || u.id})` === e.target.value)
                                setCircleSelectedUserId(match ? match.id : '')
                              }}
                              placeholder="Search and select user..."
                              className="w-full px-2.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <datalist id="circle-users-datalist">
                              {circleUserOptions.map((u) => (
                                <option key={u.id} value={`${u.name || 'Unknown'} (${u.email || u.id})`} />
                              ))}
                            </datalist>
                          </div>
                          <select
                            title="Assign role"
                            value={circleSelectedRole}
                            onChange={(e) => setCircleSelectedRole(e.target.value as 'member' | 'owner')}
                            className="px-2.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs h-fit"
                          >
                            <option value="member">Member</option>
                            <option value="owner">Owner</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-fit"
                            disabled={!circleSelectedUserId}
                            onClick={() => assignSelectedCircleUser(selectedCircle.id)}
                          >
                            Add User
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
                        <p className="text-xs font-semibold mb-2">Assigned Users</p>
                        <div className="space-y-2">
                          {[
                            ...(selectedCircle.members || []).map((m) => ({ id: m.id, userId: m.userId, email: m.user?.email || m.userId, role: 'member' as const })),
                            ...(selectedCircle.owners || []).map((o) => ({ id: o.id, userId: o.userId, email: o.user?.email || o.userId, role: 'owner' as const })),
                          ].map((entry) => (
                            <div key={`${entry.role}-${entry.id}`} className="text-xs grid grid-cols-[minmax(0,1fr)_110px_70px] gap-2 items-center">
                              <span className="truncate">{entry.email}</span>
                              <select
                                value={entry.role}
                                title="Assigned role"
                                onChange={(e) => switchCircleUserRole(entry.userId, entry.role, e.target.value as 'member' | 'owner')}
                                className="px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs"
                              >
                                <option value="member">Member</option>
                                <option value="owner">Owner</option>
                              </select>
                              <button
                                title="Remove user"
                                onClick={() => (entry.role === 'owner' ? removeCircleOwner(entry.userId) : removeCircleMember(entry.userId))}
                                className="text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {(selectedCircle.members || []).length === 0 && (selectedCircle.owners || []).length === 0 && (
                            <p className="text-xs text-gray-500">No users assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {circleDetailTab === 'billing' && (
                    <div className="space-y-4">
                      {application.circleBillingMode === 'perCircleLevel' ? (
                        <>
                          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-zinc-200">Assign Billing User</p>
                            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px] gap-2">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={circleBillingUserSearch}
                                  onChange={(e) => setCircleBillingUserSearch(e.target.value)}
                                  placeholder="Search user by name or email"
                                  className="w-full px-2.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs"
                                />
                                <select
                                  title="Select billing user"
                                  value={circleSelectedBillingUserId}
                                  onChange={(e) => setCircleSelectedBillingUserId(e.target.value)}
                                  className="w-full px-2.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs"
                                >
                                  <option value="">Select billing user...</option>
                                  {circleBillingUserOptions.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {(u.name || 'Unknown')} ({u.email || u.id})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button size="sm" variant="outline" className="h-fit" disabled={!circleSelectedBillingUserId} onClick={() => assignCircleBilling(selectedCircle.id)}>
                                Set Assignee
                              </Button>
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
                            <p className="text-xs font-semibold mb-2">Billing Assignees</p>
                            <div className="space-y-2">
                              {(selectedCircle.billingAssignees || []).map((b) => (
                                <div key={b.id} className="text-xs flex items-center justify-between gap-2">
                                  <span className="truncate">{b.user?.email || b.userId}{b.isPrimary ? ' (primary)' : ''}</span>
                                  <button title="Remove billing assignee" onClick={() => removeCircleBillingAssignee(b.userId)} className="text-red-500 hover:text-red-600">Remove</button>
                                </div>
                              ))}
                              {(selectedCircle.billingAssignees || []).length === 0 && <p className="text-xs text-gray-500">No billing assignees</p>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4 text-xs text-gray-500">
                          Billing mode is currently per user account. Switch to per circle from the Billing tab to configure circle assignees.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={async () => {
                  if (!selectedCircleId) return
                  const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${selectedCircleId}`, { method: 'DELETE' })
                  if (res.ok) {
                    setCircleDrawerOpen(false)
                    setSelectedCircleId(null)
                    setSelectedCircle(null)
                    await loadCircles()
                  }
                }}
              >
                Delete Circle
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setCircleDrawerOpen(false)}>Close</Button>
                <Button onClick={saveCircleDetail} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">Save Circle</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Drawers */}
      <AuthMethodsConfigDrawer
        isOpen={isAuthDrawerOpen}
        onClose={() => { setIsAuthDrawerOpen(false); setSelectedAuthMethod(null) }}
        appId={appId}
        appName={application.name}
        initialMethod={selectedAuthMethod}
      />
      <CommunicationConfigDrawer
        isOpen={isCommDrawerOpen}
        onClose={() => {
          setIsCommDrawerOpen(false)
          setSelectedCommChannel(null)
        }}
        appId={appId}
        appName={application.name}
        initialChannel={selectedCommChannel}
      />
      <LegalConfigDrawer
        isOpen={isLegalDrawerOpen}
        onClose={() => setIsLegalDrawerOpen(false)}
        appId={appId}
        appName={application?.name || 'Application'}
      />
      <BillingConfigDrawer
        isOpen={isBillingDrawerOpen}
        onClose={() => {
          setIsBillingDrawerOpen(false)
          setSelectedBillingProvider(null)
          loadBillingConfig()
        }}
        appId={appId}
        appName={application?.name || 'Application'}
        initialProvider={selectedBillingProvider}
      />

      {/* Confirm Client Secret Rotation */}
      {showRotateSecretConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRotateSecretConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800/80 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rotate Client Secret?</h3>
              <button onClick={() => setShowRotateSecretConfirm(false)} title="Close modal" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              This generates a new client secret immediately. The new secret is shown once and must be updated in your integrations.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg px-3 py-2">
              Existing integrations using the old secret will fail until updated.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowRotateSecretConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleRotateClientSecretNow()
                  setShowRotateSecretConfirm(false)
                }}
              >
                Rotate Now
              </Button>
            </div>
          </div>
        </div>
      )}

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
          { description: 'Web SDK — Fetch & update app metadata:', code: `import { AppKit } from '@appkit/web';\n\nconst client = new AppKit({ apiKey: 'ak_...' });\nconst app = await client.getApplication();\n// { id, name, domain, platform, status, ... }\n\nawait client.updateApplication({\n  name: 'My App',\n  domain: 'myapp.com',\n  platform: 'web',\n});` },
        ]}
        mobileContent={[
          { description: 'React Native SDK — Fetch & update app metadata:', code: `import { AppKit } from '@appkit/react-native';\n\nconst client = new AppKit({ apiKey: 'ak_...' });\nconst app = await client.getApplication();\n// { id, name, bundleId, platform, status, ... }\n\nawait client.updateApplication({\n  name: 'My Mobile App',\n  bundleId: 'com.myapp.mobile',\n  deepLinkScheme: 'myapp://',\n});` },
        ]}
        apiEndpoints={`GET  /api/v1/admin/applications/{appId}\nPUT  /api/v1/admin/applications/{appId}\nDELETE /api/v1/admin/applications/{appId}`}
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
          { description: 'Web — OAuth, email/password, and magic link:', code: `const methods = await client.getAuthMethods();\n\nawait client.auth.startOAuth('google-oauth', {\n  redirectUri: '${canonicalRedirectUri}',\n  scope: 'openid email profile',\n});\n\nconst session = await client.auth.signIn({\n  email: 'user@example.com',\n  password: '***',\n});\n\nawait client.auth.sendMagicLink('user@example.com');\nconst user = await client.auth.getCurrentUser();` },
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
        open={activeDevGuide === 'email-templates'}
        onClose={() => setActiveDevGuide(null)}
        title="Email Templates Guide"
        description="Template variables, preview flow, and save API."
        sharedContent={[
          { description: 'Create templates, render preview, and send transactional mail:', code: `const template = await client.emailTemplates.create({\n  name: 'Welcome Email',\n  slug: 'welcome-email',\n  subject: 'Welcome {{user.firstName}}',\n  htmlContent: '<p>Hello {{user.firstName}}, welcome to {{app.name}}</p>',\n});\n\n// Server-side render preview before send\nconst html = await client.emailTemplates.render('welcome-email', {\n  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },\n  app: { name: 'My App' },\n});\n\nawait client.communication.sendEmail({\n  to: 'john@example.com',\n  template: 'welcome-email',\n  data: {\n    user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },\n    app: { name: 'My App' },\n  },\n});` },
        ]}
        apiEndpoints={`GET    /api/v1/admin/applications/{appId}/email-templates\nPOST   /api/v1/admin/applications/{appId}/email-templates\nPATCH  /api/v1/admin/applications/{appId}/email-templates/{templateId}\nDELETE /api/v1/admin/applications/{appId}/email-templates/{templateId}`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'billing'}
        onClose={() => setActiveDevGuide(null)}
        title="Billing Config Guide"
        description="Billing inherits platform defaults and supports inline per-app overrides."
        sharedContent={[
          { description: 'Set provider mode and choose billing scope (per user or per circle):', code: `// Save app-level billing override (inherits defaults, then override fields)\nawait fetch('/api/v1/admin/applications/config', {\n  method: 'PUT',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    appId: '{appId}',\n    configType: 'billing',\n    config: {\n      enabled: true,\n      provider: 'stripe',\n      mode: 'live',\n      currency: 'USD',\n      providerConfig: {\n        stripe: {\n          publicKey: 'pk_live_...',\n          secretKey: 'sk_live_...',\n          webhookSecret: 'whsec_...',\n        },\n      },\n    },\n  }),\n});\n\n// Choose billing scope\nawait fetch('/api/v1/admin/applications/{appId}/billing-mode', {\n  method: 'PATCH',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ billingMode: 'perCircleLevel' }), // or 'perAccount'\n});` },
        ]}
        apiEndpoints={`GET    /api/v1/admin/config/billing\nPUT    /api/v1/admin/config/billing\nGET    /api/v1/admin/applications/config?appId={appId}&configType=billing\nPUT    /api/v1/admin/applications/config\nPATCH  /api/v1/admin/applications/{appId}/billing-mode`}
      />
      <DevGuideDrawer
        open={activeDevGuide === 'circles'}
        onClose={() => setActiveDevGuide(null)}
        title="Circles Guide"
        description="Manage hierarchical circles, members, owners, and billing assignees."
        sharedContent={[
          { description: 'Create circles, assign users, and move hierarchy by parent updates:', code: `// Create circle\nawait fetch('/api/v1/admin/applications/{appId}/circles', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    name: 'Engineering',\n    circleType: 'team',\n    parentId: null,\n  }),\n});\n\n// Re-parent (drag/drop equivalent)\nawait fetch('/api/v1/admin/applications/{appId}/circles/{circleId}', {\n  method: 'PATCH',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ parentId: 'parent-circle-uuid' }),\n});\n\n// Assign member/owner/billing\nawait fetch('/api/v1/admin/applications/{appId}/circles/{circleId}/members', { method: 'POST', body: JSON.stringify({ userId }) });\nawait fetch('/api/v1/admin/applications/{appId}/circles/{circleId}/owners', { method: 'POST', body: JSON.stringify({ userId }) });\nawait fetch('/api/v1/admin/applications/{appId}/circles/{circleId}/billing-assignee', { method: 'POST', body: JSON.stringify({ userId }) });` },
        ]}
        apiEndpoints={`GET    /api/v1/admin/applications/{appId}/circles\nPOST   /api/v1/admin/applications/{appId}/circles\nGET    /api/v1/admin/applications/{appId}/circles/{circleId}\nPATCH  /api/v1/admin/applications/{appId}/circles/{circleId}\nDELETE /api/v1/admin/applications/{appId}/circles/{circleId}`}
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
        description="Sandbox endpoints are not implemented yet in this build."
        sharedContent={[
          { description: 'Create test users and simulate auth scenarios:', code: `const testUser = await client.sandbox.createUser({\n  email: 'test@sandbox.example.com',\n  password: 'test123',\n});\n\nawait client.sandbox.simulate('login-success');\nawait client.sandbox.simulate('login-failure');\nawait client.sandbox.simulate('mfa-challenge');\nawait client.sandbox.simulate('account-lockout');\n\nconst logs = await client.sandbox.getLogs();` },
        ]}
        apiEndpoints={`Planned: sandbox endpoints are coming soon`}
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
        description="Configure and consume support/contact links in your app."
        sharedContent={[
          { description: 'Retrieve and render all support links (email, docs, GitHub, GitLab, social, app stores):', code: `const links = await client.getSocialLinks();\n\n// Common keys\n// links.supportEmail\n// links.helpCenter\n// links.githubRepo\n// links.gitlabRepo\n// links.docsUrl\n// links.discord / links.whatsapp / links.line\n// links.facebook / links.instagram / links.twitter / links.linkedin\n\nconst visibleLinks = Object.entries(links).filter(([, v]) => Boolean(v));\n\nreturn visibleLinks.map(([key, url]) => ({\n  key,\n  url,\n  icon: getIconByLinkType(key),\n}));` },
        ]}
        apiEndpoints={`GET  /api/v1/applications/{appId}/branding\nPUT  /api/v1/admin/applications/{appId}/branding`}
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
