'use client'

import React from 'react'
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  Loader2Icon,
  EyeIcon,
  CodeIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppEmailTemplate } from '../page'
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
}) => {
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
          <Button onClick={onSaveTemplate} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            <SaveIcon className="w-4 h-4 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      {emailTemplatesLoading ? (
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

          {/* Editor + Preview */}
          <div className="col-span-9 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
            {selectedTemplateId !== null || templateEditor.name || templateEditor.htmlContent ? (
              <>
                {/* Name + Subject row */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3">
                  {selectedTemplateId === 'new' && defaultEmailTemplates.length > 0 && (
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50 dark:border-zinc-800/50 mb-2">
                      <div className="flex-none">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">Quick Start</span>
                      </div>
                      <div className="flex-1 max-w-md">
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
                      <p className="text-[10px] text-gray-400 italic">Select a system template to use as a starting point</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Template Name</label>
                      <input
                        type="text"
                        title="Template name"
                        value={templateEditor.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setTemplateEditor((prev: any) => {
                            const updates: any = { ...prev, name: newName };
                            // Auto-slugify if slug is empty or was previously auto-generated from the old name
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
                    <div className="flex-1">
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
                    <div className="flex-1">
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
                </div>

                {/* HTML Editor + Preview split */}
                <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100 dark:divide-zinc-800">
                  {/* HTML Editor */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
                      <CodeIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">HTML Editor</span>
                    </div>
                    <textarea
                      value={templateEditor.htmlContent}
                      onChange={(e) => setTemplateEditor((prev: any) => ({ ...prev, htmlContent: e.target.value }))}
                      className="flex-1 p-4 bg-gray-50 dark:bg-zinc-950 text-xs font-mono text-gray-800 dark:text-zinc-300 resize-none focus:outline-none"
                      spellCheck={false}
                      placeholder="<div>Hello {{user.firstName}}...</div>"
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
                        srcDoc={templateEditor.htmlContent || '<html><body></body></html>'}
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
