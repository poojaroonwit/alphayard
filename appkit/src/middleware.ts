import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
  const requestId = uuidv4()
  const { pathname } = request.nextUrl

  console.log(`[${requestId}] ${request.method} ${request.url} - ${request.headers.get('user-agent') || 'Unknown'}`)

  const response = NextResponse.next()

  // CORS headers
  const requestOrigin = request.headers.get('origin')
  const requestHeaders = request.headers.get('access-control-request-headers') || 'Content-Type, Authorization, X-App-ID'
  const allowOrigin = requestOrigin || '*'
  response.headers.set('Access-Control-Allow-Origin', allowOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', requestHeaders)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Vary', 'Origin, Access-Control-Request-Headers')

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  response.headers.set('X-Request-ID', requestId)

  if (request.method === 'OPTIONS') {
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
