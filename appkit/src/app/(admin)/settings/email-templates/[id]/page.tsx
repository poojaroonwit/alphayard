'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardBody, CardHeader } from '../../../../../components/ui/Card'
import { Button } from '../../../../../components/ui/Button'
import { Input } from '../../../../../components/ui/Input'
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner'
import { Badge } from '../../../../../components/ui/Badge'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface TemplateVariable {
  name: string
  description: string
  required: boolean
  default?: string
}

interface EmailTemplate {
  id: string
  slug: string
  name: string
  description?: string
  category: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: TemplateVariable[]
  sampleData: Record<string, any>
  isActive: boolean
  isSystem: boolean
  version: number
  createdAt: string
  updatedAt: string
}

interface TemplateVersion {
  id: string
  version: number
  subject: string
  createdAt: string
  changeNote?: string
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

export default function EmailTemplateEditorPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.id as string
  const isNew = templateId === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<Partial<EmailTemplate>>({
    slug: '',
    name: '',
    description: '',
    category: 'general',
    subject: '',
    htmlContent: getDefaultHtmlTemplate(),
    textContent: '',
    variables: [],
    sampleData: {},
    isActive: true,
  })
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'variables' | 'preview'>('html')
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [changeNote, setChangeNote] = useState('')

  useEffect(() => {
    if (!isNew) {
      loadTemplate()
      loadVersions()
    }
  }, [templateId, isNew])

  useEffect(() => {
    // Auto-preview when content changes
    if (activeTab === 'preview') {
      generatePreview()
    }
  }, [template.htmlContent, template.subject, template.sampleData, activeTab])

  const loadTemplate = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTemplate(data.template)
      } else {
        alert('Template not found')
        router.push('/settings/email-templates')
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${templateId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  const generatePreview = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${isNew ? 'render' : `${templateId}/preview`}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(isNew ? {
          slug: template.slug || 'preview',
          htmlContent: template.htmlContent,
          subject: template.subject,
          data: template.sampleData
        } : {
          data: template.sampleData
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewHtml(data.html)
        setPreviewSubject(data.subject)
      }
    } catch (error) {
      // For new templates, render locally
      let html = template.htmlContent || ''
      let subject = template.subject || ''
      const data = { ...template.sampleData, year: new Date().getFullYear().toString(), appName: 'AppKit' }
      
      // Simple variable replacement
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        html = html.replace(regex, String(value))
        subject = subject.replace(regex, String(value))
      })
      
      setPreviewHtml(html)
      setPreviewSubject(subject)
    }
  }

  const handleSave = async () => {
    if (!template.slug || !template.name || !template.subject || !template.htmlContent) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const token = getAuthToken()
      const url = isNew 
        ? `${API_BASE}/api/admin/email-templates`
        : `${API_BASE}/api/admin/email-templates/${templateId}`
      
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...template,
          changeNote: changeNote || undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (isNew) {
          router.push(`/settings/email-templates/${data.template.id}`)
        } else {
          setTemplate(data.template)
          loadVersions()
          setChangeNote('')
        }
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      alert('Please enter an email address')
      return
    }

    setSendingTest(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${templateId}/send-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ to: testEmail, data: template.sampleData })
      })

      const data = await res.json()
      if (data.success) {
        alert(`Test email sent to ${testEmail}`)
      } else {
        alert(data.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Failed to send test:', error)
      alert('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  const restoreVersion = async (version: number) => {
    if (!confirm(`Restore to version ${version}? This will create a new version.`)) return

    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/admin/email-templates/${templateId}/restore/${version}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setTemplate(data.template)
        loadVersions()
        setShowVersions(false)
      }
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    const newVariables = [...(template.variables || [])]
    newVariables[index] = { ...newVariables[index], [field]: value }
    setTemplate({ ...template, variables: newVariables })
  }

  const addVariable = () => {
    setTemplate({
      ...template,
      variables: [...(template.variables || []), { name: '', description: '', required: false }]
    })
  }

  const removeVariable = (index: number) => {
    const newVariables = [...(template.variables || [])]
    newVariables.splice(index, 1)
    setTemplate({ ...template, variables: newVariables })
  }

  const updateSampleData = (key: string, value: string) => {
    setTemplate({
      ...template,
      sampleData: { ...template.sampleData, [key]: value }
    })
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/settings/email-templates')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'New Email Template' : template.name}
            </h1>
            {!isNew && (
              <p className="text-gray-500 text-sm">
                v{template.version} • Last updated {new Date(template.updatedAt || '').toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="secondary" onClick={() => setShowVersions(!showVersions)}>
              History
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            {isNew ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold">Template Information</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Slug *"
                  value={template.slug || ''}
                  onChange={(e) => setTemplate({ ...template, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="welcome-email"
                  disabled={template.isSystem}
                />
                <Input
                  label="Name *"
                  value={template.name || ''}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
              <Input
                label="Description"
                value={template.description || ''}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="Sent to new users after registration"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={template.category || 'general'}
                    onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                    className="macos-input w-full px-3 py-2 rounded-lg border border-gray-200"
                  >
                    <option value="general">General</option>
                    <option value="auth">Authentication</option>
                    <option value="notifications">Notifications</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={template.isActive}
                      onChange={(e) => setTemplate({ ...template, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <Input
                label="Subject Line *"
                value={template.subject || ''}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                placeholder="Welcome to {{appName}}!"
              />
              {!isNew && (
                <Input
                  label="Change Note (optional)"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Describe what you changed..."
                />
              )}
            </CardBody>
          </Card>

          {/* Content Tabs */}
          <Card variant="frosted">
            <CardHeader>
              <div className="flex items-center gap-4">
                {['html', 'text', 'variables', 'preview'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardBody>
              {activeTab === 'html' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">HTML Content *</label>
                  <textarea
                    value={template.htmlContent || ''}
                    onChange={(e) => setTemplate({ ...template, htmlContent: e.target.value })}
                    rows={20}
                    className="w-full font-mono text-sm p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="<!DOCTYPE html>..."
                  />
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Plain Text Content (optional)</label>
                  <textarea
                    value={template.textContent || ''}
                    onChange={(e) => setTemplate({ ...template, textContent: e.target.value })}
                    rows={15}
                    className="w-full font-mono text-sm p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Plain text version of the email..."
                  />
                </div>
              )}

              {activeTab === 'variables' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Template Variables</label>
                    <Button variant="secondary" size="sm" onClick={addVariable}>
                      Add Variable
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(template.variables || []).map((variable, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            placeholder="variableName"
                            value={variable.name}
                            onChange={(e) => updateVariable(index, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="Description"
                            value={variable.description}
                            onChange={(e) => updateVariable(index, 'description', e.target.value)}
                          />
                          <Input
                            placeholder="Default value"
                            value={variable.default || ''}
                            onChange={(e) => updateVariable(index, 'default', e.target.value)}
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={variable.required}
                              onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeVariable(index)}>
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sample Data (for preview)</label>
                    <div className="space-y-2">
                      {(template.variables || []).map((variable) => (
                        <div key={variable.name} className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 w-32 font-mono">{`{{${variable.name}}}`}</span>
                          <Input
                            value={template.sampleData?.[variable.name] || ''}
                            onChange={(e) => updateSampleData(variable.name, e.target.value)}
                            placeholder={variable.default || `Enter ${variable.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <strong>Subject:</strong> {previewSubject}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-gray-200' : ''}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-gray-200' : ''}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <Button variant="secondary" size="sm" onClick={generatePreview}>
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card variant="frosted" className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Email Preview</h3>
                {!isNew && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-48"
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleSendTest}
                      disabled={sendingTest || !testEmail}
                    >
                      {sendingTest ? <LoadingSpinner size="sm" /> : 'Send Test'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div 
                className={`mx-auto bg-white ${
                  previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
                }`}
              >
                <div className="border-b bg-gray-50 px-4 py-2">
                  <div className="text-xs text-gray-500">Subject</div>
                  <div className="font-medium truncate">{previewSubject || template.subject}</div>
                </div>
                <iframe
                  srcDoc={previewHtml || template.htmlContent}
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardBody>
          </Card>

          {/* Version History */}
          {showVersions && versions.length > 0 && (
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-base font-semibold">Version History</h3>
              </CardHeader>
              <CardBody className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div 
                      key={v.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">Version {v.version}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(v.createdAt).toLocaleString()}
                        </div>
                        {v.changeNote && (
                          <div className="text-sm text-gray-600 mt-1">{v.changeNote}</div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => restoreVersion(v.version)}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function getDefaultHtmlTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
        }
        .header { 
            background: linear-gradient(135deg, #FA7272 0%, #FF8F8F 100%); 
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background: #FA7272; 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0; 
        }
        .footer { 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
            border-top: 1px solid #eee; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{appName}}</h1>
        </div>
        <div class="content">
            <h2>Hello!</h2>
            <p>Your email content goes here.</p>
            <a href="#" class="button">Call to Action</a>
        </div>
        <div class="footer">
            <p>© {{year}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
}
