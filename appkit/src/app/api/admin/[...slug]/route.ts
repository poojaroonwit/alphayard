// Catch-all proxy: /api/admin/* → /api/v1/admin/* via internal fetch
import { NextRequest, NextResponse } from 'next/server'

async function proxy(request: NextRequest, slug: string[]) {
  // Use a more robust BASE URL for server-side internal fetching
  const getBase = () => {
    // 1. Explicitly configured NEXT_PUBLIC_SITE_URL
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    
    // 2. Try to derive from request headers (Host header)
    // This is most reliable in production behind a proxy (Nginx, Vercel, etc.)
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    if (host) return `${proto}://${host}`;
    
    // 3. Fallback to loopback
    const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? '3000' : '3001');
    return `http://localhost:${PORT}`;
  }
  const BASE = getBase();
  
  // Decide target base path: CMS is top-level, others are under v1/admin
  const isCms = slug[0] === 'cms'
  const targetPath = isCms 
    ? `/api/cms/${slug.slice(1).join('/')}` 
    : `/api/v1/admin/${slug.join('/')}`

  const target = `${BASE}${targetPath}${request.nextUrl.search}`

  // Forward headers (including Authorization)
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    if (key !== 'host' && key !== 'connection') {
      headers.set(key, value)
    }
  }

  try {
    console.log(`[proxy] Forwarding ${request.method} /api/admin/${slug.join('/')} to ${target}`)
    
    const init: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store'
    }

    // Forward body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) init.body = body
      } catch (err) {
        console.warn('[proxy] Failed to read request body:', err)
      }
    }

    const res = await fetch(target, init)
    const data = await res.text()

    if (!res.ok) {
      console.warn(`[proxy] Target returned ${res.status} for ${target}`)
    }

    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  } catch (error: any) {
    console.error(`[proxy] CRITICAL FAILURE: ${request.method} /api/admin/${slug.join('/')} → ${target}:`, error)
    return NextResponse.json({ 
      error: 'Service unavailable', 
      details: error.message,
      code: error.code || 'UNKNOWN',
      target: target.replace('127.0.0.1', 'HIDDEN') // Hide internal IP but show port/path
    }, { status: 503 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}
