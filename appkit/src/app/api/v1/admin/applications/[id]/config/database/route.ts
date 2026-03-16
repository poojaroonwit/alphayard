import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

// GET /api/v1/admin/applications/[id]/config/database
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const app = await prisma.application.findUnique({ where: { id: params.id }, select: { settings: true } })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const settings = (app.settings as any) || {}
  return NextResponse.json({ database: settings.database || null })
}

// PUT /api/v1/admin/applications/[id]/config/database
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const body = await request.json()
  const { database } = body

  const app = await prisma.application.findUnique({ where: { id: params.id }, select: { settings: true } })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const settings = (app.settings as any) || {}
  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { settings: { ...settings, database } },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: updated.id })
}
