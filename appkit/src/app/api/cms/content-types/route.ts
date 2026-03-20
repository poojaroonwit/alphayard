import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  
  // Mock content types to satisfy the Content Studio UI
  const types = [
    {
      id: 'page',
      name: 'Page',
      description: 'Standard website page with SEO and content blocks',
      category: 'content',
      icon: 'DocumentTextIcon',
      color: 'blue',
      isActive: true,
      isBuiltIn: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [
        { id: 'title', name: 'title', label: 'Title', type: 'text', required: true, display: { order: 1, width: 'full' } },
        { id: 'slug', name: 'slug', label: 'Slug', type: 'text', required: true, display: { order: 2, width: 'half' } },
        { id: 'content', name: 'content', label: 'Content', type: 'richtext', required: false, display: { order: 3, width: 'full' } }
      ],
      validation: { rules: [] },
      display: { layout: 'single', groups: [], preview: { template: '' } },
      metadata: { tags: ['core', 'seo'], complexity: 'simple', estimatedTime: '5m', useCases: ['Landing Pages'] }
    },
    {
      id: 'post',
      name: 'Blog Post',
      description: 'Article or news post with author and categories',
      category: 'marketing',
      icon: 'ChatBubbleLeftRightIcon',
      color: 'purple',
      isActive: true,
      isBuiltIn: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [
        { id: 'title', name: 'title', label: 'Post Title', type: 'text', required: true, display: { order: 1, width: 'full' } },
        { id: 'excerpt', name: 'excerpt', label: 'Excerpt', type: 'textarea', required: false, display: { order: 2, width: 'full' } },
        { id: 'author', name: 'author', label: 'Author', type: 'text', required: true, display: { order: 3, width: 'half' } }
      ],
      validation: { rules: [] },
      display: { layout: 'single', groups: [], preview: { template: '' } },
      metadata: { tags: ['blog', 'news'], complexity: 'simple', estimatedTime: '10m', useCases: ['Articles'] }
    }
  ];

  return NextResponse.json({ success: true, types }, { headers: cors });
}
