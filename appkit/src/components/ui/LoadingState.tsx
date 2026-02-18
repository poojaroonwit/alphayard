'use client'

import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Loading state component with macOS design
 * Displays a loading spinner with optional message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading...",
  size = 'md'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12" role="status" aria-label={message}>
      <LoadingSpinner size={size} className="mb-4" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
