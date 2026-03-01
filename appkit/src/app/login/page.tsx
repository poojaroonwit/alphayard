'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '../../services/authService'
import { settingsService } from '../../services/settingsService'
import { identityService } from '../../services/identityService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Layers, Chrome, Github, Twitter, User as UserIcon } from 'lucide-react'

import { Suspense } from 'react'

// Provider icons mapping
const providerIcons: Record<string, any> = {
  google: Chrome,
  github: Github,
  twitter: Twitter,
  facebook: Layers, // Placeholder
  microsoft: Layers, // Placeholder
  apple: Layers, // Placeholder
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [appName, setAppName] = useState('AppKit Admin')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loginBgStyle, setLoginBgStyle] = useState<React.CSSProperties>({})
  const [loginBgVideo, setLoginBgVideo] = useState<string | undefined>(undefined)
  const [ssoProviders, setSsoProviders] = useState<any[]>([])
  const [ssoLoading, setSsoLoading] = useState<string | null>(null)
  const [authStyle, setAuthStyle] = useState<any>(null)
  const [authStyleProviders, setAuthStyleProviders] = useState<any[]>([])
  const [formMode, setFormMode] = useState<'signin' | 'signup'>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [authBehavior, setAuthBehavior] = useState({
    signupEnabled: true,
    emailVerificationRequired: false,
    inviteOnly: false,
    allowedEmailDomains: [] as string[],
    postLoginRedirect: '',
    postSignupRedirect: ''
  })

  const detectAuthStyleDevice = (): 'mobileApp' | 'mobileWeb' | 'desktopWeb' => {
    if (typeof window === 'undefined') return 'desktopWeb'

    const ua = window.navigator.userAgent || ''
    const uaLower = ua.toLowerCase()
    const isMobileUa = /iphone|ipad|android|mobile/i.test(ua)
    const appHint = /reactnative|wv|appkit|cordova|capacitor/i.test(uaLower)

    if (appHint) return 'mobileApp'
    if (isMobileUa || window.innerWidth < 768) return 'mobileWeb'
    return 'desktopWeb'
  }

  const getBorderRadiusValue = () => {
    if (!authStyle?.borderRadius) return '0.5rem';
    switch (authStyle.borderRadius) {
      case 'none': return '0px';
      case 'small': return '0.25rem';
      case 'medium': return '0.5rem';
      case 'large': return '1rem';
      case 'full': return '9999px';
      default: return '0.5rem';
    }
  };

  // Check if already authenticated and load settings
  useEffect(() => {
    if (authService.isAuthenticated()) {
        const redirect = searchParams?.get('redirect') || '/dashboard'
        router.push(redirect)
        return
    }
    
    // Load background settings and SSO providers
    const loadSettings = async () => {
      let appConfig: any = null;
      try {
        // 1. Try Next.js searchParams first
        let extractedClientId = searchParams?.get('client_id');
        let redirectUrl = searchParams?.get('redirect');
        
        // 2. Fallback to raw window location if Next.js hydration hasn't populated searchParams yet
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (!extractedClientId) extractedClientId = urlParams.get('client_id');
          if (!redirectUrl) redirectUrl = urlParams.get('redirect');
        }

        // 3. Fallback to extracting from the nested redirect URL
        if (!extractedClientId && redirectUrl) {
           try {
              const decodedRedirect = decodeURIComponent(redirectUrl);
              const url = decodedRedirect.startsWith('http') 
                ? new URL(decodedRedirect) 
                : new URL(decodedRedirect, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
              
              extractedClientId = url.searchParams.get('client_id');
              console.log('[Login] Extracted clientId from redirect:', extractedClientId);
           } catch(e) {
              console.error('[Login] Failed to parse redirectUrl for client_id', e);
           }
        }

        // 4. Ultimate fallback: Search the entire raw URL string for anything that looks like client_id=...
        if (!extractedClientId && typeof window !== 'undefined') {
          const rawUrl = window.location.href;
          const match = rawUrl.match(/[?&]client_id=([^&]+)/i);
          if (match && match[1]) {
            extractedClientId = decodeURIComponent(match[1]);
            console.log('[Login] Extracted clientId via raw Regex match:', extractedClientId);
          }
        }

        if (extractedClientId) {
          setClientId(extractedClientId);
          try {
            console.log('[Login] Fetching app-config for clientId:', extractedClientId);
            const res = await fetch(`/api/v1/auth/app-config?client_id=${encodeURIComponent(extractedClientId)}`);
            if (res.ok) {
               appConfig = await res.json();
               console.log('[Login] app-config response:', appConfig);
               
               // Verification of Branding
               if (appConfig?.branding) {
                 console.log('[Login] Custom branding received:', appConfig.branding.name);
               } else {
                 console.warn('[Login] app-config returned null branding for clientId:', extractedClientId);
               }
            } else {
               const errorText = await res.text();
               console.error('[Login] API Error fetching app-config:', res.status, errorText);
            }
          } catch(e) {
            console.error('[Login] Exception fetching app-config:', e);
          }
        } else {
          console.log('[Login] No clientId found in searchParams, window.location, or redirect URL');
        }

        // Check if there is a custom auth style
        let settingsObj = appConfig?.settings;
        console.log('Extracted settingsObj before parse:', settingsObj);
        if (typeof settingsObj === 'string') {
          try {
            settingsObj = JSON.parse(settingsObj);
            console.log('Parsed settingsObj from string:', settingsObj);
          } catch (e) {
            settingsObj = {};
            console.error('Failed to parse settingsObj string', e);
          }
        }

        const rawBehavior = settingsObj?.authBehavior || {}
        setAuthBehavior({
          signupEnabled: rawBehavior.signupEnabled !== false,
          emailVerificationRequired: rawBehavior.emailVerificationRequired === true,
          inviteOnly: rawBehavior.inviteOnly === true,
          allowedEmailDomains: Array.isArray(rawBehavior.allowedEmailDomains)
            ? rawBehavior.allowedEmailDomains.filter((item: unknown): item is string => typeof item === 'string')
            : [],
          postLoginRedirect: typeof rawBehavior.postLoginRedirect === 'string' ? rawBehavior.postLoginRedirect : '',
          postSignupRedirect: typeof rawBehavior.postSignupRedirect === 'string' ? rawBehavior.postSignupRedirect : ''
        })

        console.log('Checking settingsObj?.authStyle:', settingsObj?.authStyle);
        if (settingsObj?.authStyle) {
          const styleConfig = settingsObj.authStyle;
          console.log('Found styleConfig:', styleConfig);

          const requestedDevice = searchParams?.get('device')
          const autoDetectedDevice = detectAuthStyleDevice()
          const selectedDevice = (requestedDevice || autoDetectedDevice) as 'mobileApp' | 'mobileWeb' | 'desktopWeb'
          const selectedStyle =
            styleConfig.devices?.[selectedDevice] ||
            styleConfig.devices?.desktopWeb ||
            styleConfig.devices?.mobileWeb ||
            styleConfig.devices?.mobileApp

          if (selectedStyle) {
            console.log(`[Login] Applying authStyle for device: ${selectedDevice}`);
            setAuthStyle(selectedStyle);
          } else {
            console.warn('No device style config found in authStyle');
          }

          if (styleConfig.providers) {
            setAuthStyleProviders(styleConfig.providers);
          }
        } else {
          console.log('No authStyle found in settingsObj');
        }

        const settings = appConfig?.branding || await settingsService.getBranding()
        if (settings?.adminAppName || settings?.name) {
          setAppName(settings.name || settings.adminAppName)
        }
        if (settings?.logoUrl) {
          setLogoUrl(settings.logoUrl)
        }

        if (settings?.loginBackground) {
          const bg = settings.loginBackground
          const style: React.CSSProperties = {}
          let videoUrl: string | undefined
  
          if (bg.type === 'solid' && bg.value) {
            style.backgroundColor = bg.value
          } else if (bg.type === 'gradient' && bg.value) {
            style.background = bg.value
          } else if (bg.type === 'gradient' && bg.gradientStops) {
            style.background = `linear-gradient(${bg.gradientDirection?.replace('to-', 'to ') || 'to right'}, ${bg.gradientStops?.map((s: any) => `${s.color} ${s.position}%`).join(', ')})`
          } else if (bg.type === 'image' && bg.value) {
            style.backgroundImage = `url(${bg.value})`
            style.backgroundSize = 'cover'
            style.backgroundPosition = 'center'
          } else if (bg.type === 'video' && bg.value) {
            videoUrl = bg.value
          }
  
          setLoginBgStyle(style)
          setLoginBgVideo(videoUrl)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }

      // Load SSO providers
      if (appConfig?.providers && appConfig.providers.length > 0) {
        setSsoProviders(appConfig.providers);
      } else {
        loadSSOProviders()
      }
    }

    loadSettings()
  }, [router, searchParams])

  // Load SSO providers from identity service
  const loadSSOProviders = async () => {
    try {
      const { providers } = await identityService.getOAuthProviders()
      setSsoProviders((providers || []).filter((p: any) => p.isEnabled))
    } catch (error) {
      console.error('Failed to load SSO providers:', error)
    }
  }

  // Handle SSO login
  const handleSSOLogin = async (provider: string) => {
    setSsoLoading(provider)
    setError('')
    
    try {
      // For now, redirect to SSO flow (this would typically open a popup or redirect)
      const redirectUrl = searchParams?.get('redirect') || '/dashboard'
      window.location.href = `/api/v1/admin/auth/sso/${provider}?redirect=${encodeURIComponent(redirectUrl)}`
    } catch (error: any) {
      setError(error.message || `Failed to login with ${provider}`)
      setSsoLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (formMode === 'signin') {
        const response = await authService.login({ email, password, clientId: clientId || undefined })
        const redirect =
          searchParams?.get('redirect') ||
          response.redirectTo ||
          authBehavior.postLoginRedirect ||
          '/dashboard'
        router.push(redirect)
      } else {
        if (!authBehavior.signupEnabled) {
          throw new Error('Signup is disabled for this application')
        }

        // Registration flow
        const payload = {
          action: 'register',
          clientId: clientId || 'appkit-admin',
          email,
          password,
          firstName,
          lastName,
          acceptTerms,
          deviceInfo: {
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
            platform: typeof window !== 'undefined' ? window.navigator.platform : 'Unknown'
          }
        }

        const res = await fetch('/api/v1/admin/identity/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        // Store token and redirect upon successful registration
        if (typeof window !== 'undefined' && data.tokens?.accessToken) {
          localStorage.setItem('admin_token', data.tokens.accessToken)
          localStorage.setItem('admin_user', JSON.stringify(data.user))
          
          const redirect =
            searchParams?.get('redirect') ||
            data.redirectTo ||
            authBehavior.postSignupRedirect ||
            '/dashboard'
          router.push(redirect)
        } else {
          throw new Error('No access token received')
        }
      }
    } catch (err: any) {
        setError(err.message || (formMode === 'signin' ? 'Login failed' : 'Registration failed'))
    } finally {
        setIsLoading(false)
    }
  }

  if (authStyle) {
    const isSplit = authStyle.layout === 'split-left' || authStyle.layout === 'split-right';
    const splitLeft = authStyle.layout === 'split-left';

    const getBorderRadiusValue = () => {
      switch (authStyle.borderRadius) {
        case 'none': return '0px'
        case 'small': return '4px'
        case 'medium': return '8px'
        case 'large': return '16px'
        case 'full': return '9999px'
        default: return '8px'
      }
    }

    const enabledProviders = (authStyleProviders.length ? authStyleProviders : ssoProviders).map(p => ({
      providerName: p.providerName,
      isEnabled: p.isEnabled ?? true,
      displayName: p.displayName,
      label: p.label || p.buttonText || `Continue with ${p.displayName}`,
      logoUrl: p.logoUrl || p.iconUrl || '',
      bgColor: p.bgColor || p.buttonColor || '',
      textColor: p.textColor || '',
    })).filter(p => p.isEnabled)

    const socialProviders = enabledProviders.filter(p => p.providerName !== 'email-password')

    const formPanel = (
      <div className="flex flex-col items-center justify-center p-6 md:p-12 w-full h-full" style={{ backgroundColor: isSplit ? authStyle.cardBackgroundColor : 'transparent' }}>
        <div className="w-full max-w-[340px] space-y-5">
          {authStyle.logoPosition !== 'hidden' && (
            <div className={`flex items-center mb-6 ${authStyle.logoPosition === 'top' ? 'justify-center flex-col gap-3' : 'gap-3'}`}>
              <div
                className="flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden shrink-0"
                style={{
                  width: authStyle.logoSize === 'small' ? 32 : authStyle.logoSize === 'medium' ? 48 : 64,
                  height: authStyle.logoSize === 'small' ? 32 : authStyle.logoSize === 'medium' ? 48 : 64,
                  borderRadius: getBorderRadiusValue(),
                  background: logoUrl ? 'transparent' : `linear-gradient(135deg, ${authStyle.primaryButtonColor}, ${authStyle.splitPanelOverlayColor || '#000'})`,
                }}
              >
                {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" alt="Logo" /> : appName.substring(0, 2).toUpperCase()}
              </div>
              {authStyle.showAppName && (
                <span className="text-xl font-bold" style={{ color: authStyle.textColor }}>{appName}</span>
              )}
            </div>
          )}

          <div className={authStyle.logoPosition === 'top' ? 'text-center' : ''}>
            <h4 className="text-2xl font-bold leading-tight" style={{ color: authStyle.textColor }}>
              {formMode === 'signin' ? authStyle.welcomeTitle : (authStyle.signupTitle || 'Create your account')}
            </h4>
            <p className="text-sm mt-1" style={{ color: authStyle.secondaryTextColor }}>
              {formMode === 'signin' ? authStyle.welcomeSubtitle : (authStyle.signupSubtitle || 'Get started in just a few steps')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formMode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: authStyle.secondaryTextColor }}>First Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 transition-colors" style={{ color: authStyle.secondaryTextColor }} />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="John"
                      className="w-full px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ 
                          backgroundColor: authStyle.inputBackgroundColor, 
                          border: `1px solid ${authStyle.inputBorderColor}`, 
                          borderRadius: getBorderRadiusValue(), 
                          color: authStyle.textColor,
                          paddingLeft: '2.5rem'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: authStyle.secondaryTextColor }}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Doe"
                    className="w-full px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ 
                        backgroundColor: authStyle.inputBackgroundColor, 
                        border: `1px solid ${authStyle.inputBorderColor}`, 
                        borderRadius: getBorderRadiusValue(), 
                        color: authStyle.textColor
                    }}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: authStyle.secondaryTextColor }}>Email</label>
              <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 transition-colors" style={{ color: authStyle.secondaryTextColor }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ 
                        backgroundColor: authStyle.inputBackgroundColor, 
                        border: `1px solid ${authStyle.inputBorderColor}`, 
                        borderRadius: getBorderRadiusValue(), 
                        color: authStyle.textColor,
                        paddingLeft: '2.5rem'
                    }}
                  />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color: authStyle.secondaryTextColor }}>Password</label>
                {formMode === 'signin' && authStyle.showForgotPassword && (
                  <a href="#" className="text-xs font-medium hover:underline cursor-pointer" style={{ color: authStyle.linkColor }}>Forgot password?</a>
                )}
              </div>
              <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 transition-colors" style={{ color: authStyle.secondaryTextColor }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ 
                        backgroundColor: authStyle.inputBackgroundColor, 
                        border: `1px solid ${authStyle.inputBorderColor}`, 
                        borderRadius: getBorderRadiusValue(), 
                        color: authStyle.textColor,
                        paddingLeft: '2.5rem',
                        paddingRight: '2.5rem'
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 opacity-50 hover:opacity-100 transition-opacity"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: authStyle.secondaryTextColor }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
              </div>
            </div>

            {formMode === 'signin' ? (
              authStyle.showRememberMe && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" className="w-4 h-4 rounded border cursor-pointer" style={{ borderColor: authStyle.inputBorderColor, accentColor: authStyle.primaryButtonColor }} />
                  <span className="text-sm select-none" style={{ color: authStyle.secondaryTextColor }}>Remember me</span>
                </label>
              )
            ) : (
              authStyle.showTermsCheckbox && (
                <label className="flex items-start gap-2 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="w-4 h-4 rounded border cursor-pointer mt-0.5" 
                    style={{ borderColor: authStyle.inputBorderColor, accentColor: authStyle.primaryButtonColor }} 
                  />
                  <span className="text-xs leading-normal" style={{ color: authStyle.secondaryTextColor }}>
                    I agree to the <a href="#" className="hover:underline" style={{ color: authStyle.linkColor }}>Terms of Service</a> and <a href="#" className="hover:underline" style={{ color: authStyle.linkColor }}>Privacy Policy</a>
                  </span>
                </label>
              )
            )}

            {error && (
              <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-semibold shadow-sm transition-all hover:opacity-90 disabled:opacity-70 mt-2"
              style={{
                backgroundColor: authStyle.primaryButtonColor,
                color: authStyle.primaryButtonTextColor,
                borderRadius: getBorderRadiusValue(),
              }}
            >
              {isLoading ? (formMode === 'signin' ? 'Signing in...' : 'Creating account...') : (formMode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {authStyle.showSocialDivider && socialProviders.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ backgroundColor: authStyle.inputBorderColor }} />
                <span className="text-xs uppercase font-medium" style={{ color: authStyle.secondaryTextColor }}>or continue with</span>
                <div className="flex-1 h-px" style={{ backgroundColor: authStyle.inputBorderColor }} />
              </div>
              
              {authStyle.socialLoginLayout === 'horizontal' ? (
                <div className="flex items-center justify-center gap-3">
                  {socialProviders.map(sp => {
                    const IconComponent = providerIcons[sp.providerName] || Layers;
                    return (
                      <button
                        key={sp.providerName}
                        type="button"
                        onClick={() => handleSSOLogin(sp.providerName)}
                        disabled={ssoLoading === sp.providerName}
                        className="w-12 h-12 flex items-center justify-center font-bold border cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 shadow-sm"
                        style={{
                          borderColor: authStyle.socialButtonStyle === 'outline' ? authStyle.inputBorderColor : (sp.bgColor || authStyle.inputBorderColor),
                          borderRadius: getBorderRadiusValue(),
                          color: sp.textColor || authStyle.secondaryTextColor,
                          backgroundColor: authStyle.socialButtonStyle === 'outline' ? 'transparent' : (sp.bgColor || authStyle.inputBackgroundColor),
                        }}
                        title={sp.label}
                      >
                        {sp.logoUrl ? <img src={sp.logoUrl} alt="" className="w-5 h-5 object-contain" /> : <IconComponent className="w-5 h-5" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {socialProviders.map(sp => {
                    const IconComponent = providerIcons[sp.providerName] || Layers;
                    return (
                      <button
                        key={sp.providerName}
                        type="button"
                        onClick={() => handleSSOLogin(sp.providerName)}
                        disabled={ssoLoading === sp.providerName}
                        className="w-full py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2.5 border transition-all disabled:opacity-50 hover:opacity-90 shadow-sm"
                        style={{
                          borderColor: authStyle.socialButtonStyle === 'outline' ? authStyle.inputBorderColor : (sp.bgColor || authStyle.inputBorderColor),
                          borderRadius: getBorderRadiusValue(),
                          color: sp.textColor || authStyle.textColor,
                          backgroundColor: authStyle.socialButtonStyle === 'outline' ? 'transparent' : (sp.bgColor || authStyle.inputBackgroundColor),
                        }}
                      >
                        {ssoLoading === sp.providerName ? (
                           <span className="animate-pulse">Connecting...</span>
                        ) : (
                           <>
                             {sp.logoUrl ? <img src={sp.logoUrl} alt="" className="w-4 h-4 object-contain" /> : <IconComponent className="w-4 h-4" />}
                             {sp.label}
                           </>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          <p className="text-center text-sm mt-8" style={{ color: authStyle.secondaryTextColor }}>
            {formMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            {formMode === 'signin' && !authBehavior.signupEnabled ? (
              <span className="font-semibold opacity-70" style={{ color: authStyle.secondaryTextColor }}>
                Signup disabled
              </span>
            ) : (
              <span
                className="font-semibold cursor-pointer hover:underline"
                style={{ color: authStyle.linkColor }}
                onClick={() => {
                  setFormMode(formMode === 'signin' ? 'signup' : 'signin');
                  setError('');
                }}
              >
                {formMode === 'signin' ? 'Sign up' : 'Sign in'}
              </span>
            )}
          </p>
        </div>
      </div>
    );

    const splitPanel = (
      <div
        className="relative hidden md:flex flex-col items-center justify-center p-12 text-white min-h-full"
        style={{ backgroundColor: authStyle.splitPanelOverlayColor }}
      >
        {authStyle.splitPanelImage && (
          <div className="absolute inset-0">
            <img src={authStyle.splitPanelImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: authStyle.splitPanelOverlayColor, opacity: authStyle.splitPanelOverlayOpacity / 100 }} />
          </div>
        )}
        <div className="relative z-10 text-center space-y-4 max-w-lg px-8">
          <h3 className="text-4xl font-bold leading-tight drop-shadow-lg">{authStyle.splitPanelHeadline}</h3>
          <p className="text-lg opacity-90 drop-shadow">{authStyle.splitPanelSubline}</p>
        </div>
      </div>
    );

    return (
      <div className="h-screen w-full flex overflow-hidden font-sans" style={{ backgroundColor: authStyle.backgroundColor, fontFamily: authStyle.fontFamily === 'system' ? 'inherit' : `var(--font-${authStyle.fontFamily}, sans-serif)` }}>
        {authStyle.layout === 'centered' || authStyle.layout === 'fullscreen' ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: authStyle.layout === 'fullscreen' ? authStyle.primaryButtonColor + '10' : authStyle.backgroundColor }}>
            <div className="w-full max-w-md shadow-2xl border" style={{ backgroundColor: authStyle.cardBackgroundColor, borderRadius: authStyle.borderRadius === 'full' ? '24px' : getBorderRadiusValue(), borderColor: authStyle.inputBorderColor }}>
               {formPanel}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row w-full h-full">
            {splitLeft ? (
              <>
                <div className="hidden md:block w-full md:w-[45%] lg:w-1/2 relative">{splitPanel}</div>
                <div className="w-full md:w-[55%] lg:w-1/2 flex items-center justify-center overflow-y-auto">{formPanel}</div>
              </>
            ) : (
              <>
                <div className="w-full md:w-[55%] lg:w-1/2 flex items-center justify-center overflow-y-auto">{formPanel}</div>
                <div className="hidden md:block w-full md:w-[45%] lg:w-1/2 relative">{splitPanel}</div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row relative overflow-hidden text-gray-900" style={loginBgStyle}>

      {/* Helper for video background */}
      {loginBgVideo && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            src={loginBgVideo}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            style={{ filter: 'brightness(0.6)' }}
          />
        </div>
      )}

      {/* Default background if none set */}
      {Object.keys(loginBgStyle).length === 0 && !loginBgVideo && (
         <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200" />
      )}

      {/* Left Column - App Name & Description */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-20 relative z-10 pointer-events-none">
        <div className="max-w-3xl space-y-6 pointer-events-auto">
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
              ) : (
                <Layers className="h-10 w-10 text-blue-600 fill-blue-600/10" />
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 drop-shadow-sm">
              {appName}
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 font-light max-w-lg leading-relaxed ml-1">
            Access your administration console to manage content, users, and settings.
          </p>
        </div>
      </div>

      {/* Right Column - Login Panel (40% width on Desktop) */}
      <div className="w-full md:w-[40%] min-w-[320px] p-4 md:p-6 flex flex-col justify-center relative z-10 h-full">
        <Card
          className="w-full h-full relative border border-gray-200 shadow-2xl backdrop-blur-xl flex flex-col justify-center rounded-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(229, 231, 235, 0.5)',
          }}
        >
          <CardHeader className="space-y-1 pb-2 flex flex-col items-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-center">
              {formMode === 'signin' ? 'Sign in' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-center text-gray-500 text-lg">
              {formMode === 'signin' ? 'Welcome back' : 'Join our community'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 md:px-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formMode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-white/50 border-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-white/50 border-white/30"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/50 border-white/30 focus:bg-white/90 transition-all hover:bg-white/70"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-white/50 border-white/30 focus:bg-white/90 transition-all hover:bg-white/70"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-500 animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {formMode === 'signup' && (
                <div className="flex items-start space-x-2 py-1">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    title="Accept terms and privacy policy"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <Label htmlFor="acceptTerms" className="text-xs text-gray-500 leading-normal font-normal">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </Label>
                </div>
              )}

              <Button type="submit" className="w-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" disabled={isLoading}>
                {isLoading ? (formMode === 'signin' ? 'Signing in...' : 'Creating account...') : (formMode === 'signin' ? 'Sign in' : 'Create account')}
              </Button>
            </form>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              {formMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              {formMode === 'signin' && !authBehavior.signupEnabled ? (
                <span className="text-gray-400 font-semibold">Signup disabled</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFormMode(formMode === 'signin' ? 'signup' : 'signin');
                    setError('');
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {formMode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              )}
            </div>

            {/* SSO Login Section */}
            {ssoProviders.length > 0 && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-gray-200/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/80 px-2 text-gray-500 backdrop-blur-sm rounded-full">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Sign in with your social account
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ssoProviders.map((provider: any) => {
                      const IconComponent = providerIcons[provider.providerName] || Layers
                      return (
                        <Button
                          key={provider.providerName}
                          type="button"
                          variant="outline"
                          className="flex items-center gap-2 h-11 bg-white/60 border-white/40 hover:bg-white/80 transition-all"
                          onClick={() => handleSSOLogin(provider.providerName)}
                          disabled={ssoLoading === provider.providerName}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span className="text-sm">
                            {ssoLoading === provider.providerName 
                              ? 'Connecting...' 
                              : provider.displayName || provider.providerName
                            }
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

             <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-gray-200/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-gray-500 backdrop-blur-sm rounded-full">
                       Secure Login
                    </span>
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-gray-50">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
