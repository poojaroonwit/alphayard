'use client'

import React, { useState } from 'react'
import { PackageIcon, CopyIcon, CheckCircle2Icon, SmartphoneIcon, MonitorIcon, CodeIcon, BookOpenIcon, ExternalLinkIcon, ChevronDownIcon, ChevronRightIcon, ZapIcon, ShieldIcon, UsersIcon, BellIcon } from 'lucide-react'

const SDK_PACKAGES = [
  {
    id: 'react-native',
    name: '@appkit/react-native',
    label: 'React Native SDK',
    platform: 'mobile',
    version: '1.0.0',
    description: 'Full-featured SDK for Expo and React Native apps. Includes auth, storage, push notifications, and UI components.',
    install: 'npm install @appkit/react-native',
    yarn: 'yarn add @appkit/react-native',
    pnpm: 'pnpm add @appkit/react-native',
    color: 'blue',
  },
  {
    id: 'web',
    name: '@appkit/web',
    label: 'Web SDK',
    platform: 'web',
    version: '1.0.0',
    description: 'Lightweight browser SDK. Works with any frontend framework — React, Vue, Svelte, or vanilla JS.',
    install: 'npm install @appkit/web',
    yarn: 'yarn add @appkit/web',
    pnpm: 'pnpm add @appkit/web',
    color: 'violet',
  },
  {
    id: 'node',
    name: '@appkit/node',
    label: 'Node.js SDK',
    platform: 'server',
    version: '1.0.0',
    description: 'Server-side SDK for Node.js/TypeScript backends. Admin API access, webhook verification, and server-side auth.',
    install: 'npm install @appkit/node',
    yarn: 'yarn add @appkit/node',
    pnpm: 'pnpm add @appkit/node',
    color: 'green',
  },
]

const GUIDES = [
  {
    id: 'quickstart-rn',
    title: 'React Native Quickstart',
    platform: 'mobile',
    steps: [
      {
        title: 'Install the SDK',
        code: `npm install @appkit/react-native

# Required peer dependencies
npm install @react-native-async-storage/async-storage`,
      },
      {
        title: 'Initialize the client',
        code: `// App.tsx
import { AppKitProvider } from '@appkit/react-native';

export default function App() {
  return (
    <AppKitProvider
      config={{
        apiKey: 'ak_your_api_key_here',
        appId: 'your_app_id',
        baseUrl: 'https://your-appkit.com',
      }}
    >
      <YourApp />
    </AppKitProvider>
  );
}`,
      },
      {
        title: 'Use auth hooks',
        code: `import { useAuth, useUser } from '@appkit/react-native';

export function LoginScreen() {
  const { login, logout, isLoading } = useAuth();
  const { user } = useUser();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password',
    });

    if (result.success) {
      console.log('Logged in:', result.user);
    }
  };

  return (
    // your UI here
  );
}`,
      },
      {
        title: 'Upload files',
        code: `import { useStorage } from '@appkit/react-native';
import * as ImagePicker from 'expo-image-picker';

export function AvatarPicker() {
  const { upload, isUploading } = useStorage();

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const { url } = await upload(result.assets[0], {
        prefix: 'avatars/',
      });
      console.log('Uploaded to:', url);
    }
  };
}`,
      },
    ],
  },
  {
    id: 'quickstart-web',
    title: 'Web Quickstart',
    platform: 'web',
    steps: [
      {
        title: 'Install the SDK',
        code: `npm install @appkit/web`,
      },
      {
        title: 'Initialize the client',
        code: `// lib/appkit.ts
import { AppKit } from '@appkit/web';

export const client = new AppKit({
  apiKey: 'ak_your_api_key_here',
  appId: 'your_app_id',
  baseUrl: 'https://your-appkit.com',
});`,
      },
      {
        title: 'Authentication',
        code: `import { client } from '@/lib/appkit';

// Login
const { user, accessToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'password',
});

// Register
const { user } = await client.auth.register({
  email: 'new@example.com',
  password: 'securepassword',
  firstName: 'John',
  lastName: 'Doe',
});

// Check auth state
const isAuthenticated = client.auth.isAuthenticated();
const currentUser = await client.auth.getUser();`,
      },
      {
        title: 'React integration (optional)',
        code: `// With React hooks
import { useAppKit } from '@appkit/react';

export function Profile() {
  const { user, isLoading, logout } = useAppKit();

  if (isLoading) return <Spinner />;
  if (!user) return <LoginPage />;

  return (
    <div>
      <h1>Hello, {user.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}`,
      },
    ],
  },
]

const FEATURES = [
  { icon: <ShieldIcon className="w-5 h-5" />, title: 'Authentication', desc: 'JWT-based auth with MFA, SSO, and OAuth support. Login, register, refresh tokens automatically.', color: 'blue' },
  { icon: <UsersIcon className="w-5 h-5" />, title: 'User Management', desc: 'CRUD for users, roles, sessions, and permissions. Full admin API access.', color: 'violet' },
  { icon: <PackageIcon className="w-5 h-5" />, title: 'File Storage', desc: 'Upload, download, and manage files. Works with MinIO, S3, GCS, and Azure.', color: 'amber' },
  { icon: <BellIcon className="w-5 h-5" />, title: 'Push Notifications', desc: 'Send push, email, and SMS notifications. Register device tokens automatically.', color: 'green' },
  { icon: <ZapIcon className="w-5 h-5" />, title: 'Real-time', desc: 'WebSocket connection via Socket.io. Live events for user activity and app updates.', color: 'orange' },
  { icon: <CodeIcon className="w-5 h-5" />, title: 'TypeScript First', desc: 'Full TypeScript support with strict types, auto-complete, and inline docs.', color: 'pink' },
]

const COLORS: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
  violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20',
  green: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20',
  pink: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-500/20',
}

export default function SDKPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeGuide, setActiveGuide] = useState('quickstart-rn')
  const [installTool, setInstallTool] = useState<'npm' | 'yarn' | 'pnpm'>('npm')
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['0', '1']))

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const guide = GUIDES.find(g => g.id === activeGuide)!

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <PackageIcon className="w-5 h-5 text-white" />
          </div>
          AppKit SDK
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Official SDKs for integrating AppKit into your web and mobile applications.</p>
      </div>

      {/* SDK Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SDK_PACKAGES.map(pkg => (
          <div key={pkg.id} className={`rounded-xl border p-5 space-y-3 ${COLORS[pkg.color]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pkg.platform === 'mobile' ? <SmartphoneIcon className="w-4 h-4" /> : pkg.platform === 'web' ? <MonitorIcon className="w-4 h-4" /> : <CodeIcon className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-wide">{pkg.platform}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20">v{pkg.version}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{pkg.label}</h3>
              <code className="text-[11px] font-mono opacity-70">{pkg.name}</code>
            </div>
            <p className="text-xs opacity-75 leading-relaxed">{pkg.description}</p>
            <div className="space-y-1">
              {(['npm', 'yarn', 'pnpm'] as const).map(tool => (
                <div
                  key={tool}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-white/40 dark:bg-black/20 font-mono text-[11px] cursor-pointer hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                  onClick={() => handleCopy(pkg[tool === 'npm' ? 'install' : tool], `${pkg.id}-${tool}`)}
                >
                  <span className="opacity-60 shrink-0">{tool}</span>
                  <code className="truncate mx-2">{pkg[tool === 'npm' ? 'install' : tool].replace(/^(npm install|yarn add|pnpm add) /, '')}</code>
                  {copiedId === `${pkg.id}-${tool}` ? <CheckCircle2Icon className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <CopyIcon className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">What's Included</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${COLORS[f.color]}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guides */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Integration Guides</h2>
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            {GUIDES.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGuide(g.id); setExpandedSteps(new Set(['0'])) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeGuide === g.id
                    ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
              >
                {g.platform === 'mobile' ? <SmartphoneIcon className="w-3.5 h-3.5" /> : <MonitorIcon className="w-3.5 h-3.5" />}
                {g.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {guide.steps.map((step, i) => {
            const id = String(i)
            const isOpen = expandedSteps.has(id)
            return (
              <div key={i} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  onClick={() => toggleStep(id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{step.title}</span>
                  {isOpen ? <ChevronDownIcon className="w-4 h-4 text-gray-400" /> : <ChevronRightIcon className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between px-5 py-2 bg-gray-50 dark:bg-zinc-800/50">
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">TypeScript</span>
                      <button
                        onClick={() => handleCopy(step.code, `step-${i}`)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      >
                        {copiedId === `step-${i}` ? <CheckCircle2Icon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                    </div>
                    <pre className="p-5 text-[12px] font-mono leading-relaxed text-gray-800 dark:text-zinc-200 overflow-x-auto">
                      {step.code}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Install selector for all packages */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-blue-500" />
            All Packages
          </h2>
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            {(['npm', 'yarn', 'pnpm'] as const).map(tool => (
              <button
                key={tool}
                onClick={() => setInstallTool(tool)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  installTool === tool ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {SDK_PACKAGES.map(pkg => {
            const cmd = installTool === 'npm' ? pkg.install : installTool === 'yarn' ? pkg.yarn : pkg.pnpm
            return (
              <div
                key={pkg.id}
                onClick={() => handleCopy(cmd, `all-${pkg.id}`)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors group"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${COLORS[pkg.color]}`}>
                  {pkg.platform === 'mobile' ? <SmartphoneIcon className="w-3.5 h-3.5" /> : pkg.platform === 'web' ? <MonitorIcon className="w-3.5 h-3.5" /> : <CodeIcon className="w-3.5 h-3.5" />}
                </div>
                <code className="text-xs font-mono text-gray-700 dark:text-zinc-300 flex-1">{cmd}</code>
                {copiedId === `all-${pkg.id}`
                  ? <CheckCircle2Icon className="w-4 h-4 text-green-500 shrink-0" />
                  : <CopyIcon className="w-4 h-4 text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                }
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
