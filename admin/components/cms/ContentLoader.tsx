'use client'

import React, { useState, useEffect } from 'react'
import { cmsService } from '../../services/cmsService'

interface ContentPage {
  id: string
  title: string
  slug: string
  type: string
  status: string
  content: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

interface ContentLoaderProps {
  children: (data: { 
    content: ContentPage[]
    loading: boolean
    error: string | null
    retry: () => void
  }) => React.ReactNode
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({ children }) => {
  const [content, setContent] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const pages = await cmsService.getContentPages()
      setContent(pages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content'
      setError(errorMessage)
      console.error('Content loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [])

  return (
    <>
      {children({
        content,
        loading,
        error,
        retry: loadContent
      })}
    </>
  )
}

export default ContentLoader
