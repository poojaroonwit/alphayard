'use client'

import React from 'react'

interface Props {
  title: string
  description: string
  error?: any
  onRetry?: () => void
}

export const ErrorState: React.FC<Props> = ({ title, description, error, onRetry }) => {
  return (
    <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
      <h3 className="text-lg font-semibold text-red-700">{title}</h3>
      <p className="mt-2 text-sm text-red-600">{description}</p>
      {error && (
        <pre className="mt-3 text-xs text-red-500 whitespace-pre-wrap">{String(error)}</pre>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorState


