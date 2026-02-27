'use client'

import React, { useState } from 'react'
import {
  XIcon,
  CopyIcon,
  CheckCircle2Icon,
  CodeIcon,
  SmartphoneIcon,
  UserPlusIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
} from 'lucide-react'

interface IntegrationGuideDrawerProps {
  isOpen: boolean
  onClose: () => void
  appId: string
  appName: string
  appDomain?: string
}

export default function IntegrationGuideDrawer({ isOpen, onClose, appId, appName, appDomain }: IntegrationGuideDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  const domain = appDomain || 'auth.your-app.com'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-4 right-4 bottom-4 w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <CodeIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integration Guide</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">SDK setup for {appName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Quick Start */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                Web SDK Quickstart
              </h3>
              <a href="#" className="text-xs text-blue-500 font-medium flex items-center gap-1 hover:underline">
                View Docs <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-zinc-400">1. Install the core identity package via npm or yarn:</p>
              <div className="relative group">
                <div className="absolute right-3 top-3">
                  <button 
                    onClick={() => handleCopy('npm install @appkit/identity-core', 'install-web')}
                    className="p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors"
                  >
                    {copiedId === 'install-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800 shadow-inner">
                  <code>npm install @appkit/identity-core</code>
                </pre>
              </div>

              <p className="text-sm text-gray-600 dark:text-zinc-400 pt-2">2. Initialize the client in your app using your Environment Variables:</p>
              <div className="relative group">
                <div className="absolute right-3 top-3">
                  <button 
                    onClick={() => handleCopy(`NEXT_PUBLIC_APPKIT_DOMAIN="https://${domain}"\nNEXT_PUBLIC_APPKIT_CLIENT_ID="${appId}"`, 'env-web')}
                    className="p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors"
                  >
                    {copiedId === 'env-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800 shadow-inner">
                  <code className="text-blue-300">NEXT_PUBLIC_APPKIT_DOMAIN</code><span className="text-gray-400">="https://{domain}"</span>{'\n'}
                  <code className="text-blue-300">NEXT_PUBLIC_APPKIT_CLIENT_ID</code><span className="text-gray-400">="{appId}"</span>
                </pre>
              </div>

              <p className="text-sm text-gray-600 dark:text-zinc-400 pt-2">3. Trigger the login flow:</p>
              <div className="relative group">
                <div className="absolute right-3 top-3">
                  <button 
                    onClick={() => handleCopy(`import { AppKit } from '@appkit/identity-core';\n\nconst client = new AppKit({\n  clientId: process.env.NEXT_PUBLIC_APPKIT_CLIENT_ID,\n  domain: process.env.NEXT_PUBLIC_APPKIT_DOMAIN\n});\n\n// Trigger login\nawait client.login();`, 'code-web')}
                    className="p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors"
                  >
                    {copiedId === 'code-web' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800 shadow-inner">
                  <span className="text-purple-400">import</span> {'{ AppKit }'} <span className="text-purple-400">from</span> <span className="text-green-300">'@appkit/identity-core'</span>;<br/><br/>
                  <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-yellow-200">AppKit</span>({'{'}<br/>
                  {'  '}clientId: process.env.<span className="text-blue-300">NEXT_PUBLIC_APPKIT_CLIENT_ID</span>,<br/>
                  {'  '}domain: process.env.<span className="text-blue-300">NEXT_PUBLIC_APPKIT_DOMAIN</span><br/>
                  {'}'});<br/><br/>
                  <span className="text-gray-500">// Trigger login</span><br/>
                  <span className="text-purple-400">await</span> client.<span className="text-blue-200">login</span>();
                </pre>
              </div>
            </div>
          </section>

          {/* React Native */}
          <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800/50">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SmartphoneIcon className="w-5 h-5 text-emerald-500" />
              React Native / Expo
            </h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400">Use our React Native wrapper for AppAuth to handle deep-linking automatically:</p>
            <div className="relative group">
              <div className="absolute right-3 top-3">
                <button 
                  onClick={() => handleCopy(`import { authorize } from 'react-native-app-auth';\n\nconst config = {\n  issuer: 'https://${domain}/oauth',\n  clientId: '${appId}',\n  redirectUrl: 'com.appkit.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}:/oauth',\n  scopes: ['openid', 'profile', 'email', 'offline_access'],\n  usePKCE: true,\n};\n\nconst authState = await authorize(config);`, 'code-rn')}
                  className="p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors"
                >
                  {copiedId === 'code-rn' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800 shadow-inner">
                <span className="text-purple-400">import</span> {'{ authorize }'} <span className="text-purple-400">from</span> <span className="text-green-300">'react-native-app-auth'</span>;<br/><br/>
                <span className="text-purple-400">const</span> config = {'{'}<br/>
                {'  '}issuer: <span className="text-green-300">'https://{domain}/oauth'</span>,<br/>
                {'  '}clientId: <span className="text-green-300">'{appId}'</span>,<br/>
                {'  '}redirectUrl: <span className="text-green-300">'com.appkit.{appName.toLowerCase().replace(/[^a-z0-9]/g, '')}:/oauth'</span>,<br/>
                {'  '}scopes: [<span className="text-green-300">'openid'</span>, <span className="text-green-300">'profile'</span>, <span className="text-green-300">'email'</span>, <span className="text-green-300">'offline_access'</span>],<br/>
                {'  '}usePKCE: <span className="text-yellow-400">true</span>,<br/>
                {'}'};<br/><br/>
                <span className="text-purple-400">const</span> authState = <span className="text-purple-400">await</span> <span className="text-blue-200">authorize</span>(config);
              </pre>
            </div>
          </section>

          {/* User Operations */}
          <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800/50">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5 text-violet-500" />
              User Signup
            </h3>
            <div className="relative group">
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => handleCopy(`// Trigger signup\nawait client.signup({\n  email: 'user@example.com',\n  password: 'securePassword123',\n  name: 'John Doe',\n});`, 'code-signup')}
                  className="p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors"
                >
                  {copiedId === 'code-signup' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800 shadow-inner">
                <span className="text-gray-500">// Trigger signup</span><br/>
                <span className="text-purple-400">await</span> client.<span className="text-blue-200">signup</span>({'{'}<br/>
                {'  '}email: <span className="text-green-300">&apos;user@example.com&apos;</span>,<br/>
                {'  '}password: <span className="text-green-300">&apos;securePassword123&apos;</span>,<br/>
                {'  '}name: <span className="text-green-300">&apos;John Doe&apos;</span>,<br/>
                {'}'});
              </pre>
            </div>
          </section>

          {/* Survey SDK */}
          <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-zinc-800/50">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardListIcon className="w-5 h-5 text-amber-500" />
              Survey SDK
            </h3>
            <div className="relative group">
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => handleCopy(`// Show a survey by ID\nawait client.showSurvey('SURVEY_ID');\n\n// Listen for survey completion\nclient.on('survey:completed', (res) => {\n  console.log('Answers:', res.answers);\n});`, 'code-survey')}
                  className="p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-800 text-gray-300 transition-colors"
                >
                  {copiedId === 'code-survey' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#0d1117] text-gray-300 text-sm overflow-x-auto border border-gray-800 shadow-inner">
                <span className="text-purple-400">await</span> client.<span className="text-blue-200">showSurvey</span>(<span className="text-green-300">&apos;SURVEY_ID&apos;</span>);<br/><br/>
                client.<span className="text-blue-200">on</span>(<span className="text-green-300">&apos;survey:completed&apos;</span>, (res) ={'> {'}<br/>
                {'  '}console.log(<span className="text-green-300">&apos;Answers:&apos;</span>, res.answers);<br/>
                {'}'});
              </pre>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-zinc-400 italic">Need help? Join our developer discord.</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  )
}
