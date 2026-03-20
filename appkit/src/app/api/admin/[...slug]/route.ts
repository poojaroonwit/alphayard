// Catch-all proxy: /api/admin/* → /api/v1/admin/* via internal fetch
import { NextRequest, NextResponse } from 'next/server'

const BASE = `http://localhost:${process.env.PORT || 3001}`

async function proxy(request: NextRequest, slug: string[]) {
  const target = `${BASE}/api/v1/admin/${slug.join('/')}${request.nextUrl.search}`

  // Forward headers (including Authorization)
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    if (key !== 'host' && key !== 'connection') {
      headers.set(key, value)
    }
  }

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
    }

    // Forward body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) init.body = body
      } catch {
        // No body
      }
    }

    const res = await fetch(target, init)
    const data = await res.text()

    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  } catch (error: any) {
    console.error(`[proxy] ${request.method} /api/admin/${slug.join('/')} failed:`, error)
    return NextResponse.json({ 
      error: 'Service unavailable', 
      details: error.message,
      target
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
