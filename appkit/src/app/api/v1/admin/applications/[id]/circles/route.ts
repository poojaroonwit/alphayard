import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_CIRCLE_TYPES = new Set([
  'organization',
  'department',
  'team',
  'family',
  'household',
  'friend-group',
  'custom',
])

function toTree(circles: any[]) {
  const byId = new Map<string, any>()
  circles.forEach((circle) => byId.set(circle.id, { ...circle, children: [] as any[] }))
  const roots: any[] = []
  byId.forEach((circle) => {
    if (circle.parentId && byId.has(circle.parentId)) {
      byId.get(circle.parentId).children.push(circle)
    } else {
      roots.push(circle)
    }
  })
  return roots
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id
    if (!UUID_REGEX.test(appId)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 })
    }

    const app = await prisma.application.findUnique({ where: { id: appId }, select: { id: true } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const circles = await prisma.circle.findMany({
      where: { applicationId: appId },
      orderBy: { createdAt: 'asc' },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        owners: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        billingAssignees: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    })

    return NextResponse.json({
      circles,
      hierarchy: toTree(circles),
    })
  } catch (error) {
    console.error('Failed to fetch circles:', error)
    return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id
    if (!UUID_REGEX.test(appId)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const circleTypeRaw = typeof body.circleType === 'string' ? body.circleType.trim().toLowerCase() : 'team'
    const circleType = ALLOWED_CIRCLE_TYPES.has(circleTypeRaw) ? circleTypeRaw : 'team'
    const parentId = typeof body.parentId === 'string' && UUID_REGEX.test(body.parentId) ? body.parentId : null

    if (!name) {
      return NextResponse.json({ error: 'Circle name is required' }, { status: 400 })
    }

    const app = await prisma.application.findUnique({ where: { id: appId }, select: { id: true } })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    if (parentId) {
      const parent = await prisma.circle.findFirst({
        where: { id: parentId, applicationId: appId },
        select: { id: true },
      })
      if (!parent) {
        return NextResponse.json({ error: 'Parent circle not found in this application' }, { status: 400 })
      }
    }

    const pinCode = typeof body.pinCode === 'string' ? body.pinCode.trim().substring(0, 10) : null
    const circleCode = typeof body.circleCode === 'string' ? body.circleCode.trim().substring(0, 50) : null

    const circle = await prisma.circle.create({
      data: {
        applicationId: appId,
        name,
        description,
        circleType,
        parentId,
        pinCode,
        circleCode,
      },
    })

    return NextResponse.json({ circle }, { status: 201 })
  } catch (error) {
    console.error('Failed to create circle:', error)
    return NextResponse.json({ error: 'Failed to create circle' }, { status: 500 })
  }
}
