import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import defaultConfigService from '@/server/services/DefaultConfigService'

// GET /api/v1/admin/config/communication — platform-default communication config
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'settings:view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const config = await defaultConfigService.getDefaultCommConfig()
    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('GET default comm config error:', error)
    return NextResponse.json({ error: 'Failed to fetch communication config' }, { status: 500 })
  }
}

// PUT /api/v1/admin/config/communication — save platform-default communication config
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }
    if (!hasPermission(auth.admin, 'settings:edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { config } = await request.json()
    if (!config) {
      return NextResponse.json({ error: 'config object is required' }, { status: 400 })
    }

    const ok = await defaultConfigService.saveDefaultCommConfig(config)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ config, message: 'Communication defaults saved' })
  } catch (error: any) {
    console.error('PUT default comm config error:', error)
    return NextResponse.json({ error: 'Failed to save communication config' }, { status: 500 })
  }
}
