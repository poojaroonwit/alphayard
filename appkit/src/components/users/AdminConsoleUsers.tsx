'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  UserIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  KeyIcon,
  UserGroupIcon,
  PlusIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { adminService, AdminUser, Role, Permission } from '../../services/adminService'
import { UserGroup } from '../../services/identityService'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup
} from '../ui/dropdown-menu'
import { FunnelIcon } from '@heroicons/react/24/outline'

export function AdminConsoleUsers() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <AdminConsoleUsersContent />
    </Suspense>
  )
}

function AdminConsoleUsersContent() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'groups'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  // @ts-ignore - permissions for future use
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAdminUserDrawerOpen, setIsAdminUserDrawerOpen] = useState(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'general' | 'activity'>('general')
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'viewer',
    status: 'active',
    department: '',
    permissions: [] as string[],
    points: 0,
    password: '',
    avatarUrl: ''
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const userId = searchParams?.get('userId')
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId)
      if (user) {
        handleEdit(user)
      }
    }
  }, [searchParams, users])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load data from API
      const [usersData, rolesData, permissionsData, userGroupsData] = await Promise.all([
        adminService.getAdminUsers(),
        adminService.getRoles(),
        adminService.getPermissions(),
        adminService.getUserGroups()
      ])

      setUsers(usersData?.users || [])
      setRoles(Array.isArray(rolesData) ? rolesData : [])
      setPermissions(Array.isArray(permissionsData) ? permissionsData : [])
      setUserGroups(userGroupsData?.groups || [])
    } catch (error) {
      console.error('Error loading admin console data:', error)
      // Show error message to user
      alert('Failed to load admin console data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreate = () => {
    setSelectedAdminUserId(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'viewer',
      status: 'active',
      department: '',
      permissions: [],
      points: 0,
      password: '',
      avatarUrl: ''
    })
    setIsAdminUserDrawerOpen(true)
    setActiveDrawerTab('general')
  }

  const handleEdit = (user: AdminUser) => {
    setSelectedAdminUserId(user.id)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      department: user.department || '',
      permissions: user.permissions,
      points: user.points || 0,
      password: '',
      avatarUrl: user.avatarUrl || ''
    })
    setIsAdminUserDrawerOpen(true)
    setActiveDrawerTab('general')
  }

  const handleSave = async () => {
    try {
      if (selectedAdminUserId) {
        // Update existing user
        const updatedUser = await adminService.updateAdminUser(selectedAdminUserId, formData as Partial<AdminUser>)
        setUsers(prev => prev.map(user => 
          user.id === selectedAdminUserId ? updatedUser : user
        ))
      } else {
        // Create new user
        const newUser = await adminService.createAdminUser(formData as any)
        setUsers(prev => [...prev, newUser])
      }
      setIsAdminUserDrawerOpen(false)
      setSelectedAdminUserId(null)
    } catch (error) {
      console.error('Error saving admin user:', error)
      alert('Failed to save admin user. Please try again.')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const response = await adminService.uploadAvatar(file, selectedAdminUserId || undefined)
      setFormData(prev => ({ ...prev, avatarUrl: response.url }))
    } catch (error) {
      console.error('Avatar upload failed:', error)
      alert('Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this admin user?')) {
      try {
        await adminService.deleteAdminUser(id)
        setUsers(prev => prev.filter(user => user.id !== id))
      } catch (error) {
        console.error('Error deleting admin user:', error)
        alert('Failed to delete admin user. Please try again.')
      }
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updatedUser = await adminService.updateAdminUserStatus(id, status)
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status. Please try again.')
    }
  }

  const handleAddRole = async () => {
    const name = prompt('Enter new role name:')
    if (!name) return

    try {
      setLoading(true)
      await adminService.createRole({ 
        name, 
        permissions: [], 
        description: `Custom role ${name}`,
        color: '#3B82F6' 
      })
      await loadData()
    } catch (error) {
      console.error('Error creating role:', error)
      alert('Failed to create role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddGroup = async () => {
    const name = prompt('Enter new group name:')
    if (!name) return

    try {
      setLoading(true)
      await adminService.createUserGroup({ 
        name, 
        description: `Custom group ${name}`,
        permissions: [],
        color: '#10B981'
      })
      await loadData()
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setLoading(false)
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

  // @ts-ignore - utility function for future use
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'gray'
      case 'pending': return 'yellow'
      case 'suspended': return 'red'
      default: return 'gray'
    }
  }

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search admin users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 px-4 flex items-center gap-2 rounded-xl border-gray-300/50 bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-all">
              <FunnelIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {(filterRole !== 'all' || filterStatus !== 'all') && (
                <div className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {(filterRole !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                title="Filter by role"
                className="macos-input w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                title="Filter by status"
                className="macos-input w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <DropdownMenuSeparator />
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-gray-500 hover:text-gray-900 h-8 font-medium"
              onClick={() => { setFilterRole('all'); setFilterStatus('all') }}
            >
              Reset all filters
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="h-12 w-12" />}
          title={users.length === 0 ? 'No admin users available' : 'No admin users found'}
          description={users.length === 0 
            ? 'Unable to load admin users from the server. Please check your connection or contact support.'
            : 'Try adjusting your search or filter criteria.'
          }
          action={users.length === 0 ? {
            label: 'Retry Loading Admin Users',
            onClick: loadData
          } : undefined}
        />
      ) : (
        <Card variant="frosted">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-200/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.firstName} className="h-10 w-10 rounded-full" />
                              ) : (
                                <UserIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              {user.isVerified ? (
                                <ShieldCheckIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
                              ) : (
                                <ShieldExclamationIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1.5 mb-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            <span className="truncate max-w-xs">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <PhoneIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="info" 
                          size="sm"
                          style={{ backgroundColor: getRoleColor(user.role), color: 'white' }}
                        >
                          {getRoleName(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              user.status === 'active' ? 'success' :
                              user.status === 'pending' ? 'warning' :
                              user.status === 'suspended' ? 'error' :
                              'default'
                            }
                            size="sm"
                          >
                            {user.status}
                          </Badge>
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                            title={`Update status for ${user.firstName} ${user.lastName}`}
                            className="macos-input text-xs px-2 py-1 rounded-lg border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department || 'No department'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            aria-label="Edit admin user"
                          >
                            <PencilIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            aria-label="Delete admin user"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )

  const renderRolesTab = () => (
    <div className="space-y-6">
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Roles & Permissions</h3>
              <p className="text-sm text-gray-500">Manage admin roles and their permissions</p>
            </div>
            <Button variant="primary" onClick={handleAddRole}>
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Role
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} variant="frosted" hoverable>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: role.color }}
                    aria-hidden="true"
                  ></div>
                  <h4 className="text-base font-semibold text-gray-900">{role.name}</h4>
                </div>
                {role.is_system && (
                  <Badge variant="info" size="sm">System</Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              
              <div className="mb-4">
                <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Permissions:</h5>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="default" size="sm">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <PencilIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  Edit
                </Button>
                {!role.is_system && (
                  <Button variant="ghost" size="sm">
                    <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                    Delete
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderGroupsTab = () => (
    <div className="space-y-6">
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">User Groups</h3>
              <p className="text-sm text-gray-500">Organize admin users into groups with shared permissions</p>
            </div>
            <Button variant="primary" onClick={handleAddGroup}>
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Group
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userGroups.map((group) => (
          <Card key={group.id} variant="frosted" hoverable>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: group.color }}
                    aria-hidden="true"
                  ></div>
                  <h4 className="text-base font-semibold text-gray-900">{group.name}</h4>
                </div>
                <Badge variant="info" size="sm">{group.memberCount} members</Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{group.description}</p>
              
              <div className="mb-4">
                <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Group Permissions:</h5>
                <div className="flex flex-wrap gap-1.5">
                  {group.permissions.map((permission) => (
                    <Badge key={permission} variant="default" size="sm">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <PencilIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm">
                  <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading admin users">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <LockClosedIcon className="w-8 h-8 text-gray-900" />
              Admin Console Users
            </h2>
            <p className="text-sm text-gray-500">Manage admin console users, roles, and permissions</p>
          </div>
          {activeTab === 'users' && (
            <Button variant="primary" onClick={handleCreate} className="rounded-xl shadow-lg shadow-blue-500/20">
              <UserPlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Admin User
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-1 inline-flex w-fit">
        <nav className="flex space-x-1" role="tablist">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
            role="tab"
            aria-selected={activeTab === 'users' ? 'true' : 'false'}
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'roles'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
            role="tab"
            aria-selected={activeTab === 'roles' ? 'true' : 'false'}
          >
            <KeyIcon className="h-4 w-4" aria-hidden="true" />
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'groups'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
            role="tab"
            aria-selected={activeTab === 'groups' ? 'true' : 'false'}
          >
            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
            User Groups
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'roles' && renderRolesTab()}
      {activeTab === 'groups' && renderGroupsTab()}

      {isAdminUserDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsAdminUserDrawerOpen(false)} />
          <div className="fixed top-4 right-4 bottom-4 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedAdminUserId ? 'Edit User' : 'Create User'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAdminUserDrawerOpen(false)} className="rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
                <TrashIcon className="w-5 h-5 text-gray-400" />
              </Button>
            </div>

            {/* Tabs inside Drawer */}
            <div className="px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-[73px] z-10">
              <nav className="flex space-x-6">
                {[
                  { id: 'general', label: 'General' },
                  { id: 'activity', label: 'Activity Logs' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDrawerTab(tab.id as any)}
                    className={`py-4 text-sm font-semibold transition-all relative ${
                      activeDrawerTab === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                    {activeDrawerTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 dark:bg-zinc-900/50">
              {activeDrawerTab === 'general' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                  {/* Avatar Section */}
                  <div className="flex flex-col md:flex-row md:items-center gap-6 pb-8 border-b border-gray-100 dark:border-zinc-800">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-700 shadow-xl">
                        {formData.avatarUrl ? (
                          <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-12 h-12 text-gray-300" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <LoadingSpinner size="sm" className="text-white" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95">
                        <PlusIcon className="w-5 h-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Profile Photo</h3>
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Update your avatar image. Recommended size 400x400px.</p>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
                  {/* General Info Section */}
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="w-full md:w-1/3 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Full Name</label>
                        <p className="text-[10px] text-gray-400 mt-0.5">Primary identification name.</p>
                      </div>
                      <div className="w-full md:w-2/3 grid grid-cols-2 gap-3">
                        <Input 
                          placeholder="First Name"
                          type="text" 
                          value={formData.firstName} 
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                          required 
                          className="bg-white dark:bg-zinc-900"
                        />
                        <Input 
                          placeholder="Last Name"
                          type="text" 
                          value={formData.lastName} 
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                          required 
                          className="bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="w-full md:w-1/3 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Email Address</label>
                        <p className="text-[10px] text-gray-400 mt-0.5">Used for login and notifications.</p>
                      </div>
                      <div className="w-full md:w-2/3">
                        <Input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                          required 
                          className="bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="w-full md:w-1/3 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Phone Number</label>
                        <p className="text-[10px] text-gray-400 mt-0.5">Optional contact number.</p>
                      </div>
                      <div className="w-full md:w-2/3">
                        <Input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                          className="bg-white dark:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                      <div className="w-full md:w-1/3 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Account Access</label>
                        <p className="text-[10px] text-gray-400 mt-0.5">Role and system permissions.</p>
                      </div>
                      <div className="w-full md:w-2/3 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Access Level / Role</label>
                          <select 
                            title="Select role" 
                            value={formData.role} 
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} 
                            required 
                            className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 dark:bg-zinc-800/80 dark:border-zinc-700/50 dark:text-white"
                          >
                            <option value="" disabled>Select role</option>
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</label>
                          <select 
                            title="Select status" 
                            value={formData.status} 
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} 
                            className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 dark:bg-zinc-800/80 dark:border-zinc-700/50 dark:text-white"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                      <div className="w-full md:w-1/3 pt-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Organization</label>
                        <p className="text-[10px] text-gray-400 mt-0.5">Reward points and department.</p>
                      </div>
                      <div className="w-full md:w-2/3 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Reward Points</label>
                          <Input 
                            type="number" 
                            value={formData.points} 
                            onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })} 
                            className="bg-white dark:bg-zinc-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Department Name</label>
                          <Input 
                            type="text" 
                            value={formData.department} 
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                            className="bg-white dark:bg-zinc-900"
                            placeholder="e.g. Engineering"
                          />
                        </div>
                      </div>
                    </div>

                    {!selectedAdminUserId && (
                      <div className="flex flex-col md:flex-row md:items-start gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                        <div className="w-full md:w-1/3 pt-2">
                          <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Security</label>
                          <p className="text-[10px] text-gray-400 mt-0.5">Initial login credentials.</p>
                        </div>
                        <div className="w-full md:w-2/3">
                          <Input 
                            type="password" 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                            required 
                            placeholder="At least 8 characters" 
                            className="bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-gray-200/50 dark:border-zinc-800/50">
                    <Button type="submit" variant="primary" className="flex-1 h-12 rounded-xl text-base font-semibold shadow-lg shadow-blue-500/20">
                      {selectedAdminUserId ? 'Save Changes' : 'Create User'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setIsAdminUserDrawerOpen(false)} className="flex-1 h-12 rounded-xl text-base font-semibold">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ClockIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-[240px] mx-auto mt-2">
                      User activity tracking and audit logs will be displayed here soon.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
