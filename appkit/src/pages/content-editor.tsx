import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { LookerStudioEditor } from '../components/cms/LookerStudioEditor'
import { useContentActions } from '../hooks/useContentActions'
import { ContentPage } from '../services/productionCmsService'
import { getContent } from '../services/contentService'

const ContentEditorPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const [content, setContent] = useState<ContentPage | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    saveContent,
    publishContent,
    duplicateContent,
    isSaving,
    isPublishing,
    isDuplicating,
    error,
    success
  } = useContentActions()

  // Load content if editing existing content
  useEffect(() => {
    const loadContent = async () => {
      if (id && typeof id === 'string') {
        try {
          const loadedContent = await getContent(id)
          if (loadedContent) {
            setContent(loadedContent)
          } else {
            // Content not found, redirect to content list
            router.push('/content')
          }
        } catch (error) {
          console.error('Failed to load content:', error)
          router.push('/content')
        }
      } else {
        // Creating new content
        setContent({
          id: '',
          title: 'New Content',
          slug: 'new-content',
          type: 'marketing',
          status: 'draft',
          components: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      setLoading(false)
    }

    loadContent()
  }, [id, router])

  const handleSave = async (page: ContentPage): Promise<void> => {
    await saveContent(page)
    setContent(page)
  }

  const handlePublish = async (page: ContentPage): Promise<void> => {
    await publishContent(page)
    setContent(page)
  }

  const handleDuplicate = async (page: ContentPage): Promise<void> => {
    const duplicated = await duplicateContent(page)
    if (duplicated) {
      // Redirect to edit the duplicated content
      router.push(`/content-editor?id=${duplicated.id}`)
    }
  }

  const handlePreview = (page: ContentPage): void => {
    // Open preview in new window
    const previewUrl = `/content-preview?id=${page.id}`
    window.open(previewUrl, '_blank')
  }

  const handleCancel = (): void => {
    // Navigate back to content list
    router.push('/content')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h1>
          <p className="text-gray-600 mb-4">The requested content could not be found.</p>
          <button
            onClick={() => router.push('/content')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Back to Content List
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      <LookerStudioEditor
        page={content}
        onSave={handleSave}
        onCancel={handleCancel}
        onPublish={handlePublish}
        onPreview={handlePreview}
        onDuplicate={handleDuplicate}
      />
    </div>
  )
}

export default ContentEditorPage
