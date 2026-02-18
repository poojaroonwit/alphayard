import { ColorValue, ColorMode } from '../ui/ColorPickerPopover';
export type { ColorValue, ColorMode };

export interface ScreenGroup {
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

export interface ScreenConfig {
    id: string; 
    name: string;
    background: string | ColorValue;
    resizeMode: 'cover' | 'contain' | 'stretch' | 'center';
    type: 'screen' | 'modal';
    icon?: string;
    description?: string;
    groupId?: string; // Link to ScreenGroup
}

export interface FontConfig {
    family: string;
    size: number;
    weight: string;
    lineHeight?: number;
}

export interface TypographyConfig {
    h1: FontConfig;
    h2: FontConfig;
    body: FontConfig;
    caption: FontConfig;
}

export interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

export interface OnboardingConfig {
    enabled: boolean;
    slides: OnboardingSlide[];
    isSkippable: boolean;
}

export interface SocialLinksConfig {
    supportEmail: string;
    helpDeskUrl: string;
    whatsapp: string;
    instagram: string;
    facebook: string;
    line: string;
    twitter: string;
    linkedin: string;
    discord: string;
    appStoreId: string;
    playStoreId: string;
}

export interface FeatureTogglesConfig {
    enableChat: boolean;
    enableReferral: boolean;
    enableDarkMode: boolean;
    isMaintenanceMode: boolean;
    maintenanceMessage: string;
}

export interface NavItemConfig {
    id: string;
    label: string;
    icon: string;
    visible: boolean;
    isCustom?: boolean;
    actionType?: 'link' | 'screen' | 'function';
    actionValue?: string;
}

export interface NavigationConfig {
    tabBar: NavItemConfig[];
    drawer: NavItemConfig[];
}

export interface AnnouncementConfig {
    enabled: boolean;
    text: string;
    linkUrl: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isDismissible: boolean;
}

export interface AppUpdateConfig {
    minVersion: string;
    storeUrl: string;
    forceUpdate: boolean;
}

export interface LocalizationConfig {
    defaultLanguage: string;
    supportedLanguages: string[];
    enableRTL: boolean;
}

export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    cacheExpiry: number;
}

export interface SecurityConfig {
    sessionTimeout: number;
    disableScreenshots: boolean;
    mandatoryMFA: boolean;
}

export interface AnalyticsConfig {
    sentryDsn: string;
    mixpanelToken: string;
    googleAnalyticsId: string;
    enableDebugLogs: boolean;
}

export interface LegalConfig {
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    cookiePolicyUrl: string;
    dataDeletionUrl: string;
    dataRequestEmail: string;
}

export interface SeoConfig {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
    twitterHandle: string;
    appleAppId: string;
}

export interface NotificationConfig {
    primaryColor: ColorValue;
    defaultIcon: string;
}

export interface SplashConfig {
    backgroundColor: string | ColorValue;
    spinnerColor: string | ColorValue;
    spinnerType: 'circle' | 'dots' | 'pulse' | 'none';
    showAppName: boolean;
    showLogo: boolean;
    logoAnimation?: 'none' | 'pulse' | 'bounce' | 'rotate' | 'zoom';
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export interface UxConfig {
    animations: 'none' | 'slow' | 'standard' | 'spring'
    haptics: 'none' | 'light' | 'medium' | 'heavy'
    loadingStyle: 'spinner' | 'skeleton' | 'logo' | 'bar'
}

export interface GradientConfig {
    start: string
    end: string
    angle: number
    enabled: boolean
}

export interface DesignTokensConfig {
    primaryGradient: GradientConfig
    secondaryGradient: GradientConfig
    glassmorphism: {
        enabled: boolean
        blur: number
        opacity: number
    }
    borderRadius: 'sharp' | 'standard' | 'organic' | 'squircle'
}

export interface EngagementConfig {
    pushEnabled: boolean
    oneSignalAppId?: string
    firebaseConfig?: string
    defaultDeepLink?: string
    history?: {
        id: string
        title: string
        message: string
        date: string
        sentTo: number
        status: 'Sent' | 'Failed' | 'Scheduled'
    }[]
}

export interface SupportConfig {
    feedbackEnabled: boolean
    bugReportingEnabled: boolean
    featureRequestsEnabled: boolean
    supportEmail: string
    helpDeskUrl: string
}

export interface AuthFlowConfig {
    requireEmailVerification: boolean
    allowSocialLogin: boolean
    termsAcceptedOn: 'signup' | 'login' | 'both'
    passwordPolicy: 'standard' | 'strong' | 'custom'
}

export interface SurveyConfig {
    enabled: boolean
    trigger: 'on_startup' | 'after_onboarding' | 'after_first_action'
    slides: {
        id: string
        question: string
        options: string[]
        type: 'single_choice' | 'multiple_choice' | 'text'
    }[]
}

export interface UserTaggingConfig {
    enabled: boolean
    tagFormat: string
    sessionDurationDays: number
    triggerEvents: ('login' | 'app_open' | 'purchase')[]
}

export interface FlowsConfig {
  onboarding: OnboardingConfig;
  survey: SurveyConfig;
  login: AuthFlowConfig;
  signup: AuthFlowConfig;
}

export interface GlobalIdentityConfig {
    login: AuthFlowConfig;
    signup: AuthFlowConfig;
    tagging: UserTaggingConfig;
}

export interface BrandingConfig {
  appName: string
  logoUrl: string
  
  primaryColor?: ColorValue
  secondaryColor?: ColorValue

  // Dynamic Screens List
  screens: ScreenConfig[];
  screenGroups?: ScreenGroup[];

  // Typography
  typography: TypographyConfig;

  // Onboarding (Deprecated: Move to flows)
  onboarding: OnboardingConfig;

  // Behavioral Flows
  flows: FlowsConfig;

  // Social & Support
  social: SocialLinksConfig;

  // Feature Toggles
  features: FeatureTogglesConfig;

  // Navigation
  navigation: NavigationConfig;

  // Splash Screen
  splash: SplashConfig;

  // Notifications
  notifications: NotificationConfig;

  // Announcements
  announcements: AnnouncementConfig;

  // App Updates
  updates: AppUpdateConfig;

  // Localization
  localization: LocalizationConfig;

  // API Environment
  api: ApiConfig;

  // Security & Access
  security: SecurityConfig;

  // Analytics & Monitoring
  analytics: AnalyticsConfig;

  // Legal & Compliance
  legal: LegalConfig;

  // SEO & Metadata
  seo: SeoConfig;

  // Advanced Styling & UX
  ux: UxConfig;
  tokens: DesignTokensConfig;

  // Engagement & Support
  engagement: EngagementConfig;
  support: SupportConfig;


  primaryFont: string
  secondaryFont: string
}

export interface MobileComponentConfig {
    componentName: string;
    filePath: string;
    usageExample?: string;
}

export interface ComponentStyle {
  backgroundColor: ColorValue
  textColor: ColorValue
  borderRadius: number
  borderColor: ColorValue
  shadowLevel: 'none' | 'sm' | 'md' | 'lg' | 'custom'
  shadowColor?: ColorValue
  shadowBlur?: number
  shadowSpread?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  borderWidth?: number
  borderTopWidth?: number
  borderRightWidth?: number
  borderBottomWidth?: number
  borderLeftWidth?: number
  opacity?: number
  padding?: number
  blur?: number
  clickAnimation?: 'none' | 'scale' | 'opacity' | 'pulse'
  
  // Icon Configuration
  icon?: string
  iconColor?: ColorValue
  showIconBackground?: boolean
  iconBackgroundColor?: ColorValue
  iconBackgroundOpacity?: number
  iconPosition?: 'left' | 'right'

  // Input States
  focusBorderColor?: ColorValue
  validBorderColor?: ColorValue
  invalidBorderColor?: ColorValue
  disabledBorderColor?: ColorValue
  focusBackgroundColor?: ColorValue
  validBackgroundColor?: ColorValue
  invalidBackgroundColor?: ColorValue
  disabledBackgroundColor?: ColorValue
}

export type ComponentType = 'button' | 'input' | 'card' | 'badge' | 'accordion' | 'tabbar' | 'generic' | 'icon-upload'

export interface ComponentConfig {
  id: string
  name: string
  type: ComponentType
  styles: ComponentStyle
  mobileConfig?: MobileComponentConfig
  config?: Record<string, any>
}

export interface CategoryConfig {
  id: string
  name: string
  description?: string
  icon: string
  components: ComponentConfig[]
}
