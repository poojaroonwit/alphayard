import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import entityService from '@/server/services/EntityService'

// GET /api/v1/admin/entities?typeName=<type>&applicationId=<id>
// Returns paginated unified entities of a given type
export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
  }

  const { searchParams } = new URL(request.url)
  const typeName = searchParams.get('typeName')
  if (!typeName) {
    return NextResponse.json({ error: 'typeName query parameter is required' }, { status: 400 })
  }

  const applicationId = searchParams.get('applicationId') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const orderBy = searchParams.get('orderBy') || undefined
  const orderDir = (searchParams.get('orderDir') || 'desc') as 'asc' | 'desc'
  const status = searchParams.get('status') || undefined

  try {
    const result = await entityService.queryEntities(typeName, {
      applicationId,
      status,
      page,
      limit,
      orderBy,
      orderDir,
    })

    return NextResponse.json({
      entities: result.entities,
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  } catch (error: any) {
    console.error('Get entities error:', error)
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
  }
}

// POST /api/v1/admin/entities — create a unified entity
export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
  }

  try {
    const body = await request.json()
    const { typeName, applicationId, ownerId, attributes, metadata } = body

    if (!typeName) {
      return NextResponse.json({ error: 'typeName is required' }, { status: 400 })
    }

    const entity = await entityService.createEntity({
      typeName,
      applicationId,
      ownerId,
      attributes: attributes || {},
      metadata,
    })

    return NextResponse.json({ entity }, { status: 201 })
  } catch (error: any) {
    console.error('Create entity error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
