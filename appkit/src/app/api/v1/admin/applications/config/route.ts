import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import defaultConfigService from '@/server/services/DefaultConfigService'

// GET /api/v1/admin/applications/config?appId=X&configType=auth|comm|legal
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'applications:view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    const configType = searchParams.get('configType')

    if (!appId || !configType) {
      return NextResponse.json({ error: 'appId and configType are required' }, { status: 400 })
    }

    const result = await defaultConfigService.getEffectiveConfig(appId, configType)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GET app config error:', error)
    return NextResponse.json({ error: 'Failed to fetch app config' }, { status: 500 })
  }
}

// PUT /api/v1/admin/applications/config — save per-app override
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'applications:edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { appId, configType, config } = await request.json()
    if (!appId || !configType || !config) {
      return NextResponse.json({ error: 'appId, configType and config are required' }, { status: 400 })
    }

    const ok = await defaultConfigService.saveAppConfig(appId, configType, config)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ message: `App override for ${configType} saved`, useDefault: false, config })
  } catch (error: any) {
    console.error('PUT app config error:', error)
    return NextResponse.json({ error: 'Failed to save app config' }, { status: 500 })
  }
}

// DELETE /api/v1/admin/applications/config — revert to default
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'applications:edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    const configType = searchParams.get('configType')

    if (!appId || !configType) {
      return NextResponse.json({ error: 'appId and configType are required' }, { status: 400 })
    }

    const ok = await defaultConfigService.deleteAppConfig(appId, configType)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ message: `App override for ${configType} removed, using defaults`, useDefault: true })
  } catch (error: any) {
    console.error('DELETE app config error:', error)
    return NextResponse.json({ error: 'Failed to delete app config' }, { status: 500 })
  }
}
