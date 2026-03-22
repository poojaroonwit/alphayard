import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

function getApplicationId(req: NextRequest): string | null {
  return req.headers.get('x-application-id') || req.nextUrl.searchParams.get('applicationId') || null;
}

function mapType(t: any) {
  const s: any = t.schema || {};
  return {
    id: t.id,
    name: t.name,
    description: t.description || '',
    category: s.category || 'content',
    icon: s.icon || 'DocumentTextIcon',
    color: s.color || 'blue',
    isActive: true,
    isBuiltIn: false,
    version: '1.0.0',
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    fields: s.fields || [],
    validation: s.validation || { rules: [] },
    display: s.display || { layout: 'single', groups: [], preview: { template: '' } },
    metadata: s.metadata || { tags: [], complexity: 'simple', estimatedTime: '5m', useCases: [] },
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  const applicationId = getApplicationId(req);
  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400, headers: cors });
  }
  try {
    const types = await (prisma.marketingContentType as any).findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, types: types.map(mapType) }, { headers: cors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  const applicationId = getApplicationId(req);
  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400, headers: cors });
  }
  try {
    const body = await req.json();
    const { name, description, category, icon, color, fields, validation, display, metadata } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400, headers: cors });
    }

    const type = await (prisma.marketingContentType as any).create({
      data: {
        applicationId,
        name: name.trim(),
        description: description?.trim() || null,
        schema: { category, icon, color, fields, validation, display, metadata },
      },
    });

    return NextResponse.json({ success: true, type: mapType(type) }, { status: 201, headers: cors });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A content type with this name already exists' }, { status: 409, headers: cors });
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }
}

export async function PUT(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  const applicationId = getApplicationId(req);
  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400, headers: cors });
  }
  try {
    const body = await req.json();
    const { id, name, description, category, icon, color, fields, validation, display, metadata } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400, headers: cors });

    const existing = await (prisma.marketingContentType as any).findFirst({ where: { id, applicationId } });
    if (!existing) return NextResponse.json({ error: 'Content type not found' }, { status: 404, headers: cors });

    const prevSchema: any = existing.schema || {};
    const type = await (prisma.marketingContentType as any).update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        schema: {
          category: category ?? prevSchema.category,
          icon: icon ?? prevSchema.icon,
          color: color ?? prevSchema.color,
          fields: fields ?? prevSchema.fields,
          validation: validation ?? prevSchema.validation,
          display: display ?? prevSchema.display,
          metadata: metadata ?? prevSchema.metadata,
        },
      },
    });

    return NextResponse.json({ success: true, type: mapType(type) }, { headers: cors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }
}

export async function DELETE(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  const applicationId = getApplicationId(req);
  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400, headers: cors });
  }
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400, headers: cors });

    await (prisma.marketingContentType as any).deleteMany({ where: { id, applicationId } });
    return NextResponse.json({ success: true }, { headers: cors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }
}
