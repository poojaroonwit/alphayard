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
  AlertTriangle,
  Globe,
  Smartphone
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
      next: { title: 'Installation', href: '/dev-hub/installation' }
    },
    'guide/web-app': {
      title: 'Web Application Integration',
      description: 'Standard OIDC Authorization Code flow for server-side applications.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">1. Authorization Flow</h2>
          <p className="text-slate-600">Redirect users to the authorization endpoint to start the login process.</p>
          <CodeBlock 
            id="web-auth-flow"
            language="javascript"
            code={`// 1. Redirect to Authorization Endpoint
const authUrl = \`\${ISSUER}/oauth/authorize?\` +
  \`client_id=\${CLIENT_ID}&\` +
  \`redirect_uri=\${REDIRECT_URI}&\` +
  \`response_type=code&\` +
  \`scope=openid profile email&\` +
  \`state=\${STATE}\`;

window.location.href = authUrl;`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">2. Token Exchange</h2>
          <CodeBlock 
            id="web-token-exchange"
            language="javascript"
            code={`// 2. Exchange Code for Tokens
const response = await fetch('\${ISSUER}/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: AUTH_CODE,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  })
});`}
          />
        </div>
      ),
      prev: { title: 'Installation', href: '/dev-hub/installation' },
      next: { title: 'Mobile Web Guide', href: '/dev-hub/guide/mobile-web' }
    },
    'guide/mobile-web': {
      title: 'Mobile Web / PWA',
      description: 'Secure authorization for public clients using Proof Key for Code Exchange (PKCE).',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">PKCE Implementation</h2>
          <p className="text-slate-600">Since mobile web clients cannot securely store secrets, PKCE is required.</p>
          <CodeBlock 
            id="pkce-flow"
            language="javascript"
            code={`// 1. Generate Verifier and Challenge
const verifier = generateRandomString();
const challenge = await generateCodeChallenge(verifier);

// 2. Redirect with Challenge
const authUrl = \`\${ISSUER}/oauth/authorize?\` +
  \`client_id=\${CLIENT_ID}&\` +
  \`redirect_uri=\${REDIRECT_URI}&\` +
  \`response_type=code&\` +
  \`code_challenge=\${challenge}&\` +
  \`code_challenge_method=S256\`;`}
          />
        </div>
      ),
      prev: { title: 'Web Guide', href: '/dev-hub/guide/web-app' },
      next: { title: 'Native Mobile Guide', href: '/dev-hub/guide/mobile-app' }
    },
    'guide/mobile-app': {
      title: 'Native Mobile App',
      description: 'Using official SDKs and deep-linking for secure native integration.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">React Native SDK</h2>
          <CodeBlock 
            id="rn-integration"
            language="javascript"
            code={`import { authorize } from 'react-native-app-auth';

const config = {
  issuer: 'https://auth.appkit.com/oauth',
  clientId: 'YOUR_CLIENT_ID',
  redirectUrl: 'com.appkit.app:/oauth',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  usePKCE: true,
};

const result = await authorize(config);`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Deep Link Configuration</h2>
          <CodeBlock 
            id="deep-link"
            language="xml"
            code={`<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.appkit.app" android:path="/oauth" />
</intent-filter>`}
          />
        </div>
      ),
      prev: { title: 'Mobile Web Guide', href: '/dev-hub/guide/mobile-web' },
      next: { title: 'Login & Auth', href: '/dev-hub/modules/login' }
    },
    'installation': {
      title: 'Installation',
      description: 'Add AppKit SDKs to your project and configure your environment.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Supported Platforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-500" /> React / Next.js
              </h4>
              <p className="text-xs text-slate-500">Optimized for client-side and server-side rendering.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-green-500" /> React Native
              </h4>
              <p className="text-xs text-slate-500">Native deep-linking and browser integration.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Core Package</h2>
          <CodeBlock 
            id="npm-install"
            language="bash"
            code="npm install @appkit/identity-core"
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Environment Configuration</h2>
          <p className="text-slate-600 leading-relaxed">
            Create a <code>.env</code> file in your project root and add your client credentials.
          </p>
          <CodeBlock 
            id="env-config"
            language="bash"
            code={`NEXT_PUBLIC_APPKIT_DOMAIN="https://auth.your-app.com"
NEXT_PUBLIC_APPKIT_CLIENT_ID="your_client_id_here"
APPKIT_CLIENT_SECRET="your_secret_here" # Server-side only`}
          />
        </div>
      ),
      prev: { title: 'Quick Start', href: '/dev-hub/quick-start' },
      next: { title: 'Login & Auth', href: '/dev-hub/modules/login' }
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
      prev: { title: 'Installation', href: '/dev-hub/installation' },
      next: { title: 'Identity & Profiles', href: '/dev-hub/modules/identity' }
    },
    'modules/identity': {
      title: 'Identity & Profiles',
      description: 'Manage user data, custom attributes, and profile synchronization.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Retrieving User Profile</h2>
          <p className="text-slate-600 leading-relaxed">
            Once authenticated, you can fetch the user's standardized profile data.
          </p>
          <CodeBlock 
            id="get-user"
            language="typescript"
            code={`const user = await client.getUser();
console.log(user.name); // 'John Doe'
console.log(user.email); // 'john@example.com'`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Custom Attributes</h2>
          <p className="text-slate-600 leading-relaxed">
            Store and retrieve application-specific metadata as part of the user's identity.
          </p>
          <CodeBlock 
            id="custom-attr"
            language="typescript"
            code={`// Update attributes
await client.updateAttributes({
  theme: 'dark',
  newsletter: true
});`}
          />
        </div>
      ),
      prev: { title: 'Login & Auth', href: '/dev-hub/modules/login' },
      next: { title: 'Groups & Organizations', href: '/dev-hub/modules/groups' }
    },
    'modules/groups': {
      title: 'Groups & Organizations',
      description: 'Manage complex organizational structures using Circles and User Groups.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            AppKit uses "Circles" as the primary unit for organizational grouping and data isolation.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Understanding Circles</h2>
          <p className="text-slate-600 leading-relaxed">
            A Circle can represent a team, a project, or an entire organization. Users can be members of multiple circles with different roles.
          </p>

          <CodeBlock 
            id="circle-membership"
            language="typescript"
            code={`const circles = await client.getUserCircles();
// [ { id: 'circle_123', name: 'Engineering', role: 'admin' } ]`}
          />
        </div>
      ),
      prev: { title: 'Identity & Profiles', href: '/dev-hub/modules/identity' },
      next: { title: 'Security & MFA', href: '/dev-hub/modules/security' }
    },
    'modules/security': {
      title: 'Security & MFA',
      description: 'Implement Multi-Factor Authentication and enforce sophisticated security policies.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Multi-Factor Auth (MFA)</h2>
          <p className="text-slate-600 leading-relaxed">
            Support for TOTP (Google Authenticator), SMS, and Email-based MFA is built-in.
          </p>

          <CodeBlock 
            id="mfa-enroll"
            language="typescript"
            code={`// Enroll user in TOTP
const { qrCodeUrl, secret } = await client.mfa.enroll('totp');

// Verify and enable
await client.mfa.verify({
  type: 'totp',
  code: '123456'
});`}
          />
        </div>
      ),
      prev: { title: 'Groups & Organizations', href: '/dev-hub/modules/groups' },
      next: { title: 'Session Management', href: '/dev-hub/modules/sessions' }
    },
    'modules/sessions': {
      title: 'Session Management',
      description: 'Handle token refresh, persistence, and secure logout.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Persistence Strategies</h2>
          <p className="text-slate-600 leading-relaxed">
            The SDK handles session persistence automatically. You can choose between <code>localStorage</code>, <code>sessionStorage</code>, or <code>Cookies</code>.
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Token Refresh</h2>
          <p className="text-slate-600 leading-relaxed">
            AppKit uses rotating refresh tokens. The SDK automatically detects expired access tokens and refreshes them in the background.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Secure Logout</h2>
          <CodeBlock 
            id="logout"
            language="typescript"
            code={`// Clear local session and invalidate tokens on the server
await client.logout({
  post_logout_redirect_uri: 'https://app.com/goodbye'
});`}
          />
        </div>
      ),
      prev: { title: 'Security & MFA', href: '/dev-hub/modules/security' },
      next: { title: 'Authentication API', href: '/dev-hub/api/auth' }
    },
    'api/auth': {
      title: 'Authentication API',
      description: 'REST endpoints for direct authentication integration.',
      content: (
        <div className="space-y-8">
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
            <h4 className="font-bold text-blue-900 mb-1">Base URL</h4>
            <code className="text-blue-700">https://auth.your-app.com/api/v1</code>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">POST /oauth/token</h2>
          <p className="text-slate-600 leading-relaxed font-mono text-sm">Grant Type: authorization_code</p>
          <CodeBlock 
            id="token-api"
            language="bash"
            code={`curl -X POST https://auth.app.com/api/v1/oauth/token \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "redirect_uri=CALLBACK_URL"`}
          />
        </div>
      ),
      prev: { title: 'Session Management', href: '/dev-hub/modules/sessions' },
      next: { title: 'Users API', href: '/dev-hub/api/users' }
    },
    'api/users': {
      title: 'Users API',
      description: 'Programmatically manage user profiles and attributes.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">GET /users/:id</h2>
          <p className="text-slate-600 leading-relaxed">Fetch a specific user profile by their unique ID.</p>
          <CodeBlock 
            id="get-user-api"
            language="bash"
            code={`curl https://auth.app.com/api/v1/users/usr_123 \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">PATCH /users/:id</h2>
          <p className="text-slate-600 leading-relaxed">Update user profile information or custom attributes.</p>
          <CodeBlock 
            id="patch-user-api"
            language="json"
            code={`{
  "firstName": "Jane",
  "attributes": {
    "role": "editor"
  }
}`}
          />
        </div>
      ),
      prev: { title: 'Authentication API', href: '/dev-hub/api/auth' },
      next: { title: 'Circles & Groups API', href: '/dev-hub/api/circles' }
    },
    'api/circles': {
      title: 'Circles & Groups API',
      description: 'Manage organizational units and memberships programmatically.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">GET /circles</h2>
          <p className="text-slate-600 leading-relaxed">List all circles the authenticated actor has access to.</p>
          <CodeBlock 
            id="list-circles"
            language="bash"
            code={`curl https://auth.app.com/api/v1/circles \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">POST /circles/:id/members</h2>
          <p className="text-slate-600 leading-relaxed">Add a new member to a circle.</p>
          <CodeBlock 
            id="add-member"
            language="json"
            code={`{
  "userId": "usr_789",
  "role": "editor"
}`}
          />
        </div>
      ),
      prev: { title: 'Users API', href: '/dev-hub/api/users' },
      next: { title: 'Audit & Security API', href: '/dev-hub/api/audit' }
    },
    'api/audit': {
      title: 'Audit & Security API',
      description: 'Access security logs and audit trails for compliance monitoring.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">GET /audit/logs</h2>
          <p className="text-slate-600 leading-relaxed">Query activity logs for specific users or applications.</p>
          <CodeBlock 
            id="query-logs"
            language="bash"
            code={`curl "https://auth.app.com/api/v1/audit/logs?targetId=usr_123" \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />
        </div>
      ),
      prev: { title: 'Circles & Groups API', href: '/dev-hub/api/circles' },
      next: { title: 'Management API', href: '/dev-hub/api/management' }
    },
    'api/management': {
      title: 'Management API',
      description: 'System-level operations for applications and settings.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">POST /applications</h2>
          <p className="text-slate-600 leading-relaxed">Register a new application in your AppKit organization.</p>
          
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
            <h4 className="font-bold text-blue-900 mb-2">Internal Use Only</h4>
            <p className="text-sm text-blue-700">
              The Management API requires a <strong>Management Token</strong> with higher privilege scopes.
            </p>
          </div>

          <CodeBlock 
            id="manage-api"
            language="bash"
            code={`curl -X POST https://auth.app.com/api/v1/applications \\
  -H "Authorization: Bearer MGMT_TOKEN" \\
  -d '{ "name": "Mobile Project" }'`}
          />
        </div>
      ),
      prev: { title: 'Audit & Security API', href: '/dev-hub/api/audit' }
    }
  }

  const doc = docs[slug] || {
    title: 'Page Not Found',
    description: "The documentation page you're looking for doesn't exist yet.",
    content: (
      <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
        <p className="text-slate-400">This section is currently under construction.</p>
        <Button variant="outline" className="mt-6">
            <Link href="/dev-hub">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
            <Link href="/dev-hub" className="hover:underline">Docs</Link>
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
