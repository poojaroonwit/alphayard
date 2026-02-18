'use client'

import React, { useEffect, useState } from 'react'
import { adminService, AdminUser, Role } from '../../../../services/adminService'
import { Card, CardBody } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { Button } from '../../../../components/ui/Button'
import { AdminUserDetailDrawer } from '../../../../components/settings/AdminUserDetailDrawer'
import { 
    UserIcon, 
    XMarkIcon,
    PlusIcon,
    KeyIcon,
    EyeIcon
} from '@heroicons/react/24/outline'
import { toast } from '@/hooks/use-toast'

// Role color mapping
const getRoleColor = (roleName: string, roleColor?: string): string => {
    if (roleColor) return roleColor
    switch (roleName) {
        case 'super_admin': return '#7C3AED'
        case 'admin': return '#10B981'
        case 'editor': return '#3B82F6'
        case 'content_manager': return '#F59E0B'
        case 'viewer': return '#6B7280'
        default: return '#3B82F6'
    }
}

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
    const [inviteForm, setInviteForm] = useState({ email: '', password: '', firstName: '', lastName: '', roleId: '' })
    const [inviting, setInviting] = useState(false)
    const [changingRole, setChangingRole] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [usersData, rolesData] = await Promise.all([
                adminService.getAdminUsers(),
                adminService.getRoles()
            ])
            setAdmins(usersData || [])
            setRoles(rolesData || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async () => {
        if (!inviteForm.email || !inviteForm.password) {
            toast({ title: 'Error', description: 'Email and password are required', variant: 'destructive' })
            return
        }
        setInviting(true)
        try {
            await adminService.createAdminUser({
                email: inviteForm.email,
                password: inviteForm.password,
                firstName: inviteForm.firstName,
                lastName: inviteForm.lastName,
                roleId: inviteForm.roleId || undefined
            })
            toast({ title: 'Success', description: 'Admin user created successfully' })
            setShowInviteModal(false)
            setInviteForm({ email: '', password: '', firstName: '', lastName: '', roleId: '' })
            fetchData()
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to create admin', variant: 'destructive' })
        } finally {
            setInviting(false)
        }
    }

    const handleViewAdmin = (admin: AdminUser) => {
        setSelectedAdminId(admin.id)
    }

    const handleCloseDrawer = () => {
        setSelectedAdminId(null)
    }

    const handleQuickRoleChange = async (admin: AdminUser, newRoleId: string) => {
        if (!newRoleId) return
        
        setChangingRole(admin.id)
        try {
            await adminService.assignRoleToUser(admin.id, newRoleId)
            toast({ title: 'Success', description: 'Role updated successfully' })
            fetchData()
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to update role', variant: 'destructive' })
        } finally {
            setChangingRole(null)
        }
    }

    const handleRevoke = async (admin: AdminUser) => {
        if (!confirm(`Are you sure you want to revoke access for ${admin.firstName} ${admin.lastName}?`)) return
        try {
            await adminService.deleteAdminUser(admin.id)
            toast({ title: 'Success', description: 'Admin access revoked' })
            fetchData()
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to revoke access', variant: 'destructive' })
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading administrators...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
                    <p className="text-gray-500">Manage system administrators and their roles</p>
                </div>
                <div className="flex gap-3">
                    <a 
                        href="/settings/roles"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <KeyIcon className="w-4 h-4" />
                        Manage Roles
                    </a>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Invite Admin
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Role Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {roles.slice(0, 5).map(role => {
                    const count = admins.filter(a => a.role === role.name).length
                    return (
                        <div 
                            key={role.id}
                            className="p-4 bg-white rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getRoleColor(role.name, role.color) }}
                                />
                                <span className="text-sm font-medium text-gray-700">{role.name.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{count}</div>
                        </div>
                    )
                })}
            </div>

            {/* Admin Users List */}
            <Card variant="frosted">
                <CardBody className="p-0">
                    {admins.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No administrators found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/50">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {admins.map((admin) => {
                                        const currentRole = roles.find(r => r.name === admin.role)
                                        const roleColor = getRoleColor(admin.role, currentRole?.color)
                                        
                                        return (
                                            <tr 
                                                key={admin.id} 
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                onClick={() => handleViewAdmin(admin)}
                                            >
                                                {/* User */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            {admin.avatar ? (
                                                                <img src={admin.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <UserIcon className="w-5 h-5 text-blue-600" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">
                                                                {admin.firstName} {admin.lastName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                {/* Email */}
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600">{admin.email}</span>
                                                </td>
                                                
                                                {/* Role */}
                                                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                    <select
                                                        value={currentRole?.id || ''}
                                                        onChange={(e) => handleQuickRoleChange(admin, e.target.value)}
                                                        disabled={changingRole === admin.id}
                                                        className="h-8 px-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 bg-white"
                                                        style={{ borderColor: roleColor }}
                                                        title={`Change role for ${admin.firstName} ${admin.lastName}`}
                                                        aria-label={`Change role for ${admin.firstName} ${admin.lastName}`}
                                                    >
                                                        {roles.map(role => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.name.replace(/_/g, ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                
                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        admin.status === 'active' 
                                                            ? 'bg-green-50 text-green-700' 
                                                            : admin.status === 'suspended'
                                                            ? 'bg-red-50 text-red-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            admin.status === 'active' 
                                                                ? 'bg-green-500' 
                                                                : admin.status === 'suspended'
                                                                ? 'bg-red-500'
                                                                : 'bg-gray-400'
                                                        }`} />
                                                        {admin.status || 'active'}
                                                    </span>
                                                </td>
                                                
                                                {/* Joined */}
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500">
                                                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </td>
                                                
                                                {/* Actions */}
                                                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleViewAdmin(admin)}
                                                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRevoke(admin)}
                                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Revoke Access"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Invite Admin Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Invite Admin</h2>
                            <button 
                                onClick={() => setShowInviteModal(false)} 
                                className="p-2 hover:bg-gray-100 rounded-full"
                                title="Close"
                                aria-label="Close modal"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="First Name" 
                                    value={inviteForm.firstName} 
                                    onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})}
                                    placeholder="John"
                                />
                                <Input 
                                    label="Last Name" 
                                    value={inviteForm.lastName} 
                                    onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})}
                                    placeholder="Doe"
                                />
                            </div>
                            <Input 
                                label="Email" 
                                type="email"
                                value={inviteForm.email} 
                                onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                                placeholder="admin@example.com"
                            />
                            <Input 
                                label="Password" 
                                type="password"
                                value={inviteForm.password} 
                                onChange={e => setInviteForm({...inviteForm, password: e.target.value})}
                                placeholder="Minimum 8 characters"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select 
                                    value={inviteForm.roleId}
                                    onChange={e => setInviteForm({...inviteForm, roleId: e.target.value})}
                                    className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    title="Select role for new admin"
                                    aria-label="Select role for new admin"
                                >
                                    <option value="">Select a role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name.replace(/_/g, ' ')} - {role.description || 'No description'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setShowInviteModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                                onClick={handleInvite}
                                disabled={inviting}
                            >
                                {inviting ? 'Creating...' : 'Create Admin'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin User Detail Drawer */}
            <AdminUserDetailDrawer
                adminId={selectedAdminId}
                onClose={handleCloseDrawer}
                onUserUpdated={fetchData}
            />
        </div>
    )
}
