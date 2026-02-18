'use client'

import React, { useState, useEffect } from 'react'

interface BackendStatusIndicatorProps {
  className?: string
}

export const BackendStatusIndicator: React.FC<BackendStatusIndicatorProps> = ({ className = '' }: BackendStatusIndicatorProps) => {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        setIsChecking(true)
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        setIsBackendOnline(response.ok)
      } catch (error) {
        console.log('Backend is offline, using mock data')
        setIsBackendOnline(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkBackendStatus()
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Show a subtle indicator in the corner
  if (isChecking || isBackendOnline === null) {
    return null
  }

  if (!isBackendOnline) {
    return (
      <div className={`fixed bottom-4 right-4 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Server Offline - Using Mock Data</span>
      </div>
    )
  }

  return null
}

export default BackendStatusIndicator
