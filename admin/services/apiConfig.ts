// Shared API base URL configuration for the admin console
// Backend runs on port 3001, admin frontend on port 4000
const defaultBase = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:4000/api/v1`
  : 'http://localhost:4000/api/v1';

export const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || defaultBase;
