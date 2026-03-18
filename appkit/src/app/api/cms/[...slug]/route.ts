import { NextRequest, NextResponse } from 'next/server'
import cmsController from '@/server/controllers/admin/CMSController'
import { Request, Response } from 'express'

/**
 * Adapter to allow Express-based controllers to run in Next.js App Router
 */
async function adaptController(req: NextRequest, params: { slug: string[] }, controllerMethod: (req: Request, res: Response) => Promise<any>) {
  const slug = params.slug
  const method = req.method
  
  // Construct a mock Express Request
  const mockReq: any = {
    method,
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(req.nextUrl.searchParams.entries()),
    params: {
        id: slug[slug.length - 1], // Usually the last part of slug is the ID if needed
        ...Object.fromEntries(slug.map((s, i) => [`slug${i}`, s]))
    },
    body: {}
  }

  // Handle params mapping based on common patterns
  // Pattern: /api/cms/content/admin/content/:id
  if (slug.includes('content') && slug.length > 3) {
      mockReq.params.id = slug[slug.length - 1]
  }

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      mockReq.body = await req.json()
    } catch (e) {
      mockReq.body = {}
    }
  }

  let status = 200
  let jsonResponse: any = null

  // Construct a mock Express Response
  const mockRes: any = {
    status: (s: number) => {
      status = s
      return mockRes
    },
    json: (j: any) => {
      jsonResponse = j
      return mockRes
    }
  }

  await controllerMethod(mockReq, mockRes)

  return NextResponse.json(jsonResponse, { status })
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const { slug } = params
  const path = slug.join('/')
  const controller = cmsController as any

  // Localization
  if (path === 'localization/languages') return adaptController(req, params, controller.getLanguages.bind(controller))
  if (path === 'localization/categories') return adaptController(req, params, controller.getCategories.bind(controller))
  if (path === 'localization/keys') return adaptController(req, params, controller.getTranslationKeys.bind(controller))
  
  // Content
  if (path === 'content/pages') return adaptController(req, params, controller.getContent.bind(controller))
  if (path === 'content/admin/content') return adaptController(req, params, controller.getContent.bind(controller))
  if (path === 'content/templates') return adaptController(req, params, controller.getContentTemplates.bind(controller))
  if (path === 'analytics') return adaptController(req, params, controller.getContentAnalytics.bind(controller))
  
  // Dynamic Content Paths
  if (path.startsWith('content/pages/')) return adaptController(req, params, controller.getContentById.bind(controller))
  
  // Versions
  if (path.includes('/versions') && !path.includes('/compare')) {
     if (slug.length === 5 && slug[0] === 'versions' && slug[1] === 'pages' && slug[3] === 'versions') {
        // GET /cms/versions/pages/:id/versions/:versionId
        return adaptController(req, { slug: [slug[4]] } as any, controller.getContentVersion.bind(controller))
     }
     if (slug.length === 4 && slug[0] === 'versions' && slug[1] === 'pages' && slug[3] === 'versions') {
        // GET /cms/versions/pages/:id/versions
        return adaptController(req, { slug: [slug[2]] } as any, controller.getContentVersions.bind(controller))
     }
  }

  if (path.includes('/compare')) {
      return adaptController(req, params, controller.compareContentVersions.bind(controller))
  }
  
  return NextResponse.json({ error: 'Endpoint not found', path }, { status: 404 })
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const { slug } = params
  const path = slug.join('/')
  const controller = cmsController as any

  if (path === 'content/pages') return adaptController(req, params, controller.createContent.bind(controller))
  if (path === 'localization/categories') return adaptController(req, params, controller.createCategory.bind(controller))
  if (path.startsWith('content/templates/') && path.endsWith('/create')) {
      return adaptController(req, { slug: [slug[2]] } as any, controller.createContentFromTemplate.bind(controller))
  }
  
  // Versions
  if (path.includes('/versions')) {
      if (path.endsWith('/restore')) {
          return adaptController(req, { slug: [slug[2], slug[4]] } as any, controller.restoreContentVersion.bind(controller))
      }
      if (slug.length === 4) {
          return adaptController(req, { slug: [slug[2]] } as any, controller.createContentVersion.bind(controller))
      }
  }

  if (path.endsWith('/auto-save')) {
      return adaptController(req, { slug: [slug[2]] } as any, controller.autoSaveContent.bind(controller))
  }
  
  return NextResponse.json({ error: 'Endpoint not found', path }, { status: 404 })
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const { slug } = params
  const path = slug.join('/')
  const controller = cmsController as any

  if (path.startsWith('content/pages/')) return adaptController(req, { slug: [slug[2]] } as any, controller.updateContent.bind(controller))
  
  return NextResponse.json({ error: 'Endpoint not found', path }, { status: 404 })
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const { slug } = params
  const path = slug.join('/')
  const controller = cmsController as any

  if (path.startsWith('content/pages/')) return adaptController(req, { slug: [slug[2]] } as any, controller.deleteContent.bind(controller))
  
  if (path.includes('/versions/')) {
       return adaptController(req, { slug: [slug[4]] } as any, controller.deleteContentVersion.bind(controller))
  }

  return NextResponse.json({ error: 'Endpoint not found', path }, { status: 404 })
}

