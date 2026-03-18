import { AppKit } from '@alphayard/appkit';

// Initialize AppKit SDK
// Pointing directly to AppKit Server
const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const appkit = new AppKit({
  clientId: 'boundary-mobile-app',
  baseURL: apiBase,
  domain: process.env.EXPO_PUBLIC_APPKIT_DOMAIN || 'https://appkits.up.railway.app',
  storage: 'localStorage',
  // Use the backend's direct JWT refresh endpoint instead of the OAuth /token endpoint.
  // The OAuth endpoint requires boundary-mobile-app to be a registered OAuth client in DB.
  tokenRefreshUrl: `${apiBase}/auth/refresh`,
});

export default appkit;
