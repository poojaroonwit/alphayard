'use client'

import React from 'react'
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Props {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  onClearFilters?: () => void
}

export const EmptyState: React.FC<Props> = ({ title, description, action, onClearFilters }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="mx-auto h-12 w-12 text-gray-400">
        <DocumentTextIcon />
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {action.label}
          </button>
        )}
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export default EmptyState


