// Catch-all proxy for /api/admin/* to /api/v1/admin/* with fallback for Railway
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_ADMIN_URL || 
                   process.env.NEXT_PUBLIC_BACKEND_URL || 
                   'http://127.0.0.1:4000'

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  
  // If backend URL is localhost, try to proxy; otherwise return fallback
  if (BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
    try {
      const url = new URL(request.url)
      const backendUrl = `${BACKEND_URL}/api/v1/admin/${slug}${url.search}`
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('API proxy error:', error)
    }
  }
  
  // Fallback for Railway or when backend is unavailable
  return NextResponse.json({
    success: false,
    error: 'Service temporarily unavailable in production mode',
    message: 'This endpoint is not available in the current deployment'
  }, { status: 503 })
}

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  const body = await request.json()
  
  // If backend URL is localhost, try to proxy; otherwise return fallback
  if (BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
    try {
      const backendUrl = `${BACKEND_URL}/api/v1/admin/${slug}`
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('API proxy error:', error)
    }
  }
  
  // Fallback for Railway or when backend is unavailable
  return NextResponse.json({
    success: false,
    error: 'Service temporarily unavailable in production mode',
    message: 'This endpoint is not available in the current deployment'
  }, { status: 503 })
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  const body = await request.json()
  
  // If backend URL is localhost, try to proxy; otherwise return fallback
  if (BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
    try {
      const url = new URL(request.url)
      const backendUrl = `${BACKEND_URL}/api/v1/admin/${slug}${url.search}`
      
      const response = await fetch(backendUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('API proxy error:', error)
    }
  }
  
  // Fallback for Railway or when backend is unavailable
  return NextResponse.json({
    success: false,
    error: 'Service temporarily unavailable in production mode',
    message: 'This endpoint is not available in the current deployment'
  }, { status: 503 })
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  
  // If backend URL is localhost, try to proxy; otherwise return fallback
  if (BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
    try {
      const url = new URL(request.url)
      const backendUrl = `${BACKEND_URL}/api/v1/admin/${slug}${url.search}`
      
      const response = await fetch(backendUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('API proxy error:', error)
    }
  }
  
  // Fallback for Railway or when backend is unavailable
  return NextResponse.json({
    success: false,
    error: 'Service temporarily unavailable in production mode',
    message: 'This endpoint is not available in the current deployment'
  }, { status: 503 })
}
