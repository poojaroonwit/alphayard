import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import defaultConfigService from '@/server/services/DefaultConfigService'

// GET /api/v1/admin/config/auth-methods — platform-default auth providers
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'settings:view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const methods = await defaultConfigService.getDefaultAuthMethods()
    return NextResponse.json({ methods })
  } catch (error: any) {
    console.error('GET default auth methods error:', error)
    return NextResponse.json({ error: 'Failed to fetch auth methods' }, { status: 500 })
  }
}

// PUT /api/v1/admin/config/auth-methods — save platform-default auth providers
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'settings:edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { methods } = await request.json()
    if (!methods || !Array.isArray(methods)) {
      return NextResponse.json({ error: 'methods array is required' }, { status: 400 })
    }

    const ok = await defaultConfigService.saveDefaultAuthMethods(methods)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    const updated = await defaultConfigService.getDefaultAuthMethods()
    return NextResponse.json({ methods: updated, message: 'Auth methods defaults saved' })
  } catch (error: any) {
    console.error('PUT default auth methods error:', error)
    return NextResponse.json({ error: 'Failed to save auth methods' }, { status: 500 })
  }
}
