'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { LookerStudioEditor } from '../../../../components/cms/LookerStudioEditor'

export default function StudioEditContentPage() {
  const router = useRouter()
  const params = useParams()
  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const apiBase = ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBase}/cms/content/pages/${params?.id || ''}`)
        if (!res.ok) throw new Error('Failed to load content')
        const data = await res.json()
        setPageData(data?.page || data?.data || data)
      } catch (e) {
        alert('Failed to load content')
        router.push('/admin?module=dynamic-content')
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) fetchData()
  }, [params?.id, apiBase, router])

  const handleSave = async (page: any) => {
    try {
      const res = await fetch(`${apiBase}/cms/content/pages/${params?.id || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page)
      })
      if (!res.ok) throw new Error('Failed to save content')
      router.push('/admin?module=dynamic-content')
    } catch (e) {
      alert('Failed to save content')
    }
  }

  const handleCancel = () => router.push('/admin?module=dynamic-content')

  // @ts-ignore - page parameter for future use
  const handlePublish = async (page: any) => {
    try {
      const res = await fetch(`${apiBase}/cms/content/pages/${params?.id || ''}/publish`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to publish content')
      router.push('/admin?module=dynamic-content')
    } catch (e) {
      alert('Failed to publish content')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
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
          <h1 className="text-lg font-semibold text-gray-900">Edit Content</h1>
        </div>
      </div>

      <LookerStudioEditor
        page={pageData}
        onSave={handleSave}
        onCancel={handleCancel}
        onPublish={handlePublish}
        onPreview={(p) => console.log('Preview', p)}
        onDuplicate={async () => { }}
      />
    </div>
  )
}


