'use client'

import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Card, CardBody } from './Card'

interface ErrorStateProps {
  title: string
  description: string
  error?: string | null
  onRetry?: () => void
}

/**
 * Error state component with macOS design
 * Displays when there's an error loading content
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  description, 
  error, 
  onRetry 
}) => {
  return (
    <Card variant="frosted" className="max-w-md mx-auto">
      <CardBody className="text-center py-12">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-6 font-mono text-left max-w-sm mx-auto">
            {error}
          </div>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
