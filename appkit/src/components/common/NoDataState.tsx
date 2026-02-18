'use client'

import React from 'react'
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'

interface NoDataStateProps {
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  icon?: React.ComponentType<any>
}

export const NoDataState: React.FC<NoDataStateProps> = ({
  title = 'No content pages found',
  description = 'Get started by creating your first content page.',
  actionText = 'Create Content Page',
  onAction,
  icon: IconComponent = DocumentTextIcon
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <IconComponent className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          {description}
        </p>
        
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}

export default NoDataState
