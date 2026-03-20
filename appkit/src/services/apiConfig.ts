// API base URL configuration
// Browser: relative URL → Next.js handles routing via rewrites
// Server (SSR): absolute URL to the running server
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // 1. Explicitly configured NEXT_PUBLIC_SITE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') + '/api';
  }

  // 2. Fallback to loopback - localhost is often more reliable than 127.0.0.1 in some Node versions
  // or it correctly resolves based on established system defaults.
  const port = process.env.PORT || '3002';
  return `http://localhost:${port}/api`;
};

export const API_BASE_URL: string = getBaseUrl();
