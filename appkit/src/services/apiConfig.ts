// Shared API base URL configuration for the admin console
// In the browser, use relative URL so requests go through Next.js proxy (next.config.js rewrites /api/* -> 127.0.0.1:3001/api/*)
// On the server (SSR), call the backend directly
const defaultBase = typeof window !== 'undefined'
  ? '/api/v1'  // Browser: uses dynamic middleware proxy
  : `${process.env.BACKEND_ADMIN_URL || 'http://127.0.0.1:3001'}/api/v1`;  // SSR: uses runtime env var

export const API_BASE_URL: string = (typeof window !== 'undefined' ? '/api/v1' : process.env.NEXT_PUBLIC_API_URL) || defaultBase;
