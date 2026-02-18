'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  TagIcon,
  PencilIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { ContentPage, ContentComponent } from '../../types/content'

// Content Version Interface
export interface ContentVersion {
  id: string
  contentId: string
  version: number
  title: string
  content: ContentPage
  createdAt: string
  createdBy: string
  createdByName?: string
  changeDescription?: string
  isAutoSave: boolean
  size: number
  tags?: string[]
  isPublished?: boolean
  publishedAt?: string
  publishedBy?: string
  publishedByName?: string
}

// Version Comparison Interface
export interface VersionComparison {
  versionA: ContentVersion
  versionB: ContentVersion
  changes: VersionChange[]
  summary: {
    added: number
    modified: number
    removed: number
  }
}

export interface VersionChange {
  type: 'added' | 'modified' | 'removed'
  path: string
  oldValue?: any
  newValue?: any
  description: string
}

// Content Versioning Component
interface ContentVersioningProps {
  contentId: string
  currentContent: ContentPage
  onVersionRestore: (version: ContentVersion) => void
  onVersionCompare: (versionA: ContentVersion, versionB: ContentVersion) => void
  onVersionDelete: (versionId: string) => void
  onVersionCreate: (content: ContentPage, description?: string) => void
  className?: string
}

export const ContentVersioning: React.FC<ContentVersioningProps> = ({
  contentId,
  currentContent,
  onVersionRestore,
  onVersionCompare,
  onVersionDelete,
  onVersionCreate,
  className = ''
}) => {
  // State management
  const [versions, setVersions] = useState<ContentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDescription, setCreateDescription] = useState('')
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareResult, setCompareResult] = useState<VersionComparison | null>(null)
  const [filter, setFilter] = useState<'all' | 'manual' | 'autosave' | 'published'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'version' | 'size' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load versions
  const loadVersions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API call
      const mockVersions: ContentVersion[] = [
        {
          id: 'v1',
          contentId,
          version: 1,
          title: 'Initial version',
          content: currentContent,
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          createdBy: 'user1',
          createdByName: 'John Doe',
          changeDescription: 'Initial content creation',
          isAutoSave: false,
          size: 1024,
          tags: ['initial', 'draft']
        },
        {
          id: 'v2',
          contentId,
          version: 2,
          title: 'Added hero section',
          content: currentContent,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          createdBy: 'user1',
          createdByName: 'John Doe',
          changeDescription: 'Added hero section with call-to-action',
          isAutoSave: false,
          size: 2048,
          tags: ['feature', 'hero']
        },
        {
          id: 'v3',
          contentId,
          version: 3,
          title: 'Auto-save',
          content: currentContent,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          createdBy: 'user1',
          createdByName: 'John Doe',
          changeDescription: 'Auto-save',
          isAutoSave: true,
          size: 2156,
          tags: ['autosave']
        } as any,
        {
          id: 'v4',
          contentId,
          version: 4,
          title: 'Published version',
          content: { ...currentContent, status: 'published' },
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdBy: 'user1',
          createdByName: 'John Doe',
          changeDescription: 'Published to production',
          isAutoSave: false,
          size: 2156,
          tags: ['published', 'production'],
          isPublished: true,
          publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          publishedBy: 'user1',
          publishedByName: 'John Doe'
        }
      ]
      
      setVersions(mockVersions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [contentId, currentContent])

  // Filter and sort versions
  const filteredVersions = versions
    .filter(version => {
      const matchesFilter = filter === 'all' || 
        (filter === 'manual' && !version.isAutoSave) ||
        (filter === 'autosave' && version.isAutoSave) ||
        (filter === 'published' && version.isPublished)
      
      const matchesSearch = searchTerm === '' ||
        version.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.changeDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.createdByName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'version':
          comparison = a.version - b.version
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'author':
          comparison = (a.createdByName || '').localeCompare(b.createdByName || '')
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Create new version
  const handleCreateVersion = useCallback(async () => {
    try {
      await onVersionCreate(currentContent, createDescription)
      setShowCreateModal(false)
      setCreateDescription('')
      loadVersions()
    } catch (error) {
      console.error('Failed to create version:', error)
    }
  }, [currentContent, createDescription, onVersionCreate, loadVersions])

  // Restore version
  const handleRestoreVersion = useCallback(async (version: ContentVersion) => {
    try {
      await onVersionRestore(version)
      loadVersions()
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }, [onVersionRestore, loadVersions])

  // Compare versions
  const handleCompareVersions = useCallback(async () => {
    if (selectedVersions.length !== 2) return
    
    const [versionA, versionB] = selectedVersions.map(id => 
      versions.find(v => v.id === id)
    ).filter(Boolean) as ContentVersion[]
    
    if (versionA && versionB) {
      const comparison = compareVersions(versionA, versionB)
      setCompareResult(comparison)
      setShowCompareModal(true)
    }
  }, [selectedVersions, versions])

  // Delete version
  const handleDeleteVersion = useCallback(async (versionId: string) => {
    try {
      await onVersionDelete(versionId)
      loadVersions()
    } catch (error) {
      console.error('Failed to delete version:', error)
    }
  }, [onVersionDelete, loadVersions])

  // Compare two versions
  const compareVersions = useCallback((versionA: ContentVersion, versionB: ContentVersion): VersionComparison => {
    const changes: VersionChange[] = []
    
    // Compare basic properties
    if (versionA.content.title !== versionB.content.title) {
      changes.push({
        type: 'modified',
        path: 'title',
        oldValue: versionA.content.title,
        newValue: versionB.content.title,
        description: 'Title changed'
      })
    }
    
    if (versionA.content.slug !== versionB.content.slug) {
      changes.push({
        type: 'modified',
        path: 'slug',
        oldValue: versionA.content.slug,
        newValue: versionB.content.slug,
        description: 'Slug changed'
      })
    }
    
    if (versionA.content.status !== versionB.content.status) {
      changes.push({
        type: 'modified',
        path: 'status',
        oldValue: versionA.content.status,
        newValue: versionB.content.status,
        description: 'Status changed'
      })
    }
    
    // Compare components
    const componentsA = versionA.content.components || []
    const componentsB = versionB.content.components || []
    
    // Find added components
    componentsB.forEach(compB => {
      if (!componentsA.find(compA => compA.id === compB.id)) {
        changes.push({
          type: 'added',
          path: `components.${compB.id}`,
          newValue: compB,
          description: `Added ${compB.type} component`
        })
      }
    })
    
    // Find removed components
    componentsA.forEach(compA => {
      if (!componentsB.find(compB => compB.id === compA.id)) {
        changes.push({
          type: 'removed',
          path: `components.${compA.id}`,
          oldValue: compA,
          description: `Removed ${compA.type} component`
        })
      }
    })
    
    // Find modified components
    componentsA.forEach(compA => {
      const compB = componentsB.find(comp => comp.id === compA.id)
      if (compB && JSON.stringify(compA) !== JSON.stringify(compB)) {
        changes.push({
          type: 'modified',
          path: `components.${compA.id}`,
          oldValue: compA,
          newValue: compB,
          description: `Modified ${compA.type} component`
        })
      }
    })
    
    const summary = {
      added: changes.filter(c => c.type === 'added').length,
      modified: changes.filter(c => c.type === 'modified').length,
      removed: changes.filter(c => c.type === 'removed').length
    }
    
    return {
      versionA,
      versionB,
      changes,
      summary
    }
  }, [])

  // Load versions on mount
  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  if (loading) {
    return (
      <div className={`content-versioning ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading versions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`content-versioning ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load versions</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadVersions}
            className="content-button content-button-primary"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`content-versioning ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
          <p className="text-sm text-gray-500">
            {versions.length} version{versions.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="content-button content-button-primary"
            aria-label="Create new version"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Create Version
          </button>
          {selectedVersions.length === 2 && (
            <button
              onClick={handleCompareVersions}
              className="content-button content-button-secondary"
              aria-label="Compare selected versions"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Compare
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'manual', label: 'Manual' },
            { key: 'autosave', label: 'Auto-save' },
            { key: 'published', label: 'Published' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search versions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="content-input w-full"
          />
        </div>
        
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-')
            setSortBy(newSortBy as any)
            setSortOrder(newSortOrder as any)
          }}
          className="content-input w-48"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="version-desc">Version (high to low)</option>
          <option value="version-asc">Version (low to high)</option>
          <option value="size-desc">Size (large to small)</option>
          <option value="size-asc">Size (small to large)</option>
          <option value="author-asc">Author (A to Z)</option>
          <option value="author-desc">Author (Z to A)</option>
        </select>
      </div>

      {/* Versions List */}
      <div className="space-y-3">
        {filteredVersions.map((version) => (
          <VersionItem
            key={version.id}
            version={version}
            isSelected={selectedVersions.includes(version.id)}
            onSelect={(selected) => {
              if (selected) {
                setSelectedVersions(prev => [...prev, version.id])
              } else {
                setSelectedVersions(prev => prev.filter(id => id !== version.id))
              }
            }}
            onRestore={() => handleRestoreVersion(version)}
            onDelete={() => handleDeleteVersion(version.id)}
            onCompare={(otherVersion) => {
              const comparison = compareVersions(version, otherVersion)
              setCompareResult(comparison)
              setShowCompareModal(true)
            }}
          />
        ))}
      </div>

      {filteredVersions.length === 0 && (
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No versions found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first version to get started'}
          </p>
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Create New Version</h3>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version Description
              </label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="content-input w-full"
                rows={3}
                placeholder="Describe the changes in this version..."
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVersion}
                className="content-button content-button-primary"
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && compareResult && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex items-center space-x-3 mb-4">
              <EyeIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Version Comparison</h3>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Version {compareResult.versionA.version}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(compareResult.versionA.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Version {compareResult.versionB.version}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(compareResult.versionB.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {compareResult.summary.added} added
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {compareResult.summary.modified} modified
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {compareResult.summary.removed} removed
                  </span>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {compareResult.changes.map((change, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      change.type === 'added' ? 'bg-green-50 border-green-200' :
                      change.type === 'modified' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        change.type === 'added' ? 'bg-green-500' :
                        change.type === 'modified' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {change.description}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {change.path}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowCompareModal(false)}
                className="content-button content-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Version Item Component
interface VersionItemProps {
  version: ContentVersion
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onRestore: () => void
  onDelete: () => void
  onCompare: (otherVersion: ContentVersion) => void
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isSelected,
  onSelect,
  onRestore,
  onDelete,
  onCompare
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`version-item ${isSelected ? 'selected' : ''}`}>
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              Version {version.version}
            </span>
            {version.isPublished && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <ShareIcon className="h-3 w-3 mr-1" />
                Published
              </span>
            )}
            {version.isAutoSave && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Auto-save
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {version.title || version.changeDescription || 'No description'}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-3 w-3" />
              <span>{version.createdByName || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{new Date(version.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="h-3 w-3" />
              <span>{formatFileSize(version.size)}</span>
            </div>
          </div>
          
          {version.tags && version.tags.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              {version.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onRestore}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Restore this version"
            aria-label="Restore this version"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete this version"
            aria-label="Delete this version"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Versioning Styles
export const versioningStyles = `
.content-versioning {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.version-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.version-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.version-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.content-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.content-button-primary {
  background: #3b82f6;
  color: white;
}

.content-button-primary:hover {
  background: #2563eb;
}

.content-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.content-button-secondary:hover {
  background: #e5e7eb;
}

.content-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.content-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`
