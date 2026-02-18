'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { LookerStudioEditor } from '../../../../components/cms/LookerStudioEditor'

export default function StudioCreateContentPage() {
  const router = useRouter()

  const apiBase = ''

  const handleSave = async (page: any) => {
    try {
      const res = await fetch(`${apiBase}/cms/content/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (!res.ok) throw new Error('Failed to save content')
      router.push('/admin?module=dynamic-content')
    } catch (e) {
      alert('Failed to save content')
    }
  }

  const handleCancel = () => router.push('/admin?module=dynamic-content')

  const handlePublish = async (page: any) => {
    try {
      // save first
      await handleSave(page)
      // publish requires id; editor should provide it after save in a real flow
    } catch (e) {
      alert('Failed to publish content')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Content</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Create Content</h1>
        </div>
      </div>

      <LookerStudioEditor
        page={undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        onPublish={handlePublish}
        onPreview={(p) => console.log('Preview', p)}
        onDuplicate={async () => { }}
      />
    </div>
  )
}


