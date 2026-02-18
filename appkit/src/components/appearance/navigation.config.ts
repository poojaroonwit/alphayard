import { ScreenConfig } from './types'

export const SUGGESTED_SCREENS: Partial<ScreenConfig>[] = [
    { id: 'welcome', name: 'Welcome', type: 'screen' },
    { id: 'login', name: 'Login', type: 'screen' },
    { id: 'register', name: 'Register', type: 'screen' },
    { id: 'pin-setup', name: 'PIN Setup', type: 'screen' },
    { id: 'pin-unlock', name: 'PIN Unlock', type: 'screen' },
    { id: 'otp', name: 'OTP Verification', type: 'screen' },
    { id: 'home', name: 'Home', type: 'screen' },
    { id: 'applications', name: 'Applications List', type: 'screen' },
    { id: 'profile', name: 'Profile', type: 'screen' },
    { id: 'settings', name: 'Settings', type: 'screen' },
    { id: 'chat-list', name: 'Chat List', type: 'screen' },
    { id: 'notifications', name: 'Notifications', type: 'screen' },
    { id: 'gallery', name: 'Gallery', type: 'modal' },
    { id: 'calendar', name: 'Calendar', type: 'screen' },
    { id: 'support', name: 'Support Help', type: 'screen' },
    { id: 'terms', name: 'Terms & Conditions', type: 'modal' },
]
