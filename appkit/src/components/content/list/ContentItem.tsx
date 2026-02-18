'use client'

import React, { memo, useEffect, useState } from 'react'
import { useContentContext } from '../providers/ContentProvider'
import { useRouter } from 'next/navigation'
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  GlobeAltIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { ContentPage } from '../../../services/productionCmsService'

interface ContentItemProps {
  page: ContentPage
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (page: ContentPage) => void
  onEdit: (page: ContentPage) => void
  onDelete: (pageId: string) => void
  onDuplicate: (page: ContentPage) => void
  onPublish: (page: ContentPage) => void
  onPreview: (page: ContentPage) => void
}

/**
 * Individual content item component
 * Renders content in both grid and list view modes
 */
export const ContentItem: React.FC<ContentItemProps> = memo(({
  page,
  viewMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onPreview
}) => {
  const { actions, contentData } = useContentContext()
  const [routes, setRoutes] = useState<string[]>([])
  const [assigning, setAssigning] = useState<string>('')

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:3001'
        const res = await fetch(`${base}/api/mobile/routes`)
        const data = await res.json()
        setRoutes(data.routes || [])
      } catch {
        setRoutes([])
      }
    }
    loadRoutes()
  }, [])

  const handleAssignRoute = async (route: string) => {
    try {
      setAssigning(route)
      await contentData.updateContent(page.id, { route })
      actions.showNotification('success', 'Route assigned')
    } catch (e) {
      actions.showNotification('error', 'Failed to assign route')
    } finally {
      setAssigning('')
    }
  }
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'marketing': return GlobeAltIcon
      case 'news': return DocumentTextIcon
      case 'inspiration': return PhotoIcon
      case 'popup': return BellIcon
      default: return DocumentTextIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'marketing': return 'bg-blue-100 text-blue-800'
      case 'news': return 'bg-purple-100 text-purple-800'
      case 'inspiration': return 'bg-pink-100 text-pink-800'
      case 'popup': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const TypeIcon = getTypeIcon(page.type)

  if (viewMode === 'grid') {
    return (
      <div 
        className={`relative bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onSelect(page)}
      >
        {/* Selection checkbox */}
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(page)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Type icon */}
        <div className="flex items-center mb-3">
          <TypeIcon className="h-6 w-6 text-gray-500 mr-2" />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
            {page.type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{page.title}</h3>

        {/* Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(page.status)}`}>
            {page.status}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(page.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview(page)
            }}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Preview"
          >
            <EyeIcon className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(page)
            }}
            className="flex-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(page)
            }}
            className="flex-1 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(page.id)
            }}
            className="flex-1 px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div 
      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => onSelect(page)}
    >
      {/* Selection checkbox */}
      <div className="mr-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(page)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Type icon */}
      <div className="mr-4">
        <TypeIcon className="h-6 w-6 text-gray-500" />
      </div>

      {/* Content info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">{page.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
            {page.type}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(page.status)}`}>
            {page.status}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>Slug: {page.slug}</span>
          <span>Updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
          <span>Views: {page.views || 0}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Quick assign route */}
        <select
          value={(page as any).route || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            handleAssignRoute(e.target.value)
          }}
          className="px-2 py-1 border border-gray-300 rounded-md text-xs"
          disabled={!!assigning}
          title="Assign route"
        >
          <option value="">No Route</option>
          {routes.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview(page)
          }}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Preview"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(page)
          }}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate(page)
          }}
          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
          title="Duplicate"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>
        {page.status !== 'published' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPublish(page)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Publish"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(page.id)
          }}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})

ContentItem.displayName = 'ContentItem'
