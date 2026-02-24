'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AdminConsoleUsers } from '@/components/users/AdminConsoleUsers'
import { 
  CogIcon,
  UsersIcon,
  ShieldCheckIcon,
  ServerIcon,
  GlobeIcon,
  KeyIcon,
  LinkIcon,
  TerminalIcon,
  BookOpenIcon,
  ScaleIcon,
  BellIcon,
} from 'lucide-react'

type SettingsSection = 'users' | 'general' | 'security' | 'api' | 'webhooks' | 'legal'

export default function SystemSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('users')

  const sections = [
    { id: 'users' as const, label: 'User Management', icon: <UsersIcon className="w-4 h-4" />, desc: 'Manage admin users, roles, and permissions' },
    { id: 'general' as const, label: 'General Settings', icon: <CogIcon className="w-4 h-4" />, desc: 'Platform name, branding, and default configs' },
    { id: 'security' as const, label: 'Security', icon: <ShieldCheckIcon className="w-4 h-4" />, desc: 'Global security policies and audit logs' },
    { id: 'api' as const, label: 'API & Keys', icon: <KeyIcon className="w-4 h-4" />, desc: 'API keys, rate limits, and access tokens' },
    { id: 'webhooks' as const, label: 'Webhooks', icon: <LinkIcon className="w-4 h-4" />, desc: 'Configure webhook endpoints and events' },
    { id: 'legal' as const, label: 'Legal & Compliance', icon: <ScaleIcon className="w-4 h-4" />, desc: 'Terms of service, privacy policy, GDPR' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Configure platform-wide settings and manage admin users</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className={activeSection === section.id ? 'text-blue-500' : 'text-gray-400 dark:text-zinc-500'}>
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {/* User Management */}
          {activeSection === 'users' && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">User Management</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage admin console users, their roles, and group permissions.</p>
              </div>
              <div className="p-5">
                <AdminConsoleUsers />
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">General Settings</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Configure your AppKit platform settings.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Platform Name</label>
                  <input type="text" defaultValue="AppKit" className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Support Email</label>
                  <input type="email" defaultValue="support@appkit.io" className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Default Timezone</label>
                  <select className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Bangkok</option>
                    <option>Asia/Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Default Language</label>
                  <select className="w-full max-w-md px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option>English</option>
                    <option>Thai</option>
                    <option>Japanese</option>
                    <option>Chinese (Simplified)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Security Settings</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Global security policies for the platform.</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Enforce MFA for all admin users', desc: 'Require multi-factor authentication for admin console access', checked: true },
                  { label: 'IP Whitelist', desc: 'Restrict admin access to specific IP addresses', checked: false },
                  { label: 'Audit Logging', desc: 'Log all admin actions for security auditing', checked: true },
                  { label: 'Session Timeout', desc: 'Automatically log out inactive admin sessions after 30 minutes', checked: true },
                  { label: 'CORS Protection', desc: 'Restrict cross-origin requests to approved domains only', checked: true },
                ].map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{setting.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={setting.checked} />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API & Keys */}
          {activeSection === 'api' && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">API Keys & Access Tokens</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Manage API keys for programmatic access to AppKit.</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Production API Key', key: 'ak_live_••••••••••••3f8a', created: '2024-01-15', status: 'Active' },
                  { name: 'Development API Key', key: 'ak_test_••••••••••••9b2c', created: '2024-02-01', status: 'Active' },
                  { name: 'CI/CD Token', key: 'ak_ci_••••••••••••1d5e', created: '2024-02-10', status: 'Active' },
                ].map((apiKey) => (
                  <div key={apiKey.name} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{apiKey.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono mt-0.5">{apiKey.key}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {apiKey.status}
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs">Rotate</Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="text-sm">
                <KeyIcon className="w-4 h-4 mr-2" />
                Generate New API Key
              </Button>
            </div>
          )}

          {/* Webhooks */}
          {activeSection === 'webhooks' && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Webhooks</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Configure webhook endpoints to receive real-time events.</p>
              </div>

              <div className="space-y-3">
                {[
                  { url: 'https://api.example.com/webhooks/appkit', events: 'user.created, user.deleted', status: 'Active' },
                  { url: 'https://hooks.slack.com/services/T00/B00/abc', events: 'application.deployed', status: 'Active' },
                ].map((webhook, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{webhook.url}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Events: {webhook.events}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {webhook.status}
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="text-sm">
                <LinkIcon className="w-4 h-4 mr-2" />
                Add Webhook Endpoint
              </Button>
            </div>
          )}

          {/* Legal */}
          {activeSection === 'legal' && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Legal & Compliance</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Manage legal documents and compliance settings.</p>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Terms of Service', lastUpdated: '2024-02-15', status: 'Published' },
                  { title: 'Privacy Policy', lastUpdated: '2024-02-10', status: 'Published' },
                  { title: 'Cookie Policy', lastUpdated: '2024-01-20', status: 'Draft' },
                  { title: 'Data Processing Agreement', lastUpdated: '2024-01-15', status: 'Published' },
                ].map((doc) => (
                  <div key={doc.title} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <ScaleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Updated: {doc.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        doc.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {doc.status}
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
