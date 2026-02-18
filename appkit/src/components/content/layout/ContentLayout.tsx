'use client'

import React from 'react'
import { useContentContext } from '../providers/ContentProvider'

interface ContentLayoutProps {
  children: React.ReactNode
}

/**
 * Main layout component for content management
 * Handles the overall structure and responsive design
 */
export const ContentLayout: React.FC<ContentLayoutProps> = ({ children }) => {
  const { state } = useContentContext()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area - full width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {children}
        </div>
      </div>

      {/* Modal Overlays */}
      {state.showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Content
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this content? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => useContentContext().actions.setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => useContentContext().actions.handleDelete(state.showDeleteConfirm!)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {state.notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            state.notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{state.notification.message}</span>
              <button
                onClick={useContentContext().actions.clearNotification}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
