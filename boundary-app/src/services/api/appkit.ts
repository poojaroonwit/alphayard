import { AppKit } from '@alphayard/appkit';

// Option B: SDK points to bondary-backend as the single API entry point.
// Bondary-backend handles mobile routes natively and proxies unmatched routes to appkit.
// Override with EXPO_PUBLIC_API_URL (bondary-backend base including /api/v1).
const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
// domain still points to appkit for SSO/OAuth callbacks
const appkitDomain = process.env.EXPO_PUBLIC_APPKIT_DOMAIN ||
  (process.env.EXPO_PUBLIC_APPKIT_URL ? new URL(process.env.EXPO_PUBLIC_APPKIT_URL).origin : 'http://127.0.0.1:3001');

console.log('[AppKit] Initializing with baseURL:', apiBase);
console.log('[AppKit] Initializing with domain:', appkitDomain);

export const appkit = new AppKit({
  clientId: 'boundary-mobile-app',
  baseURL: apiBase,
  domain: appkitDomain,
  storage: 'localStorage',
  tokenRefreshUrl: `${apiBase}/auth/refresh`,
});

export default appkit;
