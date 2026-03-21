'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import {
  SaveIcon,
  Loader2Icon,
  CodeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  CopyIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  EyeIcon,
  KeyIcon,
  XIcon,
  GripVerticalIcon
} from 'lucide-react'
import { isValidPostAuthRedirect, maskSecret } from './utils'

interface GeneralSettingsProps {
  appId: string;
  application: any;
  setApplication: React.Dispatch<React.SetStateAction<any>>;
  appBranding: any;
  setAppBranding: React.Dispatch<React.SetStateAction<any>>;
  generalSaving: boolean;
  generalMsg: string;
  onSave: () => void;
  logoUploading: boolean;
  onLogoUpload: (file: File) => void;
  logoFileInputRef: React.RefObject<HTMLInputElement>;
  faviconFileInputRef: React.RefObject<HTMLInputElement>;
  onFaviconUpload: (file: File) => void;
  newRedirectUri: string;
  setNewRedirectUri: (uri: string) => void;
  onAddRedirectUri: () => void;
  onRemoveRedirectUri: (uri: string) => void;
  onMoveRedirectUri: (uri: string, direction: 'up' | 'down') => void;
  onRedirectUriDragStart: (uri: string) => void;
  onRedirectUriDragOver: (e: React.DragEvent, uri: string) => void;
  onRedirectUriDrop: (e: React.DragEvent, uri: string) => void;
  onRedirectUriDragEnd: () => void;
  dragOverRedirectUri: string | null;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  canonicalRedirectUri: string;
  generatedClientId: string | null;
  generatedClientSecret: string | null;
  showGeneratedClientSecret: boolean;
  setShowGeneratedClientSecret: (show: boolean) => void;
  generateClientIdOnSave: boolean;
  setGenerateClientIdOnSave: (generate: boolean) => void;
  setShowRotateSecretConfirm: (show: boolean) => void;
  apiKeyVisible: boolean;
  setApiKeyVisible: (v: boolean) => void;
  setActiveDevGuide: (guide: string) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  appId,
  application,
  setApplication,
  generalSaving,
  generalMsg,
  onSave,
  logoUploading,
  onLogoUpload,
  logoFileInputRef,
  faviconFileInputRef,
  onFaviconUpload,
  newRedirectUri,
  setNewRedirectUri,
  onAddRedirectUri,
  onRemoveRedirectUri,
  onMoveRedirectUri,
  onRedirectUriDragStart,
  onRedirectUriDragOver,
  onRedirectUriDrop,
  onRedirectUriDragEnd,
  dragOverRedirectUri,
  onCopy,
  copiedId,
  canonicalRedirectUri,
  generatedClientId,
  generatedClientSecret,
  showGeneratedClientSecret,
  setShowGeneratedClientSecret,
  generateClientIdOnSave,
  setGenerateClientIdOnSave,
  setShowRotateSecretConfirm,
  apiKeyVisible,
  setApiKeyVisible,
  setActiveDevGuide
}) => {
  if (!application) return null

  const authBehavior = application.authBehavior || {
    signupEnabled: true,
    emailVerificationRequired: false,
    inviteOnly: false,
    allowedEmailDomains: [],
    postLoginRedirect: '',
    postSignupRedirect: ''
  }

  const isPostLoginRedirectValid = isValidPostAuthRedirect(authBehavior.postLoginRedirect || '')
  const isPostSignupRedirectValid = isValidPostAuthRedirect(authBehavior.postSignupRedirect || '')
  const hasInvalidPostAuthRedirect = !isPostLoginRedirectValid || !isPostSignupRedirectValid

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">General Settings</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveDevGuide('app-metadata')}
            className="inline-flex rounded-lg border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <CodeIcon className="w-3.5 h-3.5" /> Dev Guide
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">General Settings</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Configure your application&apos;s identity, platform, and metadata.</p>
          </div>
          <div className="flex items-center gap-2">
            {generalMsg && <span className={`text-xs font-medium ${generalMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{generalMsg}</span>}
            <Button onClick={onSave} disabled={generalSaving || hasInvalidPostAuthRedirect} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              {generalSaving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Platform Type */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Platform Type</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Target runtime for this application</p>
            </div>
            <div>
              <select
                title="Platform type"
                value={application.platform}
                onChange={e => setApplication((prev: any) => prev ? { ...prev, platform: e.target.value } : prev)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile Application</option>
              </select>
            </div>
          </div>
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Identity</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Logo, app name, and description</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/30 transition-colors cursor-pointer group shrink-0"
                  onClick={() => logoFileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                    {application.logoUrl ? (
                      <img src={application.logoUrl} alt={`${application.name} logo`} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      application.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <p className="mt-2 text-[9px] text-gray-500 dark:text-zinc-400 text-center">
                    {logoUploading ? 'Uploading...' : 'Click to upload logo'}
                  </p>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    title="Upload application logo"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onLogoUpload(file)
                      e.currentTarget.value = ''
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => logoFileInputRef.current?.click()} disabled={logoUploading} title="Upload application logo">
                    {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">Logo must be uploaded from file (URL input disabled)</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Application Name</label>
                <input type="text" title="Application name" value={application.name} onChange={e => setApplication((prev: any) => prev ? { ...prev, name: e.target.value } : prev)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Description</label>
                <textarea title="Application description" value={application.description} onChange={e => setApplication((prev: any) => prev ? { ...prev, description: e.target.value } : prev)} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          {/* URLs & Status */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">URLs & Status</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">{application.platform === 'web' ? 'Application URL' : 'App Store URL'}</label>
                <input type="url" value={application.appUrl || application.domain || ''} onChange={e => setApplication((prev: any) => prev ? { ...prev, appUrl: e.target.value } : prev)} placeholder={application.platform === 'web' ? 'https://your-app.com' : 'https://apps.apple.com/...'} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Status</label>
                <select title="Application status" value={application.status} onChange={e => setApplication((prev: any) => prev ? { ...prev, status: e.target.value } : prev)} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>
          </div>

          {/* Login & Signup Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Login & Signup Behavior</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Control signup policy and post-auth redirects.</p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { key: 'signupEnabled', label: 'Signup enabled' },
                  { key: 'emailVerificationRequired', label: 'Require email verification' },
                  { key: 'inviteOnly', label: 'Invite only' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={authBehavior[key]}
                      onChange={e => setApplication((prev: any) => prev ? { ...prev, authBehavior: { ...authBehavior, [key]: e.target.checked } } : prev)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Allowed Email Domains (comma-separated)</label>
                <input
                  type="text"
                  value={(authBehavior.allowedEmailDomains || []).join(', ')}
                  onChange={e => setApplication((prev: any) => prev ? {
                    ...prev,
                    authBehavior: { ...authBehavior, allowedEmailDomains: e.target.value.split(',').map((v: string) => v.trim().toLowerCase()).filter(Boolean) }
                  } : prev)}
                  placeholder="example.com, company.org"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Post Login Redirect</label>
                <input
                  type="text"
                  value={authBehavior.postLoginRedirect || ''}
                  onChange={e => setApplication((prev: any) => prev ? { ...prev, authBehavior: { ...authBehavior, postLoginRedirect: e.target.value } } : prev)}
                  placeholder="/dashboard"
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 ${isPostLoginRedirectValid ? 'border-gray-200 dark:border-zinc-700 focus:ring-blue-500/20' : 'border-red-300 dark:border-red-600 focus:ring-red-500/20'}`}
                />
                {!isPostLoginRedirectValid && <p className="mt-1 text-xs text-red-500">Use a relative path like `/dashboard` or an absolute `https://...` URL.</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Post Signup Redirect</label>
                <input
                  type="text"
                  value={authBehavior.postSignupRedirect || ''}
                  onChange={e => setApplication((prev: any) => prev ? { ...prev, authBehavior: { ...authBehavior, postSignupRedirect: e.target.value } } : prev)}
                  placeholder="/welcome"
                  className={`w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 ${isPostSignupRedirectValid ? 'border-gray-200 dark:border-zinc-700 focus:ring-blue-500/20' : 'border-red-300 dark:border-red-600 focus:ring-red-500/20'}`}
                />
                {!isPostSignupRedirectValid && <p className="mt-1 text-xs text-red-500">Use a relative path like `/welcome` or an absolute `https://...` URL.</p>}
              </div>
            </div>
          </div>

          {/* Redirect URIs */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Redirect URIs</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">OAuth callback URIs for this app client</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newRedirectUri}
                  onChange={e => setNewRedirectUri(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onAddRedirectUri()}
                  placeholder="https://yourapp.com/auth/callback or myapp://auth/callback"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Button type="button" variant="outline" onClick={onAddRedirectUri} className="shrink-0">
                  <PlusIcon className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Drag rows by the handle to reorder. The top URI is canonical.</p>
              <div className="space-y-2">
                {(application.oauthRedirectUris || []).length > 0 ? (
                  (application.oauthRedirectUris || []).map((uri: string, index: number, arr: string[]) => (
                    <div
                      key={uri}
                      draggable
                      onDragStart={() => onRedirectUriDragStart(uri)}
                      onDragOver={(e) => onRedirectUriDragOver(e, uri)}
                      onDrop={(e) => onRedirectUriDrop(e, uri)}
                      onDragEnd={onRedirectUriDragEnd}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${dragOverRedirectUri === uri ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-zinc-700'}`}
                    >
                      <button type="button" draggable onDragStart={() => onRedirectUriDragStart(uri)} className="p-1 rounded-md cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200" title="Drag to reorder">
                        <GripVerticalIcon className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onMoveRedirectUri(uri, 'up')} disabled={index === 0} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
                          <ChevronUpIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onMoveRedirectUri(uri, 'down')} disabled={index === arr.length - 1} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <code className="flex-1 text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">{uri}</code>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">canonical</span>
                      )}
                      <button onClick={() => onCopy(uri, `redirect-${uri}`)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Redirect URI">
                        {copiedId === `redirect-${uri}` ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => onRemoveRedirectUri(uri)} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Remove Redirect URI">
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-zinc-400">No redirect URIs configured yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Config */}
          {application.platform === 'mobile' && (
            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
              <div className="md:pr-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Mobile Config</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Bundle ID</label>
                  <input type="text" value={application.bundleId || ''} onChange={e => setApplication((prev: any) => prev ? { ...prev, bundleId: e.target.value } : prev)} placeholder="com.yourapp.mobile" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Deep Link Scheme</label>
                  <input type="text" value={application.deepLinkScheme || ''} onChange={e => setApplication((prev: any) => prev ? { ...prev, deepLinkScheme: e.target.value } : prev)} placeholder="myapp://" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
          )}

          {/* Web Config */}
          {application.platform === 'web' && (
            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
              <div className="md:pr-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Web Config</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-1">Domain</label>
                <input type="text" value={application.domain || ''} onChange={e => setApplication((prev: any) => prev ? { ...prev, domain: e.target.value } : prev)} placeholder="your-app.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          )}

          {/* API Key */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">API Key</p>
            </div>
            <div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                <KeyIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <code className="flex-1 text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">
                  {apiKeyVisible ? 'Not available in this UI' : '••••••••••••••••••••••••••••••••'}
                </code>
                <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title={apiKeyVisible ? 'Hide' : 'Show'}>
                  <EyeIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-2">API key management is not available on this screen yet. Use backend tooling or Dev Hub APIs once enabled.</p>
            </div>
          </div>

          {/* Application Info */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-start py-2">
            <div className="md:pr-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Application Info</p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                <p className="text-gray-500">App ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{appId}</p>
                  <button onClick={() => onCopy(appId, 'app-id')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy App ID">
                    {copiedId === 'app-id' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                <p className="text-gray-500">Platform</p>
                <p className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{application.platform === 'web' ? '🌐 Web App' : '📱 Mobile App'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                <p className="text-gray-500">Redirect URI (Canonical)</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-gray-700 dark:text-zinc-300 truncate">{canonicalRedirectUri || '—'}</p>
                  {canonicalRedirectUri && (
                    <button onClick={() => onCopy(canonicalRedirectUri, 'redirect-uri')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Redirect URI">
                      {copiedId === 'redirect-uri' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OIDC Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start pt-4 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-gray-500 pt-1 text-xs">Client ID</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={application.oauthClientId || ''}
                  onChange={e => setApplication((prev: any) => prev ? { ...prev, oauthClientId: e.target.value } : prev)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md text-xs font-mono text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="client_id"
                  title="OAuth Client ID"
                />
                {application.oauthClientId && (
                  <button onClick={() => onCopy(application.oauthClientId, 'client-id')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy Client ID">
                    {copiedId === 'client-id' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant={generateClientIdOnSave ? 'secondary' : 'outline'} className="h-7 px-2.5 text-xs" onClick={() => setGenerateClientIdOnSave(!generateClientIdOnSave)} title="Generate new Client ID on next save">
                  <RefreshCwIcon className="w-3.5 h-3.5 mr-1" />
                  {generateClientIdOnSave ? 'Will generate on save' : 'Generate on save'}
                </Button>
              </div>
              {generatedClientId && (
                <div className="p-2 rounded-md border border-blue-200 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/20">
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 mb-1">Generated Client ID:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[11px] font-mono text-blue-800 dark:text-blue-200 break-all">{generatedClientId}</code>
                    <button onClick={() => onCopy(generatedClientId, 'generated-client-id')} className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors" title="Copy generated client ID">
                      {copiedId === 'generated-client-id' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-start">
            <p className="text-gray-500 pt-1 text-xs">Client Secret</p>
            <div>
              <p className={`font-medium text-sm ${application.oauthClientSecretConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {application.oauthClientSecretConfigured ? 'Configured' : 'Not configured'}
              </p>
              <div className="mt-2 flex items-center gap-2 p-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40">
                <code className="flex-1 text-[11px] font-mono text-gray-700 dark:text-zinc-300 break-all">
                  {generatedClientSecret
                    ? (showGeneratedClientSecret ? generatedClientSecret : maskSecret(generatedClientSecret))
                    : (application.oauthClientSecretConfigured ? '••••••••••••••••••••' : 'Not configured')}
                </code>
                {generatedClientSecret && (
                  <>
                    <button onClick={() => setShowGeneratedClientSecret(!showGeneratedClientSecret)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title={showGeneratedClientSecret ? 'Hide client secret' : 'Show client secret'}>
                      <EyeIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onCopy(generatedClientSecret, 'generated-client-secret')} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-colors" title="Copy new client secret">
                      {copiedId === 'generated-client-secret' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setShowRotateSecretConfirm(true)} disabled={generalSaving} title="Rotate client secret now">
                  <RefreshCwIcon className="w-3.5 h-3.5 mr-1" />
                  Rotate secret now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
