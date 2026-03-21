import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })
    }

    const setting = await prisma.appSetting.findFirst({
      where: { applicationId: id, key: 'feature_flags' }
    })

    return NextResponse.json({ flags: setting?.value ?? {} })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })
    }

    const app = await prisma.application.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const flags = body.flags && typeof body.flags === 'object' ? body.flags : {}

    await prisma.appSetting.upsert({
      where: { applicationId_key: { applicationId: id, key: 'feature_flags' } },
      update: { value: flags },
      create: { applicationId: id, key: 'feature_flags', value: flags }
    })

    return NextResponse.json({ flags })
  } catch (error) {
    console.error('Error saving feature flags:', error)
    return NextResponse.json({ error: 'Failed to save feature flags' }, { status: 500 })
  }
}
