'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ToggleLeftIcon,
  ToggleRightIcon,
  SaveIcon,
  Loader2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/authService'

interface FlagDefinition {
  key: string
  label: string
  description: string
  category: string
}

const FLAG_DEFINITIONS: FlagDefinition[] = [
  // Social & Feed
  { key: 'social_feed', label: 'Social Feed', description: 'User activity feed and post creation', category: 'Social' },
  { key: 'social_comments', label: 'Comments', description: 'Allow users to comment on posts and content', category: 'Social' },
  { key: 'social_reactions', label: 'Reactions & Likes', description: 'Like and emoji reaction system', category: 'Social' },
  { key: 'social_follow', label: 'Follow / Friends', description: 'Follow other users or send friend requests', category: 'Social' },
  // Circles & Groups
  { key: 'circles', label: 'Circles / Groups', description: 'Community groups and circle management', category: 'Circles' },
  { key: 'circle_chat', label: 'Circle Chat', description: 'Group messaging within circles', category: 'Circles' },
  { key: 'circle_events', label: 'Circle Events', description: 'Create and manage events inside circles', category: 'Circles' },
  // Communication
  { key: 'push_notifications', label: 'Push Notifications', description: 'Send push alerts to mobile devices', category: 'Communication' },
  { key: 'in_app_chat', label: 'Direct Messaging', description: 'Private 1-on-1 in-app chat', category: 'Communication' },
  { key: 'ai_assistant', label: 'AI Assistant', description: 'Chatbot and AI-powered features in the app', category: 'Communication' },
  // Content
  { key: 'cms_content', label: 'CMS Content', description: 'Display CMS-managed pages and articles', category: 'Content' },
  { key: 'premium_content', label: 'Premium Content Gate', description: 'Lock content behind subscription plans', category: 'Content' },
  { key: 'media_gallery', label: 'Media Gallery', description: 'Photo and video gallery features', category: 'Content' },
  // Commerce
  { key: 'billing', label: 'Billing & Subscriptions', description: 'Subscription plans and payment processing', category: 'Commerce' },
  { key: 'in_app_purchases', label: 'In-App Purchases', description: 'One-time purchases and consumables', category: 'Commerce' },
  // Platform
  { key: 'user_referrals', label: 'User Referrals', description: 'Invite friends and referral rewards', category: 'Platform' },
  { key: 'leaderboards', label: 'Leaderboards', description: 'Gamification, points, and leaderboards', category: 'Platform' },
  { key: 'analytics_tracking', label: 'Analytics Tracking', description: 'Collect user behaviour analytics', category: 'Platform' },
  { key: 'location_services', label: 'Location Services', description: 'Geo-based features and location sharing', category: 'Platform' },
]

const CATEGORIES = Array.from(new Set(FLAG_DEFINITIONS.map(f => f.category)))

interface FeatureFlagsTabProps {
  appId: string
}

export function FeatureFlagsTab({ appId }: FeatureFlagsTabProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/v1/admin/applications/${appId}/feature-flags`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      const data = await res.json()
      setFlags(data.flags && typeof data.flags === 'object' ? data.flags : {})
    } catch {
      setMsg({ type: 'error', text: 'Failed to load feature flags.' })
    } finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => { fetchFlags() }, [fetchFlags])

  const toggle = (key: string) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }))
    setMsg(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const token = authService.getToken()
      const res = await fetch(`/api/v1/admin/applications/${appId}/feature-flags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ flags })
      })
      if (!res.ok) throw new Error()
      setMsg({ type: 'success', text: 'Feature flags saved.' })
    } catch {
      setMsg({ type: 'error', text: 'Failed to save feature flags.' })
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = Object.values(flags).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Flags</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Toggle features on or off for this application. Changes take effect immediately after saving.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            {enabledCount} of {FLAG_DEFINITIONS.length} enabled
          </span>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            size="sm"
            className="flex items-center gap-1.5"
          >
            {saving ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
            Save changes
          </Button>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
          msg.type === 'success'
            ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
        }`}>
          {msg.type === 'success'
            ? <CheckCircleIcon className="w-4 h-4 shrink-0" />
            : <AlertCircleIcon className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(category => (
            <div key={category} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{category}</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {FLAG_DEFINITIONS.filter(f => f.category === category).map(flag => {
                  const enabled = !!flags[flag.key]
                  return (
                    <div
                      key={flag.key}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{flag.label}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{flag.description}</p>
                      </div>
                      <button
                        onClick={() => toggle(flag.key)}
                        className="shrink-0 flex items-center gap-1.5 text-sm font-medium transition-colors"
                        aria-label={`${enabled ? 'Disable' : 'Enable'} ${flag.label}`}
                      >
                        {enabled ? (
                          <>
                            <ToggleRightIcon className="w-6 h-6 text-blue-500" />
                            <span className="text-blue-600 dark:text-blue-400 text-xs">On</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeftIcon className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
                            <span className="text-gray-400 dark:text-zinc-500 text-xs">Off</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
