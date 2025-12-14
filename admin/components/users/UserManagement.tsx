'use client'

import { useState, useEffect } from 'react'
import {
  UserIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  UserGroupIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { userService, User, Family } from '../../services/userService'
import { adminService } from '../../services/adminService'
import { FilterSystem, FilterConfig, SortableHeader } from '../common/FilterSystem'
import { billingService, BillingPlan, PaymentMethodSummary, InvoiceSummary } from '../../services/billingService'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [billingUser, setBillingUser] = useState<User | null>(null)
  const [billingOpen, setBillingOpen] = useState(false)
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([])
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [newPaymentMethodId, setNewPaymentMethodId] = useState<string>('')
  const [couponCode, setCouponCode] = useState<string>('')
  const [trialDays, setTrialDays] = useState<number | ''>('')
  const [seatCount, setSeatCount] = useState<number>(1)
  const [billingNotifications, setBillingNotifications] = useState({
    failedPaymentAlerts: true,
    renewalReminders: true,
  })
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    userType: 'hourse' as 'hourse' | 'children' | 'seniors',
    subscriptionTier: 'free' as 'free' | 'premium' | 'elite',
    familyIds: [] as string[],
    isOnboardingComplete: false,
    preferences: {
      notifications: true,
      locationSharing: true,
      popupSettings: {
        enabled: true,
        frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
        maxPerDay: 3,
        categories: ['announcement', 'promotion']
      }
    },
    role: 'user' as 'admin' | 'moderator' | 'user' | 'family_admin',
    status: 'active' as 'active' | 'inactive' | 'pending' | 'suspended',
    familyId: '',
    permissions: [] as string[]
  })

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search users by name or email...'
    },
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { id: 'all', label: 'All Roles', value: 'all' },
        { id: 'admin', label: 'Administrator', value: 'admin' },
        { id: 'moderator', label: 'Moderator', value: 'moderator' },
        { id: 'family_admin', label: 'Family Admin', value: 'family_admin' },
        { id: 'user', label: 'User', value: 'user' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { id: 'all', label: 'All Status', value: 'all' },
        { id: 'active', label: 'Active', value: 'active' },
        { id: 'inactive', label: 'Inactive', value: 'inactive' },
        { id: 'pending', label: 'Pending', value: 'pending' },
        { id: 'suspended', label: 'Suspended', value: 'suspended' }
      ]
    },
    {
      id: 'family',
      label: 'Family',
      type: 'select',
      options: [
        { id: 'all', label: 'All Families', value: 'all' },
        ...(families || []).map(family => ({
          id: family.id,
          label: family.name,
          value: family.id
        }))
      ]
    },
    {
      id: 'verified',
      label: 'Verification',
      type: 'select',
      options: [
        { id: 'all', label: 'All Users', value: 'all' },
        { id: 'verified', label: 'Verified', value: 'verified' },
        { id: 'unverified', label: 'Unverified', value: 'unverified' }
      ]
    },
    {
      id: 'userType',
      label: 'User Type',
      type: 'select',
      options: [
        { id: 'all', label: 'All Types', value: 'all' },
        { id: 'hourse', label: 'Hourse', value: 'hourse' },
        { id: 'children', label: 'Children', value: 'children' },
        { id: 'seniors', label: 'Seniors', value: 'seniors' }
      ]
    },
    {
      id: 'subscriptionTier',
      label: 'Subscription',
      type: 'select',
      options: [
        { id: 'all', label: 'All Tiers', value: 'all' },
        { id: 'free', label: 'Free', value: 'free' },
        { id: 'premium', label: 'Premium', value: 'premium' },
        { id: 'elite', label: 'Elite', value: 'elite' }
      ]
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      type: 'select',
      options: [
        { id: 'all', label: 'All Users', value: 'all' },
        { id: 'complete', label: 'Complete', value: 'complete' },
        { id: 'incomplete', label: 'Incomplete', value: 'incomplete' }
      ]
    }
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (billingOpen) {
      void loadBillingData()
    }
  }, [billingOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load data from API
      const [usersData, familiesData] = await Promise.all([
        userService.getUsers(),
        userService.getFamilies()
      ])

      // Define roles locally since they're typically static
      const rolesData: Role[] = [
        { id: 'admin', name: 'Administrator', description: 'Full system access', permissions: ['read', 'write', 'delete', 'admin'], color: '#DC2626' },
        { id: 'moderator', name: 'Moderator', description: 'Content moderation access', permissions: ['read', 'write', 'moderate'], color: '#D97706' },
        { id: 'family_admin', name: 'Family Admin', description: 'Family management access', permissions: ['read', 'write', 'family_manage'], color: '#059669' },
        { id: 'user', name: 'User', description: 'Basic user access', permissions: ['read'], color: '#2563EB' }
      ]

      setUsers(usersData)
      setRoles(rolesData)
      setFamilies(familiesData)
    } catch (error) {
      console.error('Error loading user data:', error)
      // Set empty arrays when API fails
      setUsers([])
      setFamilies([])
      setRoles([
        { id: 'admin', name: 'Administrator', description: 'Full system access', permissions: ['read', 'write', 'delete', 'admin'], color: '#DC2626' },
        { id: 'moderator', name: 'Moderator', description: 'Content moderation access', permissions: ['read', 'write', 'moderate'], color: '#D97706' },
        { id: 'family_admin', name: 'Family Admin', description: 'Family management access', permissions: ['read', 'write', 'family_manage'], color: '#059669' },
        { id: 'user', name: 'User', description: 'Basic user access', permissions: ['read'], color: '#2563EB' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const openBilling = (user: User) => {
    setBillingUser(user)
    setBillingOpen(true)
  }

  const closeBilling = () => {
    setBillingOpen(false)
    setBillingUser(null)
    setSubscription(null)
    setPaymentMethods([])
    setInvoices([])
    setPlans([])
    setSelectedPlanId('')
    setNewPaymentMethodId('')
  }

  const loadBillingData = async () => {
    setBillingLoading(true)
    try {
      const [plansRes, methodsRes, invoicesRes] = await Promise.all([
        billingService.listPlans(),
        billingService.listPaymentMethods(),
        billingService.listInvoices(10)
      ])
      setPlans(plansRes.plans || [])
      setPaymentMethods(methodsRes.paymentMethods || [])
      setInvoices(invoicesRes.invoices || [])
      try {
        const subRes = await billingService.getSubscription()
        setSubscription(subRes.subscription)
        setSelectedPlanId(subRes.subscription?.plan?.id || '')
      } catch (e) {
        setSubscription(null)
      }
    } catch (e) {
      console.error('Failed to load billing data', e)
    } finally {
      setBillingLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!selectedPlanId) return
    try {
      setBillingLoading(true)
      const res = await billingService.createSubscription({ planId: selectedPlanId })
      setSubscription(res.subscription)
      alert('Subscription created')
    } catch (e) {
      console.error(e)
      alert('Failed to create subscription')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleUpdateSubscription = async () => {
    if (!selectedPlanId) return
    try {
      setBillingLoading(true)
      const res = await billingService.updateSubscription(selectedPlanId)
      setSubscription(res.subscription)
      alert('Subscription updated')
    } catch (e) {
      console.error(e)
      alert('Failed to update subscription')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setBillingLoading(true)
      const res = await billingService.cancelSubscription()
      setSubscription(res.subscription)
      alert('Subscription set to cancel at period end')
    } catch (e) {
      console.error(e)
      alert('Failed to cancel subscription')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      setBillingLoading(true)
      const res = await billingService.reactivateSubscription()
      setSubscription(res.subscription)
      alert('Subscription reactivated')
    } catch (e) {
      console.error(e)
      alert('Failed to reactivate subscription')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethodId) return
    try {
      setBillingLoading(true)
      await billingService.addPaymentMethod(newPaymentMethodId)
      const methods = await billingService.listPaymentMethods()
      setPaymentMethods(methods.paymentMethods)
      setNewPaymentMethodId('')
      alert('Payment method added')
    } catch (e) {
      console.error(e)
      alert('Failed to add payment method')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleRemovePaymentMethod = async (id: string) => {
    try {
      setBillingLoading(true)
      await billingService.removePaymentMethod(id)
      const methods = await billingService.listPaymentMethods()
      setPaymentMethods(methods.paymentMethods)
    } catch (e) {
      console.error(e)
      alert('Failed to remove payment method')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      setBillingLoading(true)
      await billingService.setDefaultPaymentMethod(id)
      const methods = await billingService.listPaymentMethods()
      setPaymentMethods(methods.paymentMethods)
      alert('Default payment method updated')
    } catch (e) {
      console.error(e)
      alert('Failed to set default payment method')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleExportInvoicesCSV = () => {
    const headers = ['id', 'number', 'amount', 'currency', 'status', 'date', 'url']
    const rows = invoices.map(i => [i.id, i.number || '', i.amount, i.currency, i.status, new Date(i.date as any).toISOString(), i.hostedInvoiceUrl || i.pdf || ''])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => {
      const searchTerm = activeFilters.search || ''
      const matchesSearch = !searchTerm ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = !activeFilters.role || activeFilters.role === 'all' || user.role === activeFilters.role
      const matchesStatus = !activeFilters.status || activeFilters.status === 'all' || user.status === activeFilters.status
      const matchesFamily = !activeFilters.family || activeFilters.family === 'all' || user.familyId === activeFilters.family
      const matchesVerified = !activeFilters.verified || activeFilters.verified === 'all' ||
        (activeFilters.verified === 'verified' && user.isVerified) ||
        (activeFilters.verified === 'unverified' && !user.isVerified)
      const matchesUserType = !activeFilters.userType || activeFilters.userType === 'all' || user.userType === activeFilters.userType
      const matchesSubscriptionTier = !activeFilters.subscriptionTier || activeFilters.subscriptionTier === 'all' || user.subscriptionTier === activeFilters.subscriptionTier
      const matchesOnboarding = !activeFilters.onboarding || activeFilters.onboarding === 'all' ||
        (activeFilters.onboarding === 'complete' && user.isOnboardingComplete) ||
        (activeFilters.onboarding === 'incomplete' && !user.isOnboardingComplete)

      return matchesSearch && matchesRole && matchesStatus && matchesFamily && matchesVerified && matchesUserType && matchesSubscriptionTier && matchesOnboarding
    })
    .sort((a, b) => {
      if (!sortConfig) return 0

      const { key, direction } = sortConfig
      let aValue: any, bValue: any

      switch (key) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'lastLogin':
          aValue = new Date(a.lastLogin || 0).getTime()
          bValue = new Date(b.lastLogin || 0).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      userType: 'hourse' as 'hourse' | 'children' | 'seniors',
      subscriptionTier: 'free' as 'free' | 'premium' | 'elite',
      familyIds: [],
      isOnboardingComplete: false,
      preferences: {
        notifications: true,
        locationSharing: true,
        popupSettings: {
          enabled: true,
          frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
          maxPerDay: 3,
          categories: ['announcement', 'promotion']
        }
      },
      role: 'user' as 'admin' | 'moderator' | 'user' | 'family_admin',
      status: 'active' as 'active' | 'inactive' | 'pending' | 'suspended',
      familyId: '',
      permissions: []
    })
    setShowForm(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      userType: user.userType,
      subscriptionTier: user.subscriptionTier,
      familyIds: user.familyIds || [],
      isOnboardingComplete: user.isOnboardingComplete,
      preferences: user.preferences || {
        notifications: true,
        locationSharing: true,
        popupSettings: {
          enabled: true,
          frequency: 'daily',
          maxPerDay: 3,
          categories: ['announcement', 'promotion']
        }
      },
      role: user.role,
      status: user.status,
      familyId: user.familyId || '',
      permissions: user.permissions
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await userService.updateUser(editingUser.id, formData)
        setUsers(prev => prev.map(user =>
          user.id === editingUser.id ? updatedUser : user
        ))
      } else {
        // Create new user
        const newUser = await userService.createUser(formData)
        setUsers(prev => [...prev, newUser])
      }
      setShowForm(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Failed to save user. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id)
        setUsers(prev => prev.filter(user => user.id !== id))
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user. Please try again.')
      }
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updatedUser = await userService.updateUserStatus(id, status)
      setUsers(prev => prev.map(user =>
        user.id === id ? updatedUser : user
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    const roleData = roles.find(r => r.id === role)
    return roleData?.color || '#6B7280'
  }

  const getRoleName = (role: string) => {
    const roleData = roles.find(r => r.id === role)
    return roleData?.name || role
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'gray'
      case 'pending': return 'yellow'
      case 'suspended': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckIcon className="h-4 w-4 text-green-500" />
      case 'inactive': return <XMarkIcon className="h-4 w-4 text-gray-500" />
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'suspended': return <XMarkIcon className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  if (showForm) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {editingUser ? 'Edit User' : 'Create User'}
            </h1>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User Type
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value="hourse">Hourse</option>
                  <option value="children">Children</option>
                  <option value="seniors">Seniors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subscription Tier
                </label>
                <select
                  value={formData.subscriptionTier}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="onboardingComplete"
                  checked={formData.isOnboardingComplete}
                  onChange={(e) => setFormData({ ...formData, isOnboardingComplete: e.target.checked })}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="onboardingComplete" className="text-sm font-semibold text-gray-700">
                  Onboarding Complete
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={formData.preferences.notifications}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {
                      ...formData.preferences,
                      notifications: e.target.checked
                    }
                  })}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="notifications" className="text-sm font-semibold text-gray-700">
                  Notifications Enabled
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="locationSharing"
                checked={formData.preferences.locationSharing}
                onChange={(e) => setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    locationSharing: e.target.checked
                  }
                })}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="locationSharing" className="text-sm font-semibold text-gray-700">
                Location Sharing Enabled
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Family
              </label>
              <select
                value={formData.familyId}
                onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="">No Family</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">User Management</h1>
            <p className="text-lg text-gray-600 leading-relaxed">Manage users, roles, and permissions across your platform</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Export filtered users to CSV
                const headers = ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'subscriptionTier']
                const rows = filteredAndSortedUsers.map(u => [u.id, u.firstName, u.lastName, u.email, u.role, u.status, u.subscriptionTier])
                const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors duration-200"
            >
              Export CSV
            </button>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
            >
              <UserPlusIcon className="h-5 w-5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Users</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {users.filter(user => user.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {users.filter(user => user.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Verified</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {users.filter(user => user.isVerified).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <FilterSystem
            filters={filterConfigs}
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            onClearAll={() => setActiveFilters({})}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {users.length === 0 ? 'No users available' : 'No users found'}
          </h3>
          <p className="text-gray-500 mb-6">
            {users.length === 0
              ? 'No users found in the system. Users will appear here once they register.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {users.length === 0 && (
            <button
              onClick={loadData}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Refresh Users
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <SortableHeader
                    label="User"
                    sortKey="name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-6 py-4"
                  />
                  <SortableHeader
                    label="Contact"
                    sortKey="email"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-6 py-4"
                  />
                  <SortableHeader
                    label="Role"
                    sortKey="role"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-6 py-4"
                  />
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-6 py-4"
                  />
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Family
                  </th>
                  <SortableHeader
                    label="Last Login"
                    sortKey="lastLogin"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-6 py-4"
                  />
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.firstName} className="h-12 w-12 rounded-xl object-cover" />
                            ) : (
                              <UserIcon className="h-6 w-6 text-gray-500" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.isVerified ? (
                              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <ShieldExclamationIcon className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                        {user.dateOfBirth && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            {new Date(user.dateOfBirth).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {user.userType}
                          </span>
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            {user.subscriptionTier}
                          </span>
                        </div>
                        {user.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            {user.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      >
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status) === 'green' ? 'bg-green-100 text-green-800' :
                            getStatusColor(user.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              getStatusColor(user.status) === 'red' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {user.status}
                        </span>
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white hover:border-gray-300 transition-colors duration-150"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.familyName ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          <UserGroupIcon className="h-3 w-3" />
                          {user.familyName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No family</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            adminService.impersonateUser(user.id)
                              .then(() => alert('Impersonation started'))
                              .catch(() => alert('Failed to impersonate'))
                          }}
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                          title="Impersonate user"
                        >
                          <span className="text-xs">Imp</span>
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="Edit user"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openBilling(user)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors duration-150"
                          title="Manage billing"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Delete user"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {billingOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={closeBilling}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-100 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
                <p className="text-sm text-gray-500">{billingUser?.firstName} {billingUser?.lastName} • {billingUser?.email}</p>
              </div>
              <button onClick={closeBilling} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {billingLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Current Subscription</div>
                      {subscription ? (
                        <div className="mt-1">
                          <div className="text-gray-900 font-semibold">{subscription.plan?.name} • {subscription.status}</div>
                          {subscription.currentPeriodEnd && (
                            <div className="text-xs text-gray-500">Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>
                          )}
                          {subscription.cancelAtPeriodEnd && (
                            <div className="text-xs text-red-600">Cancellation scheduled at period end</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500">No active subscription</div>
                      )}
                    </div>
                    <BanknotesIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">Plans</div>
                    <button
                      onClick={() => {
                        // Simple plan comparison modal via alert for now
                        const lines = plans.map(p => `${p.name}: ${(p.price).toFixed(2)} ${p.currency.toUpperCase()}/${p.interval}`).join('\n')
                        alert(lines || 'No plans available')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Compare plans
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Select a plan</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.price} {p.currency.toUpperCase()}/{p.interval}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      {subscription ? (
                        <button onClick={handleUpdateSubscription} className="px-4 py-2 bg-gray-900 text-white rounded-lg">Update</button>
                      ) : (
                        <button onClick={handleCreateSubscription} className="px-4 py-2 bg-red-600 text-white rounded-lg">Subscribe</button>
                      )}
                      {subscription && !subscription.cancelAtPeriodEnd && (
                        <button onClick={handleCancelSubscription} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel at period end</button>
                      )}
                      {subscription && subscription.cancelAtPeriodEnd && (
                        <button onClick={handleReactivateSubscription} className="px-4 py-2 border border-gray-300 rounded-lg">Reactivate</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Coupon code</label>
                        <div className="flex gap-2">
                          <input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                            placeholder="e.g., WELCOME10"
                          />
                          <button onClick={async () => {
                            if (!couponCode) return
                            try {
                              setBillingLoading(true)
                              await billingService.applyCoupon(couponCode)
                              const sub = await billingService.getSubscription()
                              setSubscription(sub.subscription)
                              alert('Coupon applied')
                            } catch (e) {
                              console.error(e)
                              alert('Failed to apply coupon')
                            } finally {
                              setBillingLoading(false)
                            }
                          }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">Apply</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Trial days</label>
                        <input
                          type="number"
                          min={0}
                          value={trialDays}
                          onChange={(e) => setTrialDays(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2"
                          placeholder="e.g., 14"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Seats (family members)</label>
                      <input
                        type="number"
                        min={1}
                        value={seatCount}
                        onChange={(e) => setSeatCount(Math.max(1, Number(e.target.value)))}
                        className="w-32 border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">Payment Methods</div>
                    <div className="text-xs text-gray-500">Set default by removing others</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        placeholder="payment_method_id"
                        value={newPaymentMethodId}
                        onChange={(e) => setNewPaymentMethodId(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2"
                      />
                      <button onClick={handleAddPaymentMethod} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Add</button>
                    </div>
                    {paymentMethods.length === 0 ? (
                      <div className="text-sm text-gray-500">No saved methods</div>
                    ) : (
                      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                        {paymentMethods.map(pm => (
                          <li key={pm.id} className="flex items-center justify-between p-3">
                            <div className="text-sm text-gray-700">
                              {pm.brand.toUpperCase()} •••• {pm.last4} — {pm.expMonth}/{pm.expYear}
                              {pm.isDefault ? <span className="ml-2 text-xs text-gray-500">(default)</span> : null}
                            </div>
                            <div className="flex gap-3">
                              {!pm.isDefault && (
                                <button onClick={() => handleSetDefaultPaymentMethod(pm.id)} className="text-sm text-gray-600 hover:text-gray-700">Make default</button>
                              )}
                              <button onClick={() => handleRemovePaymentMethod(pm.id)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">Invoices</div>
                    <button onClick={handleExportInvoicesCSV} className="text-sm text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">Export CSV</button>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="text-sm text-gray-500">No invoices</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="text-xs text-gray-500">
                          <tr>
                            <th className="text-left py-2 pr-4">Number</th>
                            <th className="text-left py-2 pr-4">Date</th>
                            <th className="text-left py-2 pr-4">Amount</th>
                            <th className="text-left py-2 pr-4">Status</th>
                            <th className="text-left py-2 pr-4">Link</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                          {invoices.map(inv => (
                            <tr key={inv.id} className="border-t border-gray-100">
                              <td className="py-2 pr-4">{inv.number || inv.id}</td>
                              <td className="py-2 pr-4">{new Date(inv.date).toLocaleDateString()}</td>
                              <td className="py-2 pr-4">{(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}</td>
                              <td className="py-2 pr-4">{inv.status}</td>
                              <td className="py-2 pr-4">
                                {inv.hostedInvoiceUrl ? (
                                  <a className="text-blue-600 hover:underline" href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer">View</a>
                                ) : inv.pdf ? (
                                  <a className="text-blue-600 hover:underline" href={inv.pdf} target="_blank" rel="noreferrer">PDF</a>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {invoices.some(inv => inv.status === 'open' || inv.status === 'past_due' || inv.status === 'uncollectible') && (
                    <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-semibold text-yellow-800 mb-1">Dunning</div>
                      <div className="text-sm text-yellow-800">
                        {invoices.filter(inv => inv.status === 'past_due' || inv.status === 'open' || inv.status === 'uncollectible').length} invoice(s) require attention. Verify payment method and retry.
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="font-semibold text-gray-900 mb-2">Usage & Refunds</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Usage this period</div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">40% of plan limit</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600 mb-2">Refunds</div>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm" onClick={() => alert('Refund flow requires backend API.')}>Issue refund</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="font-semibold text-gray-900 mb-2">Billing Notifications</div>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={billingNotifications.failedPaymentAlerts} onChange={(e) => setBillingNotifications({ ...billingNotifications, failedPaymentAlerts: e.target.checked })} />
                      Failed payment alerts
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={billingNotifications.renewalReminders} onChange={(e) => setBillingNotifications({ ...billingNotifications, renewalReminders: e.target.checked })} />
                      Renewal reminders
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
