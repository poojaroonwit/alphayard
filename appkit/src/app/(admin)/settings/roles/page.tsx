'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { adminService, Role, Permission, PermissionsByModule, RoleWithPermissions } from '../../../../services/adminService'
import { Card, CardBody } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { Button } from '../../../../components/ui/Button'
import { 
    ShieldCheckIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    UserGroupIcon,
    KeyIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { toast } from '@/hooks/use-toast'

// Color options for roles
const ROLE_COLORS = [
    { name: 'Purple', value: '#7C3AED' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Indigo', value: '#6366F1' },
]

// Module display names and icons
const MODULE_INFO: Record<string, { label: string; description: string }> = {
    dashboard: { label: 'Dashboard', description: 'View dashboard statistics and reports' },
    users: { label: 'Users', description: 'Manage mobile app users' },
    circles: { label: 'Circles', description: 'Manage circles/families' },
    collections: { label: 'Collections', description: 'Manage data collections and entities' },
    pages: { label: 'Pages', description: 'Manage CMS pages' },
    navigation: { label: 'Navigation', description: 'Manage navigation menus' },
    appearance: { label: 'Appearance', description: 'Manage themes and styles' },
    localization: { label: 'Localization', description: 'Manage translations and languages' },
    marketing: { label: 'Marketing', description: 'Manage marketing content' },
    billing: { label: 'Billing', description: 'Manage billing and subscriptions' },
    engagement: { label: 'Engagement', description: 'Manage engagement features' },
    social: { label: 'Social', description: 'Moderate social content' },
    database: { label: 'Database', description: 'Access database explorer' },
    settings: { label: 'Settings', description: 'Manage system settings' },
    admin_users: { label: 'Admin Users', description: 'Manage admin accounts' },
    roles: { label: 'Roles & Permissions', description: 'Manage roles and permissions' },
    safety: { label: 'Safety', description: 'Manage safety incidents' },
    flows: { label: 'Flows', description: 'Manage automation flows' },
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<PermissionsByModule>({})
    const [loading, setLoading] = useState(true)
    const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)
    const [saving, setSaving] = useState(false)
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        priority: 0,
    })
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [rolesData, permsData] = await Promise.all([
                adminService.getRoles(),
                adminService.getPermissionsGrouped(),
            ])
            setRoles(rolesData || [])
            setPermissions(permsData || {})
            // Expand all modules by default
            setExpandedModules(new Set(Object.keys(permsData || {})))
        } catch (err: any) {
            console.error('Error fetching data:', err)
            toast({ title: 'Error', description: 'Failed to load roles and permissions', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSelectRole = async (role: Role) => {
        try {
            const fullRole = await adminService.getRole(role.id)
            setSelectedRole(fullRole)
            // Set selected permissions based on role's permissions
            const permIds = new Set(fullRole.permission_details?.map(p => p.id) || [])
            setSelectedPermissions(permIds)
        } catch (err: any) {
            toast({ title: 'Error', description: 'Failed to load role details', variant: 'destructive' })
        }
    }

    const handleCreateRole = () => {
        setEditingRole(null)
        setFormData({ name: '', description: '', color: '#3B82F6', priority: 0 })
        setSelectedPermissions(new Set())
        setShowRoleModal(true)
    }

    const handleEditRole = (role: RoleWithPermissions) => {
        setEditingRole(role)
        setFormData({
            name: role.name,
            description: role.description || '',
            color: role.color || '#3B82F6',
            priority: role.priority || 0,
        })
        setSelectedPermissions(new Set(role.permission_details?.map(p => p.id) || []))
        setShowRoleModal(true)
    }

    const handleSaveRole = async () => {
        if (!formData.name.trim()) {
            toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' })
            return
        }

        setSaving(true)
        try {
            const permissionIds = Array.from(selectedPermissions)
            
            if (editingRole) {
                await adminService.updateRole(editingRole.id, {
                    name: formData.name,
                    description: formData.description,
                    color: formData.color,
                    priority: formData.priority,
                    permission_ids: permissionIds,
                })
                toast({ title: 'Success', description: 'Role updated successfully' })
            } else {
                await adminService.createRole({
                    name: formData.name,
                    description: formData.description,
                    color: formData.color,
                    priority: formData.priority,
                    permission_ids: permissionIds,
                })
                toast({ title: 'Success', description: 'Role created successfully' })
            }
            
            setShowRoleModal(false)
            fetchData()
            if (selectedRole && editingRole?.id === selectedRole.id) {
                handleSelectRole(selectedRole)
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to save role', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteRole = async (role: Role) => {
        if (role.is_system) {
            toast({ title: 'Error', description: 'Cannot delete system roles', variant: 'destructive' })
            return
        }
        if ((role.user_count || 0) > 0) {
            toast({ title: 'Error', description: 'Cannot delete role with assigned users', variant: 'destructive' })
            return
        }
        if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) return

        try {
            await adminService.deleteRole(role.id)
            toast({ title: 'Success', description: 'Role deleted successfully' })
            if (selectedRole?.id === role.id) {
                setSelectedRole(null)
            }
            fetchData()
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to delete role', variant: 'destructive' })
        }
    }

    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev => {
            const next = new Set(prev)
            if (next.has(permissionId)) {
                next.delete(permissionId)
            } else {
                next.add(permissionId)
            }
            return next
        })
    }

    const toggleModuleExpanded = (module: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev)
            if (next.has(module)) {
                next.delete(module)
            } else {
                next.add(module)
            }
            return next
        })
    }

    const selectAllModulePermissions = (module: string) => {
        const modulePerms = permissions[module] || []
        setSelectedPermissions(prev => {
            const next = new Set(prev)
            modulePerms.forEach(p => next.add(p.id))
            return next
        })
    }

    const deselectAllModulePermissions = (module: string) => {
        const modulePerms = permissions[module] || []
        setSelectedPermissions(prev => {
            const next = new Set(prev)
            modulePerms.forEach(p => next.delete(p.id))
            return next
        })
    }

    const isAllModuleSelected = (module: string): boolean => {
        const modulePerms = permissions[module] || []
        return modulePerms.every(p => selectedPermissions.has(p.id))
    }

    const isSomeModuleSelected = (module: string): boolean => {
        const modulePerms = permissions[module] || []
        return modulePerms.some(p => selectedPermissions.has(p.id)) && !isAllModuleSelected(module)
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
                Loading roles and permissions...
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
                    <p className="text-gray-500">Manage admin roles and their permissions across all modules</p>
                </div>
                <button
                    onClick={handleCreateRole}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Create Role
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                {/* Roles List */}
                <div className="lg:col-span-1 flex flex-col">
                    <Card variant="frosted" className="flex-1 flex flex-col overflow-hidden">
                        <CardBody className="p-4 flex flex-col flex-1 overflow-hidden">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0">
                                <ShieldCheckIcon className="w-5 h-5" />
                                Roles ({roles.length})
                            </h3>
                            <div className="space-y-2 flex-1 overflow-y-auto">
                                {roles.map(role => (
                                    <div
                                        key={role.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            selectedRole?.id === role.id
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => handleSelectRole(role)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: role.color || '#3B82F6' }}
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{role.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {role.permission_count || 0} permissions · {role.user_count || 0} users
                                                    </div>
                                                </div>
                                            </div>
                                            {role.is_system && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                    System
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Role Details */}
                <div className="lg:col-span-2 flex flex-col">
                    {selectedRole ? (
                        <Card variant="frosted" className="flex-1 flex flex-col overflow-hidden">
                            <CardBody className="p-6 flex flex-col flex-1 overflow-hidden">
                                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: selectedRole.color || '#3B82F6' }}
                                        >
                                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{selectedRole.name}</h2>
                                            <p className="text-gray-500 text-sm">{selectedRole.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditRole(selectedRole)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit Role"
                                        >
                                            <PencilIcon className="w-5 h-5 text-gray-600" />
                                        </button>
                                        {!selectedRole.is_system && (
                                            <button
                                                onClick={() => handleDeleteRole(selectedRole)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Role"
                                            >
                                                <TrashIcon className="w-5 h-5 text-red-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900">{selectedRole.permission_count || 0}</div>
                                        <div className="text-sm text-gray-500">Permissions</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900">{selectedRole.user_count || 0}</div>
                                        <div className="text-sm text-gray-500">Users</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900">{selectedRole.priority || 0}</div>
                                        <div className="text-sm text-gray-500">Priority</div>
                                    </div>
                                </div>

                                {/* Permissions by Module */}
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0">
                                    <KeyIcon className="w-5 h-5" />
                                    Assigned Permissions
                                </h3>
                                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                                    {Object.entries(permissions).map(([module, perms]) => {
                                        const assignedPerms = perms.filter(p => 
                                            selectedRole.permission_details?.some(pd => pd.id === p.id)
                                        )
                                        if (assignedPerms.length === 0) return null
                                        
                                        const info = MODULE_INFO[module] || { label: module, description: '' }
                                        
                                        return (
                                            <div key={module} className="border border-gray-200 rounded-lg p-3">
                                                <div className="font-medium text-gray-900 mb-2">{info.label}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {assignedPerms.map(p => (
                                                        <span
                                                            key={p.id}
                                                            className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                                                        >
                                                            {p.action}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardBody>
                        </Card>
                    ) : (
                        <Card variant="frosted" className="flex-1 flex flex-col">
                            <CardBody className="p-12 text-center flex flex-col items-center justify-center flex-1">
                                <ShieldCheckIcon className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-gray-500">Select a role to view its details and permissions</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create/Edit Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </h2>
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                                title="Close"
                                aria-label="Close modal"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <Input
                                    label="Role Name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., content_editor"
                                    disabled={editingRole?.is_system}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                    <div className="flex gap-2">
                                        {ROLE_COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={() => setFormData({ ...formData, color: c.value })}
                                                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                                    formData.color === c.value ? 'border-gray-900 scale-110' : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <Input
                                    label="Description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of this role"
                                />
                            </div>

                            {/* Permissions */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Permissions</h3>
                                    <span className="text-sm text-gray-500">
                                        {selectedPermissions.size} selected
                                    </span>
                                </div>
                                <div className="space-y-2 border border-gray-200 rounded-lg divide-y divide-gray-200">
                                    {Object.entries(permissions).map(([module, perms]) => {
                                        const info = MODULE_INFO[module] || { label: module, description: '' }
                                        const isExpanded = expandedModules.has(module)
                                        const allSelected = isAllModuleSelected(module)
                                        const someSelected = isSomeModuleSelected(module)
                                        
                                        return (
                                            <div key={module}>
                                                {/* Module Header */}
                                                <div
                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                                    onClick={() => toggleModuleExpanded(module)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{info.label}</div>
                                                            <div className="text-xs text-gray-500">{info.description}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => allSelected ? deselectAllModulePermissions(module) : selectAllModulePermissions(module)}
                                                            className={`px-2 py-1 text-xs rounded ${
                                                                allSelected
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : someSelected
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}
                                                        >
                                                            {allSelected ? 'All' : someSelected ? 'Some' : 'None'}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Module Permissions */}
                                                {isExpanded && (
                                                    <div className="px-6 pb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {perms.map(perm => (
                                                            <label
                                                                key={perm.id}
                                                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                                    selectedPermissions.has(perm.id)
                                                                        ? 'bg-green-50 border border-green-200'
                                                                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPermissions.has(perm.id)}
                                                                    onChange={() => togglePermission(perm.id)}
                                                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900">{perm.action}</div>
                                                                    {perm.description && (
                                                                        <div className="text-xs text-gray-500 truncate">{perm.description}</div>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <Button
                                variant="outline"
                                onClick={() => setShowRoleModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-gray-900 text-white hover:bg-gray-800"
                                onClick={handleSaveRole}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
