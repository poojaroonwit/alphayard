import { NextRequest } from 'next/server';

/**
 * Extract the application ID from request headers.
 * Reads `x-app-id` (UUID) first, then `x-app-slug` as a named fallback.
 * Returns undefined if neither header is present.
 */
export function getAppId(req: NextRequest): string | undefined {
  return req.headers.get('x-app-id') || req.headers.get('x-app-slug') || undefined;
}
