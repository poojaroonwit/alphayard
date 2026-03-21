import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
  const requestId = uuidv4()
  const { pathname } = request.nextUrl

  console.log(`[${requestId}] ${request.method} ${request.url} - ${request.headers.get('user-agent') || 'Unknown'}`)

  if (pathname === '/system/logs') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/settings/logs'
    return NextResponse.redirect(redirectUrl)
  }

  const response = NextResponse.next()

  // API routes manage their own CORS headers to prevent duplicate header values
  // when both middleware and route handler set Access-Control-Allow-Origin.
  // Only set CORS on non-API paths (e.g., admin UI pages).
  if (!pathname.startsWith('/api/')) {
    const requestOrigin = request.headers.get('origin')
    const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim())
    const isWildcard = allowedOrigins.includes('*')
    const allowOrigin = isWildcard
      ? '*'
      : allowedOrigins.includes(requestOrigin || '')
        ? requestOrigin!
        : allowedOrigins[0]

    response.headers.set('Access-Control-Allow-Origin', allowOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-ID')
    response.headers.set('Vary', 'Origin')
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  response.headers.set('X-Request-ID', requestId)

  if (request.method === 'OPTIONS') {
    // Add CORS headers to every preflight response — the route-handler OPTIONS
    // exports never fire because this middleware intercepts OPTIONS first.
    const rawOrigins = process.env.CORS_ORIGIN || '*';
    const requestOrigin = request.headers.get('origin') || '';
    let allowOrigin = '*';
    if (rawOrigins !== '*') {
      const origins = rawOrigins.split(',').map((o) => o.trim());
      allowOrigin = origins.includes(requestOrigin) ? requestOrigin : origins[0];
    }
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-ID, X-App-Slug');
    response.headers.set('Vary', 'Origin');
    return new NextResponse(null, { status: 204, headers: response.headers })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
