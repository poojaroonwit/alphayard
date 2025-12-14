'use client'

import React, { useState } from 'react'
import { 
  ArrowDownTrayIcon as SaveIcon,
  XMarkIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'marketing' | 'news' | 'inspiration' | 'popup'
  status: 'draft' | 'published' | 'archived'
  components: any[]
  createdAt: string
  updatedAt: string
}

interface SimpleContentEditorProps {
  page?: ContentPage
  onSave: (page: ContentPage) => void
  onCancel: () => void
}

export const SimpleContentEditor: React.FC<SimpleContentEditorProps> = ({
  page,
  onSave,
  onCancel
}) => {
  console.log('SimpleContentEditor rendering with page:', page)
  
  const [content, setContent] = useState<ContentPage>(page || {
    id: '',
    title: '',
    slug: '',
    type: 'marketing',
    status: 'draft',
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const handleSave = () => {
    onSave(content)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {content.id ? 'Edit Content' : 'Create New Content'}
                </h1>
                <p className="text-gray-600">
                  {content.id ? 'Modify your content' : 'Start creating your content'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 mr-2 inline" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <SaveIcon className="h-5 w-5 mr-2 inline" />
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter content title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={content.slug}
                    onChange={(e) => setContent({ ...content, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="content-slug"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={content.type}
                    onChange={(e) => setContent({ ...content, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="news">News</option>
                    <option value="inspiration">Inspiration</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={content.status}
                    onChange={(e) => setContent({ ...content, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Content Editor</h3>
                <p className="text-gray-600 mb-4">
                  The full content editor will be available here with drag-and-drop components.
                </p>
                <button
                  onClick={() => {
                    // Add a simple text component
                    const newComponent = {
                      id: `comp_${Date.now()}`,
                      type: 'text',
                      props: { content: 'New text content' },
                      order: content.components.length
                    }
                    setContent({
                      ...content,
                      components: [...content.components, newComponent]
                    })
                  }}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2 inline" />
                  Add Text Component
                </button>
              </div>
            </div>

            {/* Components List */}
            {content.components.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Components ({content.components.length})</h2>
                <div className="space-y-2">
                  {content.components.map((component, index) => (
                    <div key={component.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        <span className="text-sm text-gray-900 capitalize">{component.type}</span>
                        {component.props.content && (
                          <span className="text-sm text-gray-600 truncate max-w-xs">
                            {component.props.content}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const newComponents = content.components.filter((_, i) => i !== index)
                          setContent({ ...content, components: newComponents })
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
