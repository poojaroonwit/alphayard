export interface LoginConfigManagerProps {
  appId?: string
  onSave?: (config: Partial<LoginConfig>) => void
}

// Device-specific configuration interfaces
export interface DeviceConfig {
  branding: {
    logoSize: string
    fontSize: string
    showBranding: boolean
    ssoLogoSize: string
    appName?: string
    logoUrl?: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    textColor?: string
    backgroundColor?: string
    tagline?: string
    description?: string
    ssoLogoUrl?: string
    ssoProviders?: string[]
    providerLogos?: Record<string, string>
  }
  layout: {
    maxWidth: string
    padding: string
    borderRadius: string
    horizontalPosition: string
    verticalPosition: string
    positionX: string
    positionY: string
    useCustomPosition: boolean
    buttonAlignment: string
    buttonGroupLayout: string
    buttonSpacing: string
    cardFloat: string
    cardZIndex: string
    cardTransform: string
    stickyPosition: boolean
    ssoIconOnly?: boolean
    ssoButtonShape?: 'default' | 'square' | 'rounded' | 'circle'
  }
  form: {
    showSocialLogin: boolean
    showSSO: boolean
    showRememberMe: boolean
    showForgotPassword: boolean
    showEmailField?: boolean
    showUsernameField?: boolean
    showPhoneField?: boolean
    showCompanyField?: boolean
    showPasswordField?: boolean
    showRememberDevice?: boolean
    showLanguageSelector?: boolean
    showThemeToggle?: boolean
    showButtonIcons?: boolean
    showMoreSocialProviders?: boolean
    showSocialPreFill?: boolean
    showAccountLinking?: boolean
    buttonStyle: string
    buttonSize: string
    buttonFullWidth: boolean
    buttonBorderRadius?: string
    buttonPadding?: string
    buttonAnimation?: string
    emailPlaceholder: string
    passwordPlaceholder: string
    usernamePlaceholder: string
    phonePlaceholder?: string
    companyPlaceholder?: string
    signInButtonText: string
    signUpButtonText: string
    submitButtonText?: string
    rememberMeText: string
    rememberDeviceText?: string
    forgotPasswordText: string
    signUpLinkText: string
    signInLinkText: string
    socialLoginText: string
    ssoButtonText: string
    moreSocialProvidersText?: string
    socialPreFillText?: string
    accountLinkingText?: string
    loadingText?: string
    errorMessage?: string
    successMessage?: string
    validationMessage?: string
    progressText?: string
    ssoLayout?: 'vertical' | 'horizontal'
  }
  background: {
    type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern'
    value: string
    opacity: number
    blur: number
    gradientStops: Array<{
      color: string
      position: number
    }>
    gradientDirection: string
    patternType: string
    patternColor: string
    patternSize: string
    videoUrl: string
    imageUrl: string
  }
  responsive: {
    enableResponsiveConfig: boolean
    breakpointMobile: string
    breakpointTablet: string
    breakpointDesktop: string
  }
}

export interface LoginConfig {
  branding: {
    appName: string
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    textColor: string
    backgroundColor: string
    fontFamily: string
    fontSize: string
    fontWeight: string
    logoSize: string
    faviconUrl: string
    metaDescription: string
    metaKeywords: string
    customCSS: string
    customJS: string
    showBranding: boolean
    tagline: string
    description: string
    ssoLogoUrl: string
    ssoLogoSize: string
    ssoProviders: string[]
    providerLogos: Record<string, string>
  }
  background: {
    type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern'
    value: string
    opacity: number
    blur: number
    gradientStops: Array<{
      color: string
      position: number
    }>
    gradientDirection: string
    patternType: string
    patternColor: string
    patternSize: string
    videoUrl: string
    imageUrl: string
  }
  layout: {
    layout: string
    maxWidth: string
    padding: string
    borderRadius: string
    shadow: string
    backdropBlur: boolean
    showBranding: boolean
    showFooter: boolean
    footerText: string
    paddingTop: string
    paddingRight: string
    paddingBottom: string
    paddingLeft: string
    marginTop: string
    marginRight: string
    marginBottom: string
    marginLeft: string
    borderTopLeftRadius: string
    borderTopRightRadius: string
    borderBottomRightRadius: string
    borderBottomLeftRadius: string
    horizontalPosition: string
    verticalPosition: string
    positionX: string
    positionY: string
    useCustomPosition: boolean
    buttonAlignment: string
    buttonGroupLayout: string
    buttonSpacing: string
    primaryButtonPosition: string
    secondaryButtonPosition: string
    showButtonDivider: boolean
    cardFloat: string
    cardZIndex: string
    cardTransform: string
    stickyPosition: boolean
    responsivePositioning: boolean
    ssoIconOnly: boolean
    ssoButtonShape: 'default' | 'square' | 'rounded' | 'circle'
  }
  form: {
    showEmailField: boolean
    showUsernameField: boolean
    showPhoneField: boolean
    showCompanyField: boolean
    showPasswordField: boolean
    showRememberMe: boolean
    showRememberDevice: boolean
    showForgotPassword: boolean
    showSocialLogin: boolean
    showSSO: boolean
    showLanguageSelector: boolean
    showThemeToggle: boolean
    showLoading: boolean
    showErrors: boolean
    showSuccessMessage: boolean
    showValidation: boolean
    showProgress: boolean
    showCookieConsent: boolean
    showPrivacyPolicy: boolean
    showTermsOfService: boolean
    showGDPR: boolean
    showCompliance: boolean
    showAccountLockoutWarning: boolean
    showSessionTimeout: boolean
    showSecurityQuestions: boolean
    showBiometric: boolean
    showKeyboardNavigation: boolean
    showScreenReaderSupport: boolean
    showHighContrast: boolean
    showFontSizeControls: boolean
    showMultiTenant: boolean
    showRoleSelection: boolean
    showWorkspaceSelection: boolean
    showMoreSocialProviders: boolean
    showSocialPreFill: boolean
    showAccountLinking: boolean
    emailPlaceholder: string
    usernamePlaceholder: string
    phonePlaceholder: string
    companyPlaceholder: string
    passwordPlaceholder: string
    submitButtonText: string
    signInButtonText: string
    signUpButtonText: string
    rememberMeText: string
    rememberDeviceText: string
    forgotPasswordText: string
    signUpLinkText: string
    signInLinkText: string
    buttonStyle: string
    buttonSize: string
    buttonBorderRadius: string
    buttonPadding: string
    showButtonIcons: boolean
    buttonAnimation: string
    buttonFullWidth: boolean
    socialLoginText: string
    ssoButtonText: string
    loadingText: string
    errorMessage: string
    successMessage: string
    validationMessage: string
    progressText: string
    cookieConsentText: string
    privacyPolicyText: string
    termsOfServiceText: string
    gdprText: string
    complianceText: string
    accountLockoutText: string
    sessionTimeoutText: string
    securityQuestionsText: string
    biometricText: string
    keyboardNavigationText: string
    screenReaderText: string
    highContrastText: string
    fontSizeText: string
    multiTenantText: string
    roleSelectionText: string
    workspaceSelectionText: string
    moreSocialProvidersText: string
    socialPreFillText: string
    accountLinkingText: string
    sessionDuration: string
    maxLoginAttempts: string
    supportedLanguages: string[]
    supportedThemes: string[]
    socialProviders: string[]
    oauthProviders: string[]
    ssoProviders: string[] // This is used for the "SSO" generic button list if different from social
    fontSizes: string[]
    ssoLayout: 'vertical' | 'horizontal'
  }
  security: {
    enableTwoFactor: boolean
    enableCaptcha: boolean
    enableRateLimit: boolean
    enableSessionManagement: boolean
    enablePasswordStrength: boolean
    enableAccountLockout: boolean
    enableAuditLog: boolean
    enableEncryption: boolean
    enableSecureCookies: boolean
    enableCSRFProtection: boolean
    enableXSSProtection: boolean
    enableSQLInjectionProtection: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    passwordRequireUppercase: boolean
    passwordRequireLowercase: boolean
    passwordRequireNumbers: boolean
    passwordRequireSpecialChars: boolean
    twoFactorMethods: string[]
    captchaProvider: string
    encryptionAlgorithm: string
    securityHeaders: Record<string, string>
  }
  animations: {
    showPageTransitions: boolean
    showFormAnimations: boolean
    showButtonAnimations: boolean
    showInputAnimations: boolean
    showLoadingAnimations: boolean
    showErrorAnimations: boolean
    showSuccessAnimations: boolean
    showHoverAnimations: boolean
    showFocusAnimations: boolean
    pageTransitionType: string
    formAnimationType: string
    buttonAnimationType: string
    inputAnimationType: string
    loadingAnimationType: string
    errorAnimationType: string
    successAnimationType: string
    hoverAnimationType: string
    focusAnimationType: string
    animationDuration: number
    animationEasing: string
    animationDelay: number
    microInteractionType: "none" | "bounce" | "shake" | "rotate" | "pulse"
  }
  advanced: {
    enableDebugMode: boolean
    enableAnalytics: boolean
    enableLogging: boolean
    enableCache: boolean
    enableCDN: boolean
    enableLazyLoading: boolean
    enableServiceWorker: boolean
    enableWebWorkers: boolean
    enableWebSockets: boolean
    enableServerSideRendering: boolean
    enableStaticGeneration: boolean
    enableIncrementalStaticRegeneration: boolean
    enableEdgeFunctions: boolean
    enableDatabaseOptimization: boolean
    enableAPICaching: boolean
    enableImageOptimization: boolean
    enableFontOptimization: boolean
    enableCSSOptimization: boolean
    enableJSOptimization: boolean
    enableHTMLOptimization: boolean
    enableSEO: boolean
    enableAccessibility: boolean
    enablePerformance: boolean
    enableSecurity: boolean
    enableTesting: boolean
    enableMonitoring: boolean
    enableAlerting: boolean
    enableBackup: boolean
    enableRecovery: boolean
    enableMigration: boolean
    enableVersioning: boolean
    enableDocumentation: boolean
    customCSS: string
    customJS: string
    customHTML: string
    environmentVariables: Record<string, string>
    apiKeys: Record<string, string>
    webhooks: Array<{
      name: string
      url: string
      method: string
      headers: Record<string, string>
      body: string
      enabled: boolean
    }>
    integrations: Array<{
      name: string
      type: string
      config: Record<string, any>
      enabled: boolean
    }>
  }
  // Device-specific configurations
  desktop: DeviceConfig
  mobile: DeviceConfig
  tablet: DeviceConfig
  mobileApp: DeviceConfig
  responsive: {
    enableResponsiveConfig: boolean
    breakpointMobile: string
    breakpointTablet: string
    breakpointDesktop: string
  }
  // Signup-specific configurations
  signup: {
    // Form Fields
    showNameField: boolean
    showEmailField: boolean
    showPhoneField: boolean
    showCompanyField: boolean
    showPasswordField: boolean
    showConfirmPasswordField: boolean
    showTermsCheckbox: boolean
    showPrivacyCheckbox: boolean
    
    // Field Labels & Placeholders
    namePlaceholder: string
    emailPlaceholder: string
    phonePlaceholder: string
    companyPlaceholder: string
    passwordPlaceholder: string
    confirmPasswordPlaceholder: string
    
    // Button Configuration
    submitButtonText: string
    signInLinkText: string
    termsLinkText: string
    privacyLinkText: string
    buttonStyle: string
    buttonSize: string
    buttonFullWidth: boolean
    
    // Social Login
    showSocialLogin: boolean
    socialLoginText: string
    socialProviders: string[]
    
    // Validation
    enableValidation: boolean
    passwordMinLength: number
    passwordRequireUppercase: boolean
    passwordRequireLowercase: boolean
    passwordRequireNumbers: boolean
    passwordRequireSpecialChars: boolean
    validateEmailDomain: boolean
    validatePhoneFormat: boolean
    
    // Branding
    showBranding: boolean
    pageTitle: string
    pageSubtitle: string
    pageDescription: string
    logoUrl: string
    logoSize: string
    logoPosition: string
    
    // Welcome Message
    showWelcomeMessage: boolean
    welcomeTitle: string
    welcomeMessage: string
    nextSteps: string
    
    // Success Page
    redirectAfterSignup: boolean
    redirectUrl: string
    autoLogin: boolean
    showSuccessAnimation: boolean
    
    // Layout
    cardWidth: string
    cardPadding: string
    borderRadius: string
    cardShadow: string
    cardBackground: string
    cardBorder: string
    formLayoutStyle: string
    fieldSpacing: string
    fieldWidth: string
    labelPosition: string
    showFieldIcons: boolean
    showFieldDescriptions: boolean
    buttonPosition: string
    buttonAlignment: string
    buttonGroupLayout: string
    buttonSpacing: string
    showButtonDivider: boolean
    cardFloat: boolean
    cardZIndex: string
    cardTransform: string
    backdropBlur: boolean
    stickyPosition: boolean
    ssoLayout: 'vertical' | 'horizontal'
    ssoIconOnly: boolean
    ssoButtonShape: 'default' | 'square' | 'rounded' | 'circle'
  }
}

export interface TabConfig {
  id: string
  label: string
  icon: React.ComponentType<any>
}
