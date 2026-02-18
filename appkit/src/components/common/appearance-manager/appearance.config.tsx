
import React from 'react'
import { 
    PaintBrushIcon, 
    StopIcon, 
    CursorArrowRaysIcon, 
    QueueListIcon, 
    ViewColumnsIcon, 
    ChatBubbleBottomCenterTextIcon,
    PresentationChartLineIcon,
    AdjustmentsHorizontalIcon,
    ListBulletIcon,
    BellSnoozeIcon,
    Bars3Icon,
    ArrowPathIcon,
    DevicePhoneMobileIcon,
    ShareIcon,
    SwatchIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    PhotoIcon,
    ShieldExclamationIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline'
import { CategoryConfig, ColorValue, ColorMode } from '../../appearance/types'

export const CategoryIcons: Record<string, React.ReactNode> = {
  // Pillar 1: Identity
  identity: <DevicePhoneMobileIcon className="w-5 h-5" />,
  branding: <PaintBrushIcon className="w-5 h-5" />,
  'mobile-quick-settings': <PaintBrushIcon className="w-5 h-5" />,
  'mobile-splash': <SparklesIcon className="w-5 h-5" />,
  social: <ShareIcon className="w-5 h-5" />,
  'mobile-screens': <DevicePhoneMobileIcon className="w-5 h-5" />,
  
  // Pillar 2: Experience
  onboarding: <PresentationChartLineIcon className="w-5 h-5" />,
  navigation: <ListBulletIcon className="w-5 h-5" />,
  engagement: <SparklesIcon className="w-5 h-5" />,
  announcements: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
  ux: <SparklesIcon className="w-5 h-5" />,
  
  // Pillar 3: Design
  tokens: <SwatchIcon className="w-5 h-5" />,
  typography: <Bars3Icon className="w-5 h-5 rotate-90" />,
  library: <ViewColumnsIcon className="w-5 h-5" />,
  export: <ArrowPathIcon className="w-5 h-5" />,
  
  // Pillar 4: Advanced
  security: <QueueListIcon className="w-5 h-5" />,
  localization: <QueueListIcon className="w-5 h-5" />,
  seo: <QueueListIcon className="w-5 h-5" />,
  updates: <ArrowPathIcon className="w-5 h-5" />,
  
  // Pillar 5: Backend/Ops
  api: <QueueListIcon className="w-5 h-5" />,
  features: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
  terms: <ListBulletIcon className="w-5 h-5" />,
  team: <QueueListIcon className="w-5 h-5" />,
  payment: <QueueListIcon className="w-5 h-5" />,

  notifications: <BellSnoozeIcon className="w-5 h-5" />,
  
  // New Component Categories (Pillar Styles)
  buttons: <CursorArrowRaysIcon className="w-5 h-5" />,
  cards: <StopIcon className="w-5 h-5" />,
  inputs: <QueueListIcon className="w-5 h-5" />,
  layout: <ViewColumnsIcon className="w-5 h-5" />,
  feedback: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
  
  'mobile-nav': <ListBulletIcon className="w-5 h-5" />,
  'mobile-actions': <CursorArrowRaysIcon className="w-5 h-5" />,
  'lists-grids': <QueueListIcon className="w-5 h-5" />,
  'communication': <ChatBubbleLeftRightIcon className="w-5 h-5" />,
  'media-assets': <PhotoIcon className="w-5 h-5" />,
  'safety-ui': <ShieldExclamationIcon className="w-5 h-5" />,
  'member-exp': <UserGroupIcon className="w-5 h-5" />,
  'charts-data': <PresentationChartLineIcon className="w-5 h-5" />,
  'app-widgets': <DevicePhoneMobileIcon className="w-5 h-5" />,
  'navigation-ui': <ListBulletIcon className="w-5 h-5" />,
  'circle-ui': <UserGroupIcon className="w-5 h-5" />,
  'profile-ui': <UserGroupIcon className="w-5 h-5" />,
  'calendar-ui': <PresentationChartLineIcon className="w-5 h-5" />,
  'map-ui': <DevicePhoneMobileIcon className="w-5 h-5" />,
  'screen-backgrounds': <SparklesIcon className="w-5 h-5" />,
}

export const solidColor = (color: string): ColorValue => ({ mode: 'solid' as ColorMode, solid: color })

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'buttons',
    name: 'Buttons',
    description: 'Configure interaction elements.',
    icon: 'buttons',
    components: [
      {
          id: 'primary', 
          name: 'Primary Button', 
          type: 'button',
          styles: { backgroundColor: solidColor('#FFB6C1'), textColor: solidColor('#FFFFFF'), borderRadius: 12, borderColor: solidColor('transparent'), shadowLevel: 'sm', clickAnimation: 'scale' } as any,
          mobileConfig: { 
              componentName: 'ThemedButton', 
              filePath: 'components/common/ThemedButton.tsx', 
              usageExample: '<ThemedButton \n  componentId="primary" \n  label="Click Me" \n  onPress={handlePress} \n/>' 
          }
      },
      {
          id: 'secondary', 
          name: 'Secondary Button', 
          type: 'button',
          styles: { backgroundColor: solidColor('#F3F4F6'), textColor: solidColor('#4B5563'), borderRadius: 12, borderColor: solidColor('transparent'), shadowLevel: 'none', clickAnimation: 'scale' } as any,
          mobileConfig: { 
              componentName: 'ThemedButton', 
              filePath: 'components/common/ThemedButton.tsx', 
              usageExample: '<ThemedButton \n  componentId="secondary" \n  label="Cancel" \n  onPress={handleCancel} \n/>' 
          }
      },
      {
          id: 'destructive', 
          name: 'Destructive Button', 
          type: 'button',
          styles: { backgroundColor: solidColor('#EF4444'), textColor: solidColor('#FFFFFF'), borderRadius: 12, borderColor: solidColor('transparent'), shadowLevel: 'none', clickAnimation: 'scale' } as any,
          mobileConfig: { 
              componentName: 'ThemedButton', 
              filePath: 'components/common/ThemedButton.tsx', 
              usageExample: '<ThemedButton \n  componentId="destructive" \n  label="Delete" \n  onPress={handleDelete} \n/>' 
          }
      }
    ]
  },
  {
      id: 'cards',
      name: 'Cards',
      description: 'Define content wrappers.',
      icon: 'cards',
      components: [
          { 
            id: 'standard', 
            name: 'Standard Card', 
            type: 'card',
            styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16, borderColor: solidColor('#E5E7EB'), shadowLevel: 'md' } as any,
            mobileConfig: { componentName: 'Card', filePath: 'components/ui/Card.tsx', usageExample: '<Card>\n  <Text>Content goes here</Text>\n</Card>' }
          }
      ]
  },
  {
      id: 'inputs',
      name: 'Inputs',
      description: 'Text fields & form elements.',
      icon: 'inputs',
      components: [
          { 
            id: 'text', 
            name: 'Text Input', 
            type: 'input',
            styles: { 
              backgroundColor: solidColor('#F9FAFB'), 
              borderRadius: 12, 
              borderColor: solidColor('#E5E7EB'), 
              textColor: solidColor('#111827'),
              focusBorderColor: solidColor('#3B82F6'),
              validBorderColor: solidColor('#10B981'),
              invalidBorderColor: solidColor('#EF4444')
            } as any,
            mobileConfig: { componentName: 'Input', filePath: 'components/ui/Input.tsx', usageExample: '<Input \n  placeholder="Enter name" \n  value={name} \n  onChangeText={setName} \n/>' }
          }
      ]
  },
  {
      id: 'layout',
      name: 'Layout',
      description: 'Structure & Containers.',
      icon: 'layout',
      components: [
          { 
            id: 'container', 
            name: 'Main Wrapper', 
            type: 'card',
            styles: { backgroundColor: solidColor('#FFFFFF') } as any,
            mobileConfig: { componentName: 'Container', filePath: 'components/ui/Container.tsx', usageExample: '<Container>\n  <Header />\n  <Content />\n</Container>' }
          }
      ]
  },
  {
      id: 'feedback',
      name: 'Feedback',
      description: 'Toasts & Modals.',
      icon: 'feedback',
      components: [
          { 
            id: 'toast', 
            name: 'Toast Message', 
            type: 'card',
            styles: { backgroundColor: solidColor('#1F2937'), textColor: solidColor('#FFFFFF'), borderRadius: 8, borderColor: solidColor('transparent'), shadowLevel: 'sm' } as any,
            mobileConfig: { componentName: 'Toast', filePath: 'components/ui/Toast.tsx', usageExample: "Toast.show({\n  type: 'success',\n  text1: 'Hello',\n  text2: 'This is a toast message'\n});" }
          }
    ]
  },
  {
    id: 'mobile-nav',
    name: 'Mobile Navigation',
    description: 'Tab bars, drawers, and menus.',
    icon: 'mobile-nav',
    components: [
      { 
        id: 'bottom-sheet', 
        name: 'Bottom Sheet', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 32, borderColor: solidColor('transparent'), shadowLevel: 'lg' } as any,
        mobileConfig: { componentName: 'CommentDrawer', filePath: 'mobile/src/components/home/CommentDrawer.tsx', usageExample: '<CommentDrawer visible={visible} onClose={() => setVisible(false)}>\n  <View><Text>Content</Text></View>\n</CommentDrawer>' }
      },
      { 
        id: 'drawer-overlay', 
        name: 'Side Drawer', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF') } as any,
        mobileConfig: { componentName: 'CircleOptionsDrawer', filePath: 'mobile/src/components/home/CircleOptionsDrawer.tsx', usageExample: '<CircleOptionsDrawer visible={isOpen} onClose={() => setIsOpen(false)} />' }
      },
      { 
        id: 'tab-navigation', 
        name: 'Mobile Tabbar', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('rgba(255,255,255,0.95)'), textColor: solidColor('#64748B') } as any,
        mobileConfig: { componentName: 'TabNavigation', filePath: 'mobile/src/components/home/TabNavigation.tsx', usageExample: '<TabNavigation \n  tabs={tabs} \n  activeId={activeTab} \n  onSelect={handleTabSelect} \n/>' }
      },
      { 
        id: 'segmented-control', 
        name: 'Segmented Control', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('#F1F5F9'), borderRadius: 16, borderColor: solidColor('transparent') } as any,
        mobileConfig: { componentName: 'SegmentedTabs', filePath: 'components/common/SegmentedTabs.tsx', usageExample: '<SegmentedTabs \n  tabs={["Map", "List"]} \n  activeId={activeId} \n  onChange={setId} \n/>' },
        config: {
            activeColor: '#FA7272',
            inactiveColor: '#F3F4F6',
            activeTextColor: '#FFFFFF',
            inactiveTextColor: '#6B7280',
            cornerRadius: 24
        }
      },
      { 
        id: 'selection-tabs', 
        name: 'Icon Selection Tabs', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('#FA7272'), textColor: solidColor('#FA7272'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'CircleSelectionTabs', filePath: 'components/common/CircleSelectionTabs.tsx', usageExample: '<CircleSelectionTabs \n  tabs={tabs} \n  activeTab={activeTab} \n  onTabPress={setActiveTab} \n  fit={true} \n/>' },
        config: {
            activeColor: '#FA7272',
            inactiveColor: '#F3F4F6',
            activeTextColor: '#FA7272',
            inactiveTextColor: '#6B7280',
            activeIconColor: '#FFFFFF',
            inactiveIconColor: '#6B7280',
            menuBackgroundColor: 'transparent',
            fit: true,
            menuShowShadow: 'none',
            activeShowShadow: 'none',
            inactiveShowShadow: 'none',

            // Layout
            itemSpacing: 8,
            itemBorderRadius: 12,
            pinnedFirstTab: false,
            showPinnedSeparator: false,
            pinnedSeparatorColor: '#E5E7EB',

            // Borders
            activeBorderColor: 'transparent',
            inactiveBorderColor: 'transparent',
            activeBorderWidth: 0,
            inactiveBorderWidth: 0,

            // Opacity
            activeOpacity: 1,
            inactiveOpacity: 1
        }
      },
      { 
        id: 'circle-selection-tabs', 
        name: 'Circle Selection Tabs', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('#FA7272'), textColor: solidColor('#FA7272'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'CircleSelectionTabs', filePath: 'components/common/CircleSelectionTabs.tsx', usageExample: '<CircleSelectionTabs \n  tabs={tabs} \n  activeTab={activeTab} \n  onTabPress={setActiveTab} \n  fit={true} \n/>' },
        config: {
            activeColor: '#FA7272',
            inactiveColor: '#F3F4F6',
            activeTextColor: '#FA7272',
            inactiveTextColor: '#6B7280',
            activeIconColor: '#FFFFFF',
            inactiveIconColor: '#6B7280',
            menuBackgroundColor: 'transparent',
            fit: true,
            menuShowShadow: 'none',
            activeShowShadow: 'none',
            inactiveShowShadow: 'none',

            // Visibility
            showLocationTab: true,
            showGalleryTab: true,
            showFinancialTab: true,
            showHealthTab: true,

            // Layout
            itemSpacing: 8,
            itemBorderRadius: 12,
            pinnedFirstTab: false,
            showPinnedSeparator: false,
            pinnedSeparatorColor: '#E5E7EB',

            // Borders
            activeBorderColor: 'transparent',
            inactiveBorderColor: 'transparent',
            activeBorderWidth: 0,
            inactiveBorderWidth: 0,

            // Opacity
            activeOpacity: 1,
            inactiveOpacity: 1
        }
      },
      { 
        id: 'health-selection-tabs', 
        name: 'Health Selection Tabs', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('#FA7272'), textColor: solidColor('#FA7272'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'HealthSelectionTabs', filePath: 'components/common/HealthSelectionTabs.tsx', usageExample: '<HealthSelectionTabs \n  activeTab={activeTab} \n  onTabPress={setActiveTab} \n/>' },
        config: {
            activeColor: '#FA7272',
            inactiveColor: '#F3F4F6',
            activeTextColor: '#FA7272',
            inactiveTextColor: '#6B7280',
            activeIconColor: '#FFFFFF',
            inactiveIconColor: '#6B7280',
            menuBackgroundColor: 'transparent',
            fit: true,
            menuShowShadow: 'none',
            activeShowShadow: 'none',
            inactiveShowShadow: 'none',

            // Layout
            itemSpacing: 8,
            itemBorderRadius: 12,
            
            // Categories
            defaultCategories: [
                { id: 'common', label: 'Common', icon: 'emoticon-happy' },
                { id: 'metrics', label: 'Metrics', icon: 'chart-line' }
            ]
        }
      },
      { 
        id: 'accordion-menu', 
        name: 'Accordion Menu', 
        type: 'accordion',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'UnifiedSettingsPage', filePath: 'mobile/src/components/settings/UnifiedSettingsPage.tsx', usageExample: '<UnifiedSettingsPage />' }
      }
    ]
  },
  {
    id: 'mobile-actions',
    name: 'Mobile Actions',
    description: 'Floating buttons and quick actions.',
    icon: 'mobile-actions',
    components: [
      { 
        id: 'fab-action', 
        name: 'Floating Button', 
        type: 'button',
        styles: { backgroundColor: solidColor('#6366F1'), textColor: solidColor('#FFFFFF'), borderRadius: 99 } as any,
        mobileConfig: { componentName: 'FloatingCreatePostButton', filePath: 'mobile/src/components/home/FloatingCreatePostButton.tsx', usageExample: '<FloatingCreatePostButton visible={true} onPress={handlePress} />' },
        config: {
            buttonSize: 56,
            bottomOffset: 24,
            rightOffset: 24,
            iconSize: 28
        }
      },
      { 
        id: 'floating-menu', 
        name: 'Application Popup', 
        type: 'button',
        styles: { backgroundColor: solidColor('#1E293B'), textColor: solidColor('#FFFFFF') } as any,
        mobileConfig: { componentName: 'ApplicationsPopup', filePath: 'mobile/src/components/popup/ApplicationsPopup.tsx', usageExample: '<ApplicationsPopup visible={visible} onClose={() => setVisible(false)} />' }
      },
      { 
        id: 'action-sheet', 
        name: 'Applications Drawer', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'ApplicationsDrawer', filePath: 'mobile/src/components/home/ApplicationsDrawer.tsx', usageExample: '<ApplicationsDrawer visible={visible} onClose={() => setVisible(false)} />' }
      },
      { 
        id: 'pull-refresh', 
        name: 'Loading Screen', 
        type: 'generic',
        styles: { textColor: solidColor('#6366F1') } as any,
        mobileConfig: { componentName: 'LoadingScreen', filePath: 'mobile/src/components/common/LoadingScreen.tsx', usageExample: '<LoadingScreen message="Loading..." />' }
      }
    ]
  },
  {
    id: 'data-display',
    name: 'Data Display',
    description: 'Charts, stats, and visualizers.',
    icon: 'data-display',
    components: [
      { 
        id: 'metric-card', 
        name: 'Profile Stats', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24, borderColor: solidColor('#F1F5F9'), shadowLevel: 'sm' } as any,
        mobileConfig: { componentName: 'ProfileStats', filePath: 'mobile/src/components/profile/ProfileStats.tsx', usageExample: '<ProfileStats stats={userData} />' }
      },
      { 
        id: 'stat-roll', 
        name: 'Health Summary', 
        type: 'generic',
        styles: { textColor: solidColor('#0F172A') } as any,
        mobileConfig: { componentName: 'HealthSummary', filePath: 'mobile/src/components/home/HealthSummary.tsx', usageExample: '<HealthSummary data={healthData} />' }
      },
      { 
        id: 'sparkline-chart', 
        name: 'Finance Summary', 
        type: 'generic',
        styles: { backgroundColor: solidColor('transparent'), textColor: solidColor('#6366F1') } as any,
        mobileConfig: { componentName: 'FinanceSummary', filePath: 'mobile/src/components/home/FinanceSummary.tsx', usageExample: '<FinanceSummary data={financeData} />' }
      },
      { 
        id: 'avatar-group', 
        name: 'Circle Members Widget', 
        type: 'badge',
        styles: { borderColor: solidColor('#FFFFFF') } as any,
        mobileConfig: { componentName: 'CircleMembersWidget', filePath: 'mobile/src/components/widgets/CircleMembersWidget.tsx', usageExample: '<CircleMembersWidget members={members} />' }
      },
      { 
        id: 'timeline-main', 
        name: 'Calendar Events', 
        type: 'generic',
        styles: { backgroundColor: solidColor('transparent'), borderColor: solidColor('#E2E8F0') } as any,
        mobileConfig: { componentName: 'EventCard', filePath: 'mobile/src/components/calendar/EventCard.tsx', usageExample: '<EventCard event={event} onPress={handleEventPress} />' }
      },
      { 
        id: 'carousel-view', 
        name: 'Gallery App', 
        type: 'generic',
        styles: { backgroundColor: solidColor('transparent'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'GalleryApp', filePath: 'mobile/src/components/apps/GalleryApp.tsx', usageExample: '<GalleryApp />' }
      },
      { 
        id: 'glass-card', 
        name: 'Content Card', 
        type: 'card',
        styles: { backgroundColor: solidColor('rgba(255,255,255,0.8)'), borderRadius: 24, borderColor: solidColor('rgba(255,255,255,0.2)'), shadowLevel: 'md' } as any,
        mobileConfig: { componentName: 'ContentCard', filePath: 'mobile/src/components/ContentCard.tsx', usageExample: '<ContentCard data={content} />' }
      }
    ]
  },
  {
    id: 'status-feedback',
    name: 'Status & Feedback',
    description: 'Indicators and progress.',
    icon: 'status-feedback',
    components: [
      { 
        id: 'status-indicator', 
        name: 'Branding Logo', 
        type: 'badge',
        styles: { backgroundColor: solidColor('#10B981') } as any,
        mobileConfig: { componentName: 'BrandLogo', filePath: 'mobile/src/components/common/BrandLogo.tsx', usageExample: '<BrandLogo size={48} />' }
      },
       { 
        id: 'notification-dot', 
        name: 'Cool Icon', 
        type: 'badge',
        styles: { backgroundColor: solidColor('#EF4444'), textColor: solidColor('#FFFFFF') } as any,
        mobileConfig: { componentName: 'CoolIcon', filePath: 'mobile/src/components/common/CoolIcon.tsx', usageExample: '<CoolIcon name="bell" size={24} color="#FF0000" />' }
      },
      { 
        id: 'progress-ring', 
        name: 'Emotion Check-in', 
        type: 'generic',
        styles: { textColor: solidColor('#6366F1'), backgroundColor: solidColor('#E2E8F0') } as any,
        mobileConfig: { componentName: 'EmotionCheckInModal', filePath: 'mobile/src/components/home/EmotionCheckInModal.tsx', usageExample: '<EmotionCheckInModal visible={visible} onClose={handleClose} />' }
      },
      { 
        id: 'skeleton-wrapper', 
        name: 'Skeleton Loader', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#F1F5F9'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'SkeletonWrapper', filePath: 'mobile/src/components/common/SkeletonWrapper.tsx', usageExample: '<SkeletonWrapper loading={isLoading}>\n  <UserProfile />\n</SkeletonWrapper>' }
      },
      { 
        id: 'rating-stars', 
        name: 'Temperature Check', 
        type: 'generic',
        styles: { backgroundColor: solidColor('transparent'), textColor: solidColor('#FBBF24') } as any,
        mobileConfig: { componentName: 'TemperatureCheckModal', filePath: 'mobile/src/components/TemperatureCheckModal.tsx', usageExample: '<TemperatureCheckModal visible={visible} onClose={handleClose} />' }
      }
    ]
  },
  {
    id: 'advanced-inputs',
    name: 'Advanced Inputs',
    description: 'Sliders, toggles, chips.',
    icon: 'advanced-inputs',
    components: [
      { 
        id: 'otp-input', 
        name: 'PIN Keypad', 
        type: 'input',
        styles: { 
          backgroundColor: solidColor('#F8FAFC'), 
          borderRadius: 12, 
          borderColor: solidColor('#E2E8F0'), 
          shadowLevel: 'none',
          focusBorderColor: solidColor('#6366F1'),
          validBorderColor: solidColor('#10B981'),
          invalidBorderColor: solidColor('#EF4444')
        } as any,
        mobileConfig: { componentName: 'PinKeypad', filePath: 'mobile/src/components/auth/PinKeypad.tsx', usageExample: '<PinKeypad \n  onCodeComplete={handlePin} \n  pinLength={6} \n/>' }
      },
      { 
        id: 'mobile-slider', 
        name: 'Language Settings', 
        type: 'input',
        styles: { backgroundColor: solidColor('#6366F1'), borderRadius: 8 } as any,
        mobileConfig: { componentName: 'LanguageSettings', filePath: 'mobile/src/components/settings/LanguageSettings.tsx', usageExample: '<LanguageSettings />' }
      },
      { 
        id: 'stepper-control', 
        name: 'Privacy Settings', 
        type: 'input',
        styles: { backgroundColor: solidColor('#F1F5F9'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'PrivacySettingsModal', filePath: 'mobile/src/components/profile/PrivacySettingsModal.tsx', usageExample: '<PrivacySettingsModal visible={visible} onClose={handleClose} />' }
      },
      { 
        id: 'toggle-switch', 
        name: 'Notification Settings', 
        type: 'input',
        styles: { backgroundColor: solidColor('#E2E8F0') } as any,
        mobileConfig: { componentName: 'NotificationSettingsModal', filePath: 'mobile/src/components/profile/NotificationSettingsModal.tsx', usageExample: '<NotificationSettingsModal visible={visible} onClose={handleClose} />' }
      },
      { 
        id: 'chip-group', 
        name: 'Calendar Filters', 
        type: 'badge',
        styles: { backgroundColor: solidColor('#E2E8F0'), borderRadius: 99, textColor: solidColor('#475569') } as any,
        mobileConfig: { componentName: 'CalendarFilters', filePath: 'mobile/src/components/calendar/CalendarFilters.tsx', usageExample: '<CalendarFilters onFilterChange={handleFilterChange} />' }
      },
      { 
        id: 'search-overlay', 
        name: 'Search Drawer', 
        type: 'input',
        styles: { backgroundColor: solidColor('rgba(255,255,255,0.98)') } as any,
        mobileConfig: { componentName: 'SearchDrawer', filePath: 'mobile/src/components/home/SearchDrawer.tsx', usageExample: '<SearchDrawer \n  visible={isSearching} \n  onClose={() => setIsSearching(false)} \n/>' }
      },
      {
        id: 'datetime-picker',
        name: 'Date & Time Picker',
        type: 'input',
        styles: { 
            backgroundColor: solidColor('#FFFFFF'), 
            borderRadius: 16, 
            borderColor: solidColor('#E5E7EB'), 
            textColor: solidColor('#1F2937'),
            shadowLevel: 'sm'
        } as any,
        mobileConfig: { componentName: 'DateTimePickerDrawer', filePath: 'mobile/src/components/calendar/DateTimePickerDrawer.tsx', usageExample: '<DateTimePickerDrawer \n  visible={show} \n  onConfirm={handleDate} \n/>' },
        config: {
            dateFormat: 'MMM DD, YYYY',
            timeFormat: 'h:mm A',
            pickerMode: 'datetime', // 'date' | 'time' | 'datetime'
            displayFormat: 'MMM DD, YYYY h:mm A'
        }
      }
    ]
  },
  {
    id: 'lists-grids',
    name: 'Lists & Grids',
    description: 'Advanced data repeaters.',
    icon: 'lists-grids',
    components: [
      { 
        id: 'swipeable-list', 
        name: 'Content List', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderColor: solidColor('#F1F5F9'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'ContentList', filePath: 'mobile/src/components/ContentList.tsx', usageExample: '<ContentList data={items} renderItem={renderItem} />' }
      },
      { 
        id: 'sortable-list', 
        name: 'Widget Customization', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'WidgetCustomizationModal', filePath: 'mobile/src/components/home/WidgetCustomizationModal.tsx', usageExample: '<WidgetCustomizationModal visible={visible} onClose={handleClose} />' }
      },
      { 
        id: 'infinite-scroll', 
        name: 'Social Tab', 
        type: 'generic',
        styles: { textColor: solidColor('#94A3B8') } as any,
        mobileConfig: { componentName: 'SocialTab', filePath: 'mobile/src/components/home/SocialTab.tsx', usageExample: '<SocialTab circleId={circleId} />' }
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication UI',
    description: 'Chat bubbles, inputs, and status.',
    icon: 'communication',
    components: [
      { 
        id: 'message-bubble-sent', 
        name: 'Chat Page', 
        type: 'card',
        styles: { backgroundColor: solidColor('#E8B4A1'), textColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ChatPage', filePath: 'mobile/src/components/chat/ChatPage.tsx', usageExample: '<ChatPage chatId={chatId} />' }
      },
      { 
        id: 'message-bubble-received', 
        name: 'Group Management', 
        type: 'card',
        styles: { backgroundColor: solidColor('#F3F4F6'), textColor: solidColor('#111827'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'GroupManagement', filePath: 'mobile/src/components/chat/GroupManagement.tsx', usageExample: '<GroupManagement groupId={groupId} />' }
      },
      { 
        id: 'ai-agent', 
        name: 'AI Agent Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#6366F1'), textColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'AIAgentWidget', filePath: 'mobile/src/components/ai/AIAgentWidget.tsx', usageExample: '<AIAgentWidget />' }
      },
      { 
        id: 'video-call', 
        name: 'Video Call Screen', 
        type: 'card',
        styles: { backgroundColor: solidColor('#1F2937'), textColor: solidColor('#FFFFFF'), borderRadius: 8 } as any,
        mobileConfig: { componentName: 'VideoCallScreen', filePath: 'mobile/src/components/video/VideoCallScreen.tsx', usageExample: '<VideoCallScreen callId={callId} />' }
      }
    ]
  },
  {
    id: 'media-assets',
    name: 'Media & Assets',
    description: 'Avatars, images, and galleries.',
    icon: 'media-assets',
    components: [
      { 
        id: 'avatar-standard', 
        name: 'Profile Header', 
        type: 'badge',
        styles: { borderRadius: 99, borderColor: solidColor('#FFFFFF') } as any,
        mobileConfig: { componentName: 'ProfileHeader', filePath: 'mobile/src/components/profile/ProfileHeader.tsx', usageExample: '<ProfileHeader user={userData} />' }
      },
      { 
        id: 'storage-app', 
        name: 'Storage App', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'StorageApp', filePath: 'mobile/src/components/apps/StorageApp.tsx', usageExample: '<StorageApp />' }
      },
      { 
        id: 'gallery-card', 
        name: 'Gallery Card Content', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'GalleryCardContent', filePath: 'mobile/src/components/card/GalleryCardContent.tsx', usageExample: '<GalleryCardContent data={galleryData} />' }
      }
    ]
  },
  {
    id: 'safety-ui',
    name: 'Safety & SOS',
    description: 'Emergency controls and alerts.',
    icon: 'safety-ui',
    components: [
      { 
        id: 'sos-button', 
        name: 'SOS Panic Button', 
        type: 'button',
        styles: { backgroundColor: solidColor('#EF4444'), textColor: solidColor('#FFFFFF'), borderRadius: 99 } as any,
        mobileConfig: { componentName: 'EmergencyAlertButton', filePath: 'mobile/src/components/emergency/EmergencyAlertButton.tsx', usageExample: '<EmergencyAlertButton />' },
        config: {
            buttonSize: 80,
            verticalOffset: 20,
            horizontalOffset: 20,
            pulseColor: '#FF5A5A'
        }
      },
      { 
        id: 'geofence-manager', 
        name: 'Geofence Manager', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'GeofenceManager', filePath: 'mobile/src/components/safety/GeofenceManager.tsx', usageExample: '<GeofenceManager />' }
      },
      { 
        id: 'emergency-contacts', 
        name: 'Emergency Contacts Card', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FEE2E2'), borderRadius: 16, borderColor: solidColor('#FCA5A5') } as any,
        mobileConfig: { componentName: 'EmergencyContactsCard', filePath: 'mobile/src/components/profile/EmergencyContactsCard.tsx', usageExample: '<EmergencyContactsCard contacts={emergencyContacts} />' }
      }
    ]
  },
  {
    id: 'circle-ui',
    name: 'Circle Components',
    description: 'Circle management and display.',
    icon: 'member-exp',
    components: [
      { 
        id: 'circle-tab', 
        name: 'Circle Tab', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'CircleTab', filePath: 'mobile/src/components/home/CircleTab.tsx', usageExample: '<CircleTab circleId={circleId} />' }
      },
      { 
        id: 'circle-health-tab', 
        name: 'Circle Health Tab', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'CircleHealthTab', filePath: 'mobile/src/components/home/CircleHealthTab.tsx', usageExample: '<CircleHealthTab circleId={circleId} />' }
      },
      { 
        id: 'circle-member-drawer', 
        name: 'Circle Member Drawer', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'CircleMemberDrawer', filePath: 'mobile/src/components/home/CircleMemberDrawer.tsx', usageExample: '<CircleMemberDrawer visible={visible} member={member} onClose={handleClose} />' }
      },
      { 
        id: 'circle-location-map', 
        name: 'Circle Location Map', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'CircleLocationMap', filePath: 'mobile/src/components/home/CircleLocationMap.tsx', usageExample: '<CircleLocationMap circleId={circleId} />' }
      },
      { 
        id: 'circle-card', 
        name: 'Circle Card', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16, shadowLevel: 'sm' } as any,
        mobileConfig: { componentName: 'CircleCard', filePath: 'mobile/src/components/profile/CircleCard.tsx', usageExample: '<CircleCard circle={circleData} onPress={handlePress} />' }
      },
      { 
        id: 'edit-circle-modal', 
        name: 'Edit Circle Modal', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'EditCircleModal', filePath: 'mobile/src/components/circle/EditCircleModal.tsx', usageExample: '<EditCircleModal visible={visible} circle={circle} onClose={handleClose} />' }
      }
    ]
  },
  {
    id: 'profile-ui',
    name: 'Profile Components',
    description: 'User profile and settings UI.',
    icon: 'member-exp',
    components: [
      { 
        id: 'profile-info-tab', 
        name: 'Profile Info Tab', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ProfileInfoTab', filePath: 'mobile/src/components/profile/ProfileInfoTab.tsx', usageExample: '<ProfileInfoTab user={userData} />' }
      },
      { 
        id: 'profile-social-tab', 
        name: 'Profile Social Tab', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ProfileSocialTab', filePath: 'mobile/src/components/profile/ProfileSocialTab.tsx', usageExample: '<ProfileSocialTab user={userData} />' }
      },
      { 
        id: 'profile-financial-tab', 
        name: 'Profile Financial Tab', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ProfileFinancialTab', filePath: 'mobile/src/components/profile/ProfileFinancialTab.tsx', usageExample: '<ProfileFinancialTab user={userData} />' }
      },
      { 
        id: 'profile-settings', 
        name: 'Profile Settings', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ProfileSettings', filePath: 'mobile/src/components/profile/ProfileSettings.tsx', usageExample: '<ProfileSettings />' }
      },
      { 
        id: 'profile-actions', 
        name: 'Profile Actions', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ProfileActions', filePath: 'mobile/src/components/profile/ProfileActions.tsx', usageExample: '<ProfileActions user={userData} />' }
      },
      { 
        id: 'circle-settings-modal', 
        name: 'Circle Settings Modal', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'CircleSettingsModal', filePath: 'mobile/src/components/profile/CircleSettingsModal.tsx', usageExample: '<CircleSettingsModal visible={visible} onClose={handleClose} />' }
      }
    ]
  },
  {
    id: 'calendar-ui',
    name: 'Calendar Components',
    description: 'Calendar and event management.',
    icon: 'onboarding',
    components: [
      { 
        id: 'modern-calendar', 
        name: 'Modern Calendar', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ModernCalendar', filePath: 'mobile/src/components/calendar/ModernCalendar.tsx', usageExample: '<ModernCalendar onDateSelect={handleDateSelect} />' }
      },
      { 
        id: 'event-modal', 
        name: 'Event Modal', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'EventModal', filePath: 'mobile/src/components/calendar/EventModal.tsx', usageExample: '<EventModal visible={visible} event={event} onClose={handleClose} />' }
      },
      { 
        id: 'add-event-modal', 
        name: 'Add Event Modal', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'AddEventModal', filePath: 'mobile/src/components/calendar/AddEventModal.tsx', usageExample: '<AddEventModal visible={visible} onClose={handleClose} onSave={handleSave} />' }
      },
      { 
        id: 'event-details-modal', 
        name: 'Event Details Modal', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'EventDetailsModal', filePath: 'mobile/src/components/calendar/EventDetailsModal.tsx', usageExample: '<EventDetailsModal visible={visible} event={event} onClose={handleClose} />' }
      },
      { 
        id: 'calendar-app', 
        name: 'Calendar App', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'CalendarApp', filePath: 'mobile/src/components/apps/CalendarApp.tsx', usageExample: '<CalendarApp />' }
      },
      { 
        id: 'calendar-theme', 
        name: 'Calendar Theme', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#FFFFFF'), textColor: solidColor('#FA7272') } as any,
        mobileConfig: { componentName: 'CalendarTheme', filePath: 'mobile/src/components/calendar/CalendarTheme.tsx', usageExample: '// Configure calendar colors and styles' }
      }
    ]
  },
  {
    id: 'map-ui',
    name: 'Map Components',
    description: 'Map display and location services.',
    icon: 'mobile-screens',
    components: [
      { 
        id: 'map-view', 
        name: 'Map View', 
        type: 'card',
        styles: { backgroundColor: solidColor('#E5E7EB'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'map', filePath: 'mobile/src/components/ui/map.tsx', usageExample: '<MapView region={region} markers={markers} />' }
      },
      { 
        id: 'free-map-view', 
        name: 'Free Map View', 
        type: 'card',
        styles: { backgroundColor: solidColor('#E5E7EB'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'FreeMapView', filePath: 'mobile/src/components/maps/FreeMapView.tsx', usageExample: '<FreeMapView location={location} />' }
      },
      { 
        id: 'location-map-home', 
        name: 'Location Map Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'LocationMapWidget', filePath: 'mobile/src/components/home/LocationMapWidget.tsx', usageExample: '<LocationMapWidget />' }
      }
    ]
  },
  {
    id: 'screen-backgrounds',
    name: 'Screen Backgrounds',
    description: 'Background and splash components.',
    icon: 'mobile-splash',
    components: [
      { 
        id: 'screen-background', 
        name: 'Screen Background', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF') } as any,
        mobileConfig: { componentName: 'ScreenBackground', filePath: 'mobile/src/components/ScreenBackground.tsx', usageExample: '<ScreenBackground>\n  <Content />\n</ScreenBackground>' }
      },
      { 
        id: 'splash-branding', 
        name: 'Splash Branding', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFB6C1') } as any,
        mobileConfig: { componentName: 'SplashBranding', filePath: 'mobile/src/components/branding/SplashBranding.tsx', usageExample: '<SplashBranding />' }
      },
      { 
        id: 'welcome-section', 
        name: 'Welcome Section', 
        type: 'card',
        styles: { backgroundColor: solidColor('transparent') } as any,
        mobileConfig: { componentName: 'WelcomeSection', filePath: 'mobile/src/components/home/WelcomeSection.tsx', usageExample: '<WelcomeSection user={userData} />' }
      }
    ]
  },
  {
    id: 'charts-data',
    name: 'Charts & Analytics',
    description: 'Heatmaps, bar charts, and data viz.',
    icon: 'charts-data',
    components: [
      { 
        id: 'heatmap-personal', 
        name: 'Emotion Heatmap', 
        type: 'generic',
        styles: { backgroundColor: solidColor('transparent'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'EmotionHeatMap', filePath: 'mobile/src/components/EmotionHeatMap.tsx', usageExample: '<EmotionHeatMap type="personal" data={records} />' }
      },
      { 
        id: 'circle-mood', 
        name: 'Circle Mood Summary', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'CircleMoodSummary', filePath: 'mobile/src/components/home/CircleMoodSummary.tsx', usageExample: '<CircleMoodSummary circleId={circleId} />' }
      },
      { 
        id: 'circle-stats', 
        name: 'Circle Stats Drawer', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 24 } as any,
        mobileConfig: { componentName: 'CircleStatsDrawer', filePath: 'mobile/src/components/home/CircleStatsDrawer.tsx', usageExample: '<CircleStatsDrawer visible={visible} onClose={handleClose} />' }
      },
      { 
        id: 'financial-tab', 
        name: 'Financial Tab', 
        type: 'generic',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 12 } as any,
        mobileConfig: { componentName: 'FinancialTab', filePath: 'mobile/src/components/home/FinancialTab.tsx', usageExample: '<FinancialTab userId={userId} />' }
      }
    ]
  },
  {
    id: 'app-widgets',
    name: 'Dashboard Widgets',
    description: 'HomeScreen overview components.',
    icon: 'app-widgets',
    components: [
      { 
        id: 'news-widget', 
        name: 'News Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'NewsWidget', filePath: 'mobile/src/components/widgets/NewsWidget.tsx', usageExample: '<NewsWidget />' }
      },
      { 
        id: 'entertainment-widget', 
        name: 'Entertainment Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'EntertainmentWidget', filePath: 'mobile/src/components/widgets/EntertainmentWidget.tsx', usageExample: '<EntertainmentWidget />' }
      },
      { 
        id: 'expenses-widget', 
        name: 'Expenses Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'ExpensesWidget', filePath: 'mobile/src/components/widgets/ExpensesWidget.tsx', usageExample: '<ExpensesWidget />' }
      },
      { 
        id: 'location-widget', 
        name: 'Location Map Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'LocationMapWidget', filePath: 'mobile/src/components/widgets/LocationMapWidget.tsx', usageExample: '<LocationMapWidget />' }
      },
      { 
        id: 'appointments-widget', 
        name: 'Appointments Widget', 
        type: 'card',
        styles: { backgroundColor: solidColor('#FFFFFF'), borderRadius: 16 } as any,
        mobileConfig: { componentName: 'AppointmentsWidget', filePath: 'mobile/src/components/home/AppointmentsWidget.tsx', usageExample: '<AppointmentsWidget />' }
      }
    ]
  },
  {
    id: 'navigation-ui',
    name: 'Navigation UI',
    description: 'Tab bars, drawers, and menus.',
    icon: 'navigation-ui',
    components: [
      { 
        id: 'main-tab-bar', 
        name: 'Home Header', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('#FFFFFF'), textColor: solidColor('#FA7272') } as any,
        mobileConfig: { componentName: 'HomeHeader', filePath: 'mobile/src/components/home/HomeHeader.tsx', usageExample: '<HomeHeader title="Home" />' }
      },
      { 
        id: 'circle-dropdown', 
        name: 'Circle Dropdown', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('#FFFFFF'), textColor: solidColor('#1F2937') } as any,
        mobileConfig: { componentName: 'CircleDropdown', filePath: 'mobile/src/components/home/CircleDropdown.tsx', usageExample: '<CircleDropdown circles={circles} onSelect={handleSelect} />' }
      },
      { 
        id: 'underline-tabs', 
        name: 'Underline Tab Navigation', 
        type: 'tabbar',
        styles: { backgroundColor: solidColor('transparent'), textColor: solidColor('#FA7272') } as any,
        mobileConfig: { componentName: 'UnderlineTabNavigation', filePath: 'mobile/src/components/common/UnderlineTabNavigation.tsx', usageExample: '<UnderlineTabNavigation tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />' }
      }
    ]
  },
  {
    id: 'social-icons',
    name: 'Social Media Icons',
    description: 'Upload and manage social media platform icons. Data loaded from database.',
    icon: 'social',
    components: [] // Loaded dynamically from database (branding.icons.social)
  },
  {
    id: 'flag-icons',
    name: 'Country Flag Icons',
    description: 'Upload and manage country flag icons for language selection. Data loaded from database.',
    icon: 'localization',
    components: [] // Loaded dynamically from database (branding.icons.flags)
  }
]

const COMPONENT_STUDIO_CATEGORIES = [
    'buttons', 'cards', 'inputs', 'layout', 'feedback', 
    'mobile-nav', 'navigation-ui', 'mobile-actions', 
    'data-display', 'status-feedback', 'charts-data', 
    'advanced-inputs', 'lists-grids', 'circle-ui', 
    'profile-ui', 'calendar-ui', 'map-ui', 
    'communication', 'media-assets', 'safety-ui', 
    'app-widgets', 'screen-backgrounds'
]

const getComponentStudioItems = (categories: CategoryConfig[]) => {
    // 1. Filter relevant categories
    const studioCategories = categories.filter(c => COMPONENT_STUDIO_CATEGORIES.includes(c.id))
    
    // 2. Extract all components and group by componentName (to find unique implementations)
    const uniqueComponentsMap = new Map<string, { id: string, name: string, icon: string }>()
    
    studioCategories.forEach(cat => {
        cat.components.forEach(comp => {
            if (comp.mobileConfig?.componentName) {
                const cmpName = comp.mobileConfig.componentName
                if (!uniqueComponentsMap.has(cmpName)) {
                     // Use the component name as the ID for the sidebar item
                     // Use the category icon as a fallback if no specific icon logic
                     // Or check if we can map component type to an icon
                    uniqueComponentsMap.set(cmpName, {
                        id: cmpName, 
                        name: cmpName, 
                        icon: cat.icon || 'library' 
                    })
                }
            }
        })
    })

    // 3. Convert to array and sort alphabetically
    return Array.from(uniqueComponentsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export const getSidebarSections = (categories: CategoryConfig[]) => [
    {
      id: 'pillar-1',
      title: 'Identity & Presence',
      items: [
        { id: 'mobile-identity', name: 'App Identity', icon: 'identity' },
        { id: 'mobile-splash', name: 'Splash Screen', icon: 'mobile-splash' },
        { id: 'mobile-social', name: 'Links & Support', icon: 'social' },
      ]
    },
    {
      id: 'pillar-2',
      title: 'App Experience',
      items: [
        { id: 'mobile-onboarding', name: 'Onboarding Flow', icon: 'onboarding' },
        { id: 'mobile-ux', name: 'UX & Motion', icon: 'ux' },
      ]
    },
    {
      id: 'pillar-3',
      title: 'Design System',
      items: [
        { id: 'mobile-tokens', name: 'Visual Tokens', icon: 'tokens' },
        { id: 'mobile-typography', name: 'Typography', icon: 'typography' },
        { id: 'mobile-library', name: 'UI Library', icon: 'library' },
        { id: 'mobile-export', name: 'Theme Export', icon: 'export' },
      ]
    },
    {
      id: 'pillar-4',
      title: 'Advanced Controls',
      items: [
        { id: 'mobile-security', name: 'Security Hub', icon: 'security' },
        { id: 'mobile-analytics', name: 'Analytics Hub', icon: 'identity' },
        { id: 'mobile-legal', name: 'Compliance Hub', icon: 'terms' },
        { id: 'mobile-localization', name: 'Localization', icon: 'localization' },
        { id: 'mobile-seo', name: 'SEO & Metadata', icon: 'seo' },
        { id: 'mobile-updates', name: 'Force Updates', icon: 'updates' },
      ]
    },
    {
      id: 'pillar-user-flows',
      title: 'User Flows',
      items: [
         // User requested: Engagement, Announcements, Billing, Backend & Ops
        { id: 'mobile-announcements', name: 'Banners', icon: 'announcements' },
        { id: 'mobile-api', name: 'API Settings', icon: 'api' },
        { id: 'mobile-features', name: 'Feature Flags', icon: 'features' },
        { id: 'mobile-legal', name: 'Legal & Terms', icon: 'terms' },
        { id: 'mobile-team', name: 'Team Manage', icon: 'team' },
      ]
    },
    {
      id: 'pillar-component-studio',
      title: 'Component Studio',
      items: getComponentStudioItems(categories)
    }
  ]
