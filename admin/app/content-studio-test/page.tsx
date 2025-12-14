'use client'

import React from 'react'
import { DynamicContentManager } from '../../components/cms/DynamicContentManager'

export default function ContentStudioTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <DynamicContentManager />
      </div>
    </div>
  )
}
