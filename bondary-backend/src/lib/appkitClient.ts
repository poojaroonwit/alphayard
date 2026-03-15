// ============================================================================
// Shared AppKit SDK singleton for server-to-server (service) calls
// ============================================================================

import { AppKit } from '@alphayard/appkit';
import { config } from '../config/env';

export const appkitClient = new AppKit({
  clientId: config.APPKIT_CLIENT_ID,
  domain: config.APPKIT_URL,
  storage: 'memory',
  ...(config.APPKIT_CLIENT_SECRET
    ? { clientSecret: config.APPKIT_CLIENT_SECRET }
    : { apiKey: config.INTERNAL_API_KEY }),
});
