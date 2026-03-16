import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

// GET /api/v1/admin/applications/[id]/config/storage
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const app = await prisma.application.findUnique({ where: { id: params.id }, select: { settings: true } })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const settings = (app.settings as any) || {}
  const storage = settings.storage ? { ...settings.storage, secretKey: settings.storage.secretKey ? '••••••••' : '' } : null
  return NextResponse.json({ storage })
}

// PUT /api/v1/admin/applications/[id]/config/storage
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const body = await request.json()
  const { storage } = body

  const app = await prisma.application.findUnique({ where: { id: params.id }, select: { settings: true } })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const settings = (app.settings as any) || {}
  // If secretKey is masked (unchanged), keep existing
  const existingSecret = settings.storage?.secretKey
  const finalStorage = { ...storage }
  if (storage.secretKey === '••••••••' && existingSecret) {
    finalStorage.secretKey = existingSecret
  }

  await prisma.application.update({
    where: { id: params.id },
    data: { settings: { ...settings, storage: finalStorage } },
  })

  return NextResponse.json({ ok: true })
}
