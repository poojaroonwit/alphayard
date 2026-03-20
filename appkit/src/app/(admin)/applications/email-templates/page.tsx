'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  Loader2Icon,
  EyeIcon,
  CodeIcon,
  InfoIcon,
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
  isActive: boolean
}

const VARIABLE_GUIDE = [
  { variable: '{{user.name}}', desc: "User's full name" },
  { variable: '{{user.email}}', desc: "User's email address" },
  { variable: '{{app.name}}', desc: 'Application name' },
  { variable: '{{app.logo}}', desc: 'Application logo URL' },
  { variable: '{{action.url}}', desc: 'Action URL (verify, reset, etc.)' },
  { variable: '{{otp}}', desc: 'OTP verification code' },
  { variable: '{{expiry}}', desc: 'Expiry time (e.g. "10 minutes")' },
]

export default function EmailTemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const selected = templates.find((t) => t.id === selectedId) || null

  const getToken = () =>
    (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '') || ''

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/admin/config/email-templates', {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data?.templates)) {
            setTemplates(data.templates)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveTemplate = async (tpl: EmailTemplate) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/admin/config/email-templates/${tpl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: tpl.name,
          slug: tpl.slug,
          subject: tpl.subject,
          htmlContent: tpl.htmlContent,
          textContent: tpl.textContent,
          variables: tpl.variables,
          isActive: tpl.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || 'Save failed')
      }
      const data = await res.json()
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? data.template : t)))
      toast({ title: 'Saved', description: 'Template updated.', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save template.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addTemplate = async () => {
    const slug = `custom-${Date.now()}`
    setSaving(true)
    try {
      const res = await fetch('/api/v1/admin/config/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: 'New Template',
          slug,
          subject: '',
          htmlContent: '<!DOCTYPE html>\n<html><body>\n  <h1>Your content here</h1>\n</body></html>',
          variables: [],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || 'Create failed')
      }
      const data = await res.json()
      setTemplates((prev) => [...prev, data.template])
      setSelectedId(data.template.id)
      toast({ title: 'Created', description: 'New template added.', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Create failed', description: err.message || 'Could not create template.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/admin/config/email-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || 'Delete failed')
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast({ title: 'Deleted', description: 'Template removed.', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message || 'Could not delete template.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage default email templates for AppKit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)}>
            <InfoIcon className="w-4 h-4 mr-1.5" />
            Variables Guide
          </Button>
          <Button variant="outline" size="sm" onClick={addTemplate} disabled={saving}>
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Template
          </Button>
          {selected && (
            <Button
              onClick={() => saveTemplate(selected)}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
            >
              {saving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
              Save
            </Button>
          )}
        </div>
      </div>

      {showGuide && (
        <div className="rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Template Variables</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {VARIABLE_GUIDE.map((v) => (
              <div key={v.variable} className="flex items-start gap-2">
                <code className="text-xs bg-blue-100 dark:bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono whitespace-nowrap">{v.variable}</code>
                <span className="text-xs text-blue-800/80 dark:text-blue-200/80">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4" style={{ minHeight: 500 }}>
          <div className="col-span-3 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Templates</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {templates.length === 0 && (
                <p className="px-4 py-6 text-xs text-gray-400 text-center">No templates yet. Click &quot;Add Template&quot; to create one.</p>
              )}
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                    selectedId === t.id
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <span className="text-[10px] font-mono text-gray-400 truncate block">{t.slug}</span>
                  </div>
                  <button
                    title="Delete template"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTemplate(t.id)
                    }}
                    className="p-1 hover:text-red-500 text-gray-400 flex-shrink-0"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-9 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
            {selected ? (
              <>
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Template Name</label>
                      <input
                        type="text"
                        title="Template name"
                        value={selected.name}
                        onChange={(e) => updateTemplate(selected.id, { name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Slug</label>
                      <input
                        type="text"
                        title="Template slug"
                        value={selected.slug}
                        onChange={(e) => updateTemplate(selected.id, { slug: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Subject Line</label>
                      <input
                        type="text"
                        title="Subject line"
                        value={selected.subject}
                        onChange={(e) => updateTemplate(selected.id, { subject: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100 dark:divide-zinc-800">
                  <div className="flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
                      <CodeIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">HTML Editor</span>
                    </div>
                    <textarea
                      value={selected.htmlContent}
                      onChange={(e) => updateTemplate(selected.id, { htmlContent: e.target.value })}
                      className="flex-1 p-4 bg-gray-50 dark:bg-zinc-950 text-xs font-mono text-gray-800 dark:text-zinc-300 resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
                      <EyeIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">Preview</span>
                    </div>
                    <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900">
                      <iframe
                        title="Email preview"
                        srcDoc={selected.htmlContent}
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                <p className="text-sm">Select a template to edit</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
