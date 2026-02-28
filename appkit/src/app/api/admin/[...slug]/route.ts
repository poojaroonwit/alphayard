// Fallback for /api/admin/* routes not handled by specific route files.
// Middleware rewrites /api/admin/* → /api/v1/admin/* before this is reached,
// so this only runs if the middleware rewrite is skipped (e.g. excluded paths).
import { NextRequest, NextResponse } from 'next/server'

function notFound(slug: string[]) {
  return NextResponse.json(
    { error: `Route /api/admin/${slug.join('/')} not found` },
    { status: 404 }
  )
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string[] } }) {
  return notFound(params.slug)
}

export async function POST(_req: NextRequest, { params }: { params: { slug: string[] } }) {
  return notFound(params.slug)
}

export async function PUT(_req: NextRequest, { params }: { params: { slug: string[] } }) {
  return notFound(params.slug)
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string[] } }) {
  return notFound(params.slug)
}

export async function PATCH(_req: NextRequest, { params }: { params: { slug: string[] } }) {
  return notFound(params.slug)
}
