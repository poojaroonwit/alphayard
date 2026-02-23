// Shared API base URL configuration for the admin console
// In the browser, use relative URL so requests go through Next.js API routes
// On the server (SSR), call the backend directly
// Updated: 2026-02-23 23:36 - Railway fix v3
const localPort = process.env.PORT || '3002';

// For Railway deployment, use the Railway URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser: always use relative URL for Next.js API routes
    // Force this to ensure Railway works correctly
    const baseUrl = '/api';
    console.log('API Base URL (browser):', baseUrl);
    return baseUrl;
  }
  
  // Server-side rendering
  if (process.env.NODE_ENV === 'production') {
    // In production, use the Railway URL or fallback to localhost
    return process.env.BACKEND_ADMIN_URL || 
           process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 
           `http://127.0.0.1:${localPort}`;
  }
  
  // Development: use localhost
  return process.env.BACKEND_ADMIN_URL || `http://127.0.0.1:${localPort}`;
};

const finalUrl = process.env.NEXT_PUBLIC_API_URL || getBaseUrl();
console.log('Final API_BASE_URL:', finalUrl, 'NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

export const API_BASE_URL: string = finalUrl;
