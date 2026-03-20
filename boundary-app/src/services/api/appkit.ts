import { AppKit } from '@alphayard/appkit';

// AppKit Server handles all auth, identity, CMS, and module API calls.
// For local dev: AppKit runs on port 3001.
// Override with EXPO_PUBLIC_APPKIT_URL (full base including /api/v1).
// Override domain (for SDK module calls) with EXPO_PUBLIC_APPKIT_DOMAIN.
const appkitBase = process.env.EXPO_PUBLIC_APPKIT_URL || 'http://localhost:3001/api/v1';
// If domain isn't set, derive it from baseURL or fall back to localhost:3001
const appkitDomain = process.env.EXPO_PUBLIC_APPKIT_DOMAIN || 
  (process.env.EXPO_PUBLIC_APPKIT_URL ? new URL(process.env.EXPO_PUBLIC_APPKIT_URL).origin : 'http://localhost:3001');

export const appkit = new AppKit({
  clientId: 'boundary-mobile-app',
  baseURL: appkitBase,
  domain: appkitDomain,
  storage: 'localStorage',
  tokenRefreshUrl: `${appkitBase}/auth/refresh`,
});

export default appkit;
