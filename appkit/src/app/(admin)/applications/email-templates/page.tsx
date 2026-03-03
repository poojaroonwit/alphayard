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
  subject: string
  htmlContent: string
  isDefault: boolean
}

const VARIABLE_GUIDE = [
  { variable: '{{user.name}}', desc: "User's full name" },
  { variable: '{{user.email}}', desc: "User's email address" },
  { variable: '{{app.name}}', desc: 'Application name' },
  { variable: '{{app.logo}}', desc: 'Application logo URL' },
  { variable: '{{action.url}}', desc: 'Action URL (verify, reset, etc.)' },
  { variable: '{{otp.code}}', desc: 'OTP code (if applicable)' },
  { variable: '{{expiry.minutes}}', desc: 'Expiry time in minutes' },
]

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{app.name}}!',
    htmlContent: `<!DOCTYPE html>\n<html><body style="font-family:sans-serif;padding:20px;">\n  <h1>Welcome, {{user.name}}!</h1>\n  <p>Thanks for joining {{app.name}}.</p>\n  <a href="{{action.url}}" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Get Started</a>\n</body></html>`,
    isDefault: true,
  },
  {
    id: 'verify-email',
    name: 'Email Verification',
    subject: 'Verify your email for {{app.name}}',
    htmlContent: `<!DOCTYPE html>\n<html><body style="font-family:sans-serif;padding:20px;">\n  <h2>Verify Your Email</h2>\n  <p>Hi {{user.name}}, click below to verify your email.</p>\n  <a href="{{action.url}}" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Verify Email</a>\n  <p style="color:#999;font-size:12px;">Link expires in {{expiry.minutes}} minutes.</p>\n</body></html>`,
    isDefault: true,
  },
  {
    id: 'reset-password',
    name: 'Password Reset',
    subject: 'Reset your {{app.name}} password',
    htmlContent: `<!DOCTYPE html>\n<html><body style="font-family:sans-serif;padding:20px;">\n  <h2>Password Reset</h2>\n  <p>Hi {{user.name}}, click below to reset your password.</p>\n  <a href="{{action.url}}" style="background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a>\n  <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>\n</body></html>`,
    isDefault: true,
  },
  {
    id: 'otp',
    name: 'OTP Code',
    subject: 'Your {{app.name}} verification code',
    htmlContent: `<!DOCTYPE html>\n<html><body style="font-family:sans-serif;padding:20px;text-align:center;">\n  <h2>Verification Code</h2>\n  <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#3b82f6;">{{otp.code}}</p>\n  <p style="color:#666;">This code expires in {{expiry.minutes}} minutes.</p>\n</body></html>`,
    isDefault: true,
  },
]

export default function EmailTemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const selected = templates.find((t) => t.id === selectedId) || null

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/v1/admin/system/config/email-templates', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data?.config?.templates) && data.config.templates.length > 0) {
            setTemplates(data.config.templates)
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

  const saveAll = async (next: EmailTemplate[]) => {
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token') || ''
      await fetch('/api/v1/admin/system/config/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config: { templates: next } }),
      })
      toast({ title: 'Saved', description: 'Email templates updated.', variant: 'success' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Save failed', description: 'Could not save templates.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addTemplate = () => {
    const newTpl: EmailTemplate = {
      id: `custom-${Date.now()}`,
      name: 'New Template',
      subject: '',
      htmlContent: '<!DOCTYPE html>\n<html><body>\n  <h1>Your content here</h1>\n</body></html>',
      isDefault: false,
    }
    const next = [...templates, newTpl]
    setTemplates(next)
    setSelectedId(newTpl.id)
  }

  const deleteTemplate = (id: string) => {
    const next = templates.filter((t) => t.id !== id)
    setTemplates(next)
    if (selectedId === id) setSelectedId(null)
    saveAll(next)
    toast({ title: 'Deleted', description: 'Template removed.', variant: 'success' })
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
          <Button variant="outline" size="sm" onClick={addTemplate}>
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Template
          </Button>
          <Button onClick={() => saveAll(templates)} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            {saving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Variables Guide */}
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
          {/* Template List */}
          <div className="col-span-3 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Templates</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
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
                    {t.isDefault && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Default</span>
                    )}
                  </div>
                  {!t.isDefault && (
                    <button
                      title="Delete template"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTemplate(t.id)
                      }}
                      className="p-1 hover:text-red-500 text-gray-400"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Editor + Preview */}
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
                  {/* HTML Editor */}
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
                  {/* Preview */}
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
