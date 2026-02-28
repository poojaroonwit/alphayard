import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
  const requestId = uuidv4()
  const { pathname } = request.nextUrl

  console.log(`[${requestId}] ${request.method} ${request.url} - ${request.headers.get('user-agent') || 'Unknown'}`)

  // Rewrite /api/admin/* → /api/v1/admin/* (except routes with their own handlers)
  // This must happen in middleware because NextResponse.rewrite() is not supported in route handlers
  if (pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace('/api/admin/', '/api/v1/admin/')
    const response = NextResponse.rewrite(url)
    response.headers.set('X-Request-ID', requestId)
    return response
  }

  const response = NextResponse.next()

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-ID')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  response.headers.set('X-Request-ID', requestId)

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
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
