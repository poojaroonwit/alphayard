'use client'

import React, { useState, useEffect } from 'react'
import { CodeIcon, KeyIcon, WebhookIcon, BookOpenIcon, CopyIcon, CheckCircle2Icon, PlusIcon, Trash2Icon, RefreshCwIcon, EyeIcon, EyeOffIcon, Loader2Icon, ActivityIcon, TerminalIcon, ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ApiKey {
  id: string
  name: string
  key: string
  scopes: string[]
  lastUsed: string | null
  createdAt: string
  isActive: boolean
}

const CODE_EXAMPLES = {
  auth: {
    label: 'Authentication',
    js: `import { AppKit } from '@appkit/sdk';

const client = new AppKit({
  apiKey: 'ak_your_api_key_here',
  appId: 'your_app_id',
});

// Login
const { user, accessToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'password',
});

// Register
const { user } = await client.auth.register({
  email: 'newuser@example.com',
  password: 'securepassword',
  firstName: 'John',
  lastName: 'Doe',
});

// Get current user
const me = await client.auth.me();`,
    curl: `# Login
curl -X POST https://your-appkit.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -H "X-App-ID: your_app_id" \\
  -d '{"email":"user@example.com","password":"password"}'

# Register
curl -X POST https://your-appkit.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -H "X-App-ID: your_app_id" \\
  -d '{"email":"new@example.com","password":"pass","firstName":"John","lastName":"Doe"}'`,
  },
  users: {
    label: 'Users',
    js: `// List users
const { users, pagination } = await client.users.list({
  page: 1,
  limit: 20,
  search: 'john',
});

// Get a user
const user = await client.users.get(userId);

// Update a user
await client.users.update(userId, {
  firstName: 'Jane',
  metadata: { plan: 'pro' },
});

// Deactivate
await client.users.deactivate(userId);`,
    curl: `# List users
curl -X GET "https://your-appkit.com/api/v1/admin/users?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get user
curl -X GET "https://your-appkit.com/api/v1/admin/users/USER_ID" \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"`,
  },
  webhooks: {
    label: 'Webhooks',
    js: `// Create a webhook
await client.webhooks.create({
  url: 'https://your-api.com/webhooks/appkit',
  events: ['user.created', 'user.login', 'user.updated'],
  secret: 'your_webhook_secret',
});

// Verify webhook signature (in your server)
import { verifyWebhookSignature } from '@appkit/sdk';

app.post('/webhooks/appkit', (req, res) => {
  const sig = req.headers['x-appkit-signature'];
  const isValid = verifyWebhookSignature(
    req.rawBody, sig, 'your_webhook_secret'
  );
  if (!isValid) return res.status(401).send('Unauthorized');

  const { event, data } = req.body;
  // handle event...
  res.sendStatus(200);
});`,
    curl: `# Webhook payload example
{
  "event": "user.created",
  "timestamp": "2024-02-22T10:30:00Z",
  "appId": "your_app_id",
  "data": {
    "userId": "usr_001",
    "email": "new@example.com",
    "firstName": "John"
  }
}`,
  },
  storage: {
    label: 'Storage',
    js: `// Upload a file
const { url, key } = await client.storage.upload(file, {
  prefix: 'avatars/',
  contentType: 'image/jpeg',
});

// Get a signed URL
const signedUrl = await client.storage.getSignedUrl(key, {
  expiresIn: 3600, // 1 hour
});

// Delete a file
await client.storage.delete(key);

// List files
const { objects } = await client.storage.list({
  prefix: 'avatars/',
});`,
    curl: `# Upload
curl -X POST "https://your-appkit.com/api/v1/admin/upload" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@photo.jpg"

# Response: { "url": "https://cdn.example.com/avatars/photo.jpg", "key": "avatars/photo.jpg" }`,
  },
}

export default function DevHubPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState('auth')
  const [codeLang, setCodeLang] = useState<'js' | 'curl'>('js')
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [keysLoading, setKeysLoading] = useState(true)
  const [showKey, setShowKey] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { loadKeys() }, [])

  const loadKeys = async () => {
    setKeysLoading(true)
    try {
      const res = await fetch('/api/v1/admin/api-keys')
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.keys || [])
      }
    } catch {
      // silent
    } finally {
      setKeysLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (res.ok) {
        setNewKeyName('')
        await loadKeys()
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return
    setDeleting(id)
    try {
      await fetch(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' })
      setApiKeys(prev => prev.filter(k => k.id !== id))
    } catch {
      // silent
    } finally {
      setDeleting(null)
    }
  }

  const example = CODE_EXAMPLES[activeExample as keyof typeof CODE_EXAMPLES]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <TerminalIcon className="w-5 h-5 text-white" />
          </div>
          Developer Hub
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 ml-13">API keys, documentation, and integration examples for your applications.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: API Keys */}
        <div className="xl:col-span-1 space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">API Keys</h2>
            </div>

            {/* Create Key */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateKey() }}
                placeholder="Key name (e.g. Production)"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button size="sm" onClick={handleCreateKey} disabled={creating || !newKeyName.trim()} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shrink-0">
                {creating ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <PlusIcon className="w-3.5 h-3.5" />}
              </Button>
            </div>

            {/* Keys List */}
            {keysLoading ? (
              <div className="flex justify-center py-4">
                <Loader2Icon className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-6">
                <KeyIcon className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400 dark:text-zinc-500">No API keys yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map(key => (
                  <div key={key.id} className="p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{key.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
                        >
                          {showKey === key.id ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(key.key, key.id)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
                        >
                          {copiedId === key.id ? <CheckCircle2Icon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          disabled={deleting === key.id}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                        >
                          {deleting === key.id ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <Trash2Icon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <code className="text-[11px] font-mono text-gray-500 dark:text-zinc-400">
                      {showKey === key.id ? key.key : `${key.key.slice(0, 12)}${'•'.repeat(16)}`}
                    </code>
                    {key.lastUsed && (
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        Last used: {new Date(key.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ZapIcon className="w-4 h-4 text-blue-500" />
              Quick Reference
            </h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Base URL', value: 'https://your-appkit.com/api/v1' },
                { label: 'Auth Header', value: 'Authorization: Bearer TOKEN' },
                { label: 'App Header', value: 'X-App-ID: your_app_id' },
                { label: 'Content-Type', value: 'application/json' },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 dark:text-zinc-400 shrink-0">{item.label}</span>
                  <code className="text-right text-gray-700 dark:text-zinc-300 font-mono text-[10px] break-all">{item.value}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook Events */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <WebhookIcon className="w-4 h-4 text-purple-500" />
              Webhook Events
            </h2>
            <div className="space-y-1">
              {[
                'user.created', 'user.updated', 'user.deleted',
                'user.login', 'user.logout', 'auth.mfa_enabled',
                'session.created', 'session.expired',
              ].map(ev => (
                <div key={ev} className="flex items-center justify-between">
                  <code className="text-[11px] font-mono text-gray-700 dark:text-zinc-300">{ev}</code>
                  <button
                    onClick={() => handleCopy(ev, ev)}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    {copiedId === ev ? <CheckCircle2Icon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Code Examples */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Example Tabs */}
            <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 dark:border-zinc-800 overflow-x-auto pb-0">
              {Object.entries(CODE_EXAMPLES).map(([key, ex]) => (
                <button
                  key={key}
                  onClick={() => setActiveExample(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                    activeExample === key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5'
                      : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Language Toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{example.label}</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                  {(['js', 'curl'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        codeLang === lang
                          ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-zinc-400'
                      }`}
                    >
                      {lang === 'js' ? 'JavaScript' : 'cURL'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleCopy(example[codeLang], 'code')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  {copiedId === 'code' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
            </div>

            {/* Code Block */}
            <pre className="p-5 overflow-x-auto text-[12px] leading-relaxed font-mono text-gray-800 dark:text-zinc-200 bg-gray-50/50 dark:bg-zinc-900 max-h-[400px] overflow-y-auto">
              {example[codeLang]}
            </pre>
          </div>

          {/* API Reference */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-green-500" />
              API Reference
            </h2>
            <div className="space-y-3">
              {[
                { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate a user' },
                { method: 'POST', path: '/api/v1/auth/register', desc: 'Register a new user' },
                { method: 'GET', path: '/api/v1/auth/me', desc: 'Get current user profile' },
                { method: 'POST', path: '/api/v1/auth/logout', desc: 'Invalidate session' },
                { method: 'GET', path: '/api/v1/admin/users', desc: 'List users (paginated)' },
                { method: 'GET', path: '/api/v1/admin/users/:id', desc: 'Get user by ID' },
                { method: 'PATCH', path: '/api/v1/admin/users/:id', desc: 'Update user' },
                { method: 'DELETE', path: '/api/v1/admin/users/:id', desc: 'Delete user' },
                { method: 'GET', path: '/api/v1/admin/applications/:id', desc: 'Get application details' },
                { method: 'POST', path: '/api/v1/admin/upload', desc: 'Upload a file' },
              ].map(ep => (
                <div key={ep.path} className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                    ep.method === 'GET' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                    ep.method === 'POST' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                    ep.method === 'PATCH' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                    'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                  }`}>{ep.method}</span>
                  <code className="text-xs font-mono text-gray-700 dark:text-zinc-300 flex-1 truncate">{ep.path}</code>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0 hidden sm:block">{ep.desc}</span>
                  <button onClick={() => handleCopy(ep.path, `ep-${ep.path}`)} className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600">
                    {copiedId === `ep-${ep.path}` ? <CheckCircle2Icon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity / Recent requests placeholder */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-blue-500" />
              Recent API Activity
            </h2>
            <div className="space-y-2">
              {[
                { status: 200, method: 'POST', path: '/api/v1/auth/login', time: '2s ago', duration: '45ms' },
                { status: 200, method: 'GET', path: '/api/v1/admin/users', time: '5m ago', duration: '112ms' },
                { status: 201, method: 'POST', path: '/api/v1/auth/register', time: '12m ago', duration: '250ms' },
                { status: 401, method: 'GET', path: '/api/v1/auth/me', time: '1h ago', duration: '12ms' },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <span className={`text-[11px] font-bold font-mono shrink-0 ${req.status < 300 ? 'text-green-600 dark:text-green-400' : req.status < 400 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                    {req.status}
                  </span>
                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded font-mono shrink-0 ${req.method === 'GET' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                    {req.method}
                  </span>
                  <code className="text-xs font-mono text-gray-600 dark:text-zinc-400 flex-1 truncate">{req.path}</code>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0">{req.duration}</span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0">{req.time}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-3 italic">Sample data — real-time logs coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
