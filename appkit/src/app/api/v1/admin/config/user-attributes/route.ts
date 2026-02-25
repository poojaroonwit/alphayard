import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import defaultConfigService from '@/server/services/DefaultConfigService'

// GET /api/v1/admin/config/user-attributes — get default user attributes
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'system:view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const attributes = await defaultConfigService.getDefaultUserAttributes()
    return NextResponse.json({ attributes: attributes || [] }) 
  } catch (error: any) {
    console.error('GET user-attributes error:', error)
    return NextResponse.json({ error: 'Failed to fetch user attributes' }, { status: 500 })
  }
}

// POST /api/v1/admin/config/user-attributes — save default user attributes
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'system:edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const ok = await defaultConfigService.saveDefaultUserAttributes(body)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Saved successfully', attributes: body })
  } catch (error: any) {
    console.error('POST user-attributes error:', error)
    return NextResponse.json({ error: 'Failed to save user attributes' }, { status: 500 })
  }
}
