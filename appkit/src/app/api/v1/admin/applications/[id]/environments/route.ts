import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { authenticate } from '@/lib/auth'
import { randomBytes } from 'crypto'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseSettings(input: unknown): Record<string, any> {
  if (typeof input === 'string') {
    try { return JSON.parse(input || '{}') } catch { return {} }
  }
  return input && typeof input === 'object' ? { ...(input as Record<string, any>) } : {}
}

// GET /api/v1/admin/applications/[id]/environments
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const { id } = params
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })

    const app = await prisma.application.findUnique({ where: { id }, select: { settings: true } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const settings = parseSettings(app.settings)
    const environments = Array.isArray(settings.environments) ? settings.environments : []

    return NextResponse.json({ environments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

// POST /api/v1/admin/applications/[id]/environments
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })

    const { id } = params
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })

    const app = await prisma.application.findUnique({ where: { id }, select: { settings: true } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const body = await request.json()
    const { name, type, copyFrom } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const settings = parseSettings(app.settings)
    const environments: any[] = Array.isArray(settings.environments) ? settings.environments : []

    const newEnv: Record<string, any> = {
      id: randomBytes(8).toString('hex'),
      name: name.trim(),
      type: ['development', 'staging', 'production', 'custom'].includes(type) ? type : 'development',
      apiKey: `env_${randomBytes(20).toString('hex')}`,
      variables: [],
      config: {},
      createdAt: new Date().toISOString(),
    }

    if (copyFrom) {
      const source = environments.find((e: any) => e.id === copyFrom)
      if (source?.variables) newEnv.variables = [...source.variables]
      if (source?.config) newEnv.config = { ...source.config }
    }

    environments.push(newEnv)
    settings.environments = environments

    await prisma.application.update({ where: { id }, data: { settings } })

    return NextResponse.json({ environment: newEnv }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
