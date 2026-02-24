'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  CheckIcon
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

export default function UserDetailDrawer({ isOpen, onClose, userId, applicationId }: UserDetailDrawerProps) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
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
      setUser(userData.user)
      
      // Load billing information
      const billingResponse = await fetch(`/api/admin/users/${userId}/billing`)
      if (!billingResponse.ok) {
        throw new Error('Failed to fetch billing information')
      }
      const billingData = await billingResponse.json()
      setBilling(billingData.billing)
      
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{user.phone || 'Not provided'}</span>
                            </div>
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
                            <div className="flex items-center space-x-2">
                              <CogIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{user.role || 'User'}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <div className="flex items-center space-x-2">
                              <FileTextIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{user.address || 'Not provided'}</span>
                            </div>
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
                              <span className="text-gray-900">{new Date(user.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Active</label>
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{new Date(user.lastActive).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
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
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                <CogIcon className="w-4 h-4 mr-2" />
                Edit User
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
