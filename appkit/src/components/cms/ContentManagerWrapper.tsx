'use client'

import React, { useEffect, useState } from 'react'
// Use the final content page
import { ContentManagementPage } from '../content/ContentManagementPage'
import { BackendStatusIndicator } from '../common/BackendStatusIndicator'
import { LookerStudioEditor } from './LookerStudioEditor'
import { ContentProviderWithNavigation } from '../content/providers/ContentProviderWithNavigation'
import { authService } from '../../services/authService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export const ContentManagerWrapper: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingPage, setEditingPage] = useState<any>(null)
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  // Sync view with URL params (?studio=create|edit&id=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const studio = params.get('studio')
    const id = params.get('id')
    if (studio === 'create') {
      // Immediately create a draft on the server and enter edit mode
      ; (async () => {
        try {
          setCreatingDraft(true)
          const token = authService.getToken()
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          const now = Date.now()
          const draftPayload = {
            title: 'Untitled Page',
            slug: `untitled-${now}`,
            type: 'page',
            status: 'draft',
            content: '',
            components: [],
            mobile_display: {}
          }

          console.log('Creating draft with payload:', draftPayload)
          console.log('API Base URL:', apiBase)
          console.log('Token available:', !!token)

          const res = await fetch(`${apiBase}/cms/content/pages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(draftPayload)
          })

          console.log('Response status:', res.status)
          console.log('Response headers:', Object.fromEntries(res.headers.entries()))

          if (!res.ok) {
            const errorText = await res.text()
            console.error('API Error Response:', errorText)
            throw new Error(`Failed to create draft: ${res.status} ${errorText}`)
          }

          const data = await res.json()
          console.log('Created draft data:', data)
          const created = data?.page || data?.data || data
          setEditingPage(created)
          setCurrentView('edit')
          // Reflect id in URL for consistency
          const url = new URL(window.location.href)
          url.searchParams.set('studio', 'edit')
          if (created?.id) url.searchParams.set('id', String(created.id))
          window.history.replaceState({}, '', url.toString())
        } catch (e) {
          console.error('Draft creation error:', e)
          alert(`Failed to create draft content: ${(e as Error).message}`)
          setCurrentView('list')
        } finally {
          setCreatingDraft(false)
        }
      })()
    } else if (studio === 'edit') {
      setEditingPage(id ? { id } : null)
      setCurrentView('edit')
    } else {
      setCurrentView('list')
      setEditingPage(null)
    }
  }, [])

  const handleCreateNew = async () => {
    // Programmatic create (same as URL-based flow): create draft then edit
    try {
      setCreatingDraft(true)
      const token = authService.getToken()
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const now = Date.now()
      const draftPayload = {
        title: 'Untitled Page',
        slug: `untitled-${now}`,
        type: 'page',
        status: 'draft',
        content: '',
        components: [],
        mobile_display: {}
      }
      const res = await fetch(`${apiBase}/cms/content/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(draftPayload)
      })
      if (!res.ok) throw new Error('Failed to create draft')
      const data = await res.json()
      const created = data?.page || data?.data || data
      setEditingPage(created)
      setCurrentView('edit')
      // Update URL to reflect editing the created draft
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('studio', 'edit')
        if (created?.id) url.searchParams.set('id', String(created.id))
        window.history.pushState({}, '', url.toString())
      }
    } catch (e) {
      console.error(e)
      alert('Failed to create draft content')
      setCurrentView('list')
    } finally {
      setCreatingDraft(false)
    }
  }

  const handleEdit = (page: any) => {
    setEditingPage(page)
    setCurrentView('edit')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setEditingPage(null)
  }

  const handleSave = async (page: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const url = editingPage
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/cms/content/pages/${editingPage.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/cms/content/pages`

      const method = editingPage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          type: page.type || 'page',
          status: page.status || 'draft',
          content: page.content,
          components: page.components || [],
          mobile_display: page.mobile_display || {}
        })
      })

      if (response.ok) {
        handleBackToList()
      } else {
        throw new Error('Failed to save content')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Failed to save content. Please try again.')
    }
  }

  const handlePublish = async (page: any) => {
    try {
      // First save the content
      await handleSave(page)

      // Then publish it
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/cms/content/pages/${page.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      })

      if (response.ok) {
        handleBackToList()
      } else {
        throw new Error('Failed to publish content')
      }
    } catch (error) {
      console.error('Error publishing content:', error)
      alert('Failed to publish content. Please try again.')
    }
  }

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <Card variant="frosted" className="rounded-none border-x-0 border-t-0 shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToList}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                  <span>Back to Content Management</span>
                </Button>
                <div className="h-6 w-px bg-gray-300/50" aria-hidden="true"></div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {currentView === 'create' ? 'Create New Content' : `Edit Content: ${editingPage?.title || ''}`}
                  </h1>
                  {editingPage?.slug && (
                    <span className="text-sm text-gray-500">
                      Route: <span className="font-mono text-gray-700">/content/{editingPage.slug}</span>
                    </span>
                  )}
                </div>
              </div>
              <BackendStatusIndicator />
            </div>
          </CardBody>
        </Card>

        {/* Content Editor */}
        <div className="flex-1 p-6">
          {creatingDraft ? (
            <div className="flex items-center justify-center h-64" role="status" aria-label="Creating draft">
              <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-sm text-gray-600">Creating draft...</p>
              </div>
            </div>
          ) : (
            <LookerStudioEditor
              page={editingPage}
              onSave={handleSave}
              onCancel={handleBackToList}
              onPublish={handlePublish}
              onPreview={(page) => console.log('Preview:', page)}
              onDuplicate={async () => { }}
            />
          )}
        </div>
      </div>
    )
  }

  // Note: Authentication is handled by the main admin panel
  // This component assumes the user is already authenticated

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-fade-in">
      {/* Content management without top header/status */}
      <ContentProviderWithNavigation
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
      >
        <ContentManagementPage />
      </ContentProviderWithNavigation>
    </div>
  )
}


export default ContentManagerWrapper
