import { useState, useCallback } from 'react'
import { ContentPage } from '../services/productionCmsService'
import { saveContent, publishContent, duplicateContent } from '../services/contentService'

export interface UseContentActionsReturn {
  saveContent: (content: ContentPage) => Promise<void>
  publishContent: (content: ContentPage) => Promise<void>
  duplicateContent: (content: ContentPage) => Promise<ContentPage | null>
  isSaving: boolean
  isPublishing: boolean
  isDuplicating: boolean
  error: string | null
  success: string | null
  clearMessages: () => void
}

export const useContentActions = (): UseContentActionsReturn => {
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const handleSave = useCallback(async (content: ContentPage): Promise<void> => {
    setIsSaving(true)
    setError(null)
    
    try {
      const result = await saveContent(content)
      
      if (result.success) {
        setSuccess(result.message)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save content'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const handlePublish = useCallback(async (content: ContentPage): Promise<void> => {
    setIsPublishing(true)
    setError(null)
    
    try {
      const result = await publishContent(content)
      
      if (result.success) {
        setSuccess(result.message)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish content'
      setError(errorMessage)
    } finally {
      setIsPublishing(false)
    }
  }, [])

  const handleDuplicate = useCallback(async (content: ContentPage): Promise<ContentPage | null> => {
    setIsDuplicating(true)
    setError(null)
    
    try {
      const result = await duplicateContent(content)
      
      if (result) {
        setSuccess('Content duplicated successfully')
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Failed to duplicate content')
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate content'
      setError(errorMessage)
      return null
    } finally {
      setIsDuplicating(false)
    }
  }, [])

  return {
    saveContent: handleSave,
    publishContent: handlePublish,
    duplicateContent: handleDuplicate,
    isSaving,
    isPublishing,
    isDuplicating,
    error,
    success,
    clearMessages
  }
}
