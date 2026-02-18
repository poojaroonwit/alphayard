'use client'

import React, { useEffect, useState } from 'react'
import {
    identityService,
    UserGroup,
} from '../../../../services/identityService'
import { GlobalUser, userService } from '../../../../services/userService'
import {
    UserGroupIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    UsersIcon,
    MagnifyingGlassIcon,
    UserPlusIcon,
    UserMinusIcon,
} from '@heroicons/react/24/outline'

interface GroupMember {
    id: string
    email: string
    firstName?: string
    lastName?: string
    avatar?: string
    addedAt: string
    addedBy?: string
}

export default function UserGroupsPage() {
    const [groups, setGroups] = useState<UserGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
    const [membersLoading, setMembersLoading] = useState(false)
    const [showGroupModal, setShowGroupModal] = useState(false)
    const [showAddMemberModal, setShowAddMemberModal] = useState(false)
    const [formData, setFormData] = useState<Partial<UserGroup>>({})
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    
    // Search users state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<GlobalUser[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])

    useEffect(() => {
        loadGroups()
    }, [])

    const loadGroups = async () => {
        setLoading(true)
        try {
            const { groups } = await identityService.getUserGroups()
            setGroups(groups)
        } catch (error) {
            console.error('Error loading groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadGroupMembers = async (groupId: string) => {
        setMembersLoading(true)
        try {
            const { members } = await identityService.getGroupMembers(groupId)
            setGroupMembers(members)
        } catch (error) {
            console.error('Error loading members:', error)
        } finally {
            setMembersLoading(false)
        }
    }

    const selectGroup = (group: UserGroup) => {
        setSelectedGroup(group)
        loadGroupMembers(group.id)
    }

    const openCreateModal = () => {
        setFormData({
            groupName: '',
            description: '',
            groupType: 'custom',
            isActive: true,
            metadata: {}
        })
        setShowGroupModal(true)
    }

    const openEditModal = (group: UserGroup) => {
        setFormData(group)
        setShowGroupModal(true)
    }

    const handleSaveGroup = async () => {
        if (!formData.groupName?.trim()) {
            setError('Group name is required')
            return
        }
        
        setSaving(true)
        setError(null)
        
        try {
            if (formData.id) {
                await identityService.updateUserGroup(formData.id, formData)
                setSuccess('Group updated successfully')
            } else {
                await identityService.createUserGroup(formData)
                setSuccess('Group created successfully')
            }
            setShowGroupModal(false)
            loadGroups()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to save group')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group? All member associations will be removed.')) return
        
        try {
            await identityService.deleteUserGroup(groupId)
            setSuccess('Group deleted successfully')
            if (selectedGroup?.id === groupId) {
                setSelectedGroup(null)
                setGroupMembers([])
            }
            loadGroups()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to delete group')
        }
    }

    const searchUsers = async () => {
        if (!searchQuery.trim()) return
        
        setSearchLoading(true)
        try {
            const users = await userService.getGlobalUsers()
            const filtered = users.filter(u => 
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (u.lastName && u.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            // Filter out existing members
            const memberIds = groupMembers.map(m => m.id)
            setSearchResults(filtered.filter(u => !memberIds.includes(u.id)))
        } catch (error) {
            console.error('Error searching users:', error)
        } finally {
            setSearchLoading(false)
        }
    }

    const addMembersToGroup = async () => {
        if (!selectedGroup || selectedUsers.length === 0) return
        
        setSaving(true)
        setError(null)
        
        try {
            for (const userId of selectedUsers) {
                await identityService.addUserToGroup(selectedGroup.id, userId)
            }
            setSuccess(`Added ${selectedUsers.length} member(s) to group`)
            setShowAddMemberModal(false)
            setSelectedUsers([])
            setSearchResults([])
            setSearchQuery('')
            loadGroupMembers(selectedGroup.id)
            loadGroups() // Refresh member count
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to add members')
        } finally {
            setSaving(false)
        }
    }

    const removeMemberFromGroup = async (userId: string) => {
        if (!selectedGroup) return
        if (!confirm('Remove this member from the group?')) return
        
        try {
            await identityService.removeUserFromGroup(selectedGroup.id, userId)
            setSuccess('Member removed from group')
            loadGroupMembers(selectedGroup.id)
            loadGroups()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to remove member')
        }
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    return (
        <div className="space-y-6">
            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        {success}
                    </div>
                    <button onClick={() => setSuccess(null)} title="Dismiss" aria-label="Dismiss success message"><XMarkIcon className="w-5 h-5" /></button>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5" />
                        {error}
                    </div>
                    <button onClick={() => setError(null)} title="Dismiss" aria-label="Dismiss error message"><XMarkIcon className="w-5 h-5" /></button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">User Groups</h1>
                        <p className="text-gray-500 text-xs mt-1">Organize users into groups for easier management and permission assignment.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={loadGroups}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button 
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Group
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Groups List */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-gray-900">Groups ({groups.length})</h2>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-12">
                            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No groups created yet</p>
                        </div>
                    ) : (
                        <div className="divide-y max-h-[600px] overflow-y-auto">
                            {groups.map(group => (
                                <div
                                    key={group.id}
                                    onClick={() => selectGroup(group)}
                                    className={`p-4 cursor-pointer transition hover:bg-gray-50 ${
                                        selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                group.groupType === 'system' ? 'bg-purple-100' : 'bg-blue-100'
                                            }`}>
                                                <UserGroupIcon className={`w-5 h-5 ${
                                                    group.groupType === 'system' ? 'text-purple-600' : 'text-blue-600'
                                                }`} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{group.groupName}</h3>
                                                <p className="text-xs text-gray-500">{group.memberCount || 0} members</p>
                                            </div>
                                        </div>
                                        {group.groupType === 'system' && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">System</span>
                                        )}
                                    </div>
                                    {group.description && (
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{group.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Group Details & Members */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {selectedGroup ? (
                        <>
                            {/* Group Header */}
                            <div className="p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                            selectedGroup.groupType === 'system' ? 'bg-purple-100' : 'bg-blue-100'
                                        }`}>
                                            <UserGroupIcon className={`w-7 h-7 ${
                                                selectedGroup.groupType === 'system' ? 'text-purple-600' : 'text-blue-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{selectedGroup.groupName}</h2>
                                            <p className="text-gray-500">{selectedGroup.description || 'No description'}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className={`px-2 py-0.5 text-xs rounded ${
                                                    selectedGroup.groupType === 'system' 
                                                        ? 'bg-purple-100 text-purple-700' 
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {selectedGroup.groupType}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded ${
                                                    selectedGroup.isActive 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {selectedGroup.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(selectedGroup)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                            title="Edit group"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        {selectedGroup.groupType !== 'system' && (
                                            <button
                                                onClick={() => handleDeleteGroup(selectedGroup.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete group"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Members Section */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">
                                        Members ({groupMembers.length})
                                    </h3>
                                    <button
                                        onClick={() => setShowAddMemberModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                    >
                                        <UserPlusIcon className="w-4 h-4" />
                                        Add Members
                                    </button>
                                </div>

                                {membersLoading ? (
                                    <div className="flex justify-center py-8">
                                        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : groupMembers.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <UsersIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">No members in this group</p>
                                    </div>
                                ) : (
                                    <div className="divide-y border rounded-lg max-h-[400px] overflow-y-auto">
                                        {groupMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt="" className="w-10 h-10 rounded-full" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-gray-500 font-medium">
                                                                {(member.firstName?.[0] || member.email[0]).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {member.firstName || member.lastName 
                                                                ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                                                                : member.email}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400">
                                                        Added {new Date(member.addedAt).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => removeMemberFromGroup(member.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Remove from group"
                                                    >
                                                        <UserMinusIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <UserGroupIcon className="w-16 h-16 text-gray-200 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Group</h3>
                            <p className="text-gray-500 max-w-sm">
                                Select a group from the list to view and manage its members, or create a new group.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{formData.id ? 'Edit Group' : 'Create Group'}</h2>
                            <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" title="Close">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                                <input
                                    type="text"
                                    value={formData.groupName || ''}
                                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Engineering Team"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="Group description..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                                <select
                                    value={formData.groupType || 'custom'}
                                    onChange={(e) => setFormData({ ...formData, groupType: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    disabled={formData.groupType === 'system'}
                                    title="Group type"
                                >
                                    <option value="custom">Custom</option>
                                    <option value="department">Department</option>
                                    <option value="team">Team</option>
                                    <option value="project">Project</option>
                                    <option value="system" disabled>System (read-only)</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive !== false}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <span>Group is active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={handleSaveGroup} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Members Modal */}
            {showAddMemberModal && selectedGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Add Members to {selectedGroup.groupName}</h2>
                            <button onClick={() => { setShowAddMemberModal(false); setSearchResults([]); setSelectedUsers([]); setSearchQuery('') }} className="p-2 hover:bg-gray-100 rounded-lg" title="Close">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Search */}
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                        placeholder="Search users by name or email..."
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <button onClick={searchUsers} disabled={searchLoading} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                    {searchLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Search'}
                                </button>
                            </div>

                            {/* Selected Users */}
                            {selectedUsers.length > 0 && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-700">{selectedUsers.length} user(s) selected</p>
                                </div>
                            )}

                            {/* Search Results */}
                            {searchResults.length > 0 ? (
                                <div className="divide-y border rounded-lg max-h-[300px] overflow-y-auto">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUserSelection(user.id)}
                                            className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                                                selectedUsers.includes(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => {}}
                                                className="w-4 h-4 rounded"
                                                title={`Select ${user.email}`}
                                                aria-label={`Select ${user.email}`}
                                            />
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-gray-500 font-medium">
                                                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {user.firstName || user.lastName 
                                                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                                        : user.email}
                                                </p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery && !searchLoading ? (
                                <div className="text-center py-8 text-gray-500">
                                    No users found matching "{searchQuery}"
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Search for users to add to this group
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <button onClick={() => { setShowAddMemberModal(false); setSearchResults([]); setSelectedUsers([]); setSearchQuery('') }} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition">
                                Cancel
                            </button>
                            <button 
                                onClick={addMembersToGroup} 
                                disabled={saving || selectedUsers.length === 0} 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {saving ? 'Adding...' : `Add ${selectedUsers.length || ''} Member${selectedUsers.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
