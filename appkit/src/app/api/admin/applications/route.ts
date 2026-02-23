// Redirect /api/admin/* to /api/v1/admin/* for backward compatibility
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/admin/applications', request.url))
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/admin/applications', request.url))
}

export async function PUT(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/admin/applications', request.url))
}

export async function DELETE(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/v1/admin/applications', request.url))
}
