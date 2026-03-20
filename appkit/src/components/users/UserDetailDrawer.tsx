'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  CreditCardIcon,
  FileTextIcon,
  ShieldCheckIcon,
  CogIcon,
  XIcon,
  CheckIcon,
  MessageSquareIcon,
  BellIcon,
  UploadIcon,
  ServerIcon,
  ExternalLinkIcon,
  Paperclip,
  Send,
  Plus,
  RefreshCw,
  LockIcon,
  ShieldIcon,
  GlobeIcon,
  CameraIcon,
  BriefcaseIcon,
  MapPinIcon,
  HashIcon,
  PinIcon
} from 'lucide-react'
import { adminService } from '@/services/adminService'

interface UserDetail {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' | 'suspended'
  plan: string
  joinedAt: string
  lastActive: string
  avatar?: string
  phone?: string
  address?: string
  company?: string
  role?: string
  points?: number
  appPoints?: number
  coins?: number
  loginMethods?: string[]
  jobTitle?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
}

interface SubscriptionInfo {
  id: string
  appId?: string
  appName: string
  plan: string
  planName: string
  status: 'active' | 'cancelled' | 'past_due' | 'inactive' | string
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate?: string
  amount: number
  currency: string
  paymentMethod: {
    type: 'card' | 'paypal' | 'bank'
    last4?: string
    brand?: string
    expiry?: string
  }
  usage: {
    users: number
    storage: number
    bandwidth: number
    apiCalls: number
  }
  limits: {
    users: number
    storage: number
    bandwidth: number
    apiCalls: number
  }
}

interface UserDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  applicationId: string
}

interface UserActivityEvent {
  id: string
  type: string
  message: string
  timestamp: string
  source: string
  metadata?: Record<string, unknown>
}

interface UserComment {
  id: string
  content: string
  tags: string[]
  attachments: string[]
  isPinned: boolean
  remindAt?: string | null
  createdAt: string
  author?: {
    id: string
    name: string
    email: string
  }
}

interface UserReminder {
  id: string
  title: string
  note?: string | null
  remindAt: string
  status: string
  attachments: string[]
}

interface AssociatedApplication {
  id: string
  name: string
  slug?: string
  status: string
  domain?: string
  role?: string
  appStatus?: string
  appPoints?: number
  joinedAt?: string
  lastActiveAt?: string
  isCurrent: boolean
}

export default function UserDetailDrawer({ isOpen, onClose, userId, applicationId }: UserDetailDrawerProps) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [associatedApps, setAssociatedApps] = useState<AssociatedApplication[]>([])
  const [activityEvents, setActivityEvents] = useState<UserActivityEvent[]>([])
  const [commentFeed, setCommentFeed] = useState<UserComment[]>([])
  const [reminders, setReminders] = useState<UserReminder[]>([])
  const [commentForm, setCommentForm] = useState({
    content: '',
    tags: '',
    remindAt: '',
    attachments: [] as string[],
  })
  const [reminderForm, setReminderForm] = useState({
    title: '',
    note: '',
    remindAt: '',
    attachments: [] as string[],
  })
  const [notesSaving, setNotesSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    role: 'member',
    status: 'active' as UserDetail['status'],
    avatar: '',
    points: 0,
    appPoints: 0,
    coins: 0,
    company: '',
    jobTitle: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    setIsLoading(true)
    
    try {
      // Load user details
      const userResponse = await fetch(`/api/admin/users/${userId}`)
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details')
      }
      const userData = await userResponse.json()
      const nextUser = userData.user
      setUser(nextUser)
      setEditForm({
        name: nextUser?.name || '',
        phone: nextUser?.phone || '',
        role: (nextUser?.role || 'member').toLowerCase(),
        status: (nextUser?.status || 'active').toLowerCase(),
        avatar: nextUser?.avatar || '',
        points: nextUser?.points || 0,
        appPoints: nextUser?.appPoints || 0,
        coins: nextUser?.coins || 0,
        company: nextUser?.company || '',
        jobTitle: nextUser?.jobTitle || '',
        address: nextUser?.address || '',
        city: nextUser?.city || '',
        state: nextUser?.state || '',
        country: nextUser?.country || '',
        zipCode: nextUser?.zipCode || '',
      })
      
      // Load billing information
      const billingResponse = await fetch(`/api/admin/users/${userId}/billing`)
      if (billingResponse.ok) {
        const billingData = await billingResponse.json()
        setSubscriptions(billingData.subscriptions || [])
      }

      const [activityRes, commentsRes, remindersRes] = await Promise.all([
        fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/activity`),
        fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/comments`),
        fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/reminders`),
      ])

      if (activityRes.ok) {
        const data = await activityRes.json().catch(() => ({}))
        setActivityEvents(Array.isArray(data?.events) ? data.events : [])
      } else {
        setActivityEvents([])
      }

      if (commentsRes.ok) {
        const data = await commentsRes.json().catch(() => ({}))
        setCommentFeed(Array.isArray(data?.comments) ? data.comments : [])
      } else {
        setCommentFeed([])
      }

      if (remindersRes.ok) {
        const data = await remindersRes.json().catch(() => ({}))
        setReminders(Array.isArray(data?.reminders) ? data.reminders : [])
      } else {
        setReminders([])
      }

      // Load applications associated with the user via UserApplication join table
      try {
        const appsRes = await fetch(`/api/v1/admin/users/${userId}/applications`)
        const appsData = await appsRes.json().catch(() => ({}))
        const mapped: AssociatedApplication[] = (appsData.applications || []).map((app: any) => ({
          id: app.id,
          name: app.name,
          slug: app.slug,
          status: app.status,
          domain: app.domain,
          role: app.role,
          appStatus: app.appStatus,
          appPoints: app.appPoints,
          joinedAt: app.joinedAt,
          lastActiveAt: app.lastActiveAt,
          isCurrent: app.id === applicationId,
        }))
        setAssociatedApps(mapped)
      } catch {
        setAssociatedApps([])
      }

    } catch (err: any) {
      console.error('Failed to fetch user details:', err)
      toast({
        title: 'Error',
        description: 'Failed to load user details. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'past_due': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const splitName = (fullName: string) => {
    const normalized = (fullName || '').trim()
    if (!normalized) return { firstName: '', lastName: '' }
    const [firstNameRaw, ...lastParts] = normalized.split(/\s+/)
    return {
      firstName: firstNameRaw || '',
      lastName: lastParts.join(' ').trim(),
    }
  }

  const togglePinComment = async (commentId: string, currentPinned: boolean) => {
    if (!applicationId || !userId) return

    try {
      const response = await fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: !currentPinned }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle pin status')
      }

      const { comment: updatedComment } = await response.json()
      
      setCommentFeed(prev => {
        const next = prev.map(c => c.id === commentId ? { ...c, isPinned: updatedComment.isPinned } : c)
        // Sort: pinned first, then createdAt desc
        return [...next].sort((a: UserComment, b: UserComment) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      })

      toast({
        title: updatedComment.isPinned ? 'Comment pinned' : 'Comment unpinned',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error toggling pin status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment pinning',
        variant: 'destructive',
      })
    }
  }

  const handleSaveUser = async () => {
    if (!user) return

    const { firstName, lastName } = splitName(editForm.name)
    if (!firstName) {
      toast({
        title: 'Validation error',
        description: 'Name is required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSaving(true)
      const res = await fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber: editForm.phone,
          avatarUrl: editForm.avatar,
          role: editForm.role,
          status: editForm.status,
          isActive: editForm.status === 'active',
          points: editForm.points,
          appPoints: editForm.appPoints,
          coins: editForm.coins,
          company: editForm.company,
          jobTitle: editForm.jobTitle,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          country: editForm.country,
          zipCode: editForm.zipCode,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update user')
      }

      const updatedUser = data?.user
      if (updatedUser) {
        setUser(prev => prev ? {
          ...prev,
          id: updatedUser.id || prev.id,
          email: updatedUser.email || prev.email,
          name: updatedUser.name || prev.name,
          status: (updatedUser.status || prev.status) as UserDetail['status'],
          role: updatedUser.role || prev.role,
          phone: updatedUser.phone || '',
          avatar: updatedUser.avatar || '',
          joinedAt: updatedUser.joinedAt || prev.joinedAt,
          lastActive: updatedUser.lastActive || prev.lastActive,
          points: updatedUser.points ?? prev.points,
          appPoints: updatedUser.appPoints ?? prev.appPoints,
          coins: updatedUser.coins ?? prev.coins,
        } : prev)
      }

      setIsEditing(false)
      toast({
        title: 'Saved',
        description: 'User updated successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message || 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'free': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (!isOpen) return null

  const handleUploadAttachment = async (file: File, target: 'comment' | 'reminder') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/v1/admin/applications/${applicationId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      const url = data?.url
      if (!url) throw new Error('Upload URL missing')
      if (target === 'comment') {
        setCommentForm(prev => ({ ...prev, attachments: [...prev.attachments, url] }))
      } else {
        setReminderForm(prev => ({ ...prev, attachments: [...prev.attachments, url] }))
      }
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Could not upload attachment',
        variant: 'destructive',
      })
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsSaving(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/v1/admin/applications/${applicationId}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Avatar upload failed')
      const url = data?.url
      if (!url) throw new Error('Upload URL missing')
      
      setEditForm(prev => ({ ...prev, avatar: url }))
      toast({
        title: 'Success',
        description: 'Avatar uploaded. Click Save to apply changes.',
      })
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Could not upload avatar',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const postComment = async () => {
    if (!commentForm.content.trim()) return
    try {
      setNotesSaving(true)
      const res = await fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentForm.content.trim(),
          tags: commentForm.tags.split(',').map(v => v.trim()).filter(Boolean),
          remindAt: commentForm.remindAt || null,
          attachments: commentForm.attachments,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to post comment')
      setCommentForm({ content: '', tags: '', remindAt: '', attachments: [] })
      const refreshed = await fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/comments`)
      const refreshedData = await refreshed.json().catch(() => ({}))
      setCommentFeed(Array.isArray(refreshedData?.comments) ? refreshedData.comments : [])
    } catch (err: any) {
      toast({
        title: 'Failed to post comment',
        description: err?.message || 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setNotesSaving(false)
    }
  }

  const createReminder = async () => {
    if (!reminderForm.title.trim() || !reminderForm.remindAt) return
    try {
      setNotesSaving(true)
      const res = await fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reminderForm.title.trim(),
          note: reminderForm.note.trim(),
          remindAt: reminderForm.remindAt,
          attachments: reminderForm.attachments,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to create reminder')
      setReminderForm({ title: '', note: '', remindAt: '', attachments: [] })
      const refreshed = await fetch(`/api/v1/admin/applications/${applicationId}/users/${userId}/reminders`)
      const refreshedData = await refreshed.json().catch(() => ({}))
      setReminders(Array.isArray(refreshedData?.reminders) ? refreshedData.reminders : [])
    } catch (err: any) {
      toast({
        title: 'Failed to create reminder',
        description: err?.message || 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setNotesSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden">
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-4 top-4 bottom-4 z-20 w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-gray-200/80 dark:border-zinc-800/80">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <XIcon className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(user?.status || '')}>
                {user?.status}
              </Badge>
              <Badge className={getPlanColor(user?.plan || '')}>
                {user?.plan}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Tabs */}
                <div className="flex space-x-1 border-b">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'info'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Customer Info
                  </button>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'billing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Subscriptions
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'activity'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'comments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'reminders'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reminders
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === 'applications'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Applications
                  </button>
                </div>

                {/* Customer Info Tab */}
                {activeTab === 'info' && user && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative group">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-700">
                              {(isEditing ? editForm.avatar : user.avatar) ? (
                                <img 
                                  src={isEditing ? editForm.avatar : user.avatar} 
                                  alt={user.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserIcon className="w-8 h-8 text-gray-400" />
                              )}
                              
                              {isEditing && (
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CameraIcon className="w-5 h-5 text-white" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleAvatarUpload(file)
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                            
                            {/* SSO Connection indicator */}
                            {!isEditing && user.loginMethods && user.loginMethods.some(m => m !== 'password') && (
                              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 border border-gray-100 dark:border-zinc-800 shadow-sm" title="Connected via SSO">
                                <GlobeIcon className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.name}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600 dark:text-zinc-400">{user.email}</p>
                              {user.loginMethods && user.loginMethods.length > 0 && (
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                                  user.loginMethods.includes('password') 
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' 
                                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                                }`}>
                                  {user.loginMethods.find(m => m !== 'password') || 'Email / Pass'}
                                </span>
                              )}

                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">ID: {user.id}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            {isEditing ? (
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Full name"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{user.name}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            {isEditing ? (
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Phone number"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{user.phone || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            {isEditing ? (
                              <Input
                                value={editForm.company}
                                onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                                placeholder="Company name"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{user.company || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            {isEditing ? (
                              <select
                                title="User role"
                                value={editForm.role}
                                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                              </select>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <CogIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{user.role || 'User'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Source</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {!user.loginMethods || user.loginMethods.length === 0 ? (
                                <div className="flex items-center space-x-2 text-gray-500">
                                  <ShieldIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm italic">Unknown Source</span>
                                </div>
                              ) : (
                                user.loginMethods.map((method) => (
                                  <div key={method} className="flex items-center space-x-1.5 bg-gray-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-all hover:border-[var(--primary-blue)]/50 group">
                                    {method === 'password' ? (
                                      <LockIcon className="w-3.5 h-3.5 text-blue-500/70 group-hover:text-blue-500" />
                                    ) : (
                                      <GlobeIcon className="w-3.5 h-3.5 text-emerald-500/70 group-hover:text-emerald-500" />
                                    )}
                                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 capitalize">
                                      {method === 'password' ? 'Credentials (Email)' : method}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            {isEditing ? (
                              <Input
                                value={editForm.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Street address"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <FileTextIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{user.address || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          {/* New attribute fields */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                            {isEditing ? (
                              <Input
                                value={editForm.jobTitle}
                                onChange={(e) => setEditForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                                placeholder="Job title"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-900">
                                <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                                <span>{user.jobTitle || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            {isEditing ? (
                              <Input
                                value={editForm.city}
                                onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="City"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-900">
                                <MapPinIcon className="w-4 h-4 text-gray-400" />
                                <span>{user.city || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                            {isEditing ? (
                              <Input
                                value={editForm.state}
                                onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                                placeholder="State or province"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-900">
                                <span className="w-4" /> {/* Spacer */}
                                <span>{user.state || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            {isEditing ? (
                              <Input
                                value={editForm.country}
                                onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                                placeholder="Country"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-900">
                                <GlobeIcon className="w-4 h-4 text-gray-400" />
                                <span>{user.country || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zip / Postal Code</label>
                            {isEditing ? (
                              <Input
                                value={editForm.zipCode}
                                onChange={(e) => setEditForm(prev => ({ ...prev, zipCode: e.target.value }))}
                                placeholder="Zip or postal code"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-900">
                                <HashIcon className="w-4 h-4 text-gray-400" />
                                <span>{user.zipCode || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            {isEditing ? (
                              <select
                                title="User status"
                                value={editForm.status}
                                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as UserDetail['status'] }))}
                                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm bg-white"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900 capitalize">{user.status}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                            {isEditing ? (
                              <Input
                                value={editForm.avatar}
                                onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                                placeholder="https://..."
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <FileTextIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900 truncate">{user.avatar || 'Not provided'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Global Points</label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editForm.points}
                                onChange={(e) => setEditForm(prev => ({ ...prev, points: parseInt(e.target.value, 10) || 0 }))}
                                placeholder="0"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="mr-1">💎</span>
                                <span className="text-gray-900">{user.points ?? 0}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">App Points</label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editForm.appPoints}
                                onChange={(e) => setEditForm(prev => ({ ...prev, appPoints: parseInt(e.target.value, 10) || 0 }))}
                                placeholder="0"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="mr-1">⭐</span>
                                <span className="text-gray-900">{user.appPoints ?? 0}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Coins</label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editForm.coins}
                                onChange={(e) => setEditForm(prev => ({ ...prev, coins: parseInt(e.target.value, 10) || 0 }))}
                                placeholder="0"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="mr-1">💰</span>
                                <span className="text-gray-900">{user.coins ?? 0}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{new Date(user.joinedAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Active</label>
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{new Date(user.lastActive).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">User Activity Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {activityEvents.length === 0 ? (
                          <p className="text-sm text-gray-500">No activity logs yet.</p>
                        ) : activityEvents.map((event) => (
                          <div key={event.id} className="rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-gray-900 capitalize">{event.type.replace(/_/g, ' ')}</p>
                              <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{event.message}</p>
                            <p className="text-xs text-gray-500 mt-1">Source: {event.source}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="flex flex-col h-[600px] bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50">
                      <div className="flex items-center gap-2">
                        <MessageSquareIcon className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Internal Comments</h3>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-gray-100 dark:border-zinc-700">
                        {commentFeed.length} Comments
                      </span>
                    </div>

                    {/* Chat Area - List of Comments */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 dark:bg-zinc-950/20">
                      {commentFeed.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            <MessageSquareIcon className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No comments yet</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Start the conversation below</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {commentFeed.map((comment) => (
                            <div key={comment.id} className={`group relative p-2 rounded-2xl transition-all ${comment.isPinned ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-900/20 shadow-sm' : ''}`}>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                                  {comment.author?.name?.charAt(0).toUpperCase() || (comment.id.substring(0, 1).toUpperCase())}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-gray-900 dark:text-white">{comment.author?.name || 'Admin User'}</span>
                                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </span>
                                      {comment.isPinned && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tighter rounded border border-amber-200 dark:border-amber-800/50">
                                          <PinIcon className="w-2.5 h-2.5 fill-amber-500" />
                                          Pinned
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => togglePinComment(comment.id, comment.isPinned)}
                                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 ${
                                        comment.isPinned ? 'opacity-100 text-amber-500 bg-white dark:bg-zinc-800 shadow-sm border-amber-200 dark:border-amber-800' : 'text-gray-400'
                                      }`}
                                      title={comment.isPinned ? "Unpin comment" : "Pin comment"}
                                    >
                                      <PinIcon className={`w-3.5 h-3.5 ${comment.isPinned ? 'fill-amber-500' : ''}`} />
                                    </button>
                                  </div>
                                  <div className={`bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm group-hover:shadow-md transition-shadow ${comment.isPinned ? 'border-amber-100 dark:border-amber-900/30' : ''}`}>
                                    <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed break-words">
                                      {comment.content}
                                    </p>
                                    {comment.attachments && comment.attachments.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800 grid grid-cols-1 gap-2">
                                        {comment.attachments.map((url, idx) => (
                                          <a 
                                            key={idx} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-100 dark:border-zinc-700"
                                          >
                                            <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[11px] text-gray-600 dark:text-zinc-400 truncate">{url.split('/').pop() || 'Attachment'}</span>
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Input Area at the Bottom */}
                    <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <div className="space-y-3">
                        {/* Attachments Preview */}
                        {commentForm.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {commentForm.attachments.map((url, index) => (
                              <div key={index} className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg group">
                                <Paperclip className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] text-blue-700 dark:text-blue-400 truncate max-w-[100px]">{url.split('/').pop()}</span>
                                <button 
                                  onClick={() => setCommentForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }))}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Integrated Input Container */}
                        <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                          <label className="p-2 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors rounded-xl hover:bg-white dark:hover:bg-zinc-800">
                            <Paperclip className="w-5 h-5" />
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUploadAttachment(file, 'comment')
                                e.currentTarget.value = ''
                              }}
                            />
                          </label>
                          
                          <textarea
                            rows={1}
                            value={commentForm.content}
                            onChange={(e) => {
                              setCommentForm(prev => ({ ...prev, content: e.target.value }));
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                            }}
                            placeholder="Type an internal comment..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 max-h-[120px] resize-none dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                postComment();
                              }
                            }}
                          />

                          <button 
                            onClick={postComment}
                            disabled={notesSaving || !commentForm.content.trim()}
                            className={`p-2 rounded-xl transition-all ${
                              commentForm.content.trim() && !notesSaving 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-100 active:scale-95' 
                                : 'bg-gray-100 text-gray-300 dark:bg-zinc-800 dark:text-zinc-600'
                            }`}
                          >
                            {notesSaving ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {/* Additional Options Container (Optional/Initially hidden) */}
                        <div className="flex items-center gap-4 px-1">
                          <div className="flex-1 flex gap-2">
                            <div className="relative group">
                              <input 
                                value={commentForm.tags}
                                onChange={(e) => setCommentForm(prev => ({ ...prev, tags: e.target.value }))}
                                placeholder="Add tags..."
                                className="text-[10px] bg-transparent border-none focus:ring-0 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-400 transition-colors w-24"
                              />
                            </div>
                            <div className="w-[1px] h-3 bg-gray-200 dark:bg-zinc-800 self-center" />
                            <input 
                              type="datetime-local"
                              value={commentForm.remindAt}
                              onChange={(e) => setCommentForm(prev => ({ ...prev, remindAt: e.target.value }))}
                              className="text-[10px] bg-transparent border-none focus:ring-0 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-400 transition-colors"
                              title="Set reminder"
                            />
                          </div>
                          <span className="text-[10px] text-gray-300 dark:text-zinc-700 italic">Press Enter to send</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reminders' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BellIcon className="w-5 h-5" />
                          Reminders
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={reminderForm.title}
                            onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Reminder title"
                          />
                          <Input
                            type="datetime-local"
                            value={reminderForm.remindAt}
                            onChange={(e) => setReminderForm(prev => ({ ...prev, remindAt: e.target.value }))}
                            placeholder="Reminder datetime"
                          />
                          <Input
                            value={reminderForm.note}
                            onChange={(e) => setReminderForm(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Optional note"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <UploadIcon className="w-4 h-4" />
                            Upload Reminder Attachment
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUploadAttachment(file, 'reminder')
                                e.currentTarget.value = ''
                              }}
                            />
                          </label>
                          <Button onClick={createReminder} disabled={notesSaving}>
                            {notesSaving ? 'Saving...' : 'Create Reminder'}
                          </Button>
                        </div>
                        {reminders.length === 0 ? (
                          <p className="text-sm text-gray-500">No reminders yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {reminders.map((reminder) => (
                              <div key={reminder.id} className="rounded-lg border border-gray-200 p-3">
                                <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                                {reminder.note && <p className="text-sm text-gray-700 mt-1">{reminder.note}</p>}
                                <p className="text-xs text-gray-500 mt-1">{new Date(reminder.remindAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Applications Tab */}
                {activeTab === 'applications' && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ServerIcon className="w-5 h-5 text-blue-500" />
                          Associated Applications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {associatedApps.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">No applications found.</p>
                        ) : (
                          <div className="space-y-3">
                            {associatedApps.map(app => (
                              <div
                                key={app.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  app.isCurrent
                                    ? 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                                    : 'border-gray-200 dark:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {app.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{app.name}</p>
                                      {app.isCurrent && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-medium flex-shrink-0">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{app.domain || app.slug || app.id}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                                    app.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                  }`}>
                                    {app.status}
                                  </span>
                                  <a
                                    href={`/applications/${app.id}?tab=users`}
                                    className="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                    title="View in application"
                                  >
                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Subscriptions Tab */}
                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    {subscriptions.length === 0 ? (
                      <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                          <CreditCardIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">No active subscriptions</h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 max-w-[240px] mx-auto">
                          This user doesn't have any active subscriptions across any applications.
                        </p>
                      </div>
                    ) : (
                      subscriptions.map((sub) => (
                        <Card key={sub.id} className="overflow-hidden">
                          <div className="bg-gray-50/50 dark:bg-zinc-800/50 px-5 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">
                                {sub.appName}
                              </span>
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{sub.planName}</h4>
                            </div>
                            <Badge className={getStatusColor(sub.status)}>
                              {sub.status}
                            </Badge>
                          </div>
                          <CardContent className="p-5 space-y-4">
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  ${sub.amount}
                                  <span className="text-sm font-normal text-gray-500 dark:text-zinc-500 ml-1">
                                    /{sub.currency.toUpperCase()}
                                  </span>
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                                  Period: {new Date(sub.currentPeriodStart).toLocaleDateString()} - {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <CreditCardIcon className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                    {sub.paymentMethod.brand} •••• {sub.paymentMethod.last4}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                  Expires {sub.paymentMethod.expiry}
                                </p>
                              </div>
                            </div>
                            
                            {/* Usage Progress */}
                            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Resource Usage</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                                  Current Period
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 dark:text-zinc-400">Users</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{sub.usage.users} / {sub.limits.users}</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${getUsageColor(getUsagePercentage(sub.usage.users, sub.limits.users))}`} 
                                      style={{ width: `${getUsagePercentage(sub.usage.users, sub.limits.users)}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 dark:text-zinc-400">Storage</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{sub.usage.storage}GB / {sub.limits.storage}GB</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${getUsageColor(getUsagePercentage(sub.usage.storage, sub.limits.storage))}`} 
                                      style={{ width: `${getUsagePercentage(sub.usage.storage, sub.limits.storage)}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 dark:text-zinc-400">API Calls</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{(sub.usage.apiCalls / 1000).toFixed(1)}k / {(sub.limits.apiCalls / 1000).toFixed(1)}k</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${getUsageColor(getUsagePercentage(sub.usage.apiCalls, sub.limits.apiCalls))}`} 
                                      style={{ width: `${getUsagePercentage(sub.usage.apiCalls, sub.limits.apiCalls)}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 dark:text-zinc-400">Bandwidth</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{sub.usage.bandwidth}GB / {sub.limits.bandwidth}GB</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${getUsageColor(getUsagePercentage(sub.usage.bandwidth, sub.limits.bandwidth))}`} 
                                      style={{ width: `${getUsagePercentage(sub.usage.bandwidth, sub.limits.bandwidth)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      if (user) {
                        setEditForm({
                          name: user.name || '',
                          phone: user.phone || '',
                          role: (user.role || 'member').toLowerCase(),
                          status: user.status,
                          avatar: user.avatar || '',
                          points: user.points || 0,
                          appPoints: user.appPoints || 0,
                          coins: user.coins || 0,
                          company: user.company || '',
                          jobTitle: user.jobTitle || '',
                          address: user.address || '',
                          city: user.city || '',
                          state: user.state || '',
                          country: user.country || '',
                          zipCode: user.zipCode || '',
                        })
                      }
                    }}
                    disabled={isSaving}
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser} disabled={isSaving}>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save User'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    <CogIcon className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
