// Catch-all redirect for /api/admin/* to /api/v1/admin/*
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  return NextResponse.redirect(new URL(`/api/v1/admin/${slug}`, request.url))
}

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  return NextResponse.redirect(new URL(`/api/v1/admin/${slug}`, request.url))
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  return NextResponse.redirect(new URL(`/api/v1/admin/${slug}`, request.url))
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/')
  return NextResponse.redirect(new URL(`/api/v1/admin/${slug}`, request.url))
}
