'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { 
  CloudArrowUpIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { productionCmsService } from '../../services/productionCmsService'

interface MediaFile {
  id: string
  url: string
  name: string
  size: number
  type: string
  createdAt: string
}

interface MediaUploadProps {
  onUploadComplete?: (file: MediaFile) => void
  onUploadError?: (error: string) => void
  accept?: string
  maxSize?: number // in MB
  folder?: string
  multiple?: boolean
  className?: string
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*,audio/*',
  maxSize = 10, // 10MB default
  folder = 'uploads',
  multiple = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const fileType = file.type
    const isValidType = acceptedTypes.some(acceptedType => {
      if (acceptedType.endsWith('/*')) {
        const baseType = acceptedType.replace('/*', '')
        return fileType.startsWith(baseType)
      }
      return fileType === acceptedType
    })

    if (!isValidType) {
      return `File type not supported. Accepted types: ${accept}`
    }

    return null
  }, [accept, maxSize])

  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    
    if (!multiple && fileArray.length > 1) {
      setError('Only one file can be uploaded at a time')
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        
        // Validate file
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          onUploadError?.(validationError)
          continue
        }

        // Upload file
        try {
          const uploadedFile = await productionCmsService.uploadMedia(file, {
            folder,
            resize: file.type.startsWith('image/'),
            quality: 85
          })

          setUploadedFiles(prev => [...prev, uploadedFile as any])
          onUploadComplete?.(uploadedFile as any)
          
          // Update progress
          setUploadProgress(((i + 1) / fileArray.length) * 100)
        } catch (uploadError) {
          console.error('Upload failed:', uploadError)
          setError(`Failed to upload ${file.name}`)
          onUploadError?.(`Failed to upload ${file.name}`)
        }
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [validateFile, multiple, folder, onUploadComplete, onUploadError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const removeFile = useCallback(async (fileId: string) => {
    try {
      await productionCmsService.deleteMedia(fileId)
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('Failed to delete file:', error)
      setError('Failed to delete file')
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return PhotoIcon
    if (type.startsWith('video/')) return VideoCameraIcon
    if (type.startsWith('audio/')) return SpeakerWaveIcon
    return DocumentIcon
  }

  return (
    <div className={`media-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`upload-area ${
          isDragging ? 'upload-area-dragging' : ''
        } ${uploading ? 'upload-area-uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="upload-content">
          {uploading ? (
            <div className="text-center">
              <ArrowPathIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading...</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{Math.round(uploadProgress)}% complete</p>
            </div>
          ) : (
            <div className="text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isDragging ? 'Drop files here' : 'Upload Media'}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop files here, or click to select files
              </p>
              <div className="text-sm text-gray-500">
                <p>Accepted formats: {accept}</p>
                <p>Max file size: {maxSize}MB</p>
                {multiple && <p>Multiple files allowed</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => {
              const IconComponent = getFileIcon(file.type)
              return (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-8 w-8 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View file"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete file"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Media Gallery Component
interface MediaGalleryProps {
  onSelect?: (file: MediaFile) => void
  onClose?: () => void
  className?: string
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  onSelect,
  onClose,
  className = ''
}) => {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await productionCmsService.getMediaList({ pageSize: 50 })
      setFiles(response.data)
    } catch (err) {
      setError('Failed to load media files')
      console.error('Failed to load media files:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return PhotoIcon
    if (type.startsWith('video/')) return VideoCameraIcon
    if (type.startsWith('audio/')) return SpeakerWaveIcon
    return DocumentIcon
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className={`media-gallery ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading media files...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`media-gallery ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load media</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`media-gallery ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Media Gallery</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media files</h3>
          <p className="text-gray-500">Upload some files to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => {
            const IconComponent = getFileIcon(file.type)
            const isSelected = selectedFile?.id === file.id
            
            return (
              <div
                key={file.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFile(file)}
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                    <IconComponent className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <EyeIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                  <p className="text-xs truncate">{file.name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(file.size)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedFile && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)} • {new Date(selectedFile.createdAt).toLocaleDateString()}
              </p>
            </div>
            {onSelect && (
              <button
                onClick={() => onSelect(selectedFile)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
export const mediaUploadStyles = `
.media-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-area-dragging {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
}

.upload-area-uploading {
  border-color: #3b82f6;
  background: #eff6ff;
  cursor: not-allowed;
}

.upload-content {
  pointer-events: none;
}

.media-gallery {
  max-height: 400px;
  overflow-y: auto;
}
`
