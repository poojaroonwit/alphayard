// Login UI Configuration Types

export interface LoginBackground {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern'
  value?: string
  gradientStops?: Array<{
    color: string
    position: number
  }>
  gradientDirection?: string
  opacity?: number
  blur?: number
}

export interface LoginBranding {
  appName?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  tagline?: string
  description?: string
}

export interface LoginFormConfig {
  showEmailField?: boolean
  showPasswordField?: boolean
  showRememberMe?: boolean
  showForgotPassword?: boolean
  showSocialLogin?: boolean
  showSSO?: boolean
  emailPlaceholder?: string
  passwordPlaceholder?: string
  submitButtonText?: string
  rememberMeText?: string
  forgotPasswordText?: string
  socialLoginText?: string
  ssoButtonText?: string
}

export interface SocialLoginConfig {
  providers: Array<{
    name: string
    displayName: string
    clientId?: string
    enabled: boolean
    icon?: string
    color?: string
    buttonText?: string
  }>
  layout: 'horizontal' | 'vertical' | 'grid'
  showDivider?: boolean
  dividerText?: string
}

export interface SSOConfig {
  enabled: boolean
  providers: Array<{
    name: string
    displayName: string
    enabled: boolean
    icon?: string
    color?: string
    buttonText?: string
    redirectUrl?: string
  }>
  layout: 'horizontal' | 'vertical' | 'grid'
  showDivider?: boolean
  dividerText?: string
  autoRedirect?: boolean
  defaultProvider?: string
}

export interface LoginLayoutConfig {
  layout: 'centered' | 'split' | 'full-width' | 'card'
  maxWidth?: string
  padding?: string
  borderRadius?: string
  shadow?: string
  backdropBlur?: boolean
  showBranding?: boolean
  showFooter?: boolean
  footerText?: string
  footerLinks?: Array<{
    text: string
    url: string
    target?: '_blank' | '_self'
  }>
}

export interface LoginSecurityConfig {
  showSecurityBadge?: boolean
  securityText?: string
  showPasswordStrength?: boolean
  requireTwoFactor?: boolean
  sessionTimeout?: number
  maxLoginAttempts?: number
  lockoutDuration?: number
  showCaptcha?: boolean
  captchaProvider?: 'recaptcha' | 'hcaptcha' | 'turnstile'
}

export interface LoginAnalyticsConfig {
  trackLoginAttempts?: boolean
  trackProviderUsage?: boolean
  trackFormInteractions?: boolean
  analyticsProvider?: 'google' | 'mixpanel' | 'custom'
  trackingId?: string
}

export interface LoginUIConfig {
  // Core branding and appearance
  branding: LoginBranding
  background: LoginBackground
  layout: LoginLayoutConfig
  
  // Form configuration
  form: LoginFormConfig
  
  // Authentication methods
  socialLogin?: SocialLoginConfig
  sso?: SSOConfig
  
  // Security and analytics
  security: LoginSecurityConfig
  analytics: LoginAnalyticsConfig
  
  // Customization
  customCSS?: string
  customJS?: string
  theme?: 'light' | 'dark' | 'auto'
  animations?: boolean
  
  // Localization
  locale?: string
  translations?: Record<string, string>
}

export interface AppLoginConfig {
  appId: string
  config: LoginUIConfig
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Default configuration
export const DEFAULT_LOGIN_CONFIG: Partial<LoginUIConfig> = {
  branding: {
    appName: 'Application',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b'
  },
  background: {
    type: 'gradient',
    gradientStops: [
      { color: '#3b82f6', position: 0 },
      { color: '#8b5cf6', position: 100 }
    ],
    gradientDirection: 'to right',
    opacity: 1
  },
  layout: {
    layout: 'centered',
    maxWidth: '400px',
    padding: '2rem',
    borderRadius: '1rem',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    backdropBlur: true,
    showBranding: true,
    showFooter: true,
    footerText: '© 2024 Your Company. All rights reserved.'
  },
  form: {
    showEmailField: true,
    showPasswordField: true,
    showRememberMe: true,
    showForgotPassword: true,
    showSocialLogin: true,
    showSSO: true,
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    submitButtonText: 'Sign In',
    rememberMeText: 'Remember me',
    forgotPasswordText: 'Forgot password?',
    socialLoginText: 'Or continue with',
    ssoButtonText: 'Sign in with {provider}'
  },
  security: {
    showSecurityBadge: true,
    securityText: 'Secured with industry-standard encryption',
    showPasswordStrength: false,
    requireTwoFactor: false,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    showCaptcha: false
  },
  analytics: {
    trackLoginAttempts: true,
    trackProviderUsage: true,
    trackFormInteractions: false,
    analyticsProvider: 'google'
  },
  theme: 'auto',
  animations: true,
  locale: 'en'
}
