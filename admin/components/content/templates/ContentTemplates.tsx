'use client'

import React from 'react'
import { useContentContext } from '../providers/ContentProvider'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { RectangleStackIcon } from '@heroicons/react/24/outline'

/**
 * Content templates component
 * Handles template selection and creation
 */
export const ContentTemplates: React.FC = () => {
  const { state, actions, contentData } = useContentContext()

  if (!state.showTemplates) {
    return null
  }

  const handleCreateFromTemplate = async (template: any) => {
    try {
      await contentData.createFromTemplate(template.id, {
        title: `${template.name} - Copy`,
        slug: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      })
      actions.showNotification('success', 'Content created from template successfully')
      actions.setShowTemplates(false)
    } catch (error) {
      actions.showNotification('error', 'Failed to create content from template')
    }
  }

  if (contentData.loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <LoadingState />
        </div>
      </div>
    )
  }

  if (contentData.error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <ErrorState
            title="Failed to load templates"
            description="We couldn't load the content templates. Please try again."
            error={contentData.error}
            onRetry={contentData.refreshTemplates}
          />
        </div>
      </div>
    )
  }

  if (contentData.templates.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <EmptyState
            icon={<RectangleStackIcon className="h-12 w-12" />}
            title="No templates available"
            description="There are no content templates available at the moment."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Content Templates</h2>
          <button
            onClick={() => actions.setShowTemplates(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentData.templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCreateFromTemplate(template)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{template.type}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
