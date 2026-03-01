'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { useApp } from '../../contexts/AppContext'
import { toast } from '@/hooks/use-toast'
import { ThemeExporter } from '../appearance/ThemeExporter'
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

import { BrandingConfig, CategoryConfig, ComponentStyle, ColorValue } from '../appearance/types'
import { BrandingSettings } from '../appearance/BrandingSettings'
import { IdentitySettings } from '../appearance/IdentitySettings'
import { SplashScreenSettings } from '../appearance/SplashScreenSettings'
import { QuickSettings } from '../appearance/QuickSettings'
import { WallpaperSettings } from '../appearance/WallpaperSettings'
import { adminService } from '../../services/adminService'
import { ComponentStyleSettings } from '../appearance/ComponentStyleSettings'
import { TypographySettings } from '../appearance/TypographySettings'
import { OnboardingSettings } from '../appearance/OnboardingSettings'
import { SocialSettings } from '../appearance/SocialSettings'
import { FeatureToggles } from '../appearance/FeatureToggles'
import { NotificationSettings } from '../appearance/NotificationSettings'
import { VisualTokenSettings } from '../appearance/VisualTokenSettings'
import { UxSettings } from '../appearance/UxSettings'
// import { MobileComponentsDemo } from '../ui/MobileComponentsDemo'
import { AnnouncementSettings } from '../appearance/AnnouncementSettings'
import { AppUpdateSettings } from '../appearance/AppUpdateSettings'
import { LocalizationSettings } from '../appearance/LocalizationSettings'
import { SeoSettings } from '../appearance/SeoSettings'
import { ApiSettings } from '../appearance/ApiSettings'
import { AnalyticsSettings } from '../appearance/AnalyticsSettings'
import { SupportSettings } from '../appearance/SupportSettings'
import { EngagementSettings } from '../appearance/EngagementSettings'
import { CoreIdentityTab } from '../appearance/CoreIdentityTab'
import { IconCategoryPanel } from '../appearance/IconCategoryPanel'

import { PaymentMethodsTab } from '../settings/PaymentMethodsTab'
import { TeamTab } from '../settings/TeamTab'
import { TermsPolicyTab } from '../settings/TermsPolicyTab'

import { AppearanceHeader } from './appearance-manager/AppearanceHeader'
import { AppearanceSidebar } from './appearance-manager/AppearanceSidebar'
import { DEFAULT_CATEGORIES, getSidebarSections, solidColor } from './appearance-manager/appearance.config'

export function AppearanceManager() {
  const { currentApp, refreshApplications } = useApp()
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string>('branding')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [activeScreenTab, setActiveScreenTab] = useState<string>('welcome')

  useEffect(() => {
    if (currentApp) {
      // Parse branding if it's a string (can happen if stored as JSON string)
      let sourceBranding = currentApp.branding || currentApp.settings?.branding
      if (sourceBranding) {
        // If branding is a string, parse it
        if (typeof sourceBranding === 'string') {
          try {
            sourceBranding = JSON.parse(sourceBranding)
            console.log('[AppearanceManager] Parsed branding from string:', { screens: sourceBranding.screens?.length })
          } catch (e) {
            console.error('[AppearanceManager] Failed to parse branding string:', e)
            sourceBranding = null
          }
        }
        
        // Log loaded branding for debugging
        console.log('[AppearanceManager] Loading branding:', {
          hasBranding: !!sourceBranding,
          screensCount: sourceBranding?.screens?.length || 0,
          screens: sourceBranding?.screens?.map((s: any) => ({
            id: s.id,
            name: s.name,
            hasBackground: !!s.background,
            backgroundType: typeof s.background === 'string' ? 'string' : s.background?.mode || 'none'
          }))
        })
        }
        
      if (sourceBranding) {
        // Ensure critical sub-objects exist
        const defaultScreens = [
            { id: 'marketing', name: 'Marketing', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'getstart', name: 'Get Started', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'welcome', name: 'Welcome', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'login', name: 'Login / Sign Up', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'signup', name: 'Signup Flow', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'twofactor-method', name: '2FA Method', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'twofactor-verify', name: '2FA Verify', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'personal', name: 'Personal (You)', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'home', name: 'Home (Legacy)', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'circle', name: 'Circle', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'social', name: 'Social', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'apps', name: 'Workspace (Apps)', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'settings', name: 'Settings', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'profile', name: 'Profile', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'chat', name: 'Chat List', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'pin-setup', name: 'Pin Setup', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'pin-unlock', name: 'Pin Unlock', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'search-drawer', name: 'Search Drawer', background: '', resizeMode: 'cover', type: 'screen' }
        ];

        // Merge existing screens with defaults (PRESERVE Custom Screens + Remove Case-Insensitive Duplicates)
        let mergedScreens: any[] = [];
        
        if (sourceBranding.screens && Array.isArray(sourceBranding.screens)) {
            // Use a Map to track unique IDs (normalized to lowercase)
            const screenMap = new Map();

            // 1. Process database screens first (Source of Truth)
            sourceBranding.screens.forEach((s: any) => {
                if (s && s.id) {
                    screenMap.set(s.id.toLowerCase(), s);
                }
            });

            // 2. Process default screens (Backfill missing)
            defaultScreens.forEach(def => {
                const lowerId = def.id.toLowerCase();
                if (!screenMap.has(lowerId)) {
                    // Start fresh if missing
                    screenMap.set(lowerId, def);
                } else {
                    // Merge defaults into existing if needed (PRESERVE existing background/images)
                    const existing = screenMap.get(lowerId);
                    // Deep merge to preserve nested objects like background
                    const merged = {
                        ...def,
                        ...existing,
                        // Preserve background structure (important for images)
                        background: existing.background || def.background,
                        // Preserve other important fields
                        resizeMode: existing.resizeMode || def.resizeMode,
                        name: existing.name || def.name
                    };
                    screenMap.set(lowerId, merged);
                }
            });

            mergedScreens = Array.from(screenMap.values());
        } else {
            mergedScreens = [...defaultScreens];
        }

        const safeBranding = {
            ...sourceBranding,
            screens: mergedScreens,
            social: sourceBranding.social || { 
                supportEmail: '', helpDeskUrl: '', githubRepo: '', gitlabRepo: '', docsUrl: '', whatsapp: '', instagram: '', facebook: '',
                line: '', twitter: '', linkedin: '', discord: '', appStoreId: '', playStoreId: '' 
            },
            features: sourceBranding.features || { 
                enableChat: true, enableReferral: false, enableDarkMode: false, 
                isMaintenanceMode: false, maintenanceMessage: 'System is under maintenance.' 
            },
            ux: sourceBranding.ux || { animations: 'standard', haptics: 'light', loadingStyle: 'spinner' },
            engagement: sourceBranding.engagement || { pushEnabled: true, oneSignalAppId: '', firebaseConfig: '', defaultDeepLink: '' },
            support: sourceBranding.support || { feedbackEnabled: true, bugReportingEnabled: true, featureRequestsEnabled: true, supportEmail: '', helpDeskUrl: '' },
            announcements: sourceBranding.announcements || { enabled: false, text: '', linkUrl: '', type: 'info', isDismissible: true },
            updates: sourceBranding.updates || { minVersion: '1.0.0', storeUrl: '', forceUpdate: false },
            api: sourceBranding.api || { baseUrl: '', timeout: 30000, cacheExpiry: 3600 },
            analytics: sourceBranding.analytics || { sentryDsn: '', mixpanelToken: '', googleAnalyticsId: '', enableDebugLogs: false },
            security: sourceBranding.security || { sessionTimeout: 3600, disableScreenshots: true, mandatoryMFA: false },
            legal: sourceBranding.legal || { privacyPolicyUrl: '', termsOfServiceUrl: '', cookiePolicyUrl: '', dataDeletionUrl: '', dataRequestEmail: '' },
            seo: sourceBranding.seo || { title: currentApp.name, description: '', keywords: [], ogImage: '', twitterHandle: '', appleAppId: '' },
            localization: sourceBranding.localization || { defaultLanguage: 'en', supportedLanguages: ['en'], enableRTL: false },
            onboarding: sourceBranding.onboarding || { enabled: true, slides: [], isSkippable: true },
        }
        setBranding(safeBranding)
        
        // Build categories from database if available
        const dynamicCategories = [...DEFAULT_CATEGORIES];
        
        // Load UI components from database (branding.uiComponents)
        if (sourceBranding.uiComponents && Object.keys(sourceBranding.uiComponents).length > 0) {
            for (const [categoryId, categoryData] of Object.entries(sourceBranding.uiComponents) as any) {
                const catIndex = dynamicCategories.findIndex(c => c.id === categoryId);
                
                // Convert components object to array format
                const componentsArray = categoryData.components 
                    ? Object.values(categoryData.components).map((comp: any) => {
                        // Find default component to merge config
                        const defaultComp = dynamicCategories[catIndex]?.components?.find(c => c.id === comp.id);
                        return {
                            id: comp.id,
                            name: comp.name,
                            type: comp.type,
                            styles: comp.styles,
                            mobileConfig: comp.mobileConfig || defaultComp?.mobileConfig,
                            config: { ...(defaultComp?.config || {}), ...(comp.config || {}) }
                        };
                    })
                    : [];

                if (catIndex >= 0) {
                    // Identify default components that are missing from the database record
                    const defaultComponents = dynamicCategories[catIndex].components || [];
                    const missingDefaults = defaultComponents.filter(def => !componentsArray.find(c => c.id === def.id));
                    
                    // Merge database components with missing defaults
                    const mergedComponents = componentsArray.length > 0 
                        ? [...componentsArray, ...missingDefaults] 
                        : defaultComponents;

                    // Update existing category with database components + missing defaults
                    dynamicCategories[catIndex] = {
                        ...dynamicCategories[catIndex],
                        name: categoryData.name || dynamicCategories[catIndex].name,
                        description: categoryData.description || dynamicCategories[catIndex].description,
                        components: mergedComponents
                    };
                } else {
                    // Add new category from database
                    dynamicCategories.push({
                        id: categoryId,
                        name: categoryData.name,
                        description: categoryData.description,
                        icon: categoryData.icon,
                        components: componentsArray
                    });
                }
            }
        }
        
        // Load icon categories from database (branding.icons)
        if (sourceBranding.icons) {
            // Build social icons category from database
            if (sourceBranding.icons.social && Object.keys(sourceBranding.icons.social).length > 0) {
                const socialIconsFromDb = Object.values(sourceBranding.icons.social).map((icon: any) => ({
                    id: icon.id,
                    name: icon.name,
                    type: 'icon-upload' as const,
                    styles: { iconUrl: icon.iconUrl || '' } as any,
                    mobileConfig: { 
                        componentName: 'SocialIcon', 
                        filePath: 'components/common/SocialIcon.tsx', 
                        usageExample: `<SocialIcon platform="${icon.id}" />` 
                    }
                }));
                
                // Find and replace the social-icons category
                const socialCatIndex = dynamicCategories.findIndex(c => c.id === 'social-icons');
                if (socialCatIndex >= 0) {
                    dynamicCategories[socialCatIndex] = {
                        ...dynamicCategories[socialCatIndex],
                        components: socialIconsFromDb
                    };
                }
            }
            
            // Build flag icons category from database
            if (sourceBranding.icons.flags && Object.keys(sourceBranding.icons.flags).length > 0) {
                const flagIconsFromDb = Object.values(sourceBranding.icons.flags).map((flag: any) => ({
                    id: flag.id,
                    name: flag.name,
                    type: 'icon-upload' as const,
                    styles: { iconUrl: flag.iconUrl || '', countryCode: flag.code } as any,
                    mobileConfig: { 
                        componentName: 'FlagIcon', 
                        filePath: 'components/common/FlagIcon.tsx', 
                        usageExample: `<FlagIcon country="${flag.code}" />` 
                    }
                }));
                
                // Find and replace the flag-icons category
                const flagCatIndex = dynamicCategories.findIndex(c => c.id === 'flag-icons');
                if (flagCatIndex >= 0) {
                    dynamicCategories[flagCatIndex] = {
                        ...dynamicCategories[flagCatIndex],
                        components: flagIconsFromDb
                    };
                }
            }
        }
        
        if (sourceBranding.categories) {
          // Enhanced Merge logic: Merge both categories AND components within them
          const savedCats = sourceBranding.categories
          const mergedCategories = dynamicCategories.map((defCat: any) => {
              const savedCat = savedCats.find((s: any) => s.id === defCat.id)
              if (!savedCat) return defCat
              
              // Merge components in this category
              const mergedComponents = [
                  ...savedCat.components,
                  ...defCat.components.filter((defComp: any) => !savedCat.components.find((sc: any) => sc.id === defComp.id))
              ]
              return { ...savedCat, components: mergedComponents }
          })
          setCategories(mergedCategories)
        } else {
            setCategories(dynamicCategories)
        }
      } else {
        setBranding({
          appName: currentApp.name,
          logoUrl: '',
          primaryColor: solidColor('#FFB6C1'),
          secondaryColor: solidColor('#FFFFFF'),
          primaryFont: 'Inter',
          secondaryFont: 'Outfit',
          typography: {
            h1: { family: 'Inter', size: 32, weight: '700', lineHeight: 1.2 },
            h2: { family: 'Inter', size: 24, weight: '600', lineHeight: 1.2 },
            body: { family: 'Inter', size: 16, weight: '400', lineHeight: 1.5 },
            caption: { family: 'Inter', size: 12, weight: '400', lineHeight: 1.5 },
          },
          screens: [
            { id: 'welcome', name: 'Welcome', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'login', name: 'Login / Sign Up', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'home', name: 'Home (You)', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'circle', name: 'Circle', background: '', resizeMode: 'cover', type: 'screen' },
            { id: 'social', name: 'Social', background: '', resizeMode: 'cover', type: 'screen' }
          ],
          screenGroups: [
            { id: 'auth', name: 'Authentication', icon: 'lock' },
            { id: 'main', name: 'Main App', icon: 'home' },
            { id: 'settings', name: 'Settings & Profile', icon: 'cog' }
          ],
          onboarding: { enabled: true, slides: [], isSkippable: true },
          social: { 
            supportEmail: '', 
            helpDeskUrl: '', 
            githubRepo: '',
            gitlabRepo: '',
            docsUrl: '',
            whatsapp: '', 
            instagram: '', 
            facebook: '',
            line: '',
            twitter: '', 
            linkedin: '', 
            discord: '', 
            appStoreId: '', 
            playStoreId: '' 
          },
          features: { 
            enableChat: true, 
            enableReferral: false, 
            enableDarkMode: false, 
            isMaintenanceMode: false, 
            maintenanceMessage: 'System is under maintenance.' 
          },
          navigation: { tabBar: [], drawer: [] },
          notifications: { primaryColor: solidColor('#FFB6C1'), defaultIcon: 'bell' },
          announcements: { enabled: false, text: '', linkUrl: '', type: 'info', isDismissible: true },
          updates: { minVersion: '1.0.0', storeUrl: '', forceUpdate: false },
          localization: { defaultLanguage: 'en', supportedLanguages: ['en'], enableRTL: false },
          api: { baseUrl: '', timeout: 30000, cacheExpiry: 3600 },
          security: { sessionTimeout: 3600, disableScreenshots: true, mandatoryMFA: false },
          analytics: { sentryDsn: '', mixpanelToken: '', googleAnalyticsId: '', enableDebugLogs: false },
          legal: { privacyPolicyUrl: '', termsOfServiceUrl: '', cookiePolicyUrl: '', dataDeletionUrl: '', dataRequestEmail: '' },
          seo: { title: currentApp.name, description: '', keywords: [], ogImage: '', twitterHandle: '', appleAppId: '' },
          ux: { animations: 'standard', haptics: 'light', loadingStyle: 'spinner' },
          splash: { 
            backgroundColor: '#FFFFFF', 
            spinnerColor: '#FFB6C1', 
            spinnerType: 'circle', 
            showAppName: true, 
            showLogo: true 
          },
          tokens: { 
            primaryGradient: { start: '#FFB6C1', end: '#FF69B4', angle: 45, enabled: true },
            secondaryGradient: { start: '#FFFFFF', end: '#F0F0F0', angle: 180, enabled: false },
            glassmorphism: { enabled: true, blur: 10, opacity: 0.8 },
            borderRadius: 'standard'
          },
          engagement: { pushEnabled: true, oneSignalAppId: '', firebaseConfig: '', defaultDeepLink: '' },
          support: { feedbackEnabled: true, bugReportingEnabled: true, featureRequestsEnabled: true, supportEmail: '', helpDeskUrl: '' },
          flows: {
            onboarding: { enabled: true, slides: [], isSkippable: true },
            login: { requireEmailVerification: false, allowSocialLogin: true, termsAcceptedOn: 'login', passwordPolicy: 'standard' },
            signup: { requireEmailVerification: true, allowSocialLogin: true, termsAcceptedOn: 'signup', passwordPolicy: 'standard' },
            survey: { enabled: false, trigger: 'after_onboarding', slides: [] }
          }
        } as BrandingConfig)
      }
      setLoading(false)
    }
  }, [currentApp])

  const handleSave = async () => {
    if (!currentApp || !branding) return
    setSaving(true)
    try {
      const brandingPayload = { ...branding, categories: categories }
      
      // Log image URLs before saving for debugging
      console.log('[AppearanceManager] Saving branding with screens:', brandingPayload.screens?.map(s => ({
        id: s.id,
        name: s.name,
        background: s.background
      })))
      
      // Save global branding settings
      const result = await adminService.upsertApplicationSetting({ 
          setting_key: 'branding', 
          setting_value: brandingPayload 
      })
      
      // Update local state with saved branding to ensure immediate UI update
      if (result?.setting?.value) {
        const savedBranding = typeof result.setting.value === 'string' 
          ? JSON.parse(result.setting.value) 
          : result.setting.value
        
        // Log saved branding to verify image URLs are preserved
        console.log('[AppearanceManager] Saved branding loaded from response:', {
          screensCount: savedBranding.screens?.length || 0,
          screens: savedBranding.screens?.map((s: any) => ({
            id: s.id,
            name: s.name,
            hasBackground: !!s.background,
            backgroundType: typeof s.background === 'string' ? 'string' : s.background?.mode || 'none',
            backgroundImage: typeof s.background === 'object' && s.background?.mode === 'image' ? s.background.image : null
          }))
        })
        
        setBranding(savedBranding)
        
        // Also update currentApp in context to ensure it's in sync
        // This ensures that when the component re-renders, it has the latest branding
        if (currentApp) {
          const updatedApp = { ...currentApp, branding: savedBranding }
          // Note: We can't directly update currentApp here, but refreshApplications will reload it
        }
      }
      
      toast({ title: "Appearance updated", description: "Visual changes saved successfully." })
      await refreshApplications()
    } catch (error) {
      console.error('Failed to save appearance:', error)
      toast({ title: "Save failed", description: "Could not save appearance changes.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
      setCategories(DEFAULT_CATEGORIES)
      toast({ title: "Styles reset", description: "UI components reset to defaults." })
  }

  const handleBrandingUpload = async (field: keyof BrandingConfig, file: File, screenId?: string) => {
      setUploading(screenId || (field as string))
      try {
          // Perform actual file upload
          const response = await adminService.uploadFile(file)
          const realUrl = response.file?.url || response.file?.id
          
          console.log('[AppearanceManager] File uploaded:', {
            field,
            screenId,
            fileId: response.file?.id,
            url: realUrl,
            fullResponse: response
          })

          if (!realUrl) {
            throw new Error('No URL returned from upload')
          }

          if (screenId && field === 'screens') {
              setBranding(prev => {
                  if (!prev) return null
                  const updatedScreens = prev.screens?.map(s => s.id === screenId ? { 
                      ...s, 
                      background: { mode: 'image' as const, image: realUrl } as ColorValue
                  } : s) || []
                  
                  console.log('[AppearanceManager] Updated screen background:', {
                    screenId,
                    url: realUrl,
                    updatedScreen: updatedScreens.find(s => s.id === screenId)
                  })
                  
                  return {
                      ...prev,
                      screens: updatedScreens
                  }
              })
          } else {
              setBranding(prev => prev ? { ...prev, [field]: realUrl } : null)
          }

          toast({ title: "Asset uploaded", description: "Image uploaded successfully. Please Save Changes." })
      } catch (error: any) {
          console.error('Upload failed:', error)
          toast({ 
            title: "Upload failed", 
            description: error.message || "Could not upload image. Please try again.", 
            variant: "destructive" 
          })
      } finally {
          setUploading(null)
      }
  }

  let activeCategory: any = categories.find(c => c.id === selectedCategory)

  // If no direct category match, check if selectedCategory is a componentName (Component Studio)
  if (!activeCategory) {
      const matchingComponents: any[] = []
      categories.forEach(cat => {
          cat.components.forEach(comp => {
              if (comp.mobileConfig?.componentName === selectedCategory) {
                  matchingComponents.push(comp)
              }
          })
      })

      if (matchingComponents.length > 0) {
          activeCategory = {
              id: selectedCategory,
              name: selectedCategory.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to CamelCase
              description: `Manage styles for ${selectedCategory} components.`,
              icon: 'library',
              components: matchingComponents
          }
      }
  }

  // Accordion Section Logic
  const sidebarSections = getSidebarSections(categories)
  const [expandedSection, setExpandedSection] = useState<string | null>('pillar-1')

  useEffect(() => {
     const section = sidebarSections.find(s => s.items.some(i => i.id === selectedCategory))
     if (section) {
         if (expandedSection !== section.id) {
            setExpandedSection(section.id)
         }
     }
  }, [selectedCategory])

  const toggleSection = (sectionId: string) => {
      setExpandedSection(prev => prev === sectionId ? null : sectionId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentApp || !branding) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white/40 rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                  <DevicePhoneMobileIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Application Selected</h2>
              <p className="text-gray-500 max-w-sm mx-auto">Please select an application from the side menu to begin styling.</p>
          </div>
      )
  }

  return (
    <div className="w-full mx-auto space-y-6">
        <AppearanceHeader 
            appName={branding.appName} 
            onReset={handleResetToDefaults} 
            onSave={handleSave} 
            isSaving={saving} 
        />

        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-72 shrink-0">
                <AppearanceSidebar 
                    sections={sidebarSections}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    expandedSection={expandedSection}
                    onToggleSection={toggleSection}
                />
            </aside>

            <main className="flex-1 min-w-0 pb-20">
                <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-1 min-h-[600px] transition-all">
                    { selectedCategory === 'mobile-identity' && (
                        <IdentitySettings 
                            branding={branding} 
                            setBranding={setBranding as any} 
                            handleBrandingUpload={handleBrandingUpload} 
                            uploading={!!uploading} 
                        />
                    )}

                     {selectedCategory === 'mobile-splash' && (
                        <SplashScreenSettings 
                            branding={branding} 
                            setBranding={setBranding as any} 
                        />
                    )}

                     {selectedCategory === 'mobile-quick-settings' && (
                        <QuickSettings 
                            branding={branding} 
                            setBranding={setBranding as any} 
                        />
                    )}
                    
                    {selectedCategory === 'branding' && (
                        <div className="space-y-6">
                            <BrandingSettings 
                                branding={branding} 
                                setBranding={setBranding as any} 
                                handleBrandingUpload={handleBrandingUpload} 
                                uploading={!!uploading} 
                            />
                        </div>
                    )}

                    {selectedCategory === 'mobile-screens' && (
                        <WallpaperSettings 
                            branding={branding} 
                            setBranding={setBranding as any} 
                            activeScreenTab={activeScreenTab} 
                            setActiveScreenTab={setActiveScreenTab} 
                            handleBrandingUpload={handleBrandingUpload} 
                        />
                    )}
                    
                    {selectedCategory === 'mobile-social' && <SocialSettings social={branding.social} setBranding={setBranding as any} />}

                    {/* Pillar 2: Experience */}
                    {selectedCategory === 'mobile-onboarding' && <OnboardingSettings onboarding={branding.onboarding} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-engagement' && <EngagementSettings engagement={branding.engagement} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-announcements' && <AnnouncementSettings announcements={branding.announcements} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-ux' && <UxSettings ux={branding.ux} setBranding={setBranding as any} />}

                    {/* Pillar 3: Design */}
                    {selectedCategory === 'mobile-tokens' && <VisualTokenSettings tokens={branding.tokens} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-typography' && <TypographySettings typography={branding.typography} branding={branding} setBranding={setBranding as any} />}
                    
                    {selectedCategory === 'mobile-library' && (
                         <div className="p-8 text-center text-gray-500">
                             <h3 className="text-lg font-medium text-gray-900">UI Component Library</h3>
                             <p>Browse and configure base components affecting the entire app.</p>
                             <Button className="mt-4" onClick={() => setSelectedCategory('buttons')}>Go to Buttons</Button>
                         </div>
                    )}
                    {selectedCategory === 'mobile-export' && <ThemeExporter branding={branding} categories={categories} />}

                    {/* Pillar 4: Advanced */}
                    {selectedCategory === 'mobile-security' && <div className="space-y-6">
                        <FeatureToggles features={branding.features} setBranding={setBranding as any} />
                    </div>}
                    {selectedCategory === 'mobile-localization' && <LocalizationSettings localization={branding.localization} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-seo' && <SeoSettings seo={branding.seo} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-updates' && <AppUpdateSettings updates={branding.updates} setBranding={setBranding as any} />}

                    {/* Pillar 5: Backend */}
                    {selectedCategory === 'mobile-api' && <ApiSettings api={branding.api} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-features' && <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">Feature Flags moved to specific sections.</div>} 
                    {selectedCategory === 'mobile-legal' && <TermsPolicyTab app={currentApp} />}
                    {selectedCategory === 'mobile-team' && <TeamTab app={currentApp} />}
                    {selectedCategory === 'mobile-payment' && <PaymentMethodsTab app={currentApp} />}

                    {/* Support Settings (Maybe under Social or Ops?) */}
                    {selectedCategory === 'support' && <SupportSettings support={branding.support} setBranding={setBranding as any} />}
                    {selectedCategory === 'mobile-analytics' && <AnalyticsSettings analytics={branding.analytics} setBranding={setBranding as any} />}

                    {/* Generic Component Style Settings for UI Library */}
                    {activeCategory && activeCategory.components && activeCategory.components.length > 0 && !['branding', 'mobile-identity', 'mobile-splash', 'mobile-quick-settings', 'mobile-screens', 'mobile-social', 'mobile-onboarding', 'mobile-engagement', 'mobile-announcements', 'mobile-ux', 'mobile-tokens', 'mobile-typography', 'mobile-library', 'mobile-export', 'mobile-security', 'mobile-localization', 'mobile-seo', 'mobile-updates', 'mobile-api', 'mobile-features', 'mobile-legal', 'mobile-team', 'mobile-payment', 'support', 'mobile-analytics', 'social-icons', 'flag-icons'].includes(selectedCategory) && (
                        <ComponentStyleSettings 
                            activeCategory={activeCategory} 
                            handleUpdateComponentStyle={(catId, compId, field, value) => {
                                setCategories(prev => prev.map(c => {
                                    // Update if category contains this component (works for both Category View and Component Studio View)
                                    if (c.components.some(comp => comp.id === compId)) {
                                        return {
                                            ...c,
                                            components: c.components.map((comp: any) => 
                                                comp.id === compId ? { ...comp, styles: { ...comp.styles, [field]: value } } : comp
                                            )
                                        }
                                    }
                                    return c
                                }))
                            }}
                            handleUpdateComponentConfig={(catId, compId, field, value) => {
                                setCategories(prev => prev.map(c => {
                                    if (c.components.some(comp => comp.id === compId)) {
                                        return {
                                            ...c,
                                            components: c.components.map((comp: any) => 
                                                comp.id === compId ? { 
                                                    ...comp, 
                                                    config: { ...(comp.config || {}), [field]: value } 
                                                } : comp
                                            )
                                        }
                                    }
                                    return c
                                }))
                            }}
                            handleDuplicateComponent={(catId: string, compId: string) => {
                                setCategories(prev => prev.map(c => {
                                    if (c.components.some(comp => comp.id === compId)) {
                                        const compIndex = c.components.findIndex(comp => comp.id === compId);
                                        if (compIndex === -1) return c;
                                        
                                        const originalComp = c.components[compIndex];
                                        // Deep copy needed to prevent shared references for styles/config
                                        const newComp = {
                                            ...originalComp,
                                            id: `${originalComp.id}_copy_${Date.now()}`,
                                            name: `${originalComp.name} (Copy)`,
                                            styles: originalComp.styles ? JSON.parse(JSON.stringify(originalComp.styles)) : {},
                                            config: originalComp.config ? JSON.parse(JSON.stringify(originalComp.config)) : {}
                                        };
                                        
                                        const newComponents = [...c.components];
                                        newComponents.splice(compIndex + 1, 0, newComp);
                                        
                                        return {
                                            ...c,
                                            components: newComponents
                                        };
                                    }
                                    return c;
                                }));
                                toast({ title: "Component Duplicated", description: "A copy of the component has been created." });
                            }}
                        />
                    )}

                    {/* Component Studio - Icon Management */}
                    {(selectedCategory === 'social-icons' || selectedCategory === 'flag-icons') && (
                        <div className="p-6">
                            <IconCategoryPanel
                                categoryId={selectedCategory}
                                categoryName={selectedCategory === 'social-icons' ? 'Social Media Icons' : 'Country Flag Icons'}
                                description={selectedCategory === 'social-icons' 
                                    ? 'Upload and manage social media platform icons for your app.' 
                                    : 'Upload and manage country flag icons for language selection.'}
                                components={categories.find(c => c.id === selectedCategory)?.components || []}
                                onIconUpload={async (componentId, file) => {
                                    // Upload file to server and return URL
                                    const formData = new FormData()
                                    formData.append('file', file)
                                    formData.append('type', 'icon')
                                    formData.append('componentId', componentId)
                                    
                                    try {
                                        const response = await adminService.uploadBrandingAsset(currentApp?.id || '', formData)
                                        return response.url || ''
                                    } catch (error) {
                                        console.error('Icon upload failed:', error)
                                        throw error
                                    }
                                }}
                                onIconRemove={(componentId) => {
                                    // Update category components to remove iconUrl
                                    setCategories(prev => prev.map(cat => {
                                        if (cat.id === selectedCategory) {
                                            return {
                                                ...cat,
                                                components: cat.components.map(comp => 
                                                    comp.id === componentId 
                                                        ? { ...comp, styles: { ...comp.styles, iconUrl: '' } as any }
                                                        : comp
                                                )
                                            }
                                        }
                                        return cat
                                    }))
                                }}
                                onIconUrlChange={(componentId, url) => {
                                    // Update category components with new iconUrl
                                    setCategories(prev => prev.map(cat => {
                                        if (cat.id === selectedCategory) {
                                            return {
                                                ...cat,
                                                components: cat.components.map(comp => 
                                                    comp.id === componentId 
                                                        ? { ...comp, styles: { ...comp.styles, iconUrl: url } as any }
                                                        : comp
                                                )
                                            }
                                        }
                                        return cat
                                    }))
                                }}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    </div>
  )
}
