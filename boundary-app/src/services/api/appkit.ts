import { AppKit } from '@alphayard/appkit';
import { API_CONFIG } from '../../constants/app';

// Initialize AppKit SDK
// Pointing directly to AppKit Server
export const appkit = new AppKit({
  clientId: 'boundary-mobile-app',
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  domain: process.env.EXPO_PUBLIC_APPKIT_DOMAIN || 'https://appkits.up.railway.app',
  storage: 'localStorage',
});

export default appkit;
