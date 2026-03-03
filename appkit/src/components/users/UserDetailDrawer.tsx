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
  UploadIcon
} from 'lucide-react'

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
}

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due'
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
  remindAt?: string | null
  createdAt: string
}

interface UserReminder {
  id: string
  title: string
  note?: string | null
  remindAt: string
  status: string
  attachments: string[]
}

export default function UserDetailDrawer({ isOpen, onClose, userId, applicationId }: UserDetailDrawerProps) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
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
      })
      
      // Load billing information
      const billingResponse = await fetch(`/api/admin/users/${userId}/billing`)
      if (!billingResponse.ok) {
        throw new Error('Failed to fetch billing information')
      }
      const billingData = await billingResponse.json()
      setBilling(billingData.billing)

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
                    Billing & Plan
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
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {user.id}</p>
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
                            <div className="flex items-center space-x-2">
                              <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{user.company || 'Not provided'}</span>
                            </div>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <div className="flex items-center space-x-2">
                              <FileTextIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{user.address || 'Not provided'}</span>
                            </div>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
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
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquareIcon className="w-5 h-5" />
                          Comments
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <textarea
                          title="Comment"
                          value={commentForm.content}
                          onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={3}
                          placeholder="Add comment..."
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={commentForm.tags}
                            onChange={(e) => setCommentForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tags (comma separated)"
                          />
                          <Input
                            type="datetime-local"
                            value={commentForm.remindAt}
                            onChange={(e) => setCommentForm(prev => ({ ...prev, remindAt: e.target.value }))}
                            placeholder="optional reminder datetime"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <UploadIcon className="w-4 h-4" />
                            Upload Attachment
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
                          <Button onClick={postComment} disabled={notesSaving}>
                            {notesSaving ? 'Saving...' : 'Post Comment'}
                          </Button>
                        </div>
                        {commentForm.attachments.length > 0 && (
                          <div className="space-y-1">
                            {commentForm.attachments.map((url) => (
                              <p key={url} className="text-xs text-blue-600 truncate">{url}</p>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          {commentFeed.length === 0 ? (
                            <p className="text-sm text-gray-500">No comments yet.</p>
                          ) : commentFeed.map((comment) => (
                            <div key={comment.id} className="rounded-lg border border-gray-200 p-3">
                              <p className="text-sm text-gray-900">{comment.content}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
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

                {/* Billing & Plan Tab */}
                {activeTab === 'billing' && billing && (
                  <div className="space-y-6">
                    {/* Current Plan */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Current Plan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 capitalize">{billing.plan} Plan</h4>
                            <p className="text-sm text-gray-600">
                              ${billing.amount} / {billing.currency.toUpperCase()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(billing.status)}>
                            {billing.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Current Period</span>
                            <span className="text-gray-900">
                              {new Date(billing.currentPeriodStart).toLocaleDateString()} - {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                          {billing.nextBillingDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Next Billing</span>
                              <span className="text-gray-900">
                                {new Date(billing.nextBillingDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Payment Method</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4">
                          <CreditCardIcon className="w-8 h-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}
                            </p>
                            <p className="text-sm text-gray-600">
                              Expires {billing.paymentMethod.expiry}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Usage */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Usage Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Users</span>
                              <span className="text-gray-900">
                                {billing.usage.users.toLocaleString()} / {billing.limits.users.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billing.usage.users, billing.limits.users))} ${getUsagePercentage(billing.usage.users, billing.limits.users) >= 90 ? 'w-full' : getUsagePercentage(billing.usage.users, billing.limits.users) >= 70 ? 'w-3/4' : 'w-1/2'}`}  />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Storage</span>
                              <span className="text-gray-900">
                                {billing.usage.storage} GB / {billing.limits.storage} GB
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billing.usage.storage, billing.limits.storage))} ${getUsagePercentage(billing.usage.storage, billing.limits.storage) >= 90 ? 'w-full' : getUsagePercentage(billing.usage.storage, billing.limits.storage) >= 70 ? 'w-3/4' : 'w-1/2'}`}  />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Bandwidth</span>
                              <span className="text-gray-900">
                                {(billing.usage.bandwidth / 1000).toFixed(1)} TB / {(billing.limits.bandwidth / 1000).toFixed(1)} TB
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billing.usage.bandwidth, billing.limits.bandwidth))} ${getUsagePercentage(billing.usage.bandwidth, billing.limits.bandwidth) >= 90 ? 'w-full' : getUsagePercentage(billing.usage.bandwidth, billing.limits.bandwidth) >= 70 ? 'w-3/4' : 'w-1/2'}`}  />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">API Calls</span>
                              <span className="text-gray-900">
                                {billing.usage.apiCalls.toLocaleString()} / {billing.limits.apiCalls.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billing.usage.apiCalls, billing.limits.apiCalls))} ${getUsagePercentage(billing.usage.apiCalls, billing.limits.apiCalls) >= 90 ? 'w-full' : getUsagePercentage(billing.usage.apiCalls, billing.limits.apiCalls) >= 70 ? 'w-3/4' : 'w-1/2'}`}  />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
