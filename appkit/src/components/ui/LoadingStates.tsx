'use client'

import React from 'react'
import { 
  DocumentTextIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  SpeakerWaveIcon,
  RectangleStackIcon 
} from '@heroicons/react/24/outline'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-red-600 ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  showIcon?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title = 'Loading...', 
  description = 'Please wait while we load your content',
  showIcon = true,
  icon: Icon = DocumentTextIcon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
      {showIcon && (
        <div className="mb-4">
          <Icon className="h-12 w-12 text-gray-300 animate-pulse" />
        </div>
      )}
      <LoadingSpinner size="lg" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">{description}</p>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  lines = 1 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          } ${index > 0 ? 'mt-2' : ''}`}
          style={{ height: '1rem' }}
        />
      ))}
    </div>
  )
}

interface ContentListSkeletonProps {
  count?: number
}

export const ContentListSkeleton: React.FC<ContentListSkeletonProps> = ({ 
  count = 5 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              <Skeleton className="w-48" />
              <Skeleton className="w-32" lines={1} />
              <div className="flex space-x-2">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <Skeleton className="w-8 h-4 mx-auto mb-1" />
              <Skeleton className="w-12 h-3" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface TemplateGridSkeletonProps {
  count?: number
}

export const TemplateGridSkeleton: React.FC<TemplateGridSkeletonProps> = ({ 
  count = 6 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton className="w-6 h-6 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="w-3/4" />
              <Skeleton className="w-full" lines={1} />
            </div>
          </div>
          <div className="mb-4">
            <Skeleton className="w-full h-32 rounded" />
          </div>
          <Skeleton className="w-full h-10 rounded" />
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon = DocumentTextIcon,
  title,
  description,
  action
}) => {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  error?: string
  onRetry?: () => void
  showDetails?: boolean
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Something went wrong',
  description = 'We encountered an error while loading your content. Please try again.',
  error,
  onRetry,
  showDetails = false
}) => {
  return (
    <div className="text-center py-12">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      
      {showDetails && error && (
        <details className="mb-6 text-left max-w-md mx-auto">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
            Error Details
          </summary>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32">
            {error}
          </div>
        </details>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
