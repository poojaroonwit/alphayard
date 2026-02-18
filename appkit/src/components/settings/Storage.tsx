'use client'

import { useState, useEffect } from 'react'
import { 
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon as VideoIcon,
  MusicalNoteIcon as MusicIcon,
  ArchiveBoxIcon as ArchiveIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon as DownloadIcon,
  TrashIcon,
  EyeIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface Circle {
  id: string
  name: string
  description: string
  memberCount: number
}

interface FileItem {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'
  size: number
  uploadedBy: string
  uploadedAt: string
  CircleId: string
  tags: string[]
  isShared: boolean
}

export function Storage() {
  const [families, setFamilies] = useState<Circle[]>([])
  const [selectedCircle, setSelectedCircle] = useState<string>('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCircle) {
      loadCircleFiles()
    }
  }, [selectedCircle])

  const loadData = async () => {
    setLoading(true)
    try {
      setFamilies([])
      setSelectedCircle('')
    } catch (error) {
      console.error('Error loading families:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCircleFiles = async () => {
    if (!selectedCircle) return
    
    try {
      setFiles([])
    } catch (error) {
      console.error('Error loading Circle files:', error)
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || file.type === filterType
    return matchesSearch && matchesType
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <PhotoIcon className="h-6 w-6 text-blue-500" />
      case 'video': return <VideoIcon className="h-6 w-6 text-red-500" />
      case 'audio': return <MusicIcon className="h-6 w-6 text-green-500" />
      case 'document': return <DocumentIcon className="h-6 w-6 text-gray-500" />
      case 'archive': return <ArchiveIcon className="h-6 w-6 text-yellow-500" />
      default: return <DocumentIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1) return `${(size * 1024).toFixed(0)} KB`
    if (size < 1024) return `${size.toFixed(1)} MB`
    return `${(size / 1024).toFixed(1)} GB`
  }

  const getSelectedCircleName = () => {
    const Circle = families.find(f => f.id === selectedCircle)
    return Circle?.name || 'Select Circle'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FolderIcon className="h-6 w-6" />
            Circle Storage
          </h2>
          <p className="text-gray-600">Manage files and documents for families</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn btn-primary">
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          Upload Files
        </button>
      </div>

      {/* Circle Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <label className="form-label">Select Circle:</label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="form-select w-auto"
            >
              {families.map(Circle => (
                <option key={Circle.id} value={Circle.id}>
                  {Circle.name} ({Circle.memberCount} members)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCircle && (
        <>
          {/* Storage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-number text-blue-600">{files.length}</div>
              <div className="stat-label">Total Files</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-green-600">
                {files.filter(f => f.isShared).length}
              </div>
              <div className="stat-label">Shared Files</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-purple-600">
                {files.filter(f => f.type === 'image').length}
              </div>
              <div className="stat-label">Photos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-orange-600">
                {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
              </div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-select w-auto"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                  <option value="archive">Archives</option>
                </select>
              </div>
            </div>
          </div>

          {/* Files List */}
          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderIcon className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="empty-state-title">No files found</h3>
              <p className="empty-state-description">
                {searchTerm ? 'Try adjusting your search terms.' : 'Upload your first file to get started.'}
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  {filteredFiles.map((file) => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <div className="font-medium text-gray-900">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()} • {file.uploadedBy}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {file.tags.map(tag => (
                                <span key={tag} className="badge badge-sm badge-info">
                                  {tag}
                                </span>
                              ))}
                              {file.isShared && (
                                <span className="badge badge-sm badge-success">
                                  Shared
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="btn btn-ghost text-blue-600 hover:text-blue-700">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="btn btn-ghost text-green-600 hover:text-green-700">
                            <DownloadIcon className="h-4 w-4" />
                          </button>
                          <button className="btn btn-ghost text-purple-600 hover:text-purple-700">
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button className="btn btn-ghost text-red-600 hover:text-red-700">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Files to {getSelectedCircleName()}</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Drag and drop files here or click to browse</p>
              <button className="btn btn-primary">Choose Files</button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUpload(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => setShowUpload(false)} className="btn btn-primary">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

