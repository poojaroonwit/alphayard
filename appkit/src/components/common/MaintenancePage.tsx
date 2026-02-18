'use client'

import React from 'react'
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

interface MaintenancePageProps {
  onRetry?: () => void
}

export function MaintenancePage({ onRetry }: MaintenancePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-macos-lg">
              <WrenchScrewdriverIcon className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-900" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Server Unavailable
          </h1>
          <p className="text-lg text-gray-600">
            We're unable to connect to the backend server.
          </p>
          <p className="text-sm text-gray-500">
            The server might be temporarily down for maintenance or experiencing connectivity issues. Please try again in a few moments.
          </p>
        </div>

        {/* Status Details */}
        <div className="bg-white rounded-xl shadow-macos-lg p-6 border border-gray-200">
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Offline
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Service</span>
              <span className="text-sm text-gray-600">Backend API</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-macos-md hover:shadow-macos-lg"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Retry Connection
          </button>
          
          <p className="text-xs text-gray-500">
            If the problem persists, please contact your system administrator.
          </p>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-gray-200">
          <details className="text-left">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              Troubleshooting Tips
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc list-inside">
              <li>Check your internet connection</li>
              <li>Verify the backend server is running</li>
              <li>Ensure the API URL is correctly configured</li>
              <li>Check for any firewall or network restrictions</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}
