'use client'

import React, { useState } from 'react'
import {
  PaintbrushIcon,
  LayoutTemplateIcon,
  TypeIcon,
  ImageIcon,
  PaletteIcon,
  EyeIcon,
  GlobeIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  CheckCircleIcon,
  Loader2Icon,
  SaveIcon,
  RotateCcwIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface AuthStyleSettings {
  layout: 'centered' | 'split-left' | 'split-right' | 'fullscreen'
  backgroundColor: string
  cardBackgroundColor: string
  primaryButtonColor: string
  primaryButtonTextColor: string
  inputBorderColor: string
  inputBackgroundColor: string
  textColor: string
  secondaryTextColor: string
  linkColor: string
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full'
  logoPosition: 'top' | 'left' | 'hidden'
  logoSize: 'small' | 'medium' | 'large'
  showAppName: boolean
  welcomeTitle: string
  welcomeSubtitle: string
  signupTitle: string
  signupSubtitle: string
  splitPanelImage: string
  splitPanelOverlayColor: string
  splitPanelOverlayOpacity: number
  splitPanelHeadline: string
  splitPanelSubline: string
  showSocialDivider: boolean
  socialButtonStyle: 'icon-only' | 'full-width' | 'outline'
  fontFamily: 'system' | 'inter' | 'poppins' | 'dm-sans' | 'plus-jakarta'
  showTermsCheckbox: boolean
  showRememberMe: boolean
  showForgotPassword: boolean
  customCss: string
}

const defaultSettings: AuthStyleSettings = {
  layout: 'centered',
  backgroundColor: '#F8FAFC',
  cardBackgroundColor: '#FFFFFF',
  primaryButtonColor: '#3B82F6',
  primaryButtonTextColor: '#FFFFFF',
  inputBorderColor: '#E2E8F0',
  inputBackgroundColor: '#FFFFFF',
  textColor: '#0F172A',
  secondaryTextColor: '#64748B',
  linkColor: '#3B82F6',
  borderRadius: 'medium',
  logoPosition: 'top',
  logoSize: 'medium',
  showAppName: true,
  welcomeTitle: 'Welcome back',
  welcomeSubtitle: 'Enter your credentials to continue',
  signupTitle: 'Create your account',
  signupSubtitle: 'Get started in just a few steps',
  splitPanelImage: '',
  splitPanelOverlayColor: '#1E40AF',
  splitPanelOverlayOpacity: 80,
  splitPanelHeadline: 'Build something amazing',
  splitPanelSubline: 'Join thousands of developers shipping faster.',
  showSocialDivider: true,
  socialButtonStyle: 'full-width',
  fontFamily: 'inter',
  showTermsCheckbox: true,
  showRememberMe: true,
  showForgotPassword: true,
  customCss: '',
}

interface AuthStyleConfigProps {
  appId: string
  appName: string
}

export default function AuthStyleConfig({ appId, appName }: AuthStyleConfigProps) {
  const [settings, setSettings] = useState<AuthStyleSettings>(defaultSettings)
  const [previewMode, setPreviewMode] = useState<'login' | 'signup'>('login')
  const [activeSection, setActiveSection] = useState<'layout' | 'colors' | 'typography' | 'content' | 'options'>('layout')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const update = (field: keyof AuthStyleSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await fetch(`/api/v1/admin/applications/${appId}/auth-style`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('Failed to save')
      setTimeout(() => setSaveMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
  }

  const getBorderRadiusValue = () => {
    switch (settings.borderRadius) {
      case 'none': return '0px'
      case 'small': return '4px'
      case 'medium': return '8px'
      case 'large': return '16px'
      case 'full': return '9999px'
    }
  }

  const configSections = [
    { id: 'layout' as const, label: 'Layout', icon: <LayoutTemplateIcon className="w-4 h-4" /> },
    { id: 'colors' as const, label: 'Colors', icon: <PaletteIcon className="w-4 h-4" /> },
    { id: 'typography' as const, label: 'Typography', icon: <TypeIcon className="w-4 h-4" /> },
    { id: 'content' as const, label: 'Content', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'options' as const, label: 'Options', icon: <EyeIcon className="w-4 h-4" /> },
  ]

  // ======================== LIVE PREVIEW ========================
  const renderPreview = () => {
    const isLogin = previewMode === 'login'
    const title = isLogin ? settings.welcomeTitle : settings.signupTitle
    const subtitle = isLogin ? settings.welcomeSubtitle : settings.signupSubtitle
    const isSplit = settings.layout === 'split-left' || settings.layout === 'split-right'
    const splitLeft = settings.layout === 'split-left'

    const formPanel = (
      <div className="flex flex-col items-center justify-center p-6 w-full" style={{ backgroundColor: isSplit ? settings.cardBackgroundColor : 'transparent' }}>
        <div className="w-full max-w-[260px] space-y-3">
          {settings.logoPosition !== 'hidden' && (
            <div className={`flex items-center mb-2 ${settings.logoPosition === 'top' ? 'justify-center flex-col' : 'gap-2'}`}>
              <div
                className="flex items-center justify-center text-white font-bold text-xs shadow-md"
                style={{
                  width: settings.logoSize === 'small' ? 28 : settings.logoSize === 'medium' ? 36 : 44,
                  height: settings.logoSize === 'small' ? 28 : settings.logoSize === 'medium' ? 36 : 44,
                  borderRadius: getBorderRadiusValue(),
                  background: `linear-gradient(135deg, ${settings.primaryButtonColor}, ${settings.splitPanelOverlayColor})`,
                }}
              >
                {appName.substring(0, 2).toUpperCase()}
              </div>
              {settings.showAppName && (
                <span className="text-xs font-bold" style={{ color: settings.textColor }}>{appName}</span>
              )}
            </div>
          )}

          <div className={settings.logoPosition === 'top' ? 'text-center' : ''}>
            <h4 className="text-sm font-bold leading-tight" style={{ color: settings.textColor }}>{title}</h4>
            <p className="text-[10px] mt-0.5" style={{ color: settings.secondaryTextColor }}>{subtitle}</p>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[9px] font-medium mb-0.5" style={{ color: settings.secondaryTextColor }}>Full Name</label>
              <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px]" style={{ backgroundColor: settings.inputBackgroundColor, border: `1px solid ${settings.inputBorderColor}`, borderRadius: getBorderRadiusValue(), color: settings.secondaryTextColor }}>
                <UserIcon className="w-3 h-3 opacity-40" />
                John Doe
              </div>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-medium mb-0.5" style={{ color: settings.secondaryTextColor }}>Email</label>
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px]" style={{ backgroundColor: settings.inputBackgroundColor, border: `1px solid ${settings.inputBorderColor}`, borderRadius: getBorderRadiusValue(), color: settings.secondaryTextColor }}>
              <MailIcon className="w-3 h-3 opacity-40" />
              user@example.com
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[9px] font-medium" style={{ color: settings.secondaryTextColor }}>Password</label>
              {isLogin && settings.showForgotPassword && (
                <span className="text-[8px] font-medium" style={{ color: settings.linkColor }}>Forgot?</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px]" style={{ backgroundColor: settings.inputBackgroundColor, border: `1px solid ${settings.inputBorderColor}`, borderRadius: getBorderRadiusValue(), color: settings.secondaryTextColor }}>
              <LockIcon className="w-3 h-3 opacity-40" />
              ••••••••
            </div>
          </div>

          {isLogin && settings.showRememberMe && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div className="w-3 h-3 rounded border" style={{ borderColor: settings.inputBorderColor }} />
              <span className="text-[9px]" style={{ color: settings.secondaryTextColor }}>Remember me</span>
            </label>
          )}

          {!isLogin && settings.showTermsCheckbox && (
            <label className="flex items-start gap-1.5 cursor-pointer">
              <div className="w-3 h-3 rounded border mt-0.5 shrink-0" style={{ borderColor: settings.inputBorderColor }} />
              <span className="text-[8px] leading-tight" style={{ color: settings.secondaryTextColor }}>
                I agree to the <span style={{ color: settings.linkColor }}>Terms</span> and <span style={{ color: settings.linkColor }}>Privacy Policy</span>
              </span>
            </label>
          )}

          <button
            className="w-full py-1.5 text-[10px] font-semibold shadow-sm transition-all"
            style={{
              backgroundColor: settings.primaryButtonColor,
              color: settings.primaryButtonTextColor,
              borderRadius: getBorderRadiusValue(),
            }}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {settings.showSocialDivider && (
            <>
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: settings.inputBorderColor }} />
                <span className="text-[8px]" style={{ color: settings.secondaryTextColor }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: settings.inputBorderColor }} />
              </div>
              {settings.socialButtonStyle === 'icon-only' ? (
                <div className="flex items-center justify-center gap-2">
                  {['G', 'A', 'F'].map(s => (
                    <div key={s} className="w-7 h-7 flex items-center justify-center text-[10px] font-bold border" style={{ borderColor: settings.inputBorderColor, borderRadius: getBorderRadiusValue(), color: settings.secondaryTextColor, backgroundColor: settings.inputBackgroundColor }}>
                      {s}
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  className={`w-full py-1.5 text-[10px] font-medium flex items-center justify-center gap-1.5 border transition-all ${settings.socialButtonStyle === 'outline' ? '' : ''}`}
                  style={{
                    borderColor: settings.inputBorderColor,
                    borderRadius: getBorderRadiusValue(),
                    color: settings.textColor,
                    backgroundColor: settings.socialButtonStyle === 'outline' ? 'transparent' : settings.inputBackgroundColor,
                  }}
                >
                  <GlobeIcon className="w-3 h-3" />
                  Continue with Google
                </button>
              )}
            </>
          )}

          <p className="text-center text-[8px] mt-1" style={{ color: settings.secondaryTextColor }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span className="font-medium" style={{ color: settings.linkColor }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    )

    const splitPanel = (
      <div
        className="relative flex flex-col items-center justify-center p-6 text-white min-h-full"
        style={{ backgroundColor: settings.splitPanelOverlayColor }}
      >
        {settings.splitPanelImage && (
          <div className="absolute inset-0">
            <img src={settings.splitPanelImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: settings.splitPanelOverlayColor, opacity: settings.splitPanelOverlayOpacity / 100 }} />
          </div>
        )}
        <div className="relative z-10 text-center space-y-2">
          <h3 className="text-sm font-bold leading-tight">{settings.splitPanelHeadline}</h3>
          <p className="text-[10px] opacity-80">{settings.splitPanelSubline}</p>
        </div>
      </div>
    )

    return (
      <div
        className="rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden min-h-[420px] flex"
        style={{ backgroundColor: settings.backgroundColor }}
      >
        {settings.layout === 'centered' || settings.layout === 'fullscreen' ? (
          <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: settings.layout === 'fullscreen' ? settings.primaryButtonColor + '10' : settings.backgroundColor }}>
            <div className="w-full max-w-xs rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700" style={{ backgroundColor: settings.cardBackgroundColor, borderRadius: settings.borderRadius === 'full' ? '24px' : undefined }}>
              {formPanel}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 min-h-[420px]">
            {splitLeft ? (
              <>
                {splitPanel}
                {formPanel}
              </>
            ) : (
              <>
                {formPanel}
                {splitPanel}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // ======================== CONFIG PANELS ========================
  const renderLayoutSection = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Page Layout</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'centered', label: 'Centered Card', desc: 'Form in a centered card' },
            { value: 'split-left', label: 'Split Left', desc: 'Brand panel on the left' },
            { value: 'split-right', label: 'Split Right', desc: 'Brand panel on the right' },
            { value: 'fullscreen', label: 'Fullscreen', desc: 'Full-page experience' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => update('layout', opt.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                settings.layout === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500/30'
                  : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
              }`}
            >
              <p className="text-xs font-medium text-gray-900 dark:text-white">{opt.label}</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Border Radius</label>
        <div className="flex gap-1.5">
          {(['none', 'small', 'medium', 'large', 'full'] as const).map(r => (
            <button
              key={r}
              onClick={() => update('borderRadius', r)}
              className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-all capitalize ${
                settings.borderRadius === r
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Logo</label>
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {(['top', 'left', 'hidden'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => update('logoPosition', pos)}
                className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-all capitalize ${
                  settings.logoPosition === pos
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
          {settings.logoPosition !== 'hidden' && (
            <div className="flex gap-1.5">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => update('logoSize', s)}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-all capitalize ${
                    settings.logoSize === s
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showAppName}
              onChange={e => update('showAppName', e.target.checked)}
              className="w-3.5 h-3.5 text-blue-500 border-gray-300 dark:border-zinc-600 rounded"
            />
            <span className="text-xs text-gray-700 dark:text-zinc-300">Show app name next to logo</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderColorsSection = () => (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Color Palette</label>
      {([
        { key: 'backgroundColor', label: 'Page Background' },
        { key: 'cardBackgroundColor', label: 'Card Background' },
        { key: 'primaryButtonColor', label: 'Primary Button' },
        { key: 'primaryButtonTextColor', label: 'Button Text' },
        { key: 'inputBorderColor', label: 'Input Border' },
        { key: 'inputBackgroundColor', label: 'Input Background' },
        { key: 'textColor', label: 'Heading Text' },
        { key: 'secondaryTextColor', label: 'Secondary Text' },
        { key: 'linkColor', label: 'Link / Accent' },
      ] as const).map(item => (
        <div key={item.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
          <span className="text-xs text-gray-700 dark:text-zinc-300">{item.label}</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings[item.key]}
              onChange={e => update(item.key, e.target.value)}
              className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={settings[item.key]}
              onChange={e => update(item.key, e.target.value)}
              className="w-20 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </div>
      ))}

      {(settings.layout === 'split-left' || settings.layout === 'split-right') && (
        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-3">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block">Split Panel</label>
          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
            <span className="text-xs text-gray-700 dark:text-zinc-300">Overlay Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.splitPanelOverlayColor}
                onChange={e => update('splitPanelOverlayColor', e.target.value)}
                className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={settings.splitPanelOverlayColor}
                onChange={e => update('splitPanelOverlayColor', e.target.value)}
                className="w-20 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-700 dark:text-zinc-300">Overlay Opacity: {settings.splitPanelOverlayOpacity}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.splitPanelOverlayOpacity}
              onChange={e => update('splitPanelOverlayOpacity', parseInt(e.target.value))}
              className="w-full mt-1 accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderTypographySection = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Font Family</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'system', label: 'System Default' },
            { value: 'inter', label: 'Inter' },
            { value: 'poppins', label: 'Poppins' },
            { value: 'dm-sans', label: 'DM Sans' },
            { value: 'plus-jakarta', label: 'Plus Jakarta Sans' },
          ] as const).map(f => (
            <button
              key={f.value}
              onClick={() => update('fontFamily', f.value)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                settings.fontFamily === f.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Social Login Buttons</label>
        <div className="flex gap-1.5">
          {([
            { value: 'full-width', label: 'Full Width' },
            { value: 'outline', label: 'Outline' },
            { value: 'icon-only', label: 'Icon Only' },
          ] as const).map(s => (
            <button
              key={s.value}
              onClick={() => update('socialButtonStyle', s.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-all ${
                settings.socialButtonStyle === s.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderContentSection = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Login Page Text</label>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Title</label>
            <input
              type="text"
              value={settings.welcomeTitle}
              onChange={e => update('welcomeTitle', e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Subtitle</label>
            <input
              type="text"
              value={settings.welcomeSubtitle}
              onChange={e => update('welcomeSubtitle', e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Signup Page Text</label>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Title</label>
            <input
              type="text"
              value={settings.signupTitle}
              onChange={e => update('signupTitle', e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Subtitle</label>
            <input
              type="text"
              value={settings.signupSubtitle}
              onChange={e => update('signupSubtitle', e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {(settings.layout === 'split-left' || settings.layout === 'split-right') && (
        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Split Panel Content</label>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Background Image URL</label>
              <input
                type="url"
                value={settings.splitPanelImage}
                onChange={e => update('splitPanelImage', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Headline</label>
              <input
                type="text"
                value={settings.splitPanelHeadline}
                onChange={e => update('splitPanelHeadline', e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-zinc-400 mb-0.5 block">Subline</label>
              <input
                type="text"
                value={settings.splitPanelSubline}
                onChange={e => update('splitPanelSubline', e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderOptionsSection = () => (
    <div className="space-y-4">
      <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block">Form Options</label>
      <div className="space-y-2">
        {([
          { key: 'showSocialDivider', label: 'Show social login divider', desc: 'Display "or" divider with social buttons' },
          { key: 'showRememberMe', label: 'Show "Remember me" checkbox', desc: 'On the login form' },
          { key: 'showForgotPassword', label: 'Show "Forgot password?" link', desc: 'On the login form' },
          { key: 'showTermsCheckbox', label: 'Show terms checkbox', desc: 'On the signup form' },
          { key: 'showAppName', label: 'Show app name', desc: 'Display next to or below the logo' },
        ] as const).map(opt => (
          <div key={opt.key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">{opt.label}</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">{opt.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[opt.key] as boolean}
                onChange={e => update(opt.key, e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-2">Custom CSS Override</label>
        <textarea
          value={settings.customCss}
          onChange={e => update('customCss', e.target.value)}
          placeholder={`.auth-card {\n  /* your custom styles */\n}`}
          rows={4}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Auth Page Style</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Customize the visual appearance of login & signup pages for this application&apos;s integration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcwIcon className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              {saving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
              Save Style
            </Button>
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <EyeIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Live Preview</span>
          </div>
          <div className="flex items-center rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
            {(['login', 'signup'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  previewMode === mode
                    ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
                }`}
              >
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        {renderPreview()}
      </div>

      {/* Config Panel */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
        {/* Section Nav */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
          {configSections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                activeSection === sec.id
                  ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
              }`}
            >
              {sec.icon}
              {sec.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        {activeSection === 'layout' && renderLayoutSection()}
        {activeSection === 'colors' && renderColorsSection()}
        {activeSection === 'typography' && renderTypographySection()}
        {activeSection === 'content' && renderContentSection()}
        {activeSection === 'options' && renderOptionsSection()}
      </div>
    </div>
  )
}
