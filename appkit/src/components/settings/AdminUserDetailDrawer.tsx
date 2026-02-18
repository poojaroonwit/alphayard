'use client'

import React, { useState, useEffect } from 'react'
import { adminService, AdminUser, Role } from '../../services/adminService'
import { auditService, AuditLogItem } from '../../services/auditService'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { ToggleSwitch } from '../ui/ToggleSwitch'
import { toast } from '@/hooks/use-toast'
import { 
    XMarkIcon, 
    UserIcon, 
    EnvelopeIcon, 
    ShieldCheckIcon,
    ArrowPathIcon,
    ClockIcon,
    KeyIcon,
    CameraIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

interface AdminUserDetailDrawerProps {
    adminId: string | null
    onClose: () => void
    onUserUpdated: () => void
}

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

const getActivityIcon = (level: string) => {
    switch (level) {
        case 'error':
        case 'critical':
            return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
        case 'warning':
            return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
        case 'info':
        default:
            return <InformationCircleIcon className="w-4 h-4 text-blue-500" />
    }
}

const getLevelBadgeVariant = (level: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (level) {
        case 'error':
        case 'critical':
            return 'error'
        case 'warning':
            return 'warning'
        case 'info':
        default:
            return 'info'
    }
}

export const AdminUserDetailDrawer: React.FC<AdminUserDetailDrawerProps> = ({ 
    adminId, 
    onClose, 
    onUserUpdated 
}) => {
    const [admin, setAdmin] = useState<AdminUser | null>(null)
    const [activeTab, setActiveTab] = useState<'profile' | 'role' | 'activity'>('profile')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    
    // Roles state
    const [roles, setRoles] = useState<Role[]>([])
    const [rolesLoading, setRolesLoading] = useState(false)
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    
    // Activity logs state
    const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([])
    const [activityLoading, setActivityLoading] = useState(false)
    const [activityTotal, setActivityTotal] = useState(0)

    // Form state
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        status: 'active' as string
    })

    useEffect(() => {
        if (adminId) {
            loadAdmin(adminId)
            loadRoles()
        } else {
            setAdmin(null)
            setActivityLogs([])
        }
    }, [adminId])

    useEffect(() => {
        if (adminId && activeTab === 'activity') {
            loadActivityLogs()
        }
    }, [adminId, activeTab])

    const loadAdmin = async (id: string) => {
        setLoading(true)
        try {
            const data = await adminService.getAdminUser(id)
            setAdmin(data)
            setEditForm({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                status: data.status || 'active'
            })
            // Set current role if exists
            const currentRole = roles.find(r => r.name === data.role)
            if (currentRole) {
                setSelectedRoleId(currentRole.id)
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to load admin user details", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const loadRoles = async () => {
        setRolesLoading(true)
        try {
            const rolesData = await adminService.getRoles()
            setRoles(rolesData)
            // If admin is already loaded, set the current role
            if (admin) {
                const currentRole = rolesData.find(r => r.name === admin.role)
                if (currentRole) {
                    setSelectedRoleId(currentRole.id)
                }
            }
        } catch (e) {
            console.error('Failed to load roles:', e)
        } finally {
            setRolesLoading(false)
        }
    }

    const loadActivityLogs = async () => {
        if (!adminId) return
        setActivityLoading(true)
        try {
            const response = await auditService.list({ 
                userId: adminId,
                limit: 50
            })
            setActivityLogs(response.logs || [])
            setActivityTotal(response.total || 0)
        } catch (e) {
            console.error('Failed to load activity logs:', e)
            setActivityLogs([])
        } finally {
            setActivityLoading(false)
        }
    }

    const handleSave = async () => {
        if (!admin) return
        setSaving(true)
        try {
            await adminService.updateAdminUser(admin.id, {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                status: editForm.status as any
            })
            
            // If role changed, update role assignment
            const currentRole = roles.find(r => r.name === admin.role)
            if (selectedRoleId && selectedRoleId !== currentRole?.id) {
                await adminService.assignRoleToUser(admin.id, selectedRoleId)
            }
            
            toast({ title: "Success", description: "Admin user updated successfully" })
            onUserUpdated()
            loadAdmin(admin.id)
        } catch (e) {
            toast({ title: "Error", description: "Failed to update admin user", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleAssignRole = async (roleId: string) => {
        if (!adminId) return
        try {
            await adminService.assignRoleToUser(adminId, roleId)
            setSelectedRoleId(roleId)
            toast({ title: "Success", description: roleId ? "Role assigned successfully" : "Role removed" })
            onUserUpdated()
            loadAdmin(adminId)
        } catch (e) {
            toast({ title: "Error", description: "Failed to assign role", variant: "destructive" })
        }
    }

    const formatTimeAgo = (date: string) => {
        const now = new Date()
        const then = new Date(date)
        const diffMs = now.getTime() - then.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return then.toLocaleDateString()
    }

    if (!adminId) return null

    return (
        <Drawer 
            isOpen={!!adminId} 
            onClose={onClose} 
            side="right" 
            hideHeader 
            noPadding
            className="max-w-xl"
        >
            {loading || !admin ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="relative h-32 bg-gradient-to-r from-purple-600 to-indigo-700 shrink-0">
                        <button 
                            onClick={onClose} 
                            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white backdrop-blur-sm" 
                            title="Close" 
                            aria-label="Close drawer"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative z-20 px-8 -mt-12 pb-6 border-b border-gray-100 flex items-end justify-between">
                        <div className="flex items-end gap-5">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-xl shadow-purple-900/10">
                                    {admin.avatar ? (
                                        <img src={admin.avatar} className="w-full h-full rounded-xl object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                            {admin.firstName?.[0] || admin.email?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mb-1">
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                    {admin.firstName} {admin.lastName}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={admin.status === 'active' ? 'success' : admin.status === 'suspended' ? 'error' : 'warning'}>
                                        {admin.status || 'active'}
                                    </Badge>
                                    <span 
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                        style={{ 
                                            backgroundColor: `${getRoleColor(admin.role)}20`,
                                            color: getRoleColor(admin.role)
                                        }}
                                    >
                                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                                        {admin.role?.replace(/_/g, ' ') || 'Admin'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        • Joined {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-8 bg-white z-10 overflow-x-auto no-scrollbar">
                        <TabButton id="profile" icon={<UserIcon className="w-4 h-4" />} label="Profile" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="role" icon={<ShieldCheckIcon className="w-4 h-4" />} label="Role & Permissions" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="activity" icon={<ClockIcon className="w-4 h-4" />} label="Activity Logs" active={activeTab} onClick={setActiveTab} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</h3>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input 
                                                label="First Name" 
                                                value={editForm.firstName} 
                                                onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} 
                                            />
                                            <Input 
                                                label="Last Name" 
                                                value={editForm.lastName} 
                                                onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} 
                                            />
                                        </div>
                                        <div className="relative">
                                            <EnvelopeIcon className="w-4 h-4 absolute right-3 top-[34px] text-gray-400" />
                                            <Input 
                                                label="Email Address (read-only)" 
                                                value={admin.email} 
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Account Status</h3>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                        <div className="p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-bold text-slate-900">Account Status</span>
                                                    <p className="text-xs text-slate-500">Control access to the admin panel</p>
                                                </div>
                                                <select
                                                    value={editForm.status}
                                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                    className="h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    title="Select status"
                                                    aria-label="Select status"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            </div>
                                        </div>
                                        {admin.lastLogin && (
                                            <div className="p-5 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">Last Login</span>
                                                    <span className="text-xs text-slate-500">Most recent login activity</span>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(admin.lastLogin).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <div className="flex gap-4 pt-4">
                                    <Button 
                                        className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'role' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Role Assignment</h3>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <UserGroupIcon className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Assign Role to Admin</span>
                                        </div>
                                        {rolesLoading ? (
                                            <div className="flex justify-center py-4">
                                                <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <select
                                                    value={selectedRoleId}
                                                    onChange={(e) => handleAssignRole(e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg text-sm"
                                                    title="Select role"
                                                >
                                                    <option value="">Select a role</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name.replace(/_/g, ' ')} {role.is_system ? '(System)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {selectedRoleId && (
                                                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: roles.find(r => r.id === selectedRoleId)?.color || '#7C3AED' }}
                                                        />
                                                        <span className="text-sm font-medium text-purple-700">
                                                            {roles.find(r => r.id === selectedRoleId)?.name.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-xs text-purple-500 ml-auto">
                                                            {roles.find(r => r.id === selectedRoleId)?.permission_count || 0} permissions
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Available Roles</h3>
                                    <div className="space-y-3">
                                        {roles.map(role => {
                                            const isSelected = selectedRoleId === role.id
                                            return (
                                                <div 
                                                    key={role.id}
                                                    onClick={() => handleAssignRole(role.id)}
                                                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                                                        isSelected ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div 
                                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                                style={{ backgroundColor: `${role.color || '#7C3AED'}20` }}
                                                            >
                                                                <ShieldCheckIcon 
                                                                    className="w-5 h-5" 
                                                                    style={{ color: role.color || '#7C3AED' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium text-gray-900">
                                                                        {role.name.replace(/_/g, ' ')}
                                                                    </p>
                                                                    {role.is_system && (
                                                                        <Badge variant="info" size="sm">System</Badge>
                                                                    )}
                                                                    {isSelected && (
                                                                        <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500">
                                                                    {role.description || 'No description'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {role.permission_count || 0} permissions
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Activity History ({activityTotal} events)
                                    </h3>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={loadActivityLogs}
                                        disabled={activityLoading}
                                    >
                                        <ArrowPathIcon className={`w-4 h-4 mr-2 ${activityLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                                
                                {activityLoading ? (
                                    <div className="flex justify-center py-8">
                                        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : activityLogs.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <ClockIcon className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-gray-400">No activity logs found</p>
                                        <p className="text-sm text-gray-300 mt-1">Actions by this admin will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activityLogs.map(log => (
                                            <div 
                                                key={log.id} 
                                                className="bg-white rounded-xl border border-gray-200 p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        log.level === 'error' || log.level === 'critical' 
                                                            ? 'bg-red-100' 
                                                            : log.level === 'warning'
                                                            ? 'bg-amber-100'
                                                            : 'bg-blue-100'
                                                    }`}>
                                                        {getActivityIcon(log.level)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                {log.action}
                                                            </p>
                                                            <Badge variant={getLevelBadgeVariant(log.level)} size="sm">
                                                                {log.level}
                                                            </Badge>
                                                            {log.category && (
                                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                                    {log.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {log.description}
                                                        </p>
                                                        {log.resourceType && log.resourceId && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Resource: {log.resourceType} ({log.resourceId})
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            {formatTimeAgo(log.timestamp)} • {new Date(log.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {log.details && Object.keys(log.details).length > 0 && (
                                                    <details className="mt-3 pt-3 border-t border-gray-100">
                                                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                                            View details
                                                        </summary>
                                                        <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-x-auto">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </Drawer>
    )
}

const TabButton = ({ id, label, icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`px-6 py-4 text-sm font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap shrink-0 ${
            active === id 
                ? 'border-purple-600 text-purple-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
        }`}
    >
        {icon}
        {label}
    </button>
)

export default AdminUserDetailDrawer
