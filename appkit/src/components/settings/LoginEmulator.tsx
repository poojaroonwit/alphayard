'use client'

import React from 'react'
import { Card, CardContent } from '../ui/Card'
import './LoginEmulator.css'
// ... imports
import { Eye, EyeOff, Mail, Lock, User, Smartphone, Globe, Moon, Sun, Building2, Briefcase, ArrowRight, Github, Chrome, Facebook } from 'lucide-react'
import { LoginConfig, DeviceConfig } from './LoginConfigTypes'
import { DeviceFrame } from './DeviceFrame'

interface LoginEmulatorProps {
  config: Partial<LoginConfig>
  platformMode?: 'web-desktop' | 'web-mobile' | 'mobile-app'
  deviceMode?: 'desktop' | 'mobile' | 'tablet'
}

export function LoginEmulator({ config, platformMode = 'web-desktop', deviceMode = 'desktop' }: LoginEmulatorProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loginResult, setLoginResult] = React.useState<{ success: boolean; message: string; data?: any } | null>(null)

  // Helper function to get device-specific configuration
  const getDeviceConfig = () => {
    if (config.responsive?.enableResponsiveConfig && config[deviceMode]) {
      return config[deviceMode]
    }
    // Fallback to main config if responsive config is disabled
    return {
      branding: config.branding || {},
      layout: config.layout || {},
      form: config.form || {},
      background: config.background || {}
    }
  }

  const deviceConfig = getDeviceConfig()
  const mergedConfig = {
    ...config,
    branding: { ...config.branding, ...deviceConfig.branding },
    layout: { ...config.layout, ...deviceConfig.layout },
    form: { ...config.form, ...deviceConfig.form },
    background: { ...config.background, ...deviceConfig.background }
  }

  const formatButtonText = (text: string, provider: string) => {
    if (!text) return provider;
    return text.replace(/{provider}/g, provider);
  }

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginResult(null)

    try {
      // Use the test credentials from the sandbox or form values
      const testEmail = email || 'test@example.com'
      const testPassword = password || 'password123'
      
      const testUrl = `/api/sandbox/test-login?redirect=%2Fsandbox%2Fsuccess`
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          redirectUrl: '/sandbox/success'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLoginResult({
          success: true,
          message: 'Test login successful! Authentication data generated.',
          data: data
        })
        
        // Store test data in localStorage for testing
        if (data.token) {
          localStorage.setItem('sandbox_token', data.token)
        }
        if (data.user) {
          localStorage.setItem('sandbox_user', JSON.stringify(data.user))
        }
      } else {
        setLoginResult({
          success: false,
          message: data.error || 'Test login failed'
        })
      }
    } catch (error) {
      setLoginResult({
        success: false,
        message: 'Test login failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getBackgroundStyle = () => {
    if (!mergedConfig.background) return {}
    
    const bg = mergedConfig.background || { type: 'solid', value: '#ffffff' }
    let baseStyle: React.CSSProperties = {}
    
    const bgType = bg.type || 'solid'
    switch (bgType) {
      case 'solid':
        baseStyle = { backgroundColor: bg.value }
        break
      case 'gradient':
        if (bg.gradientStops && bg.gradientStops.length > 0) {
          const gradient = `linear-gradient(${bg.gradientDirection || 'to right'}, ${bg.gradientStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
          baseStyle = { background: gradient }
        }
        break
      case 'image':
        if (bg.imageUrl) {
          baseStyle = {
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }
        }
        break
      case 'pattern':
        const patternSize = bg.patternSize || '20px'
        const pColor = bg.patternColor || '#f3f4f6'
        const pOpacity = bg.opacity || 0.1
        
        if (bg.patternType === 'dots') {
            baseStyle = {
                backgroundColor: pColor,
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,${pOpacity}) 1px, transparent 0)`,
                backgroundSize: `${patternSize} ${patternSize}`
            }
        } else if (bg.patternType === 'grid') {
            baseStyle = {
                backgroundColor: pColor,
                backgroundImage: `linear-gradient(rgba(0,0,0,${pOpacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,${pOpacity}) 1px, transparent 1px)`,
                backgroundSize: `${patternSize} ${patternSize}`
            }
        } else {
            // Stripes (default)
            baseStyle = {
                backgroundColor: pColor,
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent ${patternSize}, rgba(0,0,0,${pOpacity}) ${patternSize}, rgba(0,0,0,${pOpacity}) ${parseInt(patternSize) * 2}px)`
            }
        }
        break
    }

    // Apply opacity and blur effects (if not handled by specific types)
    if (bg.type !== 'video') {
        if (bg.type !== 'pattern' && bg.opacity !== undefined && bg.opacity < 1) {
            baseStyle.opacity = bg.opacity
        }
        
        if (bg.blur && bg.blur > 0) {
            baseStyle.filter = `blur(${bg.blur}px)`
        }
    }

    return baseStyle
  }


  const getLayoutStyle = (): React.CSSProperties => {
    const layout = mergedConfig.layout || {}
    let maxWidth = '400px'
    let padding = '2rem'
    if (deviceMode === 'mobile') { 
      maxWidth = '100%'
      padding = '1.5rem' // Standard mobile padding inside card
    }
    else if (deviceMode === 'tablet') { maxWidth = '480px'; padding = '1.5rem' }
    return {
      width: layout.maxWidth || maxWidth,
      padding: layout.padding || padding,
      borderRadius: deviceMode === 'mobile' ? '0' : (layout.borderRadius || '0.5rem'),
      boxShadow: deviceMode === 'mobile' ? 'none' : (layout.shadow || '0 10px 25px rgba(0, 0, 0, 0.1)'),
    }
  }

  const getBrandingColors = () => {
    const branding = mergedConfig.branding || {}
    return {
      primaryColor: branding.primaryColor || '#3b82f6',
      secondaryColor: branding.secondaryColor || '#6b7280',
      accentColor: branding.accentColor || '#10b981',
      textColor: branding.textColor || '#1f2937'
    }
  }

  const colors = getBrandingColors()

  // Helper for button styles
  const getButtonStyle = () => {
    const form = mergedConfig.form || {}
    const base: React.CSSProperties = {
      width: form.buttonFullWidth ? '100%' : 'auto',
      transition: 'all 0.2s'
    }

    // Radius
    switch(form.buttonBorderRadius) {
      case 'none': base.borderRadius = '0'; break;
      case 'small': base.borderRadius = '2px'; break;
      case 'medium': base.borderRadius = '4px'; break;
      case 'large': base.borderRadius = '8px'; break;
      case 'extra-large': base.borderRadius = '12px'; break;
      case 'full': base.borderRadius = '9999px'; break;
      default: base.borderRadius = '0.5rem';
    }

    // Padding & Size (Simplified)
    switch(form.buttonSize) {
      case 'small': base.padding = '0.5rem 1rem'; base.fontSize = '0.875rem'; break;
      case 'large': base.padding = '1rem 2rem'; base.fontSize = '1.125rem'; break;
      case 'extra-large': base.padding = '1.25rem 2.5rem'; base.fontSize = '1.25rem'; break;
      default: base.padding = '0.75rem 1.5rem'; base.fontSize = '1rem'; // medium
    }

    // Color & Style
    if (form.buttonStyle === 'outline') {
      base.backgroundColor = 'transparent'
      base.border = `2px solid ${colors.primaryColor}`
      base.color = colors.primaryColor
    } else if (form.buttonStyle === 'ghost') {
      base.backgroundColor = 'transparent'
      base.color = colors.primaryColor
    } else if (form.buttonStyle === 'gradient') {
        base.background = `linear-gradient(to right, ${colors.primaryColor}, ${colors.accentColor})`
        base.color = 'white'
        base.border = 'none'
    } else {
      // Solid (default)
      base.backgroundColor = colors.primaryColor
      base.color = 'white'
      base.border = 'none'
    }

    // Animation
    const animation = mergedConfig.animations?.buttonAnimationType || form.buttonAnimation
    if (animation === 'pulse') {
        base.animation = 'pulse 2s infinite'
    } else if (animation === 'bounce') {
        base.animation = 'bounce 2s infinite'
    } else if (animation === 'shake') {
        base.animation = 'shake 0.5s infinite'
    } else if (animation === 'rotate') {
        base.animation = 'rotate 2s infinite linear'
    }

    return base
  }

  return (
    <DeviceFrame platform={platformMode} deviceType={deviceMode}>
      <div 
        className="h-full w-full relative overflow-hidden"
        style={{
          ...getBackgroundStyle(),
          display: mergedConfig.layout?.layout === 'split' ? 'flex' : 'grid',
          placeItems: deviceMode === 'mobile' ? 'center stretch' : (
            mergedConfig.layout?.useCustomPosition ? 'start' : `${mergedConfig.layout?.verticalPosition === 'top' ? 'start' : mergedConfig.layout?.verticalPosition === 'bottom' ? 'end' : 'center'} ${mergedConfig.layout?.horizontalPosition === 'left' ? 'start' : mergedConfig.layout?.horizontalPosition === 'right' ? 'end' : 'center'}`
          ),
          padding: deviceMode === 'mobile' || mergedConfig.layout?.layout === 'split' || mergedConfig.layout?.layout === 'full-width' ? '0' : '2rem',
          minHeight: '100%',
        }}
      >
        {/* Background Video */}
        {mergedConfig.background?.type === 'video' && mergedConfig.background?.videoUrl && (
            <video 
                autoPlay 
                muted 
                loop 
                className="absolute inset-0 w-full h-full object-cover z-0"
                style={{ filter: `blur(${mergedConfig.background?.blur || 0}px)`, opacity: mergedConfig.background?.opacity || 1 }}
            >
                <source src={mergedConfig.background.videoUrl} type="video/mp4" />
            </video>
        )}

        {/* Backdrop Blur */}
        {mergedConfig.layout?.backdropBlur && (
          <div className="absolute inset-0 backdrop-blur-sm z-1" />
        )}

        {/* Split Layout Image Side */}
        {mergedConfig.layout?.layout === 'split' && deviceMode !== 'mobile' && (
            <div className="w-1/2 h-full relative overflow-hidden hidden md:block">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url(${mergedConfig.background?.imageUrl || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000'})`,
                    }}
                />
                <div className="absolute inset-0 bg-blue-600/20 mix-blend-multiply" />
                <div className="absolute inset-0 flex flex-col justify-center p-12 text-white z-10">
                    <h2 className="text-4xl font-bold mb-4">{mergedConfig.branding?.appName || 'Boundary'}</h2>
                    <p className="text-xl opacity-90">{mergedConfig.branding?.tagline || 'Secure access for your enterprise.'}</p>
                </div>
            </div>
        )}

        <div 
          className={mergedConfig.layout?.layout === 'split' ? "w-full md:w-1/2 h-full flex items-center justify-center p-8 bg-white" : mergedConfig.layout?.layout === 'full-width' ? "w-full h-full flex items-center justify-center bg-white" : "relative h-full w-full"}
          style={mergedConfig.layout?.layout !== 'split' && mergedConfig.layout?.layout !== 'full-width' ? {
              display: 'flex',
              alignItems: 
                  mergedConfig.layout?.verticalPosition === 'top' || mergedConfig.layout?.cardFloat?.includes('top') ? 'flex-start' : 
                  mergedConfig.layout?.verticalPosition === 'bottom' || mergedConfig.layout?.cardFloat?.includes('bottom') ? 'flex-end' : 
                  'center',
              justifyContent: 
                  mergedConfig.layout?.horizontalPosition === 'left' || mergedConfig.layout?.cardFloat?.includes('left') ? 'flex-start' : 
                  mergedConfig.layout?.horizontalPosition === 'right' || mergedConfig.layout?.cardFloat?.includes('right') ? 'flex-end' : 
                  'center',
              padding: (mergedConfig.layout?.cardFloat && mergedConfig.layout.cardFloat !== 'none') ? '0' : '2rem'
          } : {}}
        >
            {/* Top Bar Extras */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
                {mergedConfig.form?.showLanguageSelector && (
                    <button className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors" title="Change Language">
                        <Globe className="h-5 w-5 text-gray-600" />
                    </button>
                )}
                {mergedConfig.form?.showThemeToggle && (
                    <button className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors" title="Toggle Theme">
                        <Sun className="h-5 w-5 text-gray-600" />
                    </button>
                )}
            </div>
            
            {/* Login Card */}
            <Card 
            className={(mergedConfig.layout?.layout === 'split' || mergedConfig.layout?.layout === 'full-width') ? "border-none shadow-none w-full max-w-[400px]" : "relative z-10"}
            style={{
                ...getLayoutStyle(),
                ...((mergedConfig.layout?.layout === 'split' || mergedConfig.layout?.layout === 'full-width') ? {
                    width: '100%',
                    maxWidth: mergedConfig.layout?.maxWidth || '400px',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: 0,
                    margin: 0
                } : {}),
                ...(mergedConfig.layout?.useCustomPosition && deviceMode !== 'mobile' && mergedConfig.layout?.layout !== 'split' && mergedConfig.layout?.layout !== 'full-width' ? {
                    position: 'absolute',
                    left: mergedConfig.layout?.positionX || '50%',
                    top: mergedConfig.layout?.positionY || '50%',
                    transform: mergedConfig.layout?.cardTransform || `translate(-${mergedConfig.layout?.positionX || '50%'}, -${mergedConfig.layout?.positionY || '50%'})`,
                    margin: 0
                } : {
                    transform: mergedConfig.layout?.cardTransform || 'none'
                }),
                zIndex: parseInt(mergedConfig.layout?.cardZIndex || '10')
            }}
            >
          <CardContent className="p-6">
            {/* Logo and Title */}
            {mergedConfig.branding?.showBranding !== false && (
              <div className={`text-center ${deviceMode === 'mobile' ? 'mb-6' : 'mb-8'}`}>
                {mergedConfig.branding?.logoUrl && (
                  <img 
                    src={mergedConfig.branding.logoUrl} 
                    alt="Logo" 
                    className={`mx-auto mb-4 object-contain ${deviceMode === 'mobile' ? 'w-12 h-12' : 'w-16 h-16'}`}
                    style={{ width: deviceMode === 'mobile' ? (mergedConfig.branding?.logoSize || '48px') : (mergedConfig.branding?.logoSize || '64px'), height: deviceMode === 'mobile' ? (mergedConfig.branding?.logoSize || '48px') : (mergedConfig.branding?.logoSize || '64px') }}
                  />
                )}
                <h1 className={`font-bold mb-2 ${deviceMode === 'mobile' ? 'text-xl' : 'text-2xl'}`} style={{ color: colors.textColor }}>
                  {mergedConfig.branding?.appName || 'Welcome Back'}
                </h1>
                <p className={`text-sm ${deviceMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: colors.secondaryColor }}>
                  {mergedConfig.branding?.tagline || 'Sign in to your account'}
                </p>
              </div>
            )}

            {/* Social Pre-Fill */}
            {mergedConfig.form?.showSocialPreFill && (
                 <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">JD</div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">{mergedConfig.form?.socialPreFillText || 'Continue as John Doe'}</p>
                        <p className="text-xs text-blue-700">john.doe@example.com</p>
                    </div>
                </div>
            )}

            <form 
              onSubmit={handleTestLogin} 
              className={`flex flex-col ${deviceMode === 'mobile' ? 'gap-3' : 'gap-4'}`}
            >
              
               {/* Username Field */}
               {mergedConfig.form?.showUsernameField && (
                <div>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    <input
                      type="text"
                      className={`w-full border rounded-lg focus:ring-2 focus:outline-none ${deviceMode === 'mobile' ? 'pl-9 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-3'}`}
                      style={{ 
                        borderColor: colors.secondaryColor,
                        color: colors.textColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }}
                      placeholder={mergedConfig.form?.usernamePlaceholder || 'Username'}
                    />
                  </div>
                </div>
               )}

               {/* Company Field */}
               {mergedConfig.form?.showCompanyField && (
                <div>
                  <div className="relative">
                    <Building2 className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    <input
                      type="text"
                      className={`w-full border rounded-lg focus:ring-2 focus:outline-none ${deviceMode === 'mobile' ? 'pl-9 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-3'}`}
                      style={{ 
                        borderColor: colors.secondaryColor,
                        color: colors.textColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }}
                      placeholder={mergedConfig.form?.companyPlaceholder || 'Company Name'}
                    />
                  </div>
                </div>
               )}

              {/* Email Field */}
              {mergedConfig.form?.showEmailField !== false && (
                  <div>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full border rounded-lg focus:ring-2 focus:outline-none ${deviceMode === 'mobile' ? 'pl-9 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-3'}`}
                        style={{ 
                          borderColor: colors.secondaryColor,
                          color: colors.textColor,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }}
                        placeholder={mergedConfig.form?.emailPlaceholder || 'Email address'}
                      />
                    </div>
                  </div>
              )}

              {/* Phone Field */}
               {mergedConfig.form?.showPhoneField && (
                <div>
                  <div className="relative">
                    <Smartphone className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    <input
                      type="tel"
                      className={`w-full border rounded-lg focus:ring-2 focus:outline-none ${deviceMode === 'mobile' ? 'pl-9 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-3'}`}
                      style={{ 
                        borderColor: colors.secondaryColor,
                        color: colors.textColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }}
                      placeholder={mergedConfig.form?.phonePlaceholder || 'Phone Number'}
                    />
                  </div>
                </div>
               )}

              {/* Password Field */}
              {mergedConfig.form?.showPasswordField !== false && (
                  <div>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full border rounded-lg focus:ring-2 focus:outline-none ${deviceMode === 'mobile' ? 'pl-9 pr-10 py-2 text-sm' : 'pl-10 pr-12 py-3'}`}
                        style={{ 
                          borderColor: colors.secondaryColor,
                          color: colors.textColor,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }}
                        placeholder={mergedConfig.form?.passwordPlaceholder || 'Password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${deviceMode === 'mobile' ? 'right-2' : 'right-3'}`}
                      >
                        {showPassword ? <EyeOff className={`${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} /> : <Eye className={`${deviceMode === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />}
                      </button>
                    </div>
                  </div>
              )}

              <div 
                className="flex flex-col gap-2"
                style={{ 
                    order: mergedConfig.layout?.secondaryButtonPosition === 'top' ? -5 : 0 
                }}
              >
                <div className="flex items-center justify-between">
                    {mergedConfig.form?.showRememberMe !== false && (
                    <label className="flex items-center cursor-pointer">
                        <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm" style={{ color: colors.textColor }}>
                        {mergedConfig.form?.rememberMeText || 'Remember me'}
                        </span>
                    </label>
                    )}
                    {mergedConfig.form?.showForgotPassword !== false && (
                    <a href="#" className="text-sm hover:underline" style={{ color: colors.primaryColor }}>
                        {mergedConfig.form?.forgotPasswordText || 'Forgot password?'}
                    </a>
                    )}
                </div>
                {mergedConfig.form?.showRememberDevice && (
                     <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-xs text-gray-500">
                             {mergedConfig.form?.rememberDeviceText || 'Trust this device'}
                        </span>
                     </label>
                )}
              </div>

              <div 
                className="flex"
                style={{
                  justifyContent: 
                    mergedConfig.layout?.buttonAlignment === 'left' ? 'flex-start' :
                    mergedConfig.layout?.buttonAlignment === 'right' ? 'flex-end' :
                    'center',
                  marginTop: 
                    mergedConfig.layout?.buttonSpacing === 'small' ? '0.25rem' :
                    mergedConfig.layout?.buttonSpacing === 'large' ? '1rem' :
                    mergedConfig.layout?.buttonSpacing === 'extra-large' ? '1.5rem' :
                    '0.5rem',
                  order: mergedConfig.layout?.primaryButtonPosition === 'top' ? -10 : 0
                }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`font-medium shadow-sm flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  style={{
                    ...getButtonStyle(),
                    width: mergedConfig.layout?.buttonAlignment === 'stretch' ? '100%' : getButtonStyle().width
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      {mergedConfig.form?.loadingText || 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {mergedConfig.form?.signInButtonText || 'Test Login'}
                      {mergedConfig.form?.showButtonIcons && <ArrowRight className="h-4 w-4" />}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Social Login & SSO */}
            {(mergedConfig.form?.showSocialLogin || mergedConfig.form?.showSSO) && (
              <div className="mt-6">
                {(mergedConfig.layout?.showButtonDivider !== false) && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: colors.secondaryColor }}></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white" style={{ color: colors.secondaryColor }}>
                        {mergedConfig.form?.socialLoginText || 'Or continue with'}
                      </span>
                    </div>
                  </div>
                )}

                <div 
                  className={`mt-4 ${
                    mergedConfig.layout?.buttonGroupLayout === 'horizontal' ? "flex flex-wrap" : 
                    mergedConfig.layout?.buttonGroupLayout === 'grid' ? "grid grid-cols-2" :
                    "flex flex-col"
                  }`}
                  style={{ 
                    gap: 
                      mergedConfig.layout?.buttonSpacing === 'none' ? '0' :
                      mergedConfig.layout?.buttonSpacing === 'small' ? '4px' :
                      mergedConfig.layout?.buttonSpacing === 'large' ? '16px' :
                      mergedConfig.layout?.buttonSpacing === 'extra-large' ? '24px' :
                      '8px' 
                  }}
                >
                    {/* Enterprise SSO Button */}
                    {mergedConfig.form?.showSSO && (
                      <button
                        className={`flex items-center justify-center border hover:bg-gray-50 transition-colors ${
                          mergedConfig.layout?.ssoButtonShape === 'square' ? 'rounded-none' :
                          mergedConfig.layout?.ssoButtonShape === 'rounded' ? 'rounded-2xl' :
                          mergedConfig.layout?.ssoButtonShape === 'circle' ? 'rounded-full' :
                          'rounded-lg'
                        }`}
                        style={{ 
                          borderColor: colors.secondaryColor,
                          width: mergedConfig.layout?.ssoIconOnly ? '44px' : (mergedConfig.layout?.buttonAlignment === 'stretch' ? '100%' : 'auto'),
                          height: mergedConfig.layout?.ssoIconOnly ? '44px' : 'auto',
                          padding: mergedConfig.layout?.ssoIconOnly ? '0' : '12px 16px'
                        }}
                      >
                        <div className={`w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold text-white ${mergedConfig.layout?.ssoIconOnly ? '' : 'mr-2'}`}>
                          SSO
                        </div>
                        {!mergedConfig.layout?.ssoIconOnly && (
                          <span className="text-sm font-medium" style={{ color: colors.textColor }}>
                            {formatButtonText(mergedConfig.form?.ssoButtonText || 'Continue with SSO', 'SSO')}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Social Providers */}
                    {mergedConfig.form?.showSocialLogin && (mergedConfig.form?.socialProviders || ['Google', 'Microsoft', 'Apple', 'GitHub', 'LinkedIn', 'Okta', 'SAML', 'OIDC']).map((provider: string) => {
                      const customLogo = mergedConfig.branding?.providerLogos?.[provider];
                      
                      return (
                        <button
                          key={provider}
                          className={`flex items-center justify-center border hover:bg-gray-50 transition-colors ${
                            mergedConfig.layout?.ssoButtonShape === 'square' ? 'rounded-none' :
                            mergedConfig.layout?.ssoButtonShape === 'rounded' ? 'rounded-2xl' :
                            mergedConfig.layout?.ssoButtonShape === 'circle' ? 'rounded-full' :
                            'rounded-lg'
                          }`}
                          style={{ 
                            borderColor: colors.secondaryColor,
                            width: mergedConfig.layout?.ssoIconOnly ? '44px' : (mergedConfig.layout?.buttonAlignment === 'stretch' ? '100%' : 'auto'),
                            height: mergedConfig.layout?.ssoIconOnly ? '44px' : 'auto',
                            padding: mergedConfig.layout?.ssoIconOnly ? '0' : '12px 16px'
                          }}
                          title={`Sign in with ${provider}`}
                        >
                        {customLogo ? (
                          <img 
                            src={customLogo} 
                            alt={provider} 
                            className={`w-5 h-5 object-contain ${mergedConfig.layout?.ssoIconOnly ? '' : 'mr-2'}`}
                            style={{ width: mergedConfig.branding?.ssoLogoSize || '20px', height: mergedConfig.branding?.ssoLogoSize || '20px' }}
                          />
                        ) : mergedConfig.branding?.ssoLogoUrl && provider.toLowerCase() === 'sso' ? (
                          <img 
                            src={mergedConfig.branding.ssoLogoUrl} 
                            alt="SSO"
                            className={`w-5 h-5 object-contain ${mergedConfig.layout?.ssoIconOnly ? '' : 'mr-2'}`}
                            style={{ width: mergedConfig.branding?.ssoLogoSize || '20px', height: mergedConfig.branding?.ssoLogoSize || '20px' }}
                          />
                        ) : (
                            <div className={`${mergedConfig.layout?.ssoIconOnly ? '' : 'mr-2'}`}>
                             {provider.toLowerCase() === 'google' && <Chrome className="w-5 h-5 text-red-500" />}
                             {provider.toLowerCase() === 'microsoft' && <div className="w-5 h-5 grid grid-cols-2 gap-0.5"><div className="bg-red-500"/><div className="bg-green-500"/><div className="bg-blue-500"/><div className="bg-yellow-500"/></div>}
                             {provider.toLowerCase() === 'github' && <Github className="w-5 h-5 text-gray-900" />}
                             {provider.toLowerCase() === 'apple' && <Smartphone className="w-5 h-5 text-black" />}
                             {!['google', 'microsoft', 'github', 'apple'].includes(provider.toLowerCase()) && (
                               <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-600">
                                 {provider.substring(0, 2).toUpperCase()}
                               </div>
                             )}
                            </div>
                        )}
                        {!mergedConfig.layout?.ssoIconOnly && (
                          <span className="text-sm font-medium" style={{ color: colors.textColor }}>
                            {formatButtonText(mergedConfig.form?.ssoButtonText || provider, provider)}
                          </span>
                        )}
                        </button>
                      );
                    })}
                   {mergedConfig.form?.showMoreSocialProviders && (
                       <button className="text-xs text-center w-full mt-2 text-gray-500 hover:text-gray-700 underline">
                           {mergedConfig.form?.moreSocialProvidersText || 'More providers'}
                       </button>
                   )}
                </div>
              </div>
            )}
            
            {/* Login Result Display */}
            {loginResult && (
              <div className={`mt-4 p-3 rounded-lg border ${
                loginResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    loginResult.success ? 'bg-green-200' : 'bg-red-200'
                  }`}>
                    {loginResult.success ? (
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 000 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{loginResult.message}</p>
                    {loginResult.success && loginResult.data?.token && (
                      <div className="mt-2">
                        <p className="text-xs opacity-75">Token: {loginResult.data.token.substring(0, 20)}...</p>
                        <button 
                          onClick={() => setLoginResult(null)}
                          className="text-xs underline hover:no-underline mt-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Linking Notice */}
            {mergedConfig.form?.showAccountLinking && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                    <p className="font-semibold mb-1">Link your account?</p>
                    <p>{mergedConfig.form?.accountLinkingText || 'We found an existing account with this email. Sign in to link it.'}</p>
                </div>
            )}

            
            {/* Terms & Privacy Links */}
            {(mergedConfig.form?.showTermsOfService || mergedConfig.form?.showPrivacyPolicy) && (
              <div className="mt-4 flex justify-center gap-4 text-[10px]" style={{ color: colors.secondaryColor }}>
                {mergedConfig.form?.showTermsOfService && (
                  <button className="hover:underline">{mergedConfig.form?.termsOfServiceText || 'Terms of Service'}</button>
                )}
                {mergedConfig.form?.showPrivacyPolicy && (
                  <button className="hover:underline">{mergedConfig.form?.privacyPolicyText || 'Privacy Policy'}</button>
                )}
              </div>
            )}

            {/* GDPR Compliance Marker */}
            {mergedConfig.form?.showGDPR && (
              <div className="mt-4 flex justify-center">
                <div className="px-2 py-0.5 border rounded-full text-[8px] font-bold uppercase tracking-wider" style={{ borderColor: colors.secondaryColor, color: colors.secondaryColor, opacity: 0.6 }}>
                  GDPR Compliant
                </div>
              </div>
            )}
            
            {/* Footer */}
            {mergedConfig.layout?.showFooter !== false && (
              <div className="text-center mt-6 text-xs" style={{ color: colors.secondaryColor }}>
                {mergedConfig.layout?.footerText || '2024 Your Company. All rights reserved.'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accessibility: Font Size Controls */}
        {mergedConfig.form?.showFontSizeControls && (
          <div className="absolute top-4 right-4 flex gap-1 z-50">
            <button className="w-6 h-6 bg-white/80 rounded border flex items-center justify-center text-xs font-bold hover:bg-white">-</button>
            <button className="w-6 h-6 bg-white/80 rounded border flex items-center justify-center text-xs font-bold hover:bg-white">+</button>
          </div>
        )}

        {/* Cookie Consent Banner */}
        {mergedConfig.form?.showCookieConsent && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/95 backdrop-blur shadow-lg rounded-lg border z-50 animate-in slide-in-from-bottom-4">
            <p className="text-[10px] leading-tight text-gray-600 mb-2">
              {mergedConfig.form?.cookieConsentText || 'This site uses cookies to provide a better user experience.'}
            </p>
            <div className="flex gap-2">
              <button className="flex-1 py-1 bg-black text-white text-[10px] rounded font-medium">Accept</button>
              <button className="flex-1 py-1 border text-[10px] rounded font-medium">Decline</button>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </DeviceFrame>
  )
}
