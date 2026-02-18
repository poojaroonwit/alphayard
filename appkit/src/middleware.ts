import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only proxy requests starting with /api
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const backendUrl = process.env.BACKEND_ADMIN_URL || 'http://127.0.0.1:3001';
    
    // Construct the target URL
    // e.g. /api/v1/auth/login -> http://backend:3001/api/v1/auth/login
    const targetUrl = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      backendUrl
    );

    return NextResponse.rewrite(targetUrl);
  }

  return NextResponse.next();
}

// Match only the /api path
export const config = {
  matcher: '/api/:path*',
}
