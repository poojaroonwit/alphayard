'use client'

import { useState, useEffect } from 'react'
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
import { adminService, AdminUser, Role, Permission, UserGroup } from '../../services/adminService'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'

export function AdminConsoleUsers() {
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
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'viewer',
    status: 'active',
    department: '',
    permissions: [] as string[],
    password: ''
  })

  useEffect(() => {
    loadData()
  }, [])

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

      setUsers(usersData)
      setRoles(rolesData)
      setPermissions(permissionsData)
      setUserGroups(userGroupsData)
    } catch (error) {
      console.error('Error loading admin console data:', error)
      // Show error message to user
      alert('Failed to load admin console data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'viewer',
      status: 'active',
      department: '',
      permissions: [],
      password: ''
    })
    setShowForm(true)
  }

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      department: user.department || '',
      permissions: user.permissions,
      password: ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await adminService.updateAdminUser(editingUser.id, formData as Partial<AdminUser>)
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ))
      } else {
        // Create new user
        const newUser = await adminService.createAdminUser(formData as any)
        setUsers(prev => [...prev, newUser])
      }
      setShowForm(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error saving admin user:', error)
      alert('Failed to save admin user. Please try again.')
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Admins</p>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Admins</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(user => user.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {users.filter(user => user.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Verified</p>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter(user => user.isVerified).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="frosted">
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search admin users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardBody>
      </Card>

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
            <Button variant="primary">
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
            <Button variant="primary">
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

  if (showForm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card variant="frosted">
          <CardBody>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Edit Admin User' : 'Create Admin User'}
              </h2>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card variant="frosted">
          <CardBody>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    required
                    className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <Input
                label="Department"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />

              {!editingUser && (
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder="At least 8 characters"
                />
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200/50">
                <Button type="submit" variant="primary">
                  {editingUser ? 'Update Admin User' : 'Create Admin User'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    )
  }

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
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <LockClosedIcon className="w-8 h-8 text-gray-900" />
              Admin Console Users
            </h2>
              <p className="text-sm text-gray-500">Manage admin console users, roles, and permissions</p>
            </div>
            {activeTab === 'users' && (
              <Button variant="primary" onClick={handleCreate}>
                <UserPlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Admin User
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Card variant="frosted">
        <CardBody className="p-0">
          <nav className="flex space-x-1 p-2" role="tablist">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              role="tab"
              aria-selected={activeTab === 'users'}
            >
              <UserIcon className="h-4 w-4" aria-hidden="true" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'roles'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              role="tab"
              aria-selected={activeTab === 'roles'}
            >
              <KeyIcon className="h-4 w-4" aria-hidden="true" />
              Roles & Permissions
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'groups'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              role="tab"
              aria-selected={activeTab === 'groups'}
            >
              <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
              User Groups
            </button>
          </nav>
        </CardBody>
      </Card>

      {/* Tab Content */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'roles' && renderRolesTab()}
      {activeTab === 'groups' && renderGroupsTab()}
    </div>
  )
}
