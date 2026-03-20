import { NextRequest } from 'next/server';

/**
 * Returns the list of allowed origins from the CORS_ORIGIN env var.
 * CORS_ORIGIN can be:
 *   - "*"                          → allow all (development / React Native)
 *   - "https://example.com"        → single origin
 *   - "https://a.com,https://b.com" → comma-separated list
 */
function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN || '*';
  if (raw === '*') return ['*'];
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

/**
 * Resolves the correct Access-Control-Allow-Origin value for a request.
 *
 * - Wildcard mode: returns "*"
 * - React Native / curl (no origin header): reflects the first allowed origin
 * - Browser request from allowed origin: reflects that origin
 * - Browser request from unknown origin: reflects the first allowed origin
 *   (the browser will still block it — we never echo an untrusted origin)
 */
export function resolveOrigin(req: NextRequest): string {
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes('*')) return '*';

  const requestOrigin = req.headers.get('origin');

  // React Native / non-browser clients send no Origin or "null"
  if (!requestOrigin || requestOrigin === 'null') {
    return allowedOrigins[0];
  }

  return allowedOrigins.includes(requestOrigin)
    ? requestOrigin  // reflect exact match
    : allowedOrigins[0]; // unknown origin — never echo it back
}

/**
 * Builds CORS headers for a given request.
 * Pass `methods` to restrict which HTTP methods are allowed on that route.
 */
export function buildCorsHeaders(
  req: NextRequest,
  methods = 'POST, OPTIONS'
): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(req),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-ID, X-App-Slug',
    'Vary': 'Origin',
  };
}
