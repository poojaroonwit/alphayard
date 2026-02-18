'use client'

import React from 'react'
import { DynamicContentManager } from './DynamicContentManager'

export const ContentStudioDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <DynamicContentManager />
      </div>
    </div>
  )
}
