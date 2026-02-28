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
  const [copied, setCopied] = React.useState<string | null>(null)
  const params = useParams()
  if (!params) return null
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug

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
            code="npm install @alphayard/appkit"
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">3. Initialize and Login</h2>
          <CodeBlock 
            id="init"
            language="typescript"
            code={`import { AppKit } from '@alphayard/appkit';

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
            code="npm install @alphayard/appkit"
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
            code={`import { AppKit } from '@alphayard/appkit';

const client = new AppKit({
  clientId: 'YOUR_CLIENT_ID',
  domain: 'https://auth.your-app.com',
});

// 1. Build the Auth URL (includes PKCE by default)
const url = await client.buildAuthUrl({
  redirect_uri: 'https://app.com/callback',
  scope: 'openid profile email'
});

// 2. Redirect User
window.location.href = url;

// Or simply call login() which handles both steps:
await client.login();`}
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
            Once authenticated, you can fetch the user&apos;s standardized profile data.
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
            Store and retrieve application-specific metadata as part of the user&apos;s identity.
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
      next: { title: 'Content Management (CMS)', href: '/dev-hub/modules/cms' }
    },
    'modules/cms': {
      title: 'Content Management (CMS)',
      description: 'Dynamic content delivery, templates, and the Professional Content Studio.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            AppKit CMS allows you to manage marketing pages, in-app notifications, and dynamic layouts without redeploying your application.
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Content Studio</h2>
          <p className="text-slate-600">The Content Studio provides a powerful editor for creating pages, managing templates, and analyzing content performance.</p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Rendering Content</h2>
          <CodeBlock 
            id="render-content"
            language="typescript"
            code={`const content = await client.cms.getContent('welcome-page');
// Render your components based on the content object
return <div>{content.title}</div>;`}
          />
        </div>
      ),
      prev: { title: 'Identity & Profiles', href: '/dev-hub/modules/identity' },
      next: { title: 'Localization & i18n', href: '/dev-hub/modules/localization' }
    },
    'modules/localization': {
      title: 'Localization & i18n',
      description: 'Multi-lingual support, translation management, and regional configuration.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed">
            AppKit supports global applications with built-in localization services for managing languages and translations.
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">Fetching Translations</h2>
          <CodeBlock 
            id="get-translations"
            language="typescript"
            code={`const strings = await client.localization.getTranslations('en-US');
console.log(strings['welcome.title']); // 'Welcome to AppKit'`}
          />
        </div>
      ),
      prev: { title: 'Content Management (CMS)', href: '/dev-hub/modules/cms' },
      next: { title: 'Groups & Organizations', href: '/dev-hub/modules/groups' }
    },
    'modules/groups': {
      title: 'Groups & Organizations',
      description: 'Manage complex organizational structures using Circles and User Groups.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            AppKit uses &quot;Circles&quot; as the primary unit for organizational grouping and data isolation.
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
      next: { title: 'Webhooks', href: '/dev-hub/modules/webhooks' }
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
      next: { title: 'Webhooks API', href: '/dev-hub/api/webhooks' }
    },
    'api/cms': {
      title: 'CMS & Content API',
      description: 'API endpoints for managing content pages, versions, and templates.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">GET /cms/content/pages</h2>
          <p className="text-slate-600">Retrieve a list of content pages with optional filtering.</p>
          <CodeBlock 
            id="cms-list-api"
            language="bash"
            code={`curl https://auth.app.com/api/v1/cms/content/pages \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">POST /cms/content/pages</h2>
          <p className="text-slate-600">Create a new content page dynamically.</p>
          <CodeBlock 
            id="cms-create-api"
            language="json"
            code={`{
  "title": "Summer Promotion",
  "slug": "summer-promo",
  "type": "marketing",
  "status": "draft",
  "components": []
}`}
          />
        </div>
      ),
      prev: { title: 'Communication API', href: '/dev-hub/api/communication' },
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
      prev: { title: 'CMS & Content API', href: '/dev-hub/api/cms' },
      next: { title: 'Audit & Analytics API', href: '/dev-hub/api/audit' }
    },
    'api/audit': {
      title: 'Audit & Analytics API',
      description: 'Access security logs, audit trails, and platform analytics.',
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

          <h2 className="text-2xl font-bold mt-12 mb-4">GET /identity/analytics</h2>
          <p className="text-slate-600">Retrieve user growth and engagement metrics.</p>
          <CodeBlock 
            id="identity-analytics"
            language="bash"
            code={`curl https://auth.app.com/api/v1/identity/analytics \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />
        </div>
      ),
      prev: { title: 'CMS & Content API', href: '/dev-hub/api/cms' },
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

          <h2 className="text-2xl font-bold mt-12 mb-4">GET /applications/config</h2>
          <p className="text-slate-600">Fetch global configuration defaults for Auth, Communication, and Legal.</p>
          <CodeBlock 
            id="app-config-api"
            language="bash"
            code={`curl https://auth.app.com/api/v1/app-config/config \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />
        </div>
      ),
      prev: { title: 'Audit & Analytics API', href: '/dev-hub/api/audit' },
      next: { title: 'Application Config', href: '/dev-hub/admin/app-config' }
    },
    'admin/app-config': {
      title: 'Application Configuration',
      description: 'Overview of the per-application configuration console with vertical sidebar navigation.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            Each application has a dedicated configuration page organized into a vertical sidebar with grouped sections. This replaces the previous horizontal tab layout for better navigation.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Sidebar Groups</h2>
          <div className="grid gap-3">
            {[
              { group: 'Core', items: 'General (API Key, Danger Zone), Integration Guide, Users, Surveys' },
              { group: 'App Experience', items: 'Branding, Banners, Links & Support, Splash Screen, Auth Page Style' },
              { group: 'Identity & Security', items: 'Identity Scope, User Attributes, Auth Methods, Security & MFA' },
              { group: 'Operations', items: 'Communication, Webhooks, Legal & Compliance, Billing & Subscriptions, Activity Log, Login Sandbox' },
            ].map((section) => (
              <div key={section.group} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <h4 className="font-bold text-sm text-slate-900 mb-1">{section.group}</h4>
                <p className="text-xs text-slate-500">{section.items}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Fetching App Config</h2>
          <CodeBlock 
            id="fetch-app-config"
            language="bash"
            code={`curl https://auth.app.com/api/v1/admin/applications/:appId \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Updating App Settings</h2>
          <CodeBlock 
            id="update-app-config"
            language="bash"
            code={`curl -X PUT https://auth.app.com/api/v1/admin/applications/:appId \\
  -H "Authorization: Bearer MGMT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My App",
    "description": "Updated description",
    "status": "active",
    "domain": "myapp.example.com"
  }'`}
          />
        </div>
      ),
      prev: { title: 'Management API', href: '/dev-hub/api/management' },
      next: { title: 'Appearance & Branding', href: '/dev-hub/admin/appearance' }
    },
    'admin/appearance': {
      title: 'Appearance & Branding',
      description: 'Configure branding, banners, links, splash screen, and version control per application.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            The <strong>App Experience</strong> section in the application config sidebar provides five appearance-related settings panels. These were previously located on a separate Appearance page and are now integrated directly into each application&apos;s configuration.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Branding</h2>
          <p className="text-slate-600 leading-relaxed">
            Set the application name, upload a logo, and configure splash screen quick settings including background color, spinner color, resize mode, and logo animation.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Banners (Announcements)</h2>
          <p className="text-slate-600 leading-relaxed">
            Manage in-app announcement banners with configurable type (info, success, warning, error), message text, action URL, and dismissibility. Includes a real-time mobile device preview.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Links & Support</h2>
          <p className="text-slate-600 leading-relaxed">
            Configure support channels (email, help desk, WhatsApp, Line), social profiles (Facebook, Instagram, Twitter, LinkedIn, Discord), and app store IDs.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Splash Screen</h2>
          <p className="text-slate-600 leading-relaxed">
            Full splash screen customization: background color, spinner color/type (circle, dots, pulse, none), resize mode, logo animation (zoom, rotate, bounce, pulse), and visibility toggles for logo and app name.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Version Control</h2>
          <p className="text-slate-600 leading-relaxed">
            Set minimum allowed app version and store URL. Enable force-update mode for critical security fixes to block users on outdated versions.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Saving Branding Config</h2>
          <CodeBlock 
            id="save-branding"
            language="bash"
            code={`curl -X PUT https://auth.app.com/api/v1/admin/applications/:appId/branding \\
  -H "Authorization: Bearer MGMT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "My Mobile App",
    "logoUrl": "https://cdn.example.com/logo.png",
    "announcements": { "enabled": true, "text": "Welcome!", "type": "info" },
    "social": { "supportEmail": "help@example.com" },
    "splash": { "backgroundColor": "#1e40af", "spinnerType": "dots" },
    "updates": { "minVersion": "2.0.0", "forceUpdate": false }
  }'`}
          />
        </div>
      ),
      prev: { title: 'Application Config', href: '/dev-hub/admin/app-config' },
      next: { title: 'Auth Page Style', href: '/dev-hub/admin/auth-style' }
    },
    'admin/auth-style': {
      title: 'Auth Page Style',
      description: 'Visual customization of login and signup pages per device type.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            The Auth Page Style panel lets you customize the visual appearance of your authentication forms for each device type (Desktop Web, Mobile Web, Mobile App).
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Features</h2>
          <div className="grid gap-3">
            {[
              { title: 'Layout', desc: 'Choose between centered, left-aligned, or split layouts' },
              { title: 'Colors', desc: 'Background, card, text, button, and link colors' },
              { title: 'Typography', desc: 'Font family, sizes, social login button layout' },
              { title: 'Content', desc: 'Custom title, subtitle, and footer text' },
              { title: 'Providers', desc: 'Customize logos, labels, and colors per auth provider' },
              { title: 'Options', desc: 'Show/hide remember me, forgot password, social divider' },
            ].map(f => (
              <div key={f.title} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <h4 className="font-bold text-sm">{f.title}</h4>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Saving Auth Style</h2>
          <CodeBlock
            id="save-auth-style"
            language="bash"
            code={`curl -X PUT https://auth.app.com/api/v1/admin/applications/:appId/auth-style \\
  -H "Authorization: Bearer MGMT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "desktopWeb": { "layout": "centered", "bgColor": "#ffffff", ... },
    "mobileWeb": { "layout": "fullWidth", "bgColor": "#f8fafc", ... },
    "mobileApp": { "layout": "centered", "bgColor": "#0f172a", ... },
    "providers": [{ "id": "google", "label": "Google", "bgColor": "#fff" }]
  }'`}
          />
        </div>
      ),
      prev: { title: 'Appearance & Branding', href: '/dev-hub/admin/appearance' },
      next: { title: 'Activity Log', href: '/dev-hub/admin/activity' }
    },
    'admin/activity': {
      title: 'Activity Log',
      description: 'Audit trail of all configuration changes and admin actions.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            The Activity Log tab provides a complete audit trail of all admin actions across your application, including config changes, user operations, webhook events, and security updates.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Event Types</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'config', desc: 'Settings and branding changes' },
              { type: 'user', desc: 'User creation, updates, suspension' },
              { type: 'webhook', desc: 'Webhook endpoint modifications' },
              { type: 'security', desc: 'MFA and password policy changes' },
            ].map(e => (
              <div key={e.type} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <code className="text-xs font-bold text-blue-600">{e.type}</code>
                <p className="text-xs text-slate-500 mt-1">{e.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Querying the Activity Log</h2>
          <CodeBlock
            id="query-activity"
            language="bash"
            code={`curl "https://auth.app.com/api/v1/applications/:appId/activity?type=config&limit=50" \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Exporting Logs</h2>
          <CodeBlock
            id="export-activity"
            language="bash"
            code={`curl "https://auth.app.com/api/v1/applications/:appId/activity/export?format=csv" \\
  -H "Authorization: Bearer MGMT_TOKEN" -o activity.csv`}
          />
        </div>
      ),
      prev: { title: 'Auth Page Style', href: '/dev-hub/admin/auth-style' }
    },
    'modules/webhooks': {
      title: 'Webhooks',
      description: 'Receive real-time notifications when events occur in your application.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            Webhooks let your backend receive HTTP POST callbacks whenever key events happen — user signups, logins, profile updates, and more.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Available Events</h2>
          <div className="grid grid-cols-2 gap-2">
            {['user.created', 'user.login', 'user.signup', 'user.updated', 'user.deleted', 'auth.mfa_enabled', 'session.created', 'session.expired'].map(ev => (
              <code key={ev} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700">{ev}</code>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Registering a Webhook</h2>
          <CodeBlock
            id="register-webhook"
            language="typescript"
            code={`await client.webhooks.create({
  url: 'https://api.example.com/webhooks/appkit',
  events: ['user.created', 'user.login'],
  secret: 'whsec_your_signing_secret', // optional
});`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Verifying Signatures</h2>
          <CodeBlock
            id="verify-webhook"
            language="typescript"
            code={`import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Payload Format</h2>
          <CodeBlock
            id="webhook-payload"
            language="json"
            code={`{
  "event": "user.created",
  "timestamp": "2024-02-22T10:30:00Z",
  "applicationId": "app_123",
  "data": {
    "userId": "usr_001",
    "email": "john@example.com",
    "name": "John Doe"
  }
}`}
          />
        </div>
      ),
      prev: { title: 'Session Management', href: '/dev-hub/modules/sessions' },
      next: { title: 'Communication', href: '/dev-hub/modules/communication' }
    },
    'modules/communication': {
      title: 'Communication',
      description: 'Send transactional emails, SMS, push notifications, and in-app messages.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            AppKit Communication provides a unified API for sending messages across multiple channels with template support and delivery tracking.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Channels</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { ch: 'Email', provider: 'SendGrid / SES', status: 'Available' },
              { ch: 'SMS', provider: 'Twilio', status: 'Available' },
              { ch: 'Push', provider: 'Firebase / APNs', status: 'Available' },
              { ch: 'In-App', provider: 'Built-in', status: 'Available' },
            ].map(c => (
              <div key={c.ch} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <h4 className="font-bold text-sm">{c.ch}</h4>
                <p className="text-xs text-slate-500">{c.provider}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Sending Email</h2>
          <CodeBlock
            id="send-email"
            language="typescript"
            code={`await client.communication.sendEmail({
  to: 'user@example.com',
  template: 'welcome-email',
  data: { name: 'John', activationUrl: '...' },
});`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Push Notifications</h2>
          <CodeBlock
            id="send-push"
            language="typescript"
            code={`await client.communication.sendPush(userId, {
  title: 'New message',
  body: 'You have a new notification',
  data: { deepLink: '/messages/123' },
});`}
          />
        </div>
      ),
      prev: { title: 'Webhooks', href: '/dev-hub/modules/webhooks' },
      next: { title: 'Surveys', href: '/dev-hub/modules/surveys' }
    },
    'modules/surveys': {
      title: 'Surveys',
      description: 'Build, distribute, and analyze user surveys with the Survey Builder.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            The Surveys module provides a drag-and-drop survey builder with support for multiple question types, conditional logic, and real-time result analytics.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Question Types</h2>
          <div className="grid grid-cols-2 gap-2">
            {['Rating (1-5 stars)', 'Text (short/long)', 'Multiple Choice', 'NPS Score', 'Yes/No', 'Dropdown'].map(q => (
              <div key={q} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">{q}</div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Triggering a Survey</h2>
          <CodeBlock
            id="trigger-survey"
            language="typescript"
            code={`await client.surveys.trigger(surveyId, {
  userId: 'usr_123',
  context: { screen: 'checkout', action: 'purchase_complete' },
});`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Fetching Results</h2>
          <CodeBlock
            id="survey-results"
            language="typescript"
            code={`const results = await client.surveys.getResults(surveyId);
// { responses: [...], summary: { avg: 4.2, count: 128 } }`}
          />
        </div>
      ),
      prev: { title: 'Communication', href: '/dev-hub/modules/communication' },
      next: { title: 'Legal & Compliance', href: '/dev-hub/modules/legal' }
    },
    'modules/legal': {
      title: 'Legal & Compliance',
      description: 'Manage legal documents, consent tracking, GDPR compliance, and data retention.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            The Legal module handles privacy policies, terms of service, cookie consent, and GDPR/CCPA compliance requirements with versioned document management.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Document Management</h2>
          <p className="text-slate-600 leading-relaxed">
            Each document supports URL-based linking or inline content editing with a built-in Markdown editor, version tracking, and draft/published/archived status.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Fetching Legal Docs</h2>
          <CodeBlock
            id="get-legal"
            language="typescript"
            code={`const legal = await client.legal.getDocuments();
// [{ id, title, url, content, version, status, lastUpdated }]

// Check consent status
const consent = await client.legal.getConsent(userId);
// { termsAccepted: true, privacyAccepted: true, cookiePreferences: {...} }`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Compliance Settings</h2>
          <CodeBlock
            id="compliance"
            language="typescript"
            code={`// Compliance toggles available:
// - GDPR Compliance
// - Cookie Consent
// - Age Verification
// - Data Retention Policy
// - Right to Erasure
// - Audit Logging`}
          />
        </div>
      ),
      prev: { title: 'Surveys', href: '/dev-hub/modules/surveys' },
      next: { title: 'Billing & Subscriptions', href: '/dev-hub/modules/billing' }
    },
    'modules/billing': {
      title: 'Billing & Subscriptions',
      description: 'Manage subscription plans, payment methods, and billing cycles.',
      content: (
        <div className="space-y-8">
          <p className="text-slate-600 leading-relaxed text-lg">
            The Billing module integrates with your payment provider to manage subscription plans, usage metering, and invoice generation.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Subscription Plans</h2>
          <CodeBlock
            id="get-plans"
            language="typescript"
            code={`const plans = await client.billing.getPlans();
// [{ id, name, price, interval, features: [...] }]

// Assign plan to user
await client.billing.subscribe(userId, planId);`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">Usage & Metering</h2>
          <CodeBlock
            id="billing-usage"
            language="typescript"
            code={`const usage = await client.billing.getUsage(userId);
// { apiCalls: 1250, storage: '2.3GB', activeUsers: 45 }`}
          />
        </div>
      ),
      prev: { title: 'Legal & Compliance', href: '/dev-hub/modules/legal' },
      next: { title: 'Groups & Organizations', href: '/dev-hub/modules/groups' }
    },
    'api/webhooks': {
      title: 'Webhooks API',
      description: 'REST endpoints for managing webhook endpoints and delivery logs.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">GET /webhooks</h2>
          <p className="text-slate-600 leading-relaxed">List all registered webhook endpoints for the application.</p>
          <CodeBlock
            id="list-webhooks-api"
            language="bash"
            code={`curl https://auth.app.com/api/v1/applications/:appId/webhooks \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">POST /webhooks</h2>
          <p className="text-slate-600 leading-relaxed">Register a new webhook endpoint.</p>
          <CodeBlock
            id="create-webhook-api"
            language="json"
            code={`{
  "url": "https://api.example.com/webhooks",
  "events": ["user.created", "user.login"],
  "secret": "whsec_optional_signing_secret"
}`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">DELETE /webhooks/:id</h2>
          <p className="text-slate-600 leading-relaxed">Remove a webhook endpoint.</p>
          <CodeBlock
            id="delete-webhook-api"
            language="bash"
            code={`curl -X DELETE https://auth.app.com/api/v1/applications/:appId/webhooks/wh_123 \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />
        </div>
      ),
      prev: { title: 'Users API', href: '/dev-hub/api/users' },
      next: { title: 'Activity Log API', href: '/dev-hub/api/activity' }
    },
    'api/activity': {
      title: 'Activity Log API',
      description: 'Query and export the admin activity audit trail.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">GET /activity</h2>
          <p className="text-slate-600 leading-relaxed">Query activity logs with filtering by type, date range, and user.</p>
          <CodeBlock
            id="get-activity-api"
            language="bash"
            code={`curl "https://auth.app.com/api/v1/applications/:appId/activity?type=config&from=2024-02-01&limit=50" \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">GET /activity/export</h2>
          <p className="text-slate-600 leading-relaxed">Export activity logs in CSV or JSON format for compliance reporting.</p>
          <CodeBlock
            id="export-activity-api"
            language="bash"
            code={`curl "https://auth.app.com/api/v1/applications/:appId/activity/export?format=csv" \\
  -H "Authorization: Bearer MGMT_TOKEN" -o audit_log.csv`}
          />
        </div>
      ),
      prev: { title: 'Webhooks API', href: '/dev-hub/api/webhooks' },
      next: { title: 'Communication API', href: '/dev-hub/api/communication' }
    },
    'api/communication': {
      title: 'Communication API',
      description: 'Send emails, SMS, push notifications, and manage templates.',
      content: (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">POST /communication/email</h2>
          <p className="text-slate-600 leading-relaxed">Send a transactional email using a template.</p>
          <CodeBlock
            id="comm-email-api"
            language="json"
            code={`{
  "to": "user@example.com",
  "template": "welcome-email",
  "data": { "name": "John", "activationUrl": "https://..." }
}`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">POST /communication/push</h2>
          <CodeBlock
            id="comm-push-api"
            language="json"
            code={`{
  "userId": "usr_123",
  "title": "New message",
  "body": "You have a new notification",
  "data": { "deepLink": "/messages/123" }
}`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">POST /communication/sms</h2>
          <CodeBlock
            id="comm-sms-api"
            language="json"
            code={`{
  "to": "+1234567890",
  "template": "otp-code",
  "data": { "code": "123456" }
}`}
          />

          <h2 className="text-2xl font-bold mt-12 mb-4">GET /communication/templates</h2>
          <p className="text-slate-600 leading-relaxed">List all email and message templates.</p>
          <CodeBlock
            id="comm-templates-api"
            language="bash"
            code={`curl https://auth.app.com/api/v1/applications/:appId/communication/templates \\
  -H "Authorization: Bearer MGMT_TOKEN"`}
          />
        </div>
      ),
      prev: { title: 'Activity Log API', href: '/dev-hub/api/activity' },
      next: { title: 'CMS & Content API', href: '/dev-hub/api/cms' }
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
