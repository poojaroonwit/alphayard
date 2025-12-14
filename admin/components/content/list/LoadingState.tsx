'use client'

import React from 'react'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

export const LoadingState: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default LoadingState


