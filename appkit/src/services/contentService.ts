import { ContentPage } from './productionCmsService'
import { API_BASE_URL } from './apiConfig'

// API base should point to backend root (CMS is mounted at /cms)

export interface SaveResponse {
  success: boolean
  message: string
  data?: ContentPage
}

export interface PublishResponse {
  success: boolean
  message: string
  data?: ContentPage
  publishedUrl?: string
}

/**
 * Save content as draft
 */
export const saveContent = async (content: ContentPage): Promise<SaveResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/content/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...content,
        status: 'draft',
        updatedAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return {
      success: true,
      message: 'Content saved successfully',
      data: result.data
    }
  } catch (error) {
    console.error('Save error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save content'
    }
  }
}

/**
 * Publish content
 */
export const publishContent = async (content: ContentPage): Promise<PublishResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/content/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...content,
        status: 'published',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return {
      success: true,
      message: 'Content published successfully',
      data: result.data,
      publishedUrl: result.publishedUrl
    }
  } catch (error) {
    console.error('Publish error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to publish content'
    }
  }
}

/**
 * Get content by ID
 */
export const getContent = async (id: string): Promise<ContentPage | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/content/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Get content error:', error)
    return null
  }
}

/**
 * Delete content
 */
export const deleteContent = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
      method: 'DELETE'
    })

    return response.ok
  } catch (error) {
    console.error('Delete content error:', error)
    return false
  }
}

/**
 * List all content
 */
export const listContent = async (): Promise<ContentPage[]> => {
  try {
    // Try secured CMS content list first
    const response = await fetch(`${API_BASE_URL}/cms/content/pages`, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      const result = await response.json()
      // Accept multiple shapes: {data: []}, {pages: []}, or []
      return result?.data || result?.pages || result || []
    }

    // If unauthorized or not found, attempt public admin content endpoint
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      const fallback = await fetch(`${API_BASE_URL}/cms/content/admin/content`)
      if (fallback.ok) {
        const result = await fallback.json()
        return result?.pages || result?.data || []
      }
    }

    throw new Error(`HTTP error! status: ${response.status}`)
  } catch (error) {
    console.error('List content error:', error)
    // Return empty array when no data is available
    return []
  }
}

/**
 * Duplicate content
 */
export const duplicateContent = async (content: ContentPage): Promise<ContentPage | null> => {
  try {
    const duplicatedContent = {
      ...content,
      id: '', // Let the server generate a new ID
      title: `${content.title} (Copy)`,
      slug: `${content.slug}-copy`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const response = await fetch(`${API_BASE_URL}/content/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(duplicatedContent)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Duplicate content error:', error)
    return null
  }
}
