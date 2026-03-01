'use client'

import React, { useState, useEffect } from 'react'
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
  ShieldCheckIcon,
  KeyIcon,
  SmartphoneIcon,
  CogIcon,
  Trash2Icon,
  GripVerticalIcon,
  MonitorIcon,
  TabletSmartphoneIcon,
  CopyIcon,
  XIcon,
  SlidersHorizontalIcon,
  PanelRightCloseIcon,
  BookOpenIcon,
  ClipboardCopyIcon,
  CheckIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import { ColorPickerPopover, toColorValue, colorValueToCss, type ColorValue } from '@/components/ui/ColorPickerPopover'

export interface AuthProviderStyle {
  providerName: string
  displayName: string
  label: string
  logoUrl: string
  isEnabled: boolean
  bgColor: string
  textColor: string
}

const DEFAULT_PROVIDER_STYLES: AuthProviderStyle[] = [
  { providerName: 'email-password', displayName: 'Email & Password', label: 'Sign in with Email', logoUrl: '', isEnabled: true, bgColor: '', textColor: '' },
  { providerName: 'google-oauth', displayName: 'Google OAuth', label: 'Continue with Google', logoUrl: '', isEnabled: true, bgColor: '#FFFFFF', textColor: '#374151' },
  { providerName: 'github-oauth', displayName: 'GitHub OAuth', label: 'Continue with GitHub', logoUrl: '', isEnabled: false, bgColor: '#24292F', textColor: '#FFFFFF' },
  { providerName: 'saml-sso', displayName: 'SAML / SSO', label: 'Sign in with SSO', logoUrl: '', isEnabled: false, bgColor: '#7C3AED', textColor: '#FFFFFF' },
  { providerName: 'magic-link', displayName: 'Magic Link', label: 'Send Magic Link', logoUrl: '', isEnabled: false, bgColor: '#10B981', textColor: '#FFFFFF' },
  { providerName: 'sms-otp', displayName: 'SMS OTP', label: 'Sign in with SMS', logoUrl: '', isEnabled: false, bgColor: '#F59E0B', textColor: '#FFFFFF' },
]

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'email-password': <MailIcon className="w-3.5 h-3.5" />,
  'google-oauth': <GlobeIcon className="w-3.5 h-3.5" />,
  'github-oauth': <CogIcon className="w-3.5 h-3.5" />,
  'saml-sso': <ShieldCheckIcon className="w-3.5 h-3.5" />,
  'magic-link': <KeyIcon className="w-3.5 h-3.5" />,
  'sms-otp': <SmartphoneIcon className="w-3.5 h-3.5" />,
}

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
  backgroundMedia?: ColorValue | string
  splitPanelBackgroundMedia?: ColorValue | string
  splitPanelOverlayColor: string
  splitPanelOverlayOpacity: number
  splitPanelHeadline: string
  splitPanelSubline: string
  showSocialDivider: boolean
  socialLoginLayout: 'vertical' | 'horizontal'
  socialButtonStyle: 'icon-only' | 'full-width' | 'outline'
  fontFamily: 'system' | 'inter' | 'poppins' | 'dm-sans' | 'plus-jakarta'
  showTermsCheckbox: boolean
  showRememberMe: boolean
  showForgotPassword: boolean
  customCss: string
}

type DeviceType = 'mobileApp' | 'mobileWeb' | 'desktopWeb'

const DEVICE_META: Record<DeviceType, { label: string; icon: React.ReactNode; desc: string }> = {
  mobileApp: { label: 'Mobile App', icon: <SmartphoneIcon className="w-4 h-4" />, desc: 'Native iOS & Android' },
  mobileWeb: { label: 'Mobile Web', icon: <TabletSmartphoneIcon className="w-4 h-4" />, desc: 'Responsive browser' },
  desktopWeb: { label: 'Desktop Web', icon: <MonitorIcon className="w-4 h-4" />, desc: 'Full-screen browser' },
}

const defaultDesktopSettings: AuthStyleSettings = {
  layout: 'split-left',
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
  logoSize: 'large',
  showAppName: true,
  welcomeTitle: 'Welcome back',
  welcomeSubtitle: 'Enter your credentials to continue',
  signupTitle: 'Create your account',
  signupSubtitle: 'Get started in just a few steps',
  splitPanelImage: '',
  backgroundMedia: { mode: 'solid', solid: '#F8FAFC' },
  splitPanelBackgroundMedia: { mode: 'solid', solid: '#1E40AF' },
  splitPanelOverlayColor: '#1E40AF',
  splitPanelOverlayOpacity: 80,
  splitPanelHeadline: 'Build something amazing',
  splitPanelSubline: 'Join thousands of developers shipping faster.',
  showSocialDivider: true,
  socialLoginLayout: 'vertical',
  socialButtonStyle: 'full-width',
  fontFamily: 'inter',
  showTermsCheckbox: true,
  showRememberMe: true,
  showForgotPassword: true,
  customCss: '',
}

const defaultMobileWebSettings: AuthStyleSettings = {
  ...defaultDesktopSettings,
  layout: 'centered',
  logoSize: 'medium',
  borderRadius: 'large',
  socialLoginLayout: 'horizontal',
}

const defaultMobileAppSettings: AuthStyleSettings = {
  ...defaultDesktopSettings,
  layout: 'fullscreen',
  logoSize: 'medium',
  borderRadius: 'large',
  socialLoginLayout: 'horizontal',
  socialButtonStyle: 'full-width',
}

const DEFAULT_DEVICE_SETTINGS: Record<DeviceType, AuthStyleSettings> = {
  mobileApp: defaultMobileAppSettings,
  mobileWeb: defaultMobileWebSettings,
  desktopWeb: defaultDesktopSettings,
}

interface AuthStyleConfigProps {
  appId: string
  appName: string
}

export default function AuthStyleConfig({ appId, appName }: AuthStyleConfigProps) {
  const [deviceSettings, setDeviceSettings] = useState<Record<DeviceType, AuthStyleSettings>>(DEFAULT_DEVICE_SETTINGS)
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktopWeb')
  const [providers, setProviders] = useState<AuthProviderStyle[]>(DEFAULT_PROVIDER_STYLES)
  const [previewMode, setPreviewMode] = useState<'login' | 'signup'>('login')
  const [activeSection, setActiveSection] = useState<'layout' | 'colors' | 'typography' | 'content' | 'providers' | 'options'>('layout')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showConfigPanel, setShowConfigPanel] = useState(true)
  const [showDevGuide, setShowDevGuide] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const settings = deviceSettings[activeDevice]

  const normalizeMediaValue = (value: ColorValue | string | undefined, fallback: string): ColorValue => {
    if (!value) return toColorValue(fallback)
    return toColorValue(value)
  }

  const pageBackgroundValue = normalizeMediaValue(settings.backgroundMedia, settings.backgroundColor)
  const splitBackgroundValue = normalizeMediaValue(settings.splitPanelBackgroundMedia, settings.splitPanelImage || settings.splitPanelOverlayColor)

  const toBackgroundStyle = (value: ColorValue, fallback: string): React.CSSProperties => {
    const css = colorValueToCss(value)
    if (!css) return { backgroundColor: fallback }
    if (css.startsWith('url(')) {
      return {
        backgroundImage: css,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (css.includes('gradient(')) {
      return { background: css }
    }
    return { backgroundColor: css }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(id)
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

  useEffect(() => {
    const loadAuthMethods = async () => {
      try {
        const res = await adminService.getAppConfigOverride(appId, 'auth')
        const methods = res.useDefault
          ? (await adminService.getDefaultAuthMethods()).methods || []
          : res.config || []
        if (methods.length > 0) {
          setProviders(prev => {
            const merged = prev.map(p => {
              const apiMethod = methods.find((m: any) => m.providerName === p.providerName)
              return apiMethod ? { ...p, isEnabled: apiMethod.isEnabled, displayName: apiMethod.displayName || p.displayName } : p
            })
            for (const m of methods) {
              if (!merged.find(p => p.providerName === m.providerName)) {
                merged.push({
                  providerName: m.providerName,
                  displayName: m.displayName,
                  label: `Continue with ${m.displayName}`,
                  logoUrl: '',
                  isEnabled: m.isEnabled,
                  bgColor: '#F3F4F6',
                  textColor: '#374151',
                })
              }
            }
            return merged
          })
        }
      } catch {
        // Use defaults on error
      }
    }
    loadAuthMethods()
  }, [appId])

  useEffect(() => {
    const loadAuthStyle = async () => {
      try {
        const res = await fetch(`/api/v1/applications/${appId}/auth-style`)
        if (!res.ok) return
        const data = await res.json()
        if (data?.devices && typeof data.devices === 'object') {
          const mergeDevice = (device: DeviceType) => ({
            ...DEFAULT_DEVICE_SETTINGS[device],
            ...(data.devices[device] || {}),
          })
          setDeviceSettings({
            mobileApp: mergeDevice('mobileApp'),
            mobileWeb: mergeDevice('mobileWeb'),
            desktopWeb: mergeDevice('desktopWeb'),
          })
        }
        if (Array.isArray(data?.providers) && data.providers.length > 0) {
          setProviders(prev => {
            const merged = prev.map(p => {
              const saved = data.providers.find((s: any) => s.providerName === p.providerName)
              return saved ? { ...p, ...saved } : p
            })
            return merged
          })
        }
      } catch {
        // Keep defaults if no saved style exists yet.
      }
    }
    loadAuthStyle()
  }, [appId])

  const update = (field: keyof AuthStyleSettings, value: any) => {
    setDeviceSettings(prev => ({
      ...prev,
      [activeDevice]: { ...prev[activeDevice], [field]: value },
    }))
  }

  const handleCopyToOtherDevices = () => {
    const current = deviceSettings[activeDevice]
    setDeviceSettings({
      mobileApp: { ...current },
      mobileWeb: { ...current },
      desktopWeb: { ...current },
    })
    setSaveMsg('Copied to all devices!')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await fetch(`/api/v1/admin/applications/${appId}/auth-style`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: deviceSettings, providers }),
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
    setDeviceSettings(prev => ({
      ...prev,
      [activeDevice]: DEFAULT_DEVICE_SETTINGS[activeDevice],
    }))
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

  const enabledProviders = providers.filter(p => p.isEnabled)
  const socialProviders = enabledProviders.filter(p => p.providerName !== 'email-password')

  const updateProvider = (providerName: string, field: keyof AuthProviderStyle, value: any) => {
    setProviders(prev => prev.map(p => p.providerName === providerName ? { ...p, [field]: value } : p))
  }

  const configSections = [
    { id: 'layout' as const, label: 'Layout', icon: <LayoutTemplateIcon className="w-4 h-4" /> },
    { id: 'colors' as const, label: 'Colors', icon: <PaletteIcon className="w-4 h-4" /> },
    { id: 'typography' as const, label: 'Typography', icon: <TypeIcon className="w-4 h-4" /> },
    { id: 'content' as const, label: 'Content', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'providers' as const, label: 'Providers', icon: <ShieldCheckIcon className="w-4 h-4" /> },
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

          {settings.showSocialDivider && socialProviders.length > 0 && (
            <>
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: settings.inputBorderColor }} />
                <span className="text-[8px]" style={{ color: settings.secondaryTextColor }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: settings.inputBorderColor }} />
              </div>
              {settings.socialLoginLayout === 'horizontal' ? (
                <div className="flex items-center justify-center gap-2">
                  {socialProviders.map(sp => (
                    <div
                      key={sp.providerName}
                      className="w-8 h-8 flex items-center justify-center text-[10px] font-bold border cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        borderColor: settings.socialButtonStyle === 'outline' ? settings.inputBorderColor : (sp.bgColor || settings.inputBorderColor),
                        borderRadius: getBorderRadiusValue(),
                        color: sp.textColor || settings.secondaryTextColor,
                        backgroundColor: settings.socialButtonStyle === 'outline' ? 'transparent' : (sp.bgColor || settings.inputBackgroundColor),
                      }}
                      title={sp.label}
                    >
                      {sp.logoUrl ? <img src={sp.logoUrl} alt="" className="w-4 h-4 object-contain" /> : PROVIDER_ICONS[sp.providerName] || sp.label.charAt(0)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {socialProviders.map(sp => (
                    <button
                      key={sp.providerName}
                      className="w-full py-1.5 text-[10px] font-medium flex items-center justify-center gap-1.5 border transition-all"
                      style={{
                        borderColor: settings.socialButtonStyle === 'outline' ? settings.inputBorderColor : (sp.bgColor || settings.inputBorderColor),
                        borderRadius: getBorderRadiusValue(),
                        color: sp.textColor || settings.textColor,
                        backgroundColor: settings.socialButtonStyle === 'outline' ? 'transparent' : (sp.bgColor || settings.inputBackgroundColor),
                      }}
                    >
                      {sp.logoUrl ? <img src={sp.logoUrl} alt="" className="w-3 h-3 object-contain" /> : PROVIDER_ICONS[sp.providerName] || <GlobeIcon className="w-3 h-3" />}
                      {sp.label}
                    </button>
                  ))}
                </div>
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
        style={toBackgroundStyle(splitBackgroundValue, settings.splitPanelOverlayColor)}
      >
        {splitBackgroundValue.mode === 'video' && splitBackgroundValue.video && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={splitBackgroundValue.video}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        {settings.splitPanelImage && splitBackgroundValue.mode !== 'image' && splitBackgroundValue.mode !== 'video' && (
          <div className="absolute inset-0">
            <img src={settings.splitPanelImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: settings.splitPanelOverlayColor, opacity: settings.splitPanelOverlayOpacity / 100 }} />
          </div>
        )}
        {(splitBackgroundValue.mode === 'image' || splitBackgroundValue.mode === 'video') && (
          <div className="absolute inset-0" style={{ backgroundColor: settings.splitPanelOverlayColor, opacity: settings.splitPanelOverlayOpacity / 100 }} />
        )}
        <div className="relative z-10 text-center space-y-2">
          <h3 className="text-sm font-bold leading-tight">{settings.splitPanelHeadline}</h3>
          <p className="text-[10px] opacity-80">{settings.splitPanelSubline}</p>
        </div>
      </div>
    )

    return (
      <div
        className="relative rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden min-h-[420px] flex"
        style={toBackgroundStyle(pageBackgroundValue, settings.backgroundColor)}
      >
        {pageBackgroundValue.mode === 'video' && pageBackgroundValue.video && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={pageBackgroundValue.video}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        {settings.layout === 'centered' || settings.layout === 'fullscreen' ? (
          <div className="relative z-10 flex-1 flex items-center justify-center" style={{ backgroundColor: settings.layout === 'fullscreen' ? settings.primaryButtonColor + '10' : 'transparent' }}>
            <div className="w-full max-w-xs rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700" style={{ backgroundColor: settings.cardBackgroundColor, borderRadius: settings.borderRadius === 'full' ? '24px' : undefined }}>
              {formPanel}
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex-1 grid grid-cols-2 min-h-[420px]">
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

  // ======================== SHARED TWO-COL ROW ========================
  const ConfigRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start py-2.5 border-b border-gray-50 dark:border-zinc-800/50 last:border-0">
      <div className="pt-1">
        <p className="text-[11px] font-medium text-gray-700 dark:text-zinc-300 leading-tight">{label}</p>
        {desc && <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-tight">{desc}</p>}
      </div>
      <div>{children}</div>
    </div>
  )

  const SegmentPicker = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: any) => void }) => (
    <div className="flex gap-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-1 text-[10px] font-medium rounded-md border transition-all capitalize ${
            value === o.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )

  // ======================== CONFIG PANELS ========================
  const renderLayoutSection = () => (
    <div>
      <ConfigRow label="Page Layout" desc="Form page structure">
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { value: 'centered', label: 'Centered' },
            { value: 'split-left', label: 'Split Left' },
            { value: 'split-right', label: 'Split Right' },
            { value: 'fullscreen', label: 'Fullscreen' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => update('layout', opt.value)}
              className={`px-2 py-1.5 rounded-md border text-[10px] font-medium transition-all ${
                settings.layout === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </ConfigRow>

      <ConfigRow label="Border Radius" desc="Corner roundness">
        <SegmentPicker
          options={[{ value: 'none', label: 'None' }, { value: 'small', label: 'SM' }, { value: 'medium', label: 'MD' }, { value: 'large', label: 'LG' }, { value: 'full', label: 'Full' }]}
          value={settings.borderRadius}
          onChange={v => update('borderRadius', v)}
        />
      </ConfigRow>

      <ConfigRow label="Logo Position" desc="Where the logo appears">
        <SegmentPicker
          options={[{ value: 'top', label: 'Top' }, { value: 'left', label: 'Left' }, { value: 'hidden', label: 'Hidden' }]}
          value={settings.logoPosition}
          onChange={v => update('logoPosition', v)}
        />
      </ConfigRow>

      {settings.logoPosition !== 'hidden' && (
        <ConfigRow label="Logo Size">
          <SegmentPicker
            options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
            value={settings.logoSize}
            onChange={v => update('logoSize', v)}
          />
        </ConfigRow>
      )}

      <ConfigRow label="Show App Name" desc="Display next to logo">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" title="Toggle show app name" checked={settings.showAppName} onChange={e => update('showAppName', e.target.checked)} />
          <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
        </label>
      </ConfigRow>
    </div>
  )

  const renderColorsSection = () => (
    <div>
      <ConfigRow label="Page Background Media" desc="Solid, gradient, image, or video">
        <ColorPickerPopover
          value={pageBackgroundValue}
          onChange={(value) => {
            update('backgroundMedia', value)
            if (value.mode === 'solid') {
              update('backgroundColor', value.solid || settings.backgroundColor)
            }
          }}
        />
      </ConfigRow>

      {([
        { key: 'cardBackgroundColor', label: 'Card Background' },
        { key: 'primaryButtonColor', label: 'Primary Button' },
        { key: 'primaryButtonTextColor', label: 'Button Text' },
        { key: 'inputBorderColor', label: 'Input Border' },
        { key: 'inputBackgroundColor', label: 'Input Background' },
        { key: 'textColor', label: 'Heading Text' },
        { key: 'secondaryTextColor', label: 'Secondary Text' },
        { key: 'linkColor', label: 'Link / Accent' },
      ] as const).map(item => (
        <ConfigRow key={item.key} label={item.label}>
          <div className="flex items-center gap-1.5">
            <input type="color" title={`${item.label} color picker`} value={settings[item.key]} onChange={e => update(item.key, e.target.value)} className="w-6 h-6 rounded border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5" />
            <input type="text" title={`${item.label} hex value`} value={settings[item.key]} onChange={e => update(item.key, e.target.value)} className="flex-1 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
          </div>
        </ConfigRow>
      ))}

      {(settings.layout === 'split-left' || settings.layout === 'split-right') && (
        <>
          <ConfigRow label="Split Panel Media" desc="Solid, gradient, image, or video">
            <ColorPickerPopover
              value={splitBackgroundValue}
              onChange={(value) => {
                update('splitPanelBackgroundMedia', value)
                if (value.mode === 'image') {
                  update('splitPanelImage', value.image || '')
                }
              }}
            />
          </ConfigRow>
          <ConfigRow label="Overlay Color" desc="Split panel overlay">
            <div className="flex items-center gap-1.5">
              <input type="color" title="Overlay color picker" value={settings.splitPanelOverlayColor} onChange={e => update('splitPanelOverlayColor', e.target.value)} className="w-6 h-6 rounded border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5" />
              <input type="text" title="Overlay color hex value" value={settings.splitPanelOverlayColor} onChange={e => update('splitPanelOverlayColor', e.target.value)} className="flex-1 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
            </div>
          </ConfigRow>
          <ConfigRow label="Overlay Opacity" desc={`${settings.splitPanelOverlayOpacity}%`}>
            <input type="range" title="Overlay opacity" min="0" max="100" value={settings.splitPanelOverlayOpacity} onChange={e => update('splitPanelOverlayOpacity', parseInt(e.target.value))} className="w-full accent-blue-500" />
          </ConfigRow>
        </>
      )}
    </div>
  )

  const renderTypographySection = () => (
    <div>
      <ConfigRow label="Font Family" desc="Text typeface">
        <div className="grid grid-cols-2 gap-1">
          {([
            { value: 'system', label: 'System' },
            { value: 'inter', label: 'Inter' },
            { value: 'poppins', label: 'Poppins' },
            { value: 'dm-sans', label: 'DM Sans' },
            { value: 'plus-jakarta', label: 'Jakarta' },
          ] as const).map(f => (
            <button
              key={f.value}
              onClick={() => update('fontFamily', f.value)}
              className={`px-2 py-1 rounded-md border text-[10px] font-medium transition-all ${
                settings.fontFamily === f.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </ConfigRow>

      <ConfigRow label="Social Layout" desc="Button orientation">
        <SegmentPicker
          options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]}
          value={settings.socialLoginLayout}
          onChange={v => update('socialLoginLayout', v)}
        />
      </ConfigRow>

      <ConfigRow label="Button Style" desc="Social button look">
        <SegmentPicker
          options={[{ value: 'full-width', label: 'Filled' }, { value: 'outline', label: 'Outline' }]}
          value={settings.socialButtonStyle}
          onChange={v => update('socialButtonStyle', v)}
        />
      </ConfigRow>
    </div>
  )

  const renderContentSection = () => (
    <div>
      <ConfigRow label="Login Title">
        <input type="text" title="Login title" value={settings.welcomeTitle} onChange={e => update('welcomeTitle', e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </ConfigRow>
      <ConfigRow label="Login Subtitle">
        <input type="text" title="Login subtitle" value={settings.welcomeSubtitle} onChange={e => update('welcomeSubtitle', e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </ConfigRow>
      <ConfigRow label="Signup Title">
        <input type="text" title="Signup title" value={settings.signupTitle} onChange={e => update('signupTitle', e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </ConfigRow>
      <ConfigRow label="Signup Subtitle">
        <input type="text" title="Signup subtitle" value={settings.signupSubtitle} onChange={e => update('signupSubtitle', e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </ConfigRow>

      {(settings.layout === 'split-left' || settings.layout === 'split-right') && (
        <>
          <ConfigRow label="Split Headline">
            <input type="text" title="Split headline" value={settings.splitPanelHeadline} onChange={e => update('splitPanelHeadline', e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </ConfigRow>
          <ConfigRow label="Split Subline">
            <input type="text" title="Split subline" value={settings.splitPanelSubline} onChange={e => update('splitPanelSubline', e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </ConfigRow>
        </>
      )}
    </div>
  )

  const renderProvidersSection = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Authentication Providers</label>
        <p className="text-[10px] text-gray-500 dark:text-zinc-400 mb-3">Customize the logo, button label, and colors for each assigned auth method. Only enabled providers appear in the preview.</p>
      </div>

      <div className="space-y-3">
        {providers.map(provider => {
          const icon = PROVIDER_ICONS[provider.providerName]
          const isEmail = provider.providerName === 'email-password'

          return (
            <div
              key={provider.providerName}
              className={`rounded-xl border transition-all ${
                provider.isEnabled
                  ? 'border-blue-200/80 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5'
                  : 'border-gray-200/80 dark:border-zinc-800/80 bg-gray-50/30 dark:bg-zinc-800/20 opacity-60'
              }`}
            >
              {/* Provider Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-500 dark:text-zinc-400 shadow-sm">
                    {provider.logoUrl ? (
                      <img src={provider.logoUrl} alt="" className="w-4 h-4 object-contain rounded" />
                    ) : (
                      icon || <GlobeIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{provider.displayName}</p>
                    <p className="text-[9px] text-gray-400 dark:text-zinc-500">{provider.providerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${
                    provider.isEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                      : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500'
                  }`}>
                    {provider.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Provider Config (only for enabled) */}
              {provider.isEnabled && (
                <div className="px-3 pb-3 space-y-2.5 border-t border-gray-100 dark:border-zinc-800/50 pt-2.5">
                  {/* Button Label */}
                  {!isEmail && (
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Button Label</label>
                      <input
                        type="text"
                        value={provider.label}
                        onChange={e => updateProvider(provider.providerName, 'label', e.target.value)}
                        placeholder={`Continue with ${provider.displayName}`}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  {/* Logo URL */}
                  {!isEmail && (
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Logo / Icon URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={provider.logoUrl}
                          onChange={e => updateProvider(provider.providerName, 'logoUrl', e.target.value)}
                          placeholder="https://cdn.example.com/logo.svg"
                          className="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        {provider.logoUrl && (
                          <div className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                            <img src={provider.logoUrl} alt="" className="w-4 h-4 object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Button Colors */}
                  {!isEmail && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Button Background</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            title={`${provider.providerName} button background color`}
                            value={provider.bgColor || '#F3F4F6'}
                            onChange={e => updateProvider(provider.providerName, 'bgColor', e.target.value)}
                            className="w-6 h-6 rounded border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            title={`${provider.providerName} button background hex`}
                            value={provider.bgColor}
                            onChange={e => updateProvider(provider.providerName, 'bgColor', e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Button Text</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            title={`${provider.providerName} button text color`}
                            value={provider.textColor || '#374151'}
                            onChange={e => updateProvider(provider.providerName, 'textColor', e.target.value)}
                            className="w-6 h-6 rounded border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            title={`${provider.providerName} button text hex`}
                            value={provider.textColor}
                            onChange={e => updateProvider(provider.providerName, 'textColor', e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview of button */}
                  {!isEmail && (
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight block mb-1">Button Preview</label>
                      <button
                        className="w-full py-2 text-xs font-medium flex items-center justify-center gap-2 border transition-all"
                        style={{
                          borderColor: provider.bgColor || settings.inputBorderColor,
                          borderRadius: getBorderRadiusValue(),
                          color: provider.textColor || settings.textColor,
                          backgroundColor: provider.bgColor || settings.inputBackgroundColor,
                        }}
                      >
                        {provider.logoUrl ? (
                          <img src={provider.logoUrl} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          icon || <GlobeIcon className="w-4 h-4" />
                        )}
                        {provider.label}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info note */}
      <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20">
        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-bold">Note:</span> Provider availability is managed in the <span className="font-semibold">Auth Methods</span> tab. Only enabled providers will appear on the login/signup pages. This section controls their visual appearance.
        </p>
      </div>
    </div>
  )

  const renderOptionsSection = () => (
    <div>
      {([
        { key: 'showSocialDivider' as const, label: 'Social Divider', desc: '"or" divider with social buttons' },
        { key: 'showRememberMe' as const, label: 'Remember Me', desc: 'Checkbox on login form' },
        { key: 'showForgotPassword' as const, label: 'Forgot Password', desc: 'Link on login form' },
        { key: 'showTermsCheckbox' as const, label: 'Terms Checkbox', desc: 'On signup form' },
      ]).map(opt => (
        <ConfigRow key={opt.key} label={opt.label} desc={opt.desc}>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" title={`Toggle ${opt.label}`} checked={settings[opt.key] as boolean} onChange={e => update(opt.key, e.target.checked)} />
            <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </ConfigRow>
      ))}
      <ConfigRow label="Custom CSS" desc="Override styles">
        <textarea
          value={settings.customCss}
          onChange={e => update('customCss', e.target.value)}
          placeholder={`.auth-card { }`}
          rows={3}
          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-[10px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </ConfigRow>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-5 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Auth Page Style</h3>
          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />
          {/* Device Selector */}
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            {(Object.keys(DEVICE_META) as DeviceType[]).map(device => {
              const meta = DEVICE_META[device]
              return (
                <button
                  key={device}
                  onClick={() => setActiveDevice(device)}
                  title={meta.label}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    activeDevice === device
                      ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600'
                  }`}
                >
                  {meta.icon}
                  <span className="hidden lg:inline">{meta.label}</span>
                </button>
              )
            })}
          </div>
          <button onClick={handleCopyToOtherDevices} className="text-[9px] font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1" title="Copy to all devices">
            <CopyIcon className="w-3 h-3" /> Copy to all
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />
          <button
            onClick={() => setShowDevGuide(true)}
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-md transition-colors"
            title="Integration Dev Guide"
          >
            <BookOpenIcon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Dev Guide</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview Mode */}
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            {(['login', 'signup'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                  previewMode === mode
                    ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-zinc-500'
                }`}
              >
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />
          {saveMsg && <span className={`text-[10px] font-medium ${saveMsg.includes('Failed') ? 'text-red-500' : 'text-emerald-600'}`}>{saveMsg}</span>}
          <Button variant="outline" size="sm" onClick={handleReset} title="Reset current device" className="h-7 text-[10px] px-2">
            <RotateCcwIcon className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 h-7 text-[10px] px-3">
            {saving ? <Loader2Icon className="w-3 h-3 mr-1 animate-spin" /> : <SaveIcon className="w-3 h-3 mr-1" />} Save All
          </Button>
          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            title={showConfigPanel ? 'Hide config panel' : 'Show config panel'}
            className={`p-1.5 rounded-lg transition-colors ${showConfigPanel ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            {showConfigPanel ? <PanelRightCloseIcon className="w-4 h-4" /> : <SlidersHorizontalIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview + Config Columns */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-gray-50 dark:bg-zinc-950 overflow-hidden">
        <div className={`grid grid-cols-1 ${showConfigPanel ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
          <div className="flex items-center justify-center p-6 min-h-[calc(100vh-240px)] border-b xl:border-b-0 xl:border-r border-gray-200/70 dark:border-zinc-800/70">
          {activeDevice === 'mobileApp' ? (
            <div className="relative rounded-[2rem] border-[6px] border-gray-800 dark:border-zinc-600 bg-gray-800 dark:bg-zinc-600 shadow-xl overflow-hidden" style={{ width: 280, minHeight: 580 }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-800 dark:bg-zinc-600 rounded-b-xl z-10" />
              <div className="rounded-[1.5rem] overflow-hidden">
                {renderPreview()}
              </div>
            </div>
          ) : activeDevice === 'mobileWeb' ? (
            <div className="relative rounded-xl border-2 border-gray-300 dark:border-zinc-600 shadow-lg overflow-hidden" style={{ width: 340, minHeight: 560 }}>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-2 px-2 py-0.5 bg-white dark:bg-zinc-700 rounded text-[8px] text-gray-400 dark:text-zinc-500 text-center truncate">
                  {appName.toLowerCase().replace(/\s+/g, '')}.com/login
                </div>
              </div>
              {renderPreview()}
            </div>
          ) : (
            <div className="w-full max-w-2xl rounded-xl border-2 border-gray-300 dark:border-zinc-600 shadow-lg overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 px-3 py-1 bg-white dark:bg-zinc-700 rounded-md text-[10px] text-gray-400 dark:text-zinc-500 text-center truncate">
                  https://{appName.toLowerCase().replace(/\s+/g, '')}.com/login
                </div>
              </div>
              {renderPreview()}
            </div>
          )}
          </div>

        {showConfigPanel && (
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md w-full xl:w-[380px] flex flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontalIcon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-700 dark:text-zinc-200 uppercase tracking-wider">Configure</span>
              </div>
              <button onClick={() => setShowConfigPanel(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors" title="Close panel">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 dark:border-zinc-800 overflow-x-auto">
              {configSections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
                    activeSection === sec.id
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {sec.icon}
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Section Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[360px] max-h-[calc(100vh-320px)]">
              {activeSection === 'layout' && renderLayoutSection()}
              {activeSection === 'colors' && renderColorsSection()}
              {activeSection === 'typography' && renderTypographySection()}
              {activeSection === 'content' && renderContentSection()}
              {activeSection === 'providers' && renderProvidersSection()}
              {activeSection === 'options' && renderOptionsSection()}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Dev Guide Drawer */}
      {showDevGuide && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowDevGuide(false)} />
          <div className="fixed top-4 right-4 bottom-4 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-zinc-800/80">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                  <BookOpenIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Auth Style Integration Guide</h2>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400">How to apply configured styles in your app</p>
                </div>
              </div>
              <button onClick={() => setShowDevGuide(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400" title="Close">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Fetch Auth Style Config</h3>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2 leading-relaxed">
                  Retrieve the auth page style configuration for the current device type from the API endpoint.
                </p>
                {(() => {
                  const code = `// Fetch auth style for a specific device type
const response = await fetch(
  '/api/v1/applications/${appId}/auth-style?device=desktopWeb'
);
const { devices, providers } = await response.json();
const style = devices.desktopWeb; // or mobileWeb, mobileApp`
                  return (
                    <div className="relative group">
                      <pre className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-[10px] font-mono text-gray-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">{code}</pre>
                      <button onClick={() => copyToClipboard(code, 'fetch')} className="absolute top-2 right-2 p-1 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy">
                        {copiedSnippet === 'fetch' ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardCopyIcon className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Apply Styles (React)</h3>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2 leading-relaxed">
                  Use the fetched config to apply dynamic styles to your login/signup components.
                </p>
                {(() => {
                  const code = `import { useAuthStyle } from '@appkit/react';

function LoginPage() {
  const { style, providers } = useAuthStyle('${appId}');

  return (
    <div style={{
      backgroundColor: style.backgroundColor,
      fontFamily: style.fontFamily,
    }}>
      <div style={{
        backgroundColor: style.cardBackgroundColor,
        borderRadius: style.borderRadius,
      }}>
        <img src={style.logoUrl} alt="Logo" />
        <h1 style={{ color: style.textColor }}>
          {style.welcomeTitle}
        </h1>
        <p style={{ color: style.secondaryTextColor }}>
          {style.welcomeSubtitle}
        </p>

        {/* Email/Password Fields */}
        <input placeholder="Email" style={{
          borderColor: style.inputBorderColor,
          backgroundColor: style.inputBackgroundColor,
        }} />

        {/* Primary Button */}
        <button style={{
          backgroundColor: style.primaryButtonColor,
          color: style.primaryButtonTextColor,
        }}>
          Sign In
        </button>

        {/* Social Providers */}
        {style.showSocialDivider && (
          <div className={style.socialLoginLayout}>
            {providers.map(p => (
              <button key={p.providerName} style={{
                backgroundColor: p.bgColor,
                color: p.textColor,
              }}>
                <img src={p.logoUrl} alt="" />
                {style.socialLoginLayout === 'vertical'
                  && p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}`
                  return (
                    <div className="relative group">
                      <pre className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-[10px] font-mono text-gray-700 dark:text-zinc-300 overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">{code}</pre>
                      <button onClick={() => copyToClipboard(code, 'react')} className="absolute top-2 right-2 p-1 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy">
                        {copiedSnippet === 'react' ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardCopyIcon className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">3</span>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Device Detection</h3>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2 leading-relaxed">
                  Detect the user&apos;s device to load the correct style configuration automatically.
                </p>
                {(() => {
                  const code = `// Auto-detect device type
function getDeviceType(): 'mobileApp' | 'mobileWeb' | 'desktopWeb' {
  // If running inside a native WebView / React Native
  if (window.ReactNativeWebView || navigator.userAgent.includes('AppKit')) {
    return 'mobileApp';
  }
  // Mobile browser
  if (/iPhone|iPad|Android|Mobile/i.test(navigator.userAgent)) {
    return 'mobileWeb';
  }
  return 'desktopWeb';
}

// Usage
const device = getDeviceType();
const style = authConfig.devices[device];`
                  return (
                    <div className="relative group">
                      <pre className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-[10px] font-mono text-gray-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">{code}</pre>
                      <button onClick={() => copyToClipboard(code, 'detect')} className="absolute top-2 right-2 p-1 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy">
                        {copiedSnippet === 'detect' ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardCopyIcon className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">4</span>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">CSS Variables (Alternative)</h3>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2 leading-relaxed">
                  For non-React apps, inject the config as CSS custom properties for easy styling.
                </p>
                {(() => {
                  const code = `// Inject auth style as CSS variables
function applyAuthStyle(style) {
  const root = document.documentElement;
  root.style.setProperty('--auth-bg', style.backgroundColor);
  root.style.setProperty('--auth-card-bg', style.cardBackgroundColor);
  root.style.setProperty('--auth-btn-bg', style.primaryButtonColor);
  root.style.setProperty('--auth-btn-text', style.primaryButtonTextColor);
  root.style.setProperty('--auth-input-border', style.inputBorderColor);
  root.style.setProperty('--auth-input-bg', style.inputBackgroundColor);
  root.style.setProperty('--auth-text', style.textColor);
  root.style.setProperty('--auth-text-secondary', style.secondaryTextColor);
  root.style.setProperty('--auth-link', style.linkColor);
  root.style.setProperty('--auth-radius', style.borderRadius);
}

// Then in your CSS:
// .auth-page { background: var(--auth-bg); }
// .auth-card { background: var(--auth-card-bg); }
// .auth-btn  { background: var(--auth-btn-bg); }`
                  return (
                    <div className="relative group">
                      <pre className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-[10px] font-mono text-gray-700 dark:text-zinc-300 overflow-x-auto leading-relaxed max-h-56 overflow-y-auto">{code}</pre>
                      <button onClick={() => copyToClipboard(code, 'css')} className="absolute top-2 right-2 p-1 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy">
                        {copiedSnippet === 'css' ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardCopyIcon className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* API Reference */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                <h4 className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">API Endpoints</h4>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 text-[8px] font-bold rounded shrink-0">GET</span>
                    <code className="text-[9px] text-gray-600 dark:text-zinc-300 font-mono break-all">/api/v1/applications/{appId}/auth-style</code>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 text-[8px] font-bold rounded shrink-0">PUT</span>
                    <code className="text-[9px] text-gray-600 dark:text-zinc-300 font-mono break-all">/api/v1/applications/{appId}/auth-style</code>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-700">
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500">
                    Query params: <code className="px-1 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded text-[8px]">?device=mobileApp|mobileWeb|desktopWeb</code>
                  </p>
                </div>
              </div>

              {/* Style Properties Reference */}
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-500/5 border border-violet-200/50 dark:border-violet-500/20">
                <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">Style Properties</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {['layout', 'backgroundColor', 'cardBackgroundColor', 'primaryButtonColor', 'textColor', 'secondaryTextColor', 'linkColor', 'inputBorderColor', 'borderRadius', 'logoPosition', 'logoSize', 'fontFamily', 'socialLoginLayout', 'socialButtonStyle', 'welcomeTitle', 'welcomeSubtitle', 'signupTitle', 'signupSubtitle', 'showSocialDivider', 'showRememberMe', 'showForgotPassword', 'showTermsCheckbox'].map(prop => (
                    <code key={prop} className="text-[8px] text-violet-700 dark:text-violet-300 font-mono py-0.5">{prop}</code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
