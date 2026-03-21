import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { authenticate } from '@/lib/auth'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseSettings(input: unknown): Record<string, any> {
  if (typeof input === 'string') {
    try { return JSON.parse(input || '{}') } catch { return {} }
  }
  return input && typeof input === 'object' ? { ...(input as Record<string, any>) } : {}
}

// PUT /api/v1/admin/applications/[id]/environments/[envId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; envId: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const { id, envId } = params
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })

    const app = await prisma.application.findUnique({ where: { id }, select: { settings: true } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const settings = parseSettings(app.settings)
    const environments: any[] = Array.isArray(settings.environments) ? settings.environments : []

    const idx = environments.findIndex((e: any) => e.id === envId)
    if (idx === -1) return NextResponse.json({ error: 'Environment not found' }, { status: 404 })

    const body = await request.json()
    const { name, type, variables, config } = body

    if (name !== undefined) environments[idx].name = String(name).trim() || environments[idx].name
    if (type && ['development', 'staging', 'production', 'custom'].includes(type)) environments[idx].type = type
    if (Array.isArray(variables)) environments[idx].variables = variables
    if (config !== undefined && typeof config === 'object') {
      // Merge patch: only update the provided top-level config sections
      environments[idx].config = { ...(environments[idx].config || {}), ...config }
    }

    settings.environments = environments
    await prisma.application.update({ where: { id }, data: { settings } })

    return NextResponse.json({ environment: environments[idx] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

// DELETE /api/v1/admin/applications/[id]/environments/[envId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; envId: string } }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const { id, envId } = params
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })

    const app = await prisma.application.findUnique({ where: { id }, select: { settings: true } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const settings = parseSettings(app.settings)
    const environments: any[] = Array.isArray(settings.environments) ? settings.environments : []

    const filtered = environments.filter((e: any) => e.id !== envId)
    if (filtered.length === environments.length) return NextResponse.json({ error: 'Environment not found' }, { status: 404 })

    settings.environments = filtered
    await prisma.application.update({ where: { id }, data: { settings } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
