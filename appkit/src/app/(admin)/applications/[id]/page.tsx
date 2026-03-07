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
import { ColorPickerPopover, toColorValue } from '@/components/ui/ColorPickerPopover'
import { AISettings } from './components/AISettings'
import { GeneralSettings } from './components/GeneralSettings'
import { CircleManagement } from './components/CircleManagement'
import { EmailTemplateManager } from './components/EmailTemplateManager'
import { SecuritySettings } from './components/SecuritySettings'
import { ComplianceSettings } from './components/ComplianceSettings'
import { SandboxSettings } from './components/SandboxSettings'
import { WebhookSettings } from './components/WebhookSettings'
import { AuditLog } from './components/AuditLog'
import { BroadcastTab } from './components/BroadcastTab'
import { AppBillingPlans } from './components/AppBillingPlans'
import { CommunicationSettings } from './components/CommunicationSettings'
import { BillingSettings } from './components/BillingSettings'
import { CircleDrawers } from './components/CircleDrawers'
import { isValidRedirectUri, isValidPostAuthRedirect } from './components/utils'
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
  UserXIcon,
  BrainCircuitIcon,
} from 'lucide-react'

export interface Application {
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
  ogImageUrl?: string
  bundleId?: string
  deepLinkScheme?: string
  oauthClientId?: string | null
  oauthClientType?: string | null
  oauthClientSecretConfigured?: boolean
  oauthClientSecretLast4?: string | null
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

export interface ApplicationUser {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  isActive?: boolean
  plan: string
  joinedAt: string
  lastActive: string
  avatar?: string
  phone?: string
  role?: string
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  lastTriggered: string
}

export interface AppCircle {
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

export interface AppEmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  htmlContent?: string | null
  textContent?: string | null
  isActive: boolean
  updatedAt: string
}

export interface AppBillingConfig {
  enabled: boolean
  provider: string
  mode: 'test' | 'live'
  currency: string
  providerEnabled?: Record<string, boolean>
  providerConfig?: Record<string, Record<string, string>>
}

export interface AppEnvironment {
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
  development: { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',        dot: 'bg-blue-500',   label: 'Development' },
  custom:      { badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800', dot: 'bg-purple-500', label: 'Custom' },
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
  const [banModal, setBanModal] = useState<{ userId: string; userName: string; type: 'app' | 'all' | 'unban-app' | 'unban-all' } | null>(null)
  const [banning, setBanning] = useState(false)
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
  // Environments
  const [environments, setEnvironments] = useState<AppEnvironment[]>([])
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null)
  const [envsLoading, setEnvsLoading] = useState(false)
  const [showNewEnvModal, setShowNewEnvModal] = useState(false)
  const [newEnvForm, setNewEnvForm] = useState({ name: '', type: 'development', copyFrom: '' })
  const [envCreating, setEnvCreating] = useState(false)
  const [envMsg, setEnvMsg] = useState('')
  const [envApiKeyVisible, setEnvApiKeyVisible] = useState<Record<string, boolean>>({})
  const [envVarDraft, setEnvVarDraft] = useState<Record<string, { key: string; value: string }[]>>({})
  const [envVarSaving, setEnvVarSaving] = useState<string | null>(null)
  // Email templates
  const [emailTemplates, setEmailTemplates] = useState<AppEmailTemplate[]>([])
  const [defaultEmailTemplates, setDefaultEmailTemplates] = useState<AppEmailTemplate[]>([])
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateScope, setSelectedTemplateScope] = useState<'app' | 'default'>('app')
  const [templateEditor, setTemplateEditor] = useState({
    name: '',
    slug: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true,
    variables: [] as any[],
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

  const filteredActivityLog = activityFilter === 'all' ? activityLog : activityLog.filter((l: any) => l.type === activityFilter)

  const circleChildrenMap = useMemo(() => {
    const map = new Map<string, AppCircle[]>()
    circles.forEach((circle: AppCircle) => {
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
    const csv = ['timestamp,type,action,user', ...filteredActivityLog.map((l: any) => `"${l.timestamp}","${l.type}","${l.action.replace(/"/g, '""')}","${l.user}"`)].join('\n')
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

  const loadEnvironments = useCallback(async () => {
    if (!appId) return
    setEnvsLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/environments`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const envs: AppEnvironment[] = data.environments || []
      setEnvironments(envs)
      setActiveEnvId(prev => prev ?? (envs.length > 0 ? envs[0].id : null))
    } catch (e) {
      console.error('Failed to load environments:', e)
    } finally {
      setEnvsLoading(false)
    }
  }, [appId])

  useEffect(() => { loadEnvironments() }, [loadEnvironments])

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
      setApplication((prev: Application | null) => prev ? { ...prev, circleBillingMode: mode } : prev)
    } catch (error: any) {
      setCircleMsg(error?.message || 'Failed to save billing mode')
      setTimeout(() => setCircleMsg(''), 3000)
    } finally {
      setCircleBillingModeSaving(false)
    }
  }

  const toggleCircleExpanded = (circleId: string) => {
    setExpandedCircleIds((prev: string[]) => prev.includes(circleId) ? prev.filter((id: string) => id !== circleId) : [...prev, circleId])
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
          variables: (first as any).variables || [],
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
      variables: (template as any).variables || [],
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
      variables: (template as any).variables || [],
    })
  }

  const saveTemplate = async () => {
    try {
      if (!templateEditor.name || !templateEditor.slug || !templateEditor.subject) {
        setTemplateMsg('Name, slug, and subject are required')
        return
      }

      setTemplateMsg('Saving...')
      const isNew = !selectedTemplateId
      const isOverride = selectedTemplateScope === 'default'

      const method = isNew || isOverride ? 'POST' : 'PATCH'
      const url = isNew || isOverride
        ? `/api/v1/admin/applications/${appId}/email-templates`
        : `/api/v1/admin/applications/${appId}/email-templates/${selectedTemplateId}`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateEditor,
          variables: templateEditor.variables || [],
        }),
      })

      if (!res.ok) throw new Error('Failed to save template')
      const data = await res.json()

      await loadEmailTemplates()

      if (isOverride) {
        setSelectedTemplateScope('app')
        setSelectedTemplateId(data.template.id)
      }

      setTemplateMsg('Saved!')
      setTimeout(() => setTemplateMsg(''), 3000)
    } catch (error: any) {
      console.error(error)
      setTemplateMsg(error?.message || 'Failed to save template')
      setTimeout(() => setTemplateMsg(''), 3000)
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      if (selectedTemplateScope === 'default') return
      setTemplateMsg('Reverting...')
      const url = `/api/v1/admin/applications/${appId}/email-templates/${id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revert template')

      await loadEmailTemplates()
      setSelectedTemplateId(null)
      setTemplateEditor({ name: '', slug: '', subject: '', htmlContent: '', textContent: '', isActive: true, variables: [] })
      setTemplateMsg('Reverted to default')
      setTimeout(() => setTemplateMsg(''), 3000)
    } catch (error: any) {
      console.error(error)
      setTemplateMsg(error?.message || 'Failed to revert')
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
      setApplication((prev: Application | null) => prev ? { ...prev, faviconUrl: data?.url || prev.faviconUrl } : prev)
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
      setApplication((prev: Application | null) => prev ? { ...prev, logoUrl: data.url } : prev)
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

    setApplication((prev: Application | null) => prev ? { ...prev, oauthRedirectUris: [...current, candidate] } : prev)
    setNewRedirectUri('')
  }

  const handleRemoveRedirectUri = (uri: string) => {
    if (!application) return
    setApplication((prev: Application | null) => prev ? { ...prev, oauthRedirectUris: (prev.oauthRedirectUris || []).filter((item: string) => item !== uri) } : prev)
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
    setApplication((prev: Application | null) => prev ? { ...prev, oauthRedirectUris: current } : prev)
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
    setApplication((prev: Application | null) => prev ? { ...prev, oauthRedirectUris: current } : prev)
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
          brandingConfig: appBranding,
          faviconUrl: application.faviconUrl || '',
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

  const handleSaveSeo = async () => {
    if (!application) return
    try {
      setGeneralSaving(true)
      const res = await fetch(`/api/v1/admin/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaTitle: application.metaTitle || '',
          metaDescription: application.metaDescription || '',
          ogImageUrl: application.ogImageUrl || '',
          gaTrackingId: application.gaTrackingId || '',
          appUrl: application.appUrl || '',
          brandingConfig: appBranding,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      if (data?.application) {
        setApplication(data.application)
        if (data.application.brandingConfig) setAppBranding(data.application.brandingConfig)
      }
      setGeneralMsg('Saved!')
      setTimeout(() => setGeneralMsg(''), 3000)
    } catch (error: any) {
      setGeneralMsg(error?.message || 'Failed')
      setTimeout(() => setGeneralMsg(''), 3000)
    } finally {
      setGeneralSaving(false)
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
      setAuthProviders((prev: any[]) => prev.map((p: any) => p.providerName === providerName ? { ...p, isEnabled: currentlyEnabled } : p))
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
      setCommConfig((prev: any) => prev ? ({
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

  const filteredUsers = users.filter((u: ApplicationUser) =>
    (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  const executeBanAction = async () => {
    if (!banModal) return
    setBanning(true)
    try {
      const { userId, type } = banModal
      if (type === 'app') {
        await fetch(`/api/v1/admin/applications/${appId}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'banned' }),
        })
        setUsers((prev: ApplicationUser[]) => prev.map((u: ApplicationUser) => u.id === userId ? { ...u, status: 'banned' as const } : u))
      } else if (type === 'all') {
        await fetch(`/api/v1/admin/applications/${appId}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false }),
        })
        setUsers((prev: ApplicationUser[]) => prev.map((u: ApplicationUser) => u.id === userId ? { ...u, isActive: false, status: 'banned' as const } : u))
      } else if (type === 'unban-app') {
        await fetch(`/api/v1/admin/applications/${appId}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        })
        setUsers((prev: ApplicationUser[]) => prev.map((u: ApplicationUser) => u.id === userId ? { ...u, status: 'active' as const } : u))
      } else if (type === 'unban-all') {
        await fetch(`/api/v1/admin/applications/${appId}/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        })
        setUsers((prev: ApplicationUser[]) => prev.map((u: ApplicationUser) => u.id === userId ? { ...u, isActive: true, status: 'active' as const } : u))
      }
      setBanModal(null)
    } catch (err) {
      console.error('Ban action failed:', err)
    } finally {
      setBanning(false)
    }
  }

  const circleUserOptions = users.filter((u: ApplicationUser) => {
    const q = circleUserSearch.trim().toLowerCase()
    if (!q) return true
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const circleBillingUserOptions = users.filter((u: ApplicationUser) => {
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
        { value: 'environments', icon: <ServerIcon className="w-4 h-4" />, label: 'Environments' },
        { value: 'ai-config', icon: <BrainCircuitIcon className="w-4 h-4" />, label: 'AI Configuration' },
      ],
    },
    {
      title: 'App Experience',
      items: [
        { value: 'branding', icon: <PaintbrushIcon className="w-4 h-4" />, label: 'Identity & Brand' },
        { value: 'seo', icon: <SearchIcon className="w-4 h-4" />, label: 'SEO & Metadata' },
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
        { value: 'broadcast', icon: <MegaphoneIcon className="w-4 h-4" />, label: 'Broadcast' },
        { value: 'email-templates', icon: <MailIcon className="w-4 h-4" />, label: 'Email Templates' },
        { value: 'webhooks', icon: <WebhookIcon className="w-4 h-4" />, label: 'Webhooks' },
        { value: 'legal', icon: <ScaleIcon className="w-4 h-4" />, label: 'Legal & Compliance' },
        { value: 'activity', icon: <ActivityIcon className="w-4 h-4" />, label: 'Activity Log' },
      ],
    },
  ]

  const renderCircleRows = (items: AppCircle[], depth = 0): React.ReactNode[] =>
    items.flatMap((circle: AppCircle) => {
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
          onDragOver={(e: any) => e.preventDefault()}
          onDrop={(e: any) => {
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
      </div>

      {/* Vertical Sidebar + Content Layout */}
      <div className="flex gap-6">
        {/* Vertical Sidebar */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-4 rounded-xl p-3 space-y-4">
            {sidebarSections.map((section: any) => (
              <div key={section.title}>
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1.5">{section.title}</h4>
                <div className="space-y-0.5">
                  {section.items.map((item: any) => (
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

        {/* ==================== TAB: AI Configuration ==================== */}
        <TabsContent value="ai-config" className="space-y-4">
          <AISettings
            appId={appId}
            application={application}
            setApplication={setApplication}
            saving={generalSaving}
            message={generalMsg}
            onSave={handleSaveGeneral}
          />
        </TabsContent>

        {/* ==================== TAB: General Settings ==================== */}
        <TabsContent value="general" className="space-y-4">
          <GeneralSettings
            appId={appId}
            application={application}
            setApplication={setApplication}
            appBranding={appBranding}
            setAppBranding={setAppBranding}
            generalSaving={generalSaving}
            generalMsg={generalMsg}
            onSave={handleSaveGeneral}
            logoUploading={logoUploading}
            onLogoUpload={handleGeneralLogoUpload}
            logoFileInputRef={logoFileInputRef}
            faviconFileInputRef={faviconFileInputRef}
            onFaviconUpload={handleFaviconUpload}
            newRedirectUri={newRedirectUri}
            setNewRedirectUri={setNewRedirectUri}
            onAddRedirectUri={handleAddRedirectUri}
            onRemoveRedirectUri={handleRemoveRedirectUri}
            onMoveRedirectUri={handleMoveRedirectUri}
            onRedirectUriDragStart={handleRedirectUriDragStart}
            onRedirectUriDragOver={handleRedirectUriDragOver}
            onRedirectUriDrop={handleRedirectUriDrop}
            onRedirectUriDragEnd={handleRedirectUriDragEnd}
            dragOverRedirectUri={dragOverRedirectUri}
            onCopy={handleCopy}
            copiedId={copiedId}
            canonicalRedirectUri={canonicalRedirectUri}
            generatedClientId={generatedClientId}
            generatedClientSecret={generatedClientSecret}
            showGeneratedClientSecret={showGeneratedClientSecret}
            setShowGeneratedClientSecret={setShowGeneratedClientSecret}
            generateClientIdOnSave={generateClientIdOnSave}
            setGenerateClientIdOnSave={setGenerateClientIdOnSave}
            setShowRotateSecretConfirm={setShowRotateSecretConfirm}
            apiKeyVisible={apiKeyVisible}
            setApiKeyVisible={setApiKeyVisible}
            setActiveDevGuide={setActiveDevGuide}
          />
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Last Active</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                  {filteredUsers.map((user: ApplicationUser) => {
                    const isBannedGlobally = user.isActive === false
                    const isBannedApp = user.status === 'banned'
                    const isBannedAny = isBannedGlobally || isBannedApp
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50/80 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer ${isBannedAny ? 'opacity-60' : ''}`}
                        onClick={() => handleUserClick(user.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isBannedAny ? 'bg-gray-400 dark:bg-zinc-600' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
                          {isBannedGlobally ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 uppercase">
                              <UserXIcon className="w-3 h-3" />Banned (All Apps)
                            </span>
                          ) : isBannedApp ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 uppercase">
                              <UserXIcon className="w-3 h-3" />Banned (App)
                            </span>
                          ) : user.status === 'suspended' ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase">Suspended</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">{new Date(user.lastActive).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e: any) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserClick(user.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                            >
                              View
                            </Button>
                            {isBannedApp ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBanModal({ userId: user.id, userName: user.name, type: 'unban-app' })}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              >
                                Unban App
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBanModal({ userId: user.id, userName: user.name, type: 'app' })}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                              >
                                Ban App
                              </Button>
                            )}
                            {isBannedGlobally ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBanModal({ userId: user.id, userName: user.name, type: 'unban-all' })}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              >
                                Unban All
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBanModal({ userId: user.id, userName: user.name, type: 'all' })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                Ban All
                              </Button>
                            )}
                          </div>
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
          <CircleManagement
            circles={circles}
            circlesLoading={circlesLoading}
            circleMsg={circleMsg}
            draggingCircleId={draggingCircleId}
            onDragStart={setDraggingCircleId}
            onReparent={reparentCircle}
            onOpenCreateDrawer={() => setCreateCircleDrawerOpen(true)}
            circleBillingMode={application.circleBillingMode}
            onSaveBillingMode={saveCircleBillingMode}
            billingModeSaving={circleBillingModeSaving}
            onRefresh={loadCircles}
            onOpenDetail={openCircleDetail}
            setActiveDevGuide={setActiveDevGuide}
          />
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
          <SecuritySettings
            securityConfig={securityConfig}
            setSecurityConfig={setSecurityConfig}
            securitySaving={securitySaving}
            securityMsg={securityMsg}
            onSaveSecurity={handleSaveSecurity}
            identityConfig={identityConfig}
            setIdentityConfig={setIdentityConfig}
            identitySaving={identitySaving}
            identityMsg={identityMsg}
            onSaveIdentity={handleSaveIdentity}
            setActiveDevGuide={setActiveDevGuide}
            renderMode="identity"
          />
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
              {authProviders.map((provider: any) => {
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
          <SecuritySettings
            securityConfig={securityConfig}
            setSecurityConfig={setSecurityConfig}
            securitySaving={securitySaving}
            securityMsg={securityMsg}
            onSaveSecurity={handleSaveSecurity}
            identityConfig={identityConfig}
            setIdentityConfig={setIdentityConfig}
            identitySaving={identitySaving}
            identityMsg={identityMsg}
            onSaveIdentity={handleSaveIdentity}
            setActiveDevGuide={setActiveDevGuide}
            renderMode="security"
          />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          {renderTabHeader('Communication', 'communication')}
          <CommunicationSettings
            commConfig={commConfig}
            onOpenCommDrawer={(channel) => {
              setSelectedCommChannel(channel)
              setIsCommDrawerOpen(true)
            }}
            onToggleCommChannel={handleToggleCommChannel}
          />
        </TabsContent>

        {/* ==================== TAB: Broadcast ==================== */}
        <TabsContent value="broadcast" className="space-y-4">
          {renderTabHeader('Broadcast', 'broadcast')}
          <BroadcastTab appId={appId} />
        </TabsContent>

        {/* ==================== TAB: Billing ==================== */}
        <TabsContent value="billing" className="space-y-4">
          {renderTabHeader('Billing & Subscriptions', 'billing')}
          <BillingSettings
            circleBillingMode={application?.circleBillingMode || 'perAccount'}
            onSaveCircleBillingMode={saveCircleBillingMode}
            circleBillingModeSaving={circleBillingModeSaving}
            billingConfig={billingConfig}
            onOpenBillingDrawer={(provider) => {
              setSelectedBillingProvider(provider)
              setIsBillingDrawerOpen(true)
            }}
            billingProviders={BILLING_PROVIDERS}
          />

          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
            <AppBillingPlans appId={appId} appName={application?.name ?? ''} />
          </div>
        </TabsContent>

        {/* ==================== TAB: Email Templates ==================== */}
        <TabsContent value="email-templates" className="space-y-4">
          <EmailTemplateManager
            emailTemplates={emailTemplates}
            defaultEmailTemplates={defaultEmailTemplates}
            emailTemplatesLoading={emailTemplatesLoading}
            selectedTemplateId={selectedTemplateId}
            selectedTemplateScope={selectedTemplateScope}
            templateEditor={templateEditor}
            setTemplateEditor={setTemplateEditor}
            templateMsg={templateMsg}
            onSelectTemplate={selectTemplate}
            onSelectDefaultTemplate={selectDefaultTemplate}
            onSaveTemplate={saveTemplate}
            onDeleteTemplate={deleteTemplate}
            appId={appId}
            onRefresh={loadEmailTemplates}
            setActiveDevGuide={setActiveDevGuide}
            onAddTemplate={() => {
              setSelectedTemplateScope('app')
              setSelectedTemplateId(null)
              setTemplateEditor({ name: '', slug: '', subject: '', htmlContent: '', textContent: '', isActive: true, variables: [] })
            }}
          />
        </TabsContent>

        {/* ==================== TAB: Webhooks ==================== */}
        <TabsContent value="webhooks" className="space-y-4">
          {renderTabHeader('Webhooks', 'webhooks')}
          <WebhookSettings
            webhooks={webhooks}
            webhookMsg={webhookMsg}
            showAddWebhook={showAddWebhook}
            setShowAddWebhook={setShowAddWebhook}
            newWebhookUrl={newWebhookUrl}
            setNewWebhookUrl={setNewWebhookUrl}
            newWebhookEvents={newWebhookEvents}
            setNewWebhookEvents={setNewWebhookEvents}
            onAddWebhook={handleAddWebhook}
            editingWebhookId={editingWebhookId}
            editingWebhookUrl={editingWebhookUrl}
            setEditingWebhookUrl={setEditingWebhookUrl}
            editingWebhookEvents={editingWebhookEvents}
            setEditingWebhookEvents={setEditingWebhookEvents}
            editingWebhookStatus={editingWebhookStatus}
            setEditingWebhookStatus={setEditingWebhookStatus}
            onStartWebhookEdit={handleStartWebhookEdit}
            onCancelWebhookEdit={handleCancelWebhookEdit}
            onSaveWebhookEdit={handleSaveWebhookEdit}
            onDeleteWebhook={handleDeleteWebhook}
            webhookEvents={WEBHOOK_EVENTS}
          />
        </TabsContent>

        {/* ==================== TAB: Activity Log ==================== */}
        <TabsContent value="activity" className="space-y-4">
          {renderTabHeader('Activity', 'activity')}
          <AuditLog
            activityLoading={activityLoading}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            filteredActivityLog={filteredActivityLog}
            activityLog={activityLog}
            onExportActivity={handleExportActivity}
            onRefreshActivity={loadActivityLog}
          />
        </TabsContent>

        {/* ==================== TAB 7: Legal & Compliance ==================== */}
        <TabsContent value="legal" className="space-y-4">
          {renderTabHeader('Legal & Compliance', 'legal')}
          <ComplianceSettings
            legalConfig={legalConfig}
            legalUseDefault={legalUseDefault}
            onOpenLegalDrawer={() => setIsLegalDrawerOpen(true)}
          />
        </TabsContent>

        {/* ==================== TAB: Login Sandbox ==================== */}
        <TabsContent value="sandbox" className="space-y-4">
          {renderTabHeader('Sandbox', 'sandbox')}
          <SandboxSettings
            applicationName={application.name}
            sandboxMode={sandboxMode}
            setSandboxMode={setSandboxMode}
            sandboxResult={sandboxResult}
            setSandboxResult={setSandboxResult}
            sandboxRunning={sandboxRunning}
            onSimulate={handleSandboxSimulate}
            canonicalRedirectUri={canonicalRedirectUri}
          />
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

          {/* Favicon & Brand Colors */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Favicon</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Browser tab icon shown in web browsers and bookmarks.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {application.faviconUrl ? (
                  <img src={application.faviconUrl} alt="Favicon" className="w-12 h-12 rounded-xl border border-gray-200 dark:border-zinc-700 object-contain bg-white dark:bg-zinc-800 p-1.5" />
                ) : (
                  <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-300 dark:text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={application.faviconUrl || ''}
                  onChange={e => setApplication((prev: Application | null) => prev ? { ...prev, faviconUrl: e.target.value } : prev)}
                  placeholder="https://your-app.com/favicon.ico"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => faviconFileInputRef.current?.click()}>Upload Icon</Button>
                  {application.faviconUrl && (
                    <button type="button" onClick={() => setApplication((prev: Application | null) => prev ? { ...prev, faviconUrl: '' } : prev)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
                  )}
                  <input ref={faviconFileInputRef} type="file" accept="image/*" title="Upload favicon" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFaviconUpload(f); e.currentTarget.value = '' }} />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">Recommended: 32×32px or 64×64px .ico or .png file</p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Brand Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <ColorPickerPopover
                  label="Primary Color"
                  value={toColorValue(appBranding?.primaryColor as any || '#3b82f6')}
                  onChange={(v: any) => setAppBranding((prev: any) => prev ? { ...prev, primaryColor: v } : prev)}
                />
                <ColorPickerPopover
                  label="Secondary Color"
                  value={toColorValue(appBranding?.secondaryColor as any || '#6366f1')}
                  onChange={(v: any) => setAppBranding((prev: any) => prev ? { ...prev, secondaryColor: v } : prev)}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Typography</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Primary Font</label>
                  <select
                    title="Primary font"
                    value={appBranding?.primaryFont || 'Inter'}
                    onChange={e => setAppBranding((prev: any) => prev ? { ...prev, primaryFont: e.target.value } : prev)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {['Inter', 'Roboto', 'Poppins', 'Nunito', 'Lato', 'Open Sans', 'Montserrat', 'DM Sans', 'Plus Jakarta Sans', 'Geist'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Secondary Font</label>
                  <select
                    title="Secondary font"
                    value={appBranding?.secondaryFont || 'Inter'}
                    onChange={e => setAppBranding((prev: any) => prev ? { ...prev, secondaryFont: e.target.value } : prev)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {['Inter', 'Roboto', 'Poppins', 'Nunito', 'Lato', 'Open Sans', 'Montserrat', 'DM Sans', 'Plus Jakarta Sans', 'Geist'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <BrandingSettings branding={appBranding} setBranding={setAppBranding} handleBrandingUpload={handleBrandingUpload} uploading={brandingUploading} />
        </TabsContent>

        {/* ==================== TAB: SEO & Metadata ==================== */}
        <TabsContent value="seo" className="space-y-4">
          {renderTabHeader(
            'SEO & Metadata',
            'seo',
            <>
              {generalMsg && <span className={`text-xs font-medium ${generalMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{generalMsg}</span>}
              <Button onClick={handleSaveSeo} disabled={generalSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                {generalSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
                Save
              </Button>
            </>
          )}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Page Metadata</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Controls how your app appears in search engines and browser tabs.</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Meta Title</label>
                  <span className={`text-[10px] ${(application.metaTitle || '').length > 60 ? 'text-amber-500' : 'text-gray-400'}`}>{(application.metaTitle || '').length}/60</span>
                </div>
                <input type="text" value={application.metaTitle || ''} onChange={e => setApplication((prev: Application | null) => prev ? { ...prev, metaTitle: e.target.value } : prev)} placeholder="Your App — Tagline" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Meta Description</label>
                  <span className={`text-[10px] ${(application.metaDescription || '').length > 160 ? 'text-amber-500' : 'text-gray-400'}`}>{(application.metaDescription || '').length}/160</span>
                </div>
                <textarea value={application.metaDescription || ''} onChange={e => setApplication((prev: Application | null) => prev ? { ...prev, metaDescription: e.target.value } : prev)} placeholder="A short description for search engines" rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Canonical URL</label>
                  <input type="url" value={application.appUrl || ''} onChange={e => setApplication((prev: Application | null) => prev ? { ...prev, appUrl: e.target.value } : prev)} placeholder="https://your-app.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Keywords</label>
                  <input type="text" value={(appBranding?.seo?.keywords || []).join(', ')} onChange={e => setAppBranding((prev: any) => prev ? { ...prev, seo: { ...(prev.seo || {}), keywords: e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean) } } as any : prev)} placeholder="saas, productivity, team" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Social Sharing (Open Graph)</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Controls preview cards when your link is shared on social platforms.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">OG Image URL</label>
                <input type="url" value={application.ogImageUrl || ''} onChange={e => setApplication((prev: Application | null) => prev ? { ...prev, ogImageUrl: e.target.value } : prev)} placeholder="https://your-app.com/og-image.png" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <p className="mt-1 text-[10px] text-gray-400">Recommended: 1200×630px. Used by Twitter, Facebook, LinkedIn when sharing your link.</p>
                {application.ogImageUrl && (
                  <img src={application.ogImageUrl} alt="OG preview" className="mt-2 rounded-lg border border-gray-200 dark:border-zinc-700 max-h-32 object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Twitter / X Handle</label>
                  <input type="text" value={appBranding?.seo?.twitterHandle || ''} onChange={e => setAppBranding((prev: any) => prev ? { ...prev, seo: { ...(prev.seo || {}), twitterHandle: e.target.value } } as any : prev)} placeholder="@yourapp" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Apple App Site ID</label>
                  <input type="text" value={appBranding?.seo?.appleAppId || ''} onChange={e => setAppBranding((prev: any) => prev ? { ...prev, seo: { ...(prev.seo || {}), appleAppId: e.target.value } } as any : prev)} placeholder="123456789" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Analytics</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Tracking and measurement integrations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">{application.platform === 'web' ? 'Google Analytics ID' : 'Firebase Analytics ID'}</label>
                <input type="text" value={application.gaTrackingId || ''} onChange={e => setApplication((prev: Application | null) => prev ? { ...prev, gaTrackingId: e.target.value } : prev)} placeholder={application.platform === 'web' ? 'G-XXXXXXXXXX' : 'firebase-project-id'} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Mixpanel Token</label>
                <input type="text" value={appBranding?.analytics?.mixpanelToken || ''} onChange={e => setAppBranding((prev: any) => prev ? { ...prev, analytics: { ...(prev.analytics || {}), mixpanelToken: e.target.value } } as any : prev)} placeholder="your-mixpanel-token" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Sentry DSN</label>
                <input type="text" value={appBranding?.analytics?.sentryDsn || ''} onChange={e => setAppBranding((prev: any) => prev ? { ...prev, analytics: { ...(prev.analytics || {}), sentryDsn: e.target.value } } as any : prev)} placeholder="https://...@sentry.io/..." className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>
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

        {/* ==================== TAB: Environments ==================== */}
        <TabsContent value="environments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Environments</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage deployment environments and per-environment API keys</p>
            </div>
            <button
              onClick={() => setShowNewEnvModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" /> New Environment
            </button>
          </div>

          {envsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : environments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 p-10 text-center">
              <ServerIcon className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No environments yet</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Create your first environment to get an API key</p>
              <button
                onClick={() => setShowNewEnvModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" /> New Environment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Environment selector pills */}
              <div className="flex flex-wrap gap-2">
                {environments.map(env => {
                  const style = ENV_TYPE_STYLES[env.type] || ENV_TYPE_STYLES.custom
                  return (
                    <button
                      key={env.id}
                      onClick={() => setActiveEnvId(env.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        activeEnvId === env.id
                          ? style.badge + ' ring-2 ring-offset-1 ring-blue-400 dark:ring-offset-zinc-900'
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      {env.name}
                    </button>
                  )
                })}
              </div>

              {/* Active environment detail */}
              {(() => {
                const env = environments.find(e => e.id === activeEnvId)
                if (!env) return null
                const style = ENV_TYPE_STYLES[env.type] || ENV_TYPE_STYLES.custom
                const vars = envVarDraft[env.id] ?? env.variables
                return (
                  <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{env.name}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${style.badge}`}>{style.label}</span>
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500">Created {new Date(env.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete environment "${env.name}"? This cannot be undone.`)) return
                          const res = await fetch(`/api/v1/admin/applications/${appId}/environments/${env.id}`, { method: 'DELETE' })
                          if (res.ok) {
                            const remaining = environments.filter(e => e.id !== env.id)
                            setActiveEnvId(remaining[0]?.id ?? null)
                            await loadEnvironments()
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete environment"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* API Key */}
                    <div className="p-4 space-y-2">
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">API Key</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-700 dark:text-zinc-300 truncate">
                          {envApiKeyVisible[env.id] ? env.apiKey : `${env.apiKey.slice(0, 10)}${'•'.repeat(24)}`}
                        </code>
                        <button
                          onClick={() => setEnvApiKeyVisible(v => ({ ...v, [env.id]: !v[env.id] }))}
                          className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500"
                          title={envApiKeyVisible[env.id] ? 'Hide' : 'Show'}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(env.apiKey); setCopiedId(`apikey-${env.id}`); setTimeout(() => setCopiedId(null), 1500) }}
                          className="p-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500"
                          title="Copy API key"
                        >
                          {copiedId === `apikey-${env.id}` ? <CheckCircle2Icon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Variables */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Environment Variables</p>
                        <button
                          onClick={() => setEnvVarDraft(d => ({ ...d, [env.id]: [...(d[env.id] ?? env.variables), { key: '', value: '' }] }))}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        >
                          <PlusIcon className="w-3 h-3" /> Add Variable
                        </button>
                      </div>
                      {vars.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-zinc-500 italic">No variables defined</p>
                      ) : (
                        <div className="space-y-2">
                          {vars.map((v: { key: string; value: string }, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                value={v.key}
                                onChange={e => {
                                  const next = [...vars]; next[idx] = { ...next[idx], key: e.target.value }
                                  setEnvVarDraft(d => ({ ...d, [env.id]: next }))
                                }}
                                placeholder="KEY"
                                className="w-36 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-gray-400">=</span>
                              <input
                                value={v.value}
                                onChange={e => {
                                  const next = [...vars]; next[idx] = { ...next[idx], value: e.target.value }
                                  setEnvVarDraft(d => ({ ...d, [env.id]: next }))
                                }}
                                placeholder="value"
                                className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => {
                                  const next = vars.filter((_: any, i: number) => i !== idx)
                                  setEnvVarDraft(d => ({ ...d, [env.id]: next }))
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {envVarDraft[env.id] !== undefined && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={envVarSaving === env.id}
                            onClick={async () => {
                              setEnvVarSaving(env.id)
                              try {
                                const res = await fetch(`/api/v1/admin/applications/${appId}/environments/${env.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ variables: envVarDraft[env.id] }),
                                })
                                if (res.ok) {
                                  await loadEnvironments()
                                  setEnvVarDraft(d => { const next = { ...d }; delete next[env.id]; return next })
                                }
                              } finally { setEnvVarSaving(null) }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            {envVarSaving === env.id ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
                            Save Variables
                          </button>
                          <button
                            onClick={() => setEnvVarDraft(d => { const next = { ...d }; delete next[env.id]; return next })}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                          >
                            Discard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </TabsContent>

        </Tabs>
        </main>
      </div>

      {/* New Environment Modal */}
      {showNewEnvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Environment</h3>
              <button onClick={() => { setShowNewEnvModal(false); setEnvMsg('') }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Name</label>
                <input
                  value={newEnvForm.name}
                  onChange={e => setNewEnvForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Production EU"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Type</label>
                <select
                  value={newEnvForm.type}
                  onChange={e => setNewEnvForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {environments.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Copy variables from (optional)</label>
                  <select
                    value={newEnvForm.copyFrom}
                    onChange={e => setNewEnvForm(f => ({ ...f, copyFrom: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— None —</option>
                    {environments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {envMsg && <p className="text-xs text-red-500">{envMsg}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => { setShowNewEnvModal(false); setEnvMsg(''); setNewEnvForm({ name: '', type: 'development', copyFrom: '' }) }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                disabled={envCreating || !newEnvForm.name.trim()}
                onClick={async () => {
                  setEnvCreating(true)
                  setEnvMsg('')
                  try {
                    const res = await fetch(`/api/v1/admin/applications/${appId}/environments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newEnvForm.name.trim(), type: newEnvForm.type, copyFrom: newEnvForm.copyFrom || undefined }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed')
                    setShowNewEnvModal(false)
                    setNewEnvForm({ name: '', type: 'development', copyFrom: '' })
                    await loadEnvironments()
                    setActiveEnvId(data.environment.id)
                  } catch (e: any) {
                    setEnvMsg(e.message || 'Failed to create environment')
                  } finally {
                    setEnvCreating(false)
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {envCreating ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <PlusIcon className="w-3.5 h-3.5" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Circle Drawers (Create & Detail) */}
      <CircleDrawers
        appId={appId}
        circles={circles}
        users={users}
        createCircleDrawerOpen={createCircleDrawerOpen}
        setCreateCircleDrawerOpen={setCreateCircleDrawerOpen}
        newCircleName={newCircleName}
        setNewCircleName={setNewCircleName}
        newCircleType={newCircleType}
        setNewCircleType={setNewCircleType}
        newCircleParentId={newCircleParentId}
        setNewCircleParentId={setNewCircleParentId}
        newCircleDescription={newCircleDescription}
        setNewCircleDescription={setNewCircleDescription}
        newCirclePinCode={newCirclePinCode}
        setNewCirclePinCode={setNewCirclePinCode}
        newCircleCode={newCircleCode}
        setNewCircleCode={setNewCircleCode}
        onCreateCircle={createCircle}
        circleDrawerOpen={circleDrawerOpen}
        setCircleDrawerOpen={setCircleDrawerOpen}
        selectedCircle={selectedCircle}
        circleDrawerLoading={circleDrawerLoading}
        circleDetailTab={circleDetailTab}
        setCircleDetailTab={setCircleDetailTab}
        circleDetailDraft={circleDetailDraft}
        setCircleDetailDraft={setCircleDetailDraft}
        circleUserSearch={circleUserSearch}
        setCircleUserSearch={setCircleUserSearch}
        circleUserOptions={circleUserOptions}
        circleSelectedUserId={circleSelectedUserId}
        setCircleSelectedUserId={setCircleSelectedUserId}
        circleSelectedRole={circleSelectedRole}
        setCircleSelectedRole={setCircleSelectedRole}
        onAssignCircleUser={assignSelectedCircleUser}
        onSwitchCircleUserRole={switchCircleUserRole}
        onRemoveCircleMember={removeCircleMember}
        onRemoveCircleOwner={removeCircleOwner}
        circleBillingUserSearch={circleBillingUserSearch}
        setCircleBillingUserSearch={setCircleBillingUserSearch}
        circleBillingUserOptions={circleBillingUserOptions}
        circleSelectedBillingUserId={circleSelectedBillingUserId}
        setCircleSelectedBillingUserId={setCircleSelectedBillingUserId}
        onAssignCircleBilling={assignCircleBilling}
        onRemoveCircleBillingAssignee={removeCircleBillingAssignee}
        circleBillingMode={application.circleBillingMode || 'perAccount'}
        onDeleteCircle={async (id) => {
          const res = await fetch(`/api/v1/admin/applications/${appId}/circles/${id}`, { method: 'DELETE' })
          if (res.ok) {
            setCircleDrawerOpen(false)
            setSelectedCircleId(null)
            setSelectedCircle(null)
            await loadCircles()
          }
        }}
        onSaveCircleDetail={saveCircleDetail}
      />

      {/* Ban Confirmation Modal */}
      {banModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => !banning && setBanModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800/80 w-full max-w-sm p-6 space-y-4 pointer-events-auto">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${banModal.type.startsWith('unban') ? 'bg-emerald-100 dark:bg-emerald-500/20' : banModal.type === 'all' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-orange-100 dark:bg-orange-500/20'}`}>
                  <UserXIcon className={`w-5 h-5 ${banModal.type.startsWith('unban') ? 'text-emerald-600' : banModal.type === 'all' ? 'text-red-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {banModal.type === 'app' && 'Ban from This Application'}
                    {banModal.type === 'all' && 'Ban from All Applications'}
                    {banModal.type === 'unban-app' && 'Unban from This Application'}
                    {banModal.type === 'unban-all' && 'Restore All Applications Access'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    {banModal.type === 'app' && <><span className="font-medium text-gray-700 dark:text-zinc-200">{banModal.userName}</span> will be banned from this application only and cannot log in to it.</>}
                    {banModal.type === 'all' && <><span className="font-medium text-gray-700 dark:text-zinc-200">{banModal.userName}</span>&apos;s account will be globally deactivated across all applications.</>}
                    {banModal.type === 'unban-app' && <><span className="font-medium text-gray-700 dark:text-zinc-200">{banModal.userName}</span>&apos;s access to this application will be restored.</>}
                    {banModal.type === 'unban-all' && <><span className="font-medium text-gray-700 dark:text-zinc-200">{banModal.userName}</span>&apos;s account will be reactivated across all applications.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBanModal(null)} disabled={banning}>Cancel</Button>
                <Button
                  onClick={executeBanAction}
                  disabled={banning}
                  className={banModal.type.startsWith('unban') ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : banModal.type === 'all' ? 'bg-red-600 hover:bg-red-700 text-white border-0' : 'bg-orange-500 hover:bg-orange-600 text-white border-0'}
                >
                  {banning ? <Loader2Icon className="w-4 h-4 animate-spin" /> : (banModal.type.startsWith('unban') ? 'Confirm Unban' : 'Confirm Ban')}
                </Button>
              </div>
            </div>
          </div>
        </>
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
                  onChange={e => setAddUserForm((p: any) => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Full Name</label>
                <input
                  type="text"
                  value={addUserForm.name}
                  onChange={e => setAddUserForm((p: any) => ({ ...p, name: e.target.value }))}
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
                    onChange={e => setAddUserForm((p: any) => ({ ...p, role: e.target.value }))}
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
                    onChange={e => setAddUserForm((p: any) => ({ ...p, plan: e.target.value }))}
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
          { description: 'Retrieve and render all support links (email, docs, GitHub, GitLab, social, app stores):', code: `const links = await client.getSocialLinks();\n\n// Common keys\n// links.supportEmail\n// links.helpCenter\n// links.githubRepo\n// links.gitlabRepo\n// links.docsUrl\n// links.discord / links.whatsapp / links.line\n// links.facebook / links.instagram / links.twitter / links.linkedin\n\nconst visibleLinks = Object.entries(links).filter(([, v]: [string, any]) => Boolean(v));\n\nreturn visibleLinks.map(([key, url]: [string, any]) => ({\n  key,\n  url,\n  icon: getIconByLinkType(key),\n}));` },
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
