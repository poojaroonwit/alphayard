'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { GlobalUser, userService } from '../../../../services/userService'
import { identityService } from '../../../../services/identityService'
import { UserList } from '../../../../components/identity/UserList'
import { UserDetailDrawer } from '../../../../components/identity/UserDetailDrawer'
import { 
    PlusIcon, 
    ArrowDownTrayIcon, 
    TrashIcon, 
    CheckCircleIcon,
    XCircleIcon,
    UserGroupIcon,
    ArrowPathIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface CreateUserForm {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    status: string;
    emailVerified: boolean;
    sendWelcomeEmail: boolean;
}

const initialFormState: CreateUserForm = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user',
    status: 'active',
    emailVerified: false,
    sendWelcomeEmail: true,
};

export default function GlobalUsersPage() {
    const [users, setUsers] = useState<GlobalUser[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showBulkActionMenu, setShowBulkActionMenu] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [formData, setFormData] = useState<CreateUserForm>(initialFormState)
    const [saving, setSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterRole, setFilterRole] = useState<string>('all')
    const [filterApp, setFilterApp] = useState<string>('all')
    const [apps, setApps] = useState<import('../../../../services/userService').Application[]>([])

    useEffect(() => {
        loadUsers()
        loadApps()
    }, [currentPage, filterStatus, filterRole, filterApp]) // Reload when page or filters change

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) loadUsers();
            else setCurrentPage(1); // will trigger loadUsers via dependency
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await userService.getUsers({
                page: currentPage,
                limit: 20,
                search: searchQuery,
                status: filterStatus !== 'all' ? filterStatus : undefined,
                role: filterRole !== 'all' ? filterRole : undefined,
                app: filterApp !== 'all' ? filterApp : undefined
            })
            setUsers(data.users)
            setTotalPages(data.totalPages)
            setTotalUsers(data.total)
            setCurrentPage(data.currentPage)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const loadApps = async () => {
        try {
            const data = await userService.getApplications()
            setApps(data)
        } catch (error) {
            console.error('Failed to load apps', error)
        }
    }

    const handleUserUpdated = () => {
        loadUsers()
    }

    const handleCreateUser = async () => {
        if (!formData.email || !formData.password) {
            setError('Email and password are required')
            return
        }
        
        setSaving(true)
        setError(null)
        
        try {
            await identityService.createUser(formData)
            setShowCreateModal(false)
            setFormData(initialFormState)
            setSuccessMessage('User created successfully')
            setTimeout(() => setSuccessMessage(null), 3000)
            loadUsers()
        } catch (err: any) {
            setError(err.message || 'Failed to create user')
        } finally {
            setSaving(false)
        }
    }

    const handleBulkAction = async (action: string, data?: any) => {
        if (selectedUserIds.length === 0) return
        
        try {
            const result = await identityService.bulkUserOperation(action, selectedUserIds, data)
            setSuccessMessage(`${result.affected} users updated`)
            setTimeout(() => setSuccessMessage(null), 3000)
            setSelectedUserIds([])
            setShowBulkActionMenu(false)
            loadUsers()
        } catch (err: any) {
            setError(err.message || 'Bulk operation failed')
        }
    }

    const handleExport = async (format: 'json' | 'csv') => {
        try {
            const result = await identityService.exportUsers({
                format,
                status: filterStatus !== 'all' ? filterStatus : undefined,
                role: filterRole !== 'all' ? filterRole : undefined,
            })
            
            if (format === 'csv') {
                const blob = new Blob([result], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
                a.click()
                URL.revokeObjectURL(url)
            } else {
                const blob = new Blob([JSON.stringify(result.users, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`
                a.click()
                URL.revokeObjectURL(url)
            }
            
            setShowExportMenu(false)
        } catch (err: any) {
            setError(err.message || 'Export failed')
        }
    }

    const handleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([])
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.id))
        }
    }

    const handleSelectUser = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
        } else {
            setSelectedUserIds([...selectedUserIds, userId])
        }
    }

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setFormData({ ...formData, password })
    }

    // Filter users (Removed client-side filtering)
    const filteredUsers = users;

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        {successMessage}
                    </div>
                    <button onClick={() => setSuccessMessage(null)}>
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5" />
                        {error}
                    </div>
                    <button onClick={() => setError(null)}>
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">User Identities</h1>
                        <p className="text-gray-500 text-xs mt-1">Manage global identities, access, and attributes across all applications.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        {/* Export Button */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Export
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg py-1 min-w-[150px] z-20">
                                    <button 
                                        onClick={() => handleExport('csv')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                        Export as CSV
                                    </button>
                                    <button 
                                        onClick={() => handleExport('json')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                        Export as JSON
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Add User Button */}
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                    
                    {/* App Filter */}
                    <select
                        value={filterApp}
                        onChange={(e) => setFilterApp(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm max-w-[200px]"
                        title="Filter by Application"
                    >
                        <option value="all">All Applications</option>
                        {apps.map(app => (
                            <option key={app.id} value={app.name}>{app.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        title="Filter by status"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                    
                    {/* Role Filter */}
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        title="Filter by role"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                    </select>
                    
                    {/* Refresh */}
                    <button 
                        onClick={() => loadUsers()}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="Refresh"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUserIds.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-blue-700">
                                {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
                            </span>
                            <button 
                                onClick={() => setSelectedUserIds([])}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear selection
                            </button>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowBulkActionMenu(!showBulkActionMenu)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                                Bulk Actions
                            </button>
                            {showBulkActionMenu && (
                                <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg py-1 min-w-[180px] z-20">
                                    <button 
                                        onClick={() => handleBulkAction('activate')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                        Activate Users
                                    </button>
                                    <button 
                                        onClick={() => handleBulkAction('suspend')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <XCircleIcon className="w-4 h-4 text-orange-600" />
                                        Suspend Users
                                    </button>
                                    <button 
                                        onClick={() => handleBulkAction('verify_email')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                                        Verify Emails
                                    </button>
                                    <hr className="my-1" />
                                    <button 
                                        onClick={() => handleBulkAction('delete')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Delete Users
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {/* Approximate count based on current page or explicit count if available */}
                        {filterStatus === 'active' ? totalUsers : '-'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {filterStatus === 'pending' ? totalUsers : '-'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Verified</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        -
                    </p>
                </div>
            </div>

            {/* User List with Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Select All Header */}
                <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                        title="Select all users"
                    />
                    <span className="text-sm text-gray-600">
                        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                    </span>
                </div>
                
                <UserList 
                    users={users} 
                    loading={loading} 
                    onUserClick={(user) => setSelectedUserId(user.id)}
                    selectedUserIds={selectedUserIds}
                    onSelectUser={handleSelectUser}
                    showCheckboxes={true}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalUsers={totalUsers}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* User Detail Drawer */}
            <UserDetailDrawer 
                userId={selectedUserId} 
                onClose={() => setSelectedUserId(null)} 
                onUserUpdated={handleUserUpdated}
            />

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Create New User</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setFormData(initialFormState)
                                    setError(null)
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Close"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 pr-24 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1 text-gray-500 hover:text-gray-700"
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        title="User role"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="moderator">Moderator</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        title="User status"
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.emailVerified}
                                        onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Mark email as verified</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.sendWelcomeEmail}
                                        onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Send welcome email with login details</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setFormData(initialFormState)
                                    setError(null)
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateUser}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {saving ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
