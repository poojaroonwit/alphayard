'use client'

import React from 'react'
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  Loader2Icon,
  EyeIcon,
  CodeIcon,
  BookOpenIcon,
  HelpCircleIcon,
  CopyIcon,
  CheckIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppEmailTemplate } from '../page'
import { Drawer } from '@/components/ui/Drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'

interface EmailTemplateManagerProps {
  appId: string;
  emailTemplates: AppEmailTemplate[];
  defaultEmailTemplates: AppEmailTemplate[];
  emailTemplatesLoading: boolean;
  selectedTemplateId: string | null;
  selectedTemplateScope: 'app' | 'default';
  templateEditor: {
    name: string;
    slug: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    isActive: boolean;
    variables: any[];
  };
  setTemplateEditor: React.Dispatch<React.SetStateAction<any>>;
  templateMsg: string;
  onSelectTemplate: (template: AppEmailTemplate) => void;
  onSelectDefaultTemplate: (template: AppEmailTemplate) => void;
  onSaveTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
  onAddTemplate?: () => void;
  onRefresh: () => void;
  setActiveDevGuide: (guide: string) => void;
  isEmailDrawerOpen: boolean;
  setIsEmailDrawerOpen: (open: boolean) => void;
}

export const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({
  emailTemplates,
  defaultEmailTemplates,
  emailTemplatesLoading,
  selectedTemplateId,
  selectedTemplateScope,
  templateEditor,
  setTemplateEditor,
  templateMsg,
  onSelectTemplate,
  onSelectDefaultTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onAddTemplate,
  isEmailDrawerOpen,
  setIsEmailDrawerOpen,
}) => {
  const [showVarGuide, setShowVarGuide] = React.useState(false)
  const [copiedVar, setCopiedVar] = React.useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedVar(text)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  const commonVars = [
    { name: 'User First Name', key: '{{user.firstName}}', desc: 'The recipient\'s first name' },
    { name: 'User Last Name', key: '{{user.lastName}}', desc: 'The recipient\'s last name' },
    { name: 'User Email', key: '{{user.email}}', desc: 'The recipient\'s email address' },
    { name: 'Application Name', key: '{{app.name}}', desc: 'Your application\'s display name' },
    { name: 'Action URL', key: '{{action_url}}', desc: 'The main link (e.g. for verification)' },
    { name: 'OTP Code', key: '{{otp}}', desc: '6-digit verification code' },
    { name: 'Code Expiry', key: '{{expiry}}', desc: 'When the code expires (e.g. 10 minutes)' },
    { name: 'Support Email', key: '{{support_email}}', desc: 'Your support contact email' },
  ]
  const isSelected = (t: AppEmailTemplate, scope: 'app' | 'default') =>
    selectedTemplateId === t.id && selectedTemplateScope === scope

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Templates</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Override default system emails or create custom templates for your application.</p>
        </div>
        <div className="flex items-center gap-2">
          {templateMsg && (
            <span className={`text-xs font-medium ${templateMsg.includes('Saved') || templateMsg.includes('Reverted') ? 'text-emerald-600' : 'text-blue-600'}`}>
              {templateMsg}
            </span>
          )}
          <Button
            size="sm"
            onClick={onAddTemplate}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            New Template
          </Button>
        </div>
      </div>

      {emailTemplatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Template List - Now full width or wider column */}
          <div className="col-span-12 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Templates</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {/* App overrides */}
              {emailTemplates.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">App Overrides</span>
                  </div>
                  {emailTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTemplate(t)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                        isSelected(t, 'app')
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <span className="text-[10px] text-gray-400 truncate">{t.slug}</span>
                      </div>
                      <button
                        title="Revert to default"
                        onClick={(e) => { e.stopPropagation(); onDeleteTemplate(t.id) }}
                        className="p-1 hover:text-red-500 text-gray-400 shrink-0"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))}
                </>
              )}

              {/* Default templates */}
              {defaultEmailTemplates.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Default</span>
                  </div>
                  {defaultEmailTemplates.map((t) => {
                    const isOverridden = emailTemplates.some((at) => at.slug === t.slug)
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelectDefaultTemplate(t)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          isSelected(t, 'default')
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          {isOverridden && (
                            <span className="text-[10px] text-emerald-500">Overridden</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </>
              )}

              {emailTemplates.length === 0 && defaultEmailTemplates.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No templates yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Drawer */}
      <Drawer
        isOpen={isEmailDrawerOpen}
        onClose={() => setIsEmailDrawerOpen(false)}
        title={selectedTemplateId === 'new' ? 'New Template' : (templateEditor.name || 'Edit Template')}
        className="max-w-4xl"
      >
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowVarGuide(!showVarGuide)}
                className={showVarGuide ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
              >
                <HelpCircleIcon className="w-4 h-4 mr-1.5 text-blue-500" />
                Variables Guide
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={onSaveTemplate} 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/20"
              >
                <SaveIcon className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>

          {showVarGuide && (
            <div className="mb-4 p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 fade-in animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center">
                  <BookOpenIcon className="w-3.5 h-3.5 mr-1.5" /> Available Variables
                </h4>
                <button onClick={() => setShowVarGuide(false)} className="text-blue-400 hover:text-blue-600">
                  <PlusIcon className="w-3.5 h-3.5 rotate-45" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {commonVars.map((v) => (
                  <div key={v.key} className="group relative p-2 bg-white dark:bg-zinc-900 rounded-xl border border-blue-50 dark:border-zinc-800 flex flex-col gap-1 hover:border-blue-200 transition-all cursor-pointer" onClick={() => copyToClipboard(v.key)}>
                    <div className="flex items-center justify-between">
                      <code className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{v.key}</code>
                      {copiedVar === v.key ? (
                        <CheckIcon className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <CopyIcon className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400 leading-tight">{v.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-100/30 dark:border-zinc-800 flex flex-col gap-1">
                <p className="text-[10px] text-gray-400 italic">Tip: Click a variable to copy it to your clipboard.</p>
                <p className="text-[10px] text-blue-500/80 dark:text-blue-400/60 leading-relaxed font-medium">Use <code className="text-[9px] bg-blue-100/50 px-1 rounded mx-0.5">otp-verification</code> slug for system verification & MFA emails.</p>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col space-y-4">
            {/* Name + Subject rows */}
            <div className="space-y-3">
              {selectedTemplateId === 'new' && defaultEmailTemplates.length > 0 && (
                <div className="flex items-center gap-3 pb-2 border-b border-gray-50 dark:border-zinc-800/50 mb-2">
                  <div className="flex-none">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">Quick Start</span>
                  </div>
                  <div className="flex-1 max-w-sm">
                    <Select onValueChange={(val) => {
                      const def = defaultEmailTemplates.find(d => d.id === val);
                      if (def) {
                        setTemplateEditor((prev: any) => ({
                          ...prev,
                          name: def.name,
                          slug: def.slug,
                          subject: def.subject,
                          htmlContent: def.htmlContent || '',
                          textContent: def.textContent || '',
                          variables: (def as any).variables || [],
                        }));
                      }
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Clone from system default..." />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultEmailTemplates.map(def => (
                          <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Template Name</label>
                  <input
                    type="text"
                    title="Template name"
                    value={templateEditor.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setTemplateEditor((prev: any) => {
                        const updates: any = { ...prev, name: newName };
                        const oldSlug = prev.slug;
                        const wasAutoGenerated = !oldSlug || oldSlug === prev.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                        if (wasAutoGenerated) {
                          updates.slug = newName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                        }
                        return updates;
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                    placeholder="e.g. Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Slug (Identifier)</label>
                  <input
                    type="text"
                    title="Template slug"
                    value={templateEditor.slug}
                    onChange={(e) => setTemplateEditor((prev: any) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono"
                    placeholder="e.g. welcome-email"
                    disabled={selectedTemplateScope === 'default'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Subject Line</label>
                <input
                  type="text"
                  title="Subject line"
                  value={templateEditor.subject}
                  onChange={(e) => setTemplateEditor((prev: any) => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                  placeholder="Welcome to {{app.name}}!"
                />
              </div>
            </div>

            {/* HTML Editor + Preview toggle or split */}
            <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
                <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-zinc-800 h-full">
                  <div className="flex flex-col min-h-0">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5 bg-gray-50/50 dark:bg-zinc-900/50">
                      <CodeIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">HTML Content</span>
                    </div>
                    <textarea
                      value={templateEditor.htmlContent}
                      onChange={(e) => setTemplateEditor((prev: any) => ({ ...prev, htmlContent: e.target.value }))}
                      className="flex-1 p-4 bg-white dark:bg-zinc-950 text-xs font-mono text-gray-800 dark:text-zinc-300 resize-none focus:outline-none"
                      spellCheck={false}
                      placeholder="<div>Hello {{user.firstName}}...</div>"
                    />
                  </div>
                  <div className="flex flex-col min-h-0">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5 bg-gray-50/50 dark:bg-zinc-900/50">
                      <EyeIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Instant Preview</span>
                    </div>
                    <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 p-2">
                      <iframe
                        title="Email preview"
                        srcDoc={templateEditor.htmlContent || '<html><body style="font-family: sans-serif; padding: 20px; color: #666; text-align: center;">No content yet</body></html>'}
                        className="w-full h-full border-0 rounded-lg"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
