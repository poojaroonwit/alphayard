'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { 
  Copy, 
  Check, 
  Terminal, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  Info,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Badge } from '@components/ui/Badge'
import Link from 'next/link'

type DocContent = {
  title: string
  description: string
  content: React.ReactNode
  prev?: { title: string; href: string }
  next?: { title: string; href: string }
}

export default function DocPage() {
  const params = useParams()
  if (!params) return null
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug
  const [copied, setCopied] = React.useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const CodeBlock = ({ code, language, id }: { code: string, language: string, id: string }) => (
    <div className="relative group my-6">
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 w-8 p-0 bg-slate-800 border-slate-700 hover:bg-slate-700" 
          onClick={() => copyToClipboard(code, id)}
        >
          {copied === id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
        </Button>
      </div>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 rounded-t-2xl">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{language}</span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
        </div>
      </div>
      <pre className="p-6 bg-slate-950 text-slate-300 font-mono text-sm leading-relaxed overflow-x-auto rounded-b-2xl border border-slate-800 border-t-0 shadow-2xl">
        <code>{code}</code>
      </pre>
    </div>
  )

  const docs: Record<string, DocContent> = {
    'quick-start': {
      title: 'Quick Start',
      description: 'Get up and running with AppKit in less than 5 minutes.',
      content: (
        <div className="space-y-8">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-4 items-start">
            <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Info className="h-4 w-4" />
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              This guide assumes you already have an AppKit account and access to the Admin Dashboard.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">1. Create an OAuth Client</h2>
          <p className="text-slate-600 leading-relaxed">
            Navigate to <strong>{"Identity > OAuth Clients"}</strong> and create a new client. For this quickstart, we&apos;ll use a <strong>Public</strong> client type.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">2. Install the SDK</h2>
          <p className="text-slate-600 leading-relaxed">Choose your preferred package manager to add the SDK to your project.</p>
          <CodeBlock 
            id="install"
            language="bash"
            code="npm install @appkit/identity-sdk"
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">3. Initialize and Login</h2>
          <CodeBlock 
            id="init"
            language="typescript"
            code={`import { AppKit } from '@appkit/identity-sdk';

const client = new AppKit({
  clientId: 'YOUR_CLIENT_ID',
  domain: 'https://auth.your-app.com'
});

// Trigger the login flow
await client.login();`}
          />
        </div>
      ),
      next: { title: 'Installation', href: '/identity/dev-hub/installation' }
    },
    'modules/login': {
      title: 'Login & Authentication',
      description: 'Implement secure login flows with support for PKCE and Multi-Factor Auth.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            AppKit provides a robust authentication gateway that abstracts the complexities of OIDC.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Authorization Code Flow</h2>
          <p className="text-slate-600 leading-relaxed">
            The standard way to integrate is using the Authorization Code flow. This is protected by default with PKCE.
          </p>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl space-y-3">
            <h4 className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Security Warning
            </h4>
            <p className="text-sm text-amber-700 leading-relaxed">
                Never expose your <code>CLIENT_SECRET</code> in frontend-only applications. Use the Public Client type instead.
            </p>
          </div>

          <CodeBlock 
            id="login-flow"
            language="javascript"
            code={`// 1. Build the Auth URL
const url = client.buildAuthUrl({
  redirect_uri: 'https://app.com/callback',
  scope: 'openid profile email'
});

// 2. Redirect User
window.location.href = url;`}
          />
        </div>
      ),
      prev: { title: 'Installation', href: '/identity/dev-hub/installation' },
      next: { title: 'Identity & Profiles', href: '/identity/dev-hub/modules/identity' }
    }
  }

  const doc = docs[slug] || {
    title: 'Page Not Found',
    description: "The documentation page you're looking for doesn't exist yet.",
    content: (
      <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
        <p className="text-slate-400">This section is currently under construction.</p>
        <Button variant="outline" className="mt-6">
            <Link href="/identity/dev-hub">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
            <Link href="/identity/dev-hub" className="hover:underline">Docs</Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-400">{slug.split('/').pop()}</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">{doc.title}</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">{doc.description}</p>
      </div>

      <div className="prose prose-slate max-w-none dark:prose-invert">
        {doc.content}
      </div>

      {/* Pagination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-12 border-t border-slate-100 dark:border-slate-800">
        {doc.prev ? (
          <Link href={doc.prev.href} className="group p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest mb-2">
                <ArrowLeft className="h-3 w-3" />
                Previous
            </div>
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {doc.prev.title}
            </div>
          </Link>
        ) : <div />}

        {doc.next ? (
          <Link href={doc.next.href} className="group p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-right">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest mb-2 justify-end">
                Next
                <ArrowRight className="h-3 w-3" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {doc.next.title}
            </div>
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}
