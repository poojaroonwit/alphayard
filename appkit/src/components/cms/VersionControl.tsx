'use client'

import React, { useState, useEffect } from 'react'
import { 
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface ContentVersion {
  id: string
  version: number
  title: string
  content: any
  createdAt: string
  createdBy: string
  changeDescription?: string
  isAutoSave: boolean
  size: number
}

interface VersionControlProps {
  isOpen: boolean
  onClose: () => void
  currentContent: any
  onRestore: (version: ContentVersion) => void
  onSaveVersion: (description?: string) => void
}

export const VersionControl: React.FC<VersionControlProps> = ({
  isOpen,
  onClose,
  currentContent,
  onRestore,
  onSaveVersion
}) => {
  const [versions, setVersions] = useState<ContentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [compareVersion, setCompareVersion] = useState<ContentVersion | null>(null)
  const [newVersionDescription, setNewVersionDescription] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadVersions()
    }
  }, [isOpen])

  const loadVersions = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockVersions: ContentVersion[] = [
        {
          id: 'v1',
          version: 1,
          title: 'Initial Version',
          content: { components: [] },
          createdAt: '2024-01-15T10:30:00Z',
          createdBy: 'John Doe',
          changeDescription: 'Initial content creation',
          isAutoSave: false,
          size: 1024
        },
        {
          id: 'v2',
          version: 2,
          title: 'Added Hero Section',
          content: { components: [{ type: 'hero', props: {} }] },
          createdAt: '2024-01-15T11:45:00Z',
          createdBy: 'John Doe',
          changeDescription: 'Added hero section with CTA',
          isAutoSave: false,
          size: 2048
        },
        {
          id: 'v3',
          version: 3,
          title: 'Auto Save',
          content: { components: [{ type: 'hero', props: {} }, { type: 'text', props: {} }] },
          createdAt: '2024-01-15T12:15:00Z',
          createdBy: 'System',
          changeDescription: 'Auto-saved changes',
          isAutoSave: true,
          size: 3072
        },
        {
          id: 'v4',
          version: 4,
          title: 'Updated Content',
          content: currentContent,
          createdAt: '2024-01-15T13:20:00Z',
          createdBy: 'John Doe',
          changeDescription: 'Updated text content and styling',
          isAutoSave: false,
          size: 4096
        }
      ]
      
      setVersions(mockVersions)
    } catch (error) {
      console.error('Error loading versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = (version: ContentVersion) => {
    if (confirm(`Are you sure you want to restore version ${version.version}? This will replace your current content.`)) {
      onRestore(version)
      onClose()
    }
  }

  const handleSaveVersion = async () => {
    if (!newVersionDescription.trim()) {
      alert('Please enter a description for this version')
      return
    }

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newVersion: ContentVersion = {
        id: `v${versions.length + 1}`,
        version: versions.length + 1,
        title: newVersionDescription,
        content: currentContent,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
        changeDescription: newVersionDescription,
        isAutoSave: false,
        size: JSON.stringify(currentContent).length
      }
      
      setVersions(prev => [newVersion, ...prev])
      setNewVersionDescription('')
      setShowSaveDialog(false)
      onSaveVersion(newVersionDescription)
    } catch (error) {
      console.error('Error saving version:', error)
      alert('Error saving version')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getVersionChanges = (version: ContentVersion) => {
    const prevVersion = versions.find(v => v.version === version.version - 1)
    if (!prevVersion) return 'Initial version'
    
    const currentComponents = version.content.components?.length || 0
    const prevComponents = prevVersion.content.components?.length || 0
    
    if (currentComponents > prevComponents) {
      return `Added ${currentComponents - prevComponents} component(s)`
    } else if (currentComponents < prevComponents) {
      return `Removed ${prevComponents - currentComponents} component(s)`
    } else {
      return 'Modified existing components'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b bg-gray-50">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="w-full btn btn-primary mb-2"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Save Current Version
          </button>
          {selectedVersion && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="flex-1 btn btn-secondary"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                {showCompare ? 'Hide' : 'Compare'}
              </button>
              <button
                onClick={() => handleRestore(selectedVersion)}
                className="flex-1 btn btn-primary"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Restore
              </button>
            </div>
          )}
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          Version {version.version}
                        </span>
                        {version.isAutoSave && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Auto
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-1">
                        {version.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {version.changeDescription || getVersionChanges(version)}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{formatDate(version.createdAt)}</span>
                        <span>by {version.createdBy}</span>
                        <span>{formatSize(version.size)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedVersion(version)
                          setShowCompare(true)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Preview"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestore(version)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Restore"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compare View */}
        {showCompare && selectedVersion && (
          <div className="border-t bg-gray-50 p-4">
            <h3 className="font-semibold mb-3">Version Comparison</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Current Version</span>
                <span className="text-gray-500">
                  {formatSize(JSON.stringify(currentContent).length)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Version {selectedVersion.version}</span>
                <span className="text-gray-500">
                  {formatSize(selectedVersion.size)}
                </span>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => handleRestore(selectedVersion)}
                  className="w-full btn btn-primary btn-sm"
                >
                  Restore This Version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Version Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Version</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Version Description
                </label>
                <input
                  type="text"
                  value={newVersionDescription}
                  onChange={(e) => setNewVersionDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Describe the changes in this version..."
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVersion}
                  className="flex-1 btn btn-primary"
                >
                  Save Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
