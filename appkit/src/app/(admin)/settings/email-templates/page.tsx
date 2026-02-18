'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { Badge } from '../../../../components/ui/Badge'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface EmailTemplate {
  id: string
  slug: string
  name: string
  description?: string
  category: string
  subject: string
  isActive: boolean
  isSystem: boolean
  version: number
  updatedAt: string
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800',
  notifications: 'bg-green-100 text-green-800',
  marketing: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-800',
}

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    loadTemplates()
    loadCategories()
  }, [selectedCategory, showInactive])

  const loadTemplates = async () => {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (!showInactive) params.append('isActive', 'true')
      if (search) params.append('search', search)

      const res = await fetch(`${API_BASE}/api/admin/email-templates?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadTemplates()
  }

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !template.isActive })
      })
      if (res.ok) {
        loadTemplates()
      }
    } catch (error) {
      console.error('Failed to toggle template:', error)
    }
  }

  const deleteTemplate = async (template: EmailTemplate) => {
    if (template.isSystem) {
      alert('System templates cannot be deleted')
      return
    }
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return

    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${template.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        loadTemplates()
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const duplicateTemplate = async (template: EmailTemplate) => {
    const newSlug = prompt('Enter a unique slug for the duplicate:', `${template.slug}-copy`)
    if (!newSlug) return
    const newName = prompt('Enter a name for the duplicate:', `${template.name} (Copy)`)
    if (!newName) return

    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ slug: newSlug, name: newName })
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/settings/email-templates/${data.template.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to duplicate template')
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">Manage email templates for notifications, authentication, and marketing</p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/settings/email-templates/new')}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </form>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="macos-input px-3 py-2 rounded-lg border border-gray-200"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show Inactive
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            variant="frosted" 
            className={`hover:shadow-lg transition-shadow ${!template.isActive ? 'opacity-60' : ''}`}
          >
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.isSystem && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono">{template.slug}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.general}`}>
                  {template.category}
                </span>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
              )}

              <div className="text-sm text-gray-500">
                <p><strong>Subject:</strong> {template.subject}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>v{template.version}</span>
                <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/settings/email-templates/${template.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateTemplate(template)}
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(template)}
                  title={template.isActive ? 'Deactivate' : 'Activate'}
                >
                  {template.isActive ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    </svg>
                  )}
                </Button>
                {!template.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate(template)}
                    title="Delete"
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card variant="frosted">
          <CardBody className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first email template</p>
            <Button variant="primary" onClick={() => router.push('/settings/email-templates/new')}>
              Create Template
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
