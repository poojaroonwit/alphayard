'use client'

import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Eye, EyeOff, Mail, Lock, User, Smartphone, Globe, Moon, Sun, Building2, ArrowRight, Github, Chrome } from 'lucide-react'
import { LoginConfig, DeviceConfig } from './LoginConfigTypes'
import { DeviceFrame } from './DeviceFrame'

interface SignupEmulatorProps {
  config: Partial<LoginConfig>
  platformMode?: 'web-desktop' | 'web-mobile' | 'mobile-app'
  deviceMode?: 'desktop' | 'mobile' | 'tablet'
}

export function SignupEmulator({ config, platformMode = 'web-desktop', deviceMode = 'desktop' }: SignupEmulatorProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [fontSize, setFontSize] = React.useState('medium')
  const [showCookieConsent, setShowCookieConsent] = React.useState(true)
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [currentLanguage, setCurrentLanguage] = React.useState('en')
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

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
    signup: { ...config.signup, ...(deviceConfig as any).signup },
    background: { ...config.background, ...deviceConfig.background }
  }

  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-[14px]'
      case 'large': return 'text-[18px]'
      default: return 'text-[16px]'
    }
  }

  const getThemeClass = () => {
    return isDarkMode ? 'dark' : ''
  }

  const formatButtonText = (text: string, provider: string) => {
    if (!text) return provider;
    return text.replace(/{provider}/g, provider);
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
      case 'video':
        baseStyle = { backgroundColor: '#000' }
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
      default:
        baseStyle = { backgroundColor: '#ffffff' }
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
    return {
      primaryColor: mergedConfig.branding?.primaryColor || '#3b82f6',
      secondaryColor: mergedConfig.branding?.secondaryColor || '#64748b',
      accentColor: mergedConfig.branding?.accentColor || '#10b981',
      textColor: mergedConfig.branding?.textColor || '#1f2937',
      backgroundColor: mergedConfig.branding?.backgroundColor || '#ffffff'
    }
  }

  const colors = getBrandingColors()

  // Helper for button styles
  const getButtonStyle = () => {
    const form = mergedConfig.form || {}
    const base: React.CSSProperties = {
      width: form.buttonFullWidth ? '100%' : 'auto',
      transition: 'all 0.2s',
      backgroundColor: colors.primaryColor,
      color: '#ffffff'
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

    // Padding & Size
    switch(form.buttonSize) {
      case 'small': base.padding = '0.5rem 1rem'; base.fontSize = '0.875rem'; break;
      case 'large': base.padding = '1rem 2rem'; base.fontSize = '1.125rem'; break;
      case 'extra-large': base.padding = '1.25rem 2.5rem'; base.fontSize = '1.25rem'; break;
      default: base.padding = '0.75rem 1.5rem'; base.fontSize = '1rem';
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
        className={`h-full w-full relative overflow-hidden ${getThemeClass()} ${getFontSizeClass()}`}
        style={{
          ...getBackgroundStyle(),
          display: mergedConfig.signup?.layout === 'split' ? 'flex' : 'grid',
          placeItems: deviceMode === 'mobile' ? 'center stretch' : (
            mergedConfig.signup?.useCustomPosition ? 'start' : `${mergedConfig.signup?.verticalPosition === 'top' ? 'start' : mergedConfig.signup?.verticalPosition === 'bottom' ? 'end' : 'center'} ${mergedConfig.signup?.horizontalPosition === 'left' ? 'start' : mergedConfig.signup?.horizontalPosition === 'right' ? 'end' : 'center'}`
          ),
          padding: deviceMode === 'mobile' || mergedConfig.signup?.layout === 'split' || mergedConfig.signup?.layout === 'full-width' ? '0' : '2rem',
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
        {mergedConfig.signup?.backdropBlur && (
          <div className="absolute inset-0 backdrop-blur-sm z-[1]" />
        )}

        {/* Split Layout Image Side */}
        {mergedConfig.signup?.layout === 'split' && deviceMode !== 'mobile' && (
            <div className="w-1/2 h-full relative overflow-hidden hidden md:block">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url(${mergedConfig.background?.imageUrl || 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=1000'})`,
                    }}
                />
                <div className="absolute inset-0 bg-green-600/20 mix-blend-multiply" />
                <div className="absolute inset-0 flex flex-col justify-center p-12 text-white z-10">
                    <h2 className="text-4xl font-bold mb-4">{mergedConfig.branding?.appName || 'Boundary'}</h2>
                    <p className="text-xl opacity-90">{mergedConfig.branding?.tagline || 'Create your account to get started.'}</p>
                </div>
            </div>
        )}

        {/* Form Container */}
        <div 
          className={mergedConfig.signup?.layout === 'split' ? "w-full md:w-1/2 h-full flex items-center justify-center p-8 bg-white" : mergedConfig.signup?.layout === 'full-width' ? "w-full h-full flex items-center justify-center bg-white" : "relative h-full w-full"}
          style={mergedConfig.signup?.layout !== 'split' && mergedConfig.signup?.layout !== 'full-width' ? {
              display: 'flex',
              alignItems: 
                  mergedConfig.signup?.verticalPosition === 'top' || mergedConfig.signup?.cardFloat?.includes('top') ? 'flex-start' : 
                  mergedConfig.signup?.verticalPosition === 'bottom' || mergedConfig.signup?.cardFloat?.includes('bottom') ? 'flex-end' : 
                  'center',
              justifyContent: 
                  mergedConfig.signup?.horizontalPosition === 'left' || mergedConfig.signup?.cardFloat?.includes('left') ? 'flex-start' : 
                  mergedConfig.signup?.horizontalPosition === 'right' || mergedConfig.signup?.cardFloat?.includes('right') ? 'flex-end' : 
                  'center',
              padding: (mergedConfig.signup?.cardFloat && mergedConfig.signup.cardFloat !== 'none') ? '0' : '2rem'
          } : {}}
        >
            {/* Top Bar Extras */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
                {config.form?.showLanguageSelector && (
                    <button className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors" aria-label="Change language" title="Change Language">
                        <Globe className="h-5 w-5 text-gray-600" />
                    </button>
                )}
                {config.form?.showThemeToggle && (
                    <button 
                      className="p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors" 
                      title="Toggle Theme"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      aria-label="Toggle theme"
                    >
                      {isDarkMode ? <Moon className="h-5 w-5 text-gray-600" /> : <Sun className="h-5 w-5 text-gray-600" />}
                    </button>
                )}
            </div>
            
            {/* Signup Card */}
            <Card 
            className={(mergedConfig.signup?.layout === 'split' || mergedConfig.signup?.layout === 'full-width') ? "border-none shadow-none w-full max-w-[420px]" : "relative z-10"}
            style={{
                ...getLayoutStyle(),
                ...((mergedConfig.signup?.layout === 'split' || mergedConfig.signup?.layout === 'full-width') ? {
                    width: '100%',
                    maxWidth: mergedConfig.signup?.maxWidth || '420px',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: 0,
                    margin: 0
                } : {}),
                ...(mergedConfig.signup?.useCustomPosition && deviceMode !== 'mobile' && mergedConfig.signup?.layout !== 'split' && mergedConfig.signup?.layout !== 'full-width' ? {
                    position: 'absolute',
                    left: mergedConfig.signup?.positionX || '50%',
                    top: mergedConfig.signup?.positionY || '50%',
                    transform: `translate(-${mergedConfig.signup?.positionX?.includes('%') ? mergedConfig.signup.positionX : '0%'}, -${mergedConfig.signup?.positionY?.includes('%') ? mergedConfig.signup.positionY : '0%'}) ${mergedConfig.signup?.cardTransform || ''}`,
                    margin: 0
                } : {
                    transform: mergedConfig.signup?.cardTransform || 'none'
                }),
                zIndex: parseInt(mergedConfig.signup?.cardZIndex || '10')
            }}
            >
        <CardContent className="p-8">
          {/* Logo and Branding */}
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
                {mergedConfig.signup?.pageTitle || 'Create Account'}
              </h1>
              <p className={`text-sm ${deviceMode === 'mobile' ? 'text-xs' : ''}`} style={{ color: colors.secondaryColor }}>
                {mergedConfig.signup?.pageSubtitle || 'Join our community today'}
              </p>
            </div>
          )}

          {/* Social Pre-Fill */}
          {config.form?.showSocialPreFill && (
               <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">JD</div>
                  <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{config.form?.socialPreFillText || 'Continue as John Doe'}</p>
                      <p className="text-xs text-blue-700">john.doe@example.com</p>
                  </div>
              </div>
          )}

          {/* Signup Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); }}
            className={`flex flex-col ${deviceMode === 'mobile' ? 'gap-3' : 'gap-4'}`}
          >
            {/* Name Field */}
            {mergedConfig.form?.showUsernameField !== false && (
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.secondaryColor }} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={mergedConfig.form?.usernamePlaceholder || 'Full name'}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: colors.secondaryColor,
                        backgroundColor: colors.backgroundColor,
                        color: colors.textColor,
                        '--focus-ring-color': colors.primaryColor
                      } as React.CSSProperties}
                      aria-label="Full name"
                      title="Enter your full name"
                    />
                  </div>
                </div>
            )}

            {/* Email Field */}
            {mergedConfig.form?.showEmailField !== false && (
                <div>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.secondaryColor }} />
                    <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder={mergedConfig.form?.emailPlaceholder || 'Email address'}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.secondaryColor,
                      backgroundColor: colors.backgroundColor,
                      color: colors.textColor,
                      '--focus-ring-color': colors.primaryColor
                    } as React.CSSProperties}
                    aria-label="Email address"
                    title="Enter your email address"
                  />
                </div>
                </div>
            )}

            {/* Phone Field */}
            {mergedConfig.form?.showPhoneField && (
                <div>
                <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.secondaryColor }} />
                    <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder={mergedConfig.form?.phonePlaceholder || 'Phone Number'}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                        borderColor: colors.secondaryColor,
                        '--focus-ring-color': colors.primaryColor
                    } as React.CSSProperties}
                    />
                </div>
                </div>
            )}

            {/* Company Field */}
            {mergedConfig.form?.showCompanyField && (
                <div>
                <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.secondaryColor }} />
                    <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder={mergedConfig.form?.companyPlaceholder || 'Company Name'}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                        borderColor: colors.secondaryColor,
                        '--focus-ring-color': colors.primaryColor
                    } as React.CSSProperties}
                    />
                </div>
                </div>
            )}

            {/* Password Field */}
            {mergedConfig.form?.showPasswordField !== false && (
                <div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.secondaryColor }} />
                    <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={mergedConfig.form?.passwordPlaceholder || 'Password'}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                        borderColor: colors.secondaryColor,
                        '--focus-ring-color': colors.primaryColor
                    } as React.CSSProperties}
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                    style={{ color: colors.secondaryColor }}
                    title="Toggle password visibility"
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                </div>
            )}

            {/* Confirm Password Field */}
            {mergedConfig.form?.showPasswordField !== false && (
                <div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.secondaryColor }} />
                    <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder={mergedConfig.form?.passwordPlaceholder || 'Confirm password'}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                        borderColor: colors.secondaryColor,
                        '--focus-ring-color': colors.primaryColor
                    } as React.CSSProperties}
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3"
                    style={{ color: colors.secondaryColor }}
                    title="Toggle confirm password visibility"
                    >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                </div>
            )}

            {/* Terms Agreement */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="terms" className="text-sm" style={{ color: colors.textColor }}>
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            {/* Submit Button Container */}
            <div 
              className="flex"
              style={{
                justifyContent: 
                  mergedConfig.signup?.layout?.buttonAlignment === 'left' ? 'flex-start' :
                  mergedConfig.signup?.layout?.buttonAlignment === 'right' ? 'flex-end' :
                  'center',
                marginTop: 
                  mergedConfig.signup?.layout?.buttonSpacing === 'small' ? '0.25rem' :
                  mergedConfig.signup?.layout?.buttonSpacing === 'large' ? '1rem' :
                  mergedConfig.signup?.layout?.buttonSpacing === 'extra-large' ? '1.5rem' :
                  '0.5rem'
              }}
            >
              <button
                type="submit"
                className="flex items-center justify-center gap-2 font-medium shadow-sm"
                style={{
                  ...getButtonStyle(),
                  width: mergedConfig.signup?.layout?.buttonAlignment === 'stretch' ? '100%' : getButtonStyle().width,
                  order: mergedConfig.signup?.layout?.primaryButtonPosition === 'top' ? -10 : 0
                }}
                onMouseOver={(e) => {
                  if (mergedConfig.form?.buttonStyle !== 'outline' && mergedConfig.form?.buttonStyle !== 'ghost') {
                    e.currentTarget.style.backgroundColor = colors.accentColor
                  }
                }}
                onMouseOut={(e) => {
                  if (mergedConfig.form?.buttonStyle !== 'outline' && mergedConfig.form?.buttonStyle !== 'ghost') {
                    e.currentTarget.style.backgroundColor = colors.primaryColor
                  }
                }}
              >
                {mergedConfig.form?.signUpButtonText || 'Create Account'}
                {mergedConfig.form?.showButtonIcons && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          {mergedConfig.form?.signInLinkText && (
            <div className="text-center mt-4">
              <a href="#" className="text-sm hover:underline" style={{ color: colors.primaryColor }}>
                {mergedConfig.form?.signInLinkText}
              </a>
            </div>
          )}

          {/* Social Signup */}
          {mergedConfig.signup?.showSocialLogin && (
            <div className="mt-6">
              {(mergedConfig.signup?.layout?.showButtonDivider !== false) && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: colors.secondaryColor }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white" style={{ color: colors.textColor }} id="signup-social-text">
                      {mergedConfig.signup?.socialLoginText || 'Or sign up with'}
                    </span>
                  </div>
                </div>
              )}
              
              <div 
                className={`mt-6 ${
                  mergedConfig.signup?.layout?.buttonGroupLayout === 'horizontal' ? "flex flex-wrap" : 
                  mergedConfig.signup?.layout?.buttonGroupLayout === 'grid' ? "grid grid-cols-2" :
                  "flex flex-col"
                }`}
                style={{ 
                  gap: 
                    mergedConfig.signup?.layout?.buttonSpacing === 'none' ? '0' :
                    mergedConfig.signup?.layout?.buttonSpacing === 'small' ? '4px' :
                    mergedConfig.signup?.layout?.buttonSpacing === 'large' ? '16px' :
                    mergedConfig.signup?.layout?.buttonSpacing === 'extra-large' ? '24px' :
                    '12px' 
                }}
              >
                {/* Enterprise SSO Button (Signup) */}
                {mergedConfig.form?.showSSO && (
                  <button
                    className={`flex items-center justify-center border hover:bg-gray-50 transition-colors ${
                      mergedConfig.signup?.layout?.ssoButtonShape === 'square' ? 'rounded-none' :
                      mergedConfig.signup?.layout?.ssoButtonShape === 'rounded' ? 'rounded-2xl' :
                      mergedConfig.signup?.layout?.ssoButtonShape === 'circle' ? 'rounded-full' :
                      'rounded-lg'
                    }`}
                    style={{ 
                      borderColor: colors.secondaryColor,
                      width: mergedConfig.signup?.layout?.ssoIconOnly ? '44px' : (mergedConfig.signup?.layout?.buttonAlignment === 'stretch' ? '100%' : 'auto'),
                      height: mergedConfig.signup?.layout?.ssoIconOnly ? '44px' : 'auto',
                      padding: mergedConfig.signup?.layout?.ssoIconOnly ? '0' : '12px 16px'
                    }}
                  >
                    <div className={`w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold text-white ${mergedConfig.signup?.layout?.ssoIconOnly ? '' : 'mr-2'}`}>
                      SSO
                    </div>
                    {!mergedConfig.signup?.layout?.ssoIconOnly && (
                      <span className="text-sm font-medium" style={{ color: colors.textColor }}>
                        {formatButtonText(mergedConfig.form?.ssoButtonText || 'Continue with SSO', 'SSO')}
                      </span>
                    )}
                  </button>
                )}

                {mergedConfig.signup?.socialProviders?.map((provider: string) => {
                  const customLogo = mergedConfig.branding?.providerLogos?.[provider];
                  
                  return (
                    <button 
                      key={provider}
                      className={`flex items-center justify-center border hover:bg-gray-50 transition-colors ${
                        mergedConfig.signup?.layout?.ssoButtonShape === 'square' ? 'rounded-none' :
                        mergedConfig.signup?.layout?.ssoButtonShape === 'rounded' ? 'rounded-2xl' :
                        mergedConfig.signup?.layout?.ssoButtonShape === 'circle' ? 'rounded-full' :
                        'rounded-lg'
                      }`}
                      style={{ 
                        borderColor: colors.secondaryColor,
                        width: mergedConfig.signup?.layout?.ssoIconOnly ? '44px' : (mergedConfig.signup?.layout?.buttonAlignment === 'stretch' ? '100%' : 'auto'),
                        height: mergedConfig.signup?.layout?.ssoIconOnly ? '44px' : 'auto',
                        padding: mergedConfig.signup?.layout?.ssoIconOnly ? '0' : '12px 16px'
                      }}
                      title={`Sign up with ${provider}`}
                    >
                      {customLogo ? (
                        <img 
                          src={customLogo} 
                          alt={provider} 
                          className={`w-5 h-5 object-contain ${mergedConfig.signup?.layout?.ssoIconOnly ? '' : 'mr-2'}`}
                          style={{ width: '20px', height: '20px' }}
                        />
                      ) : (
                        <div className={`${mergedConfig.signup?.layout?.ssoIconOnly ? '' : 'mr-2'}`}>
                          {provider.toLowerCase() === 'google' && <Chrome className="w-5 h-5 text-red-500" />}
                          {provider.toLowerCase() === 'github' && <Github className="w-5 h-5 text-gray-900" />}
                          {provider.toLowerCase() === 'microsoft' && (
                            <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                              <div className="bg-red-500"/><div className="bg-green-500"/><div className="bg-blue-500"/><div className="bg-yellow-500"/>
                            </div>
                          )}
                          {provider.toLowerCase() === 'apple' && <Smartphone className="w-5 h-5 text-black" />}
                          {!['google', 'github', 'microsoft', 'apple'].includes(provider.toLowerCase()) && (
                             <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-600">
                               {provider.substring(0, 2).toUpperCase()}
                             </div>
                          )}
                        </div>
                      )}
                      {!mergedConfig.signup?.layout?.ssoIconOnly && (
                        <span className="text-sm font-medium" style={{ color: colors.textColor }}>
                          {formatButtonText(mergedConfig.signup?.ssoButtonText || provider, provider)}
                        </span>
                      )}
                    </button>
                  );
                })}

                {mergedConfig.signup?.showMoreSocialProviders && (
                  <button className="text-xs text-center w-full mt-2 text-gray-500 hover:text-gray-700 underline">
                    {mergedConfig.signup?.moreSocialProvidersText || 'More providers'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Account Linking Notice */}
          {config.form?.showAccountLinking && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                  <p className="font-semibold mb-1">Link your account?</p>
                  <p>{config.form?.accountLinkingText || 'We found an existing account with this email. Sign in to link it.'}</p>
              </div>
          )}


          {/* Terms & Privacy Links */}
          {(mergedConfig.signup?.showTermsCheckbox || mergedConfig.signup?.showPrivacyCheckbox) && (
            <div className="mt-4 flex justify-center gap-4 text-[10px]" style={{ color: colors.secondaryColor }}>
              {mergedConfig.signup?.showTermsCheckbox && (
                <button className="hover:underline">{mergedConfig.signup?.termsLinkText || 'Terms of Service'}</button>
              )}
              {mergedConfig.signup?.showPrivacyCheckbox && (
                <button className="hover:underline">{mergedConfig.signup?.privacyLinkText || 'Privacy Policy'}</button>
              )}
            </div>
          )}

          {/* GDPR Compliance Marker */}
          {mergedConfig.signup?.showGDPR && (
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

        {/* Accessibility: Font Size Controls */}
        {mergedConfig.signup?.showFontSizeControls && (
          <div className="absolute top-4 right-4 flex gap-1 z-50">
            <button 
              className="w-6 h-6 bg-white/80 rounded border flex items-center justify-center text-xs font-bold hover:bg-white"
              onClick={() => setFontSize('small')}
            >
              -
            </button>
            <button 
              className="w-6 h-6 bg-white/80 rounded border flex items-center justify-center text-xs font-bold hover:bg-white"
              onClick={() => setFontSize('large')}
            >
              +
            </button>
          </div>
        )}

        {/* Cookie Consent Banner */}
        {mergedConfig.signup?.showCookieConsent && showCookieConsent && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/95 backdrop-blur shadow-lg rounded-lg border z-50 animate-in slide-in-from-bottom-4">
            <p className="text-[10px] leading-tight text-gray-600 mb-2">
              {mergedConfig.signup?.cookieConsentText || 'This site uses cookies to provide a better user experience.'}
            </p>
            <div className="flex gap-2">
              <button 
                className="flex-1 py-1 bg-black text-white text-[10px] rounded font-medium"
                onClick={() => setShowCookieConsent(false)}
              >
                Accept
              </button>
              <button 
                className="flex-1 py-1 border text-[10px] rounded font-medium"
                onClick={() => setShowCookieConsent(false)}
              >
                Decline
              </button>
            </div>
          </div>
        )}
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
        </Card>
      </div>
    </div>
  </DeviceFrame>
  )
}
