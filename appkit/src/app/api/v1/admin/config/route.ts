import { NextRequest, NextResponse } from 'next/server'
import { authenticate, hasPermission } from '@/lib/auth'
import defaultConfigService from '@/server/services/DefaultConfigService'

// GET /api/v1/admin/config — get complex config for an app
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
    
    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 })
    }

    // Since this is a generic "config" call, we might want to return 
    // a combined object or just a success. 
    // Looking at adminService.ts:383, it expects { config: any }
    
    const result = await defaultConfigService.getAppConfig(appId, 'general')
    return NextResponse.json({ config: result || {} })
  } catch (error: any) {
    console.error('GET config error:', error)
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
  }
}
