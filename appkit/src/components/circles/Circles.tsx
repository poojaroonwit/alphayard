'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { adminService, Circle } from '../../services/adminService'

export function Families() {
  const [query, setQuery] = useState('')
  const [families, setFamilies] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Circle' as 'Circle' | 'friends' | 'sharehouse'
  })

  useEffect(() => {
    loadFamilies()
  }, [])

  const loadFamilies = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use generic collection endpoint instead of deprecated getFamilies()
      const response = await adminService.getCollectionItems('circles')
      // Map entities to Circle format
      const circles: Circle[] = (response.entities || []).map((entity: any) => ({
        id: entity.id,
        name: entity.attributes?.name || entity.data?.name || '',
        description: entity.attributes?.description || entity.data?.description,
        type: entity.attributes?.type || entity.data?.type || 'Circle',
        inviteCode: entity.attributes?.inviteCode || entity.data?.inviteCode,
        createdAt: entity.createdAt || entity.created_at,
        updatedAt: entity.updatedAt || entity.updated_at,
        ownerId: entity.ownerId || entity.owner_id,
        status: entity.status || 'active',
        memberCount: entity.attributes?.member_count || entity.data?.member_count || 0,
        owner: entity.attributes?.owner || entity.data?.owner
      }))
      setFamilies(circles)
    } catch (err) {
      console.error('Error loading families:', err)
      setError('Failed to load families. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({ name: '', description: '', type: 'Circle' })
    setEditingCircle(null)
    setShowCreateForm(true)
  }

  const handleEdit = (Circle: Circle) => {
    setFormData({
      name: Circle.name,
      description: Circle.description || '',
      type: Circle.type
    })
    setEditingCircle(Circle)
    setShowCreateForm(true)
  }

  const handleSave = async () => {
    try {
      if (editingCircle) {
        // Use generic collection endpoint instead of deprecated updateCircle()
        await adminService.updateCollectionItem('circles', editingCircle.id, formData)
      } else {
        // Use generic collection endpoint instead of deprecated createCircle()
        await adminService.createCollectionItem('circles', formData)
      }
      setShowCreateForm(false)
      setEditingCircle(null)
      await loadFamilies()
    } catch (err) {
      console.error('Error saving Circle:', err)
      setError('Failed to save Circle. Please try again.')
    }
  }

  const handleDelete = async (Circle: Circle) => {
    if (confirm(`Are you sure you want to delete "${Circle.name}"?`)) {
      try {
        // Use generic collection endpoint instead of deprecated deleteCircle()
        await adminService.deleteCollectionItem('circles', Circle.id)
        await loadFamilies()
      } catch (err) {
        console.error('Error deleting Circle:', err)
        setError('Failed to delete Circle. Please try again.')
      }
    }
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return families
    const q = query.toLowerCase()
    return families.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.owner?.firstName && f.owner.firstName.toLowerCase().includes(q)) ||
      (f.owner?.lastName && f.owner.lastName.toLowerCase().includes(q)) ||
      (f.owner?.email && f.owner.email.toLowerCase().includes(q))
    )
  }, [families, query])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Families Management</h2>
            <p className="text-lg text-gray-600 leading-relaxed">Create, edit, and manage Circle groups and their members</p>
          </div>
          <button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
          >
            <PlusIcon className="h-5 w-5" />
            New Circle
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">{families.length}</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Families</div>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{families.reduce((a, f) => a + f.memberCount, 0)}</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Members</div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">{families.filter(f => f.status === 'active').length}</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Families</div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search families or owners..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
            {filtered.length} results
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <div className="mt-2 text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={loadFamilies}
                  className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold text-red-800 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Families List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserGroupIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No families found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or create a new Circle.</p>
          <button 
            onClick={handleCreate}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Create First Circle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900 text-lg">{f.name}</div>
                    <div className="text-sm text-gray-500">
                      Owner: {f.owner ? `${f.owner.firstName} ${f.owner.lastName}` : 'Unknown'}
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                      {f.type}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200" title="View">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(f)} 
                    className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200" 
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(f)} 
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200" 
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{f.memberCount} members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${f.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-medium ${f.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                    {f.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {f.description && (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  {f.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Circle Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingCircle ? 'Edit Circle' : 'Create New Circle'}
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Circle Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter Circle name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  placeholder="Enter Circle description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value="Circle">Circle</option>
                  <option value="friends">Friends</option>
                  <option value="sharehouse">Sharehouse</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.name.trim()}
              >
                {editingCircle ? 'Update Circle' : 'Create Circle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

