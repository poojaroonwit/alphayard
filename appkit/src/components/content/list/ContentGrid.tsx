'use client'

import React from 'react'

interface ContentGridProps {
  children: React.ReactNode
}

/**
 * Grid layout component for content items
 * Provides responsive grid layout with proper spacing
 */
export const ContentGrid: React.FC<ContentGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  )
}
