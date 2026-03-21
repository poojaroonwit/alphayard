import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

function getApplicationId(req: NextRequest): string | null {
  return req.headers.get('x-application-id') || req.nextUrl.searchParams.get('applicationId') || null;
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
    const types = await prisma.marketingContentType.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = types.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      category: 'content',
      icon: 'DocumentTextIcon',
      color: 'blue',
      isActive: true,
      isBuiltIn: false,
      version: '1.0.0',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      fields: [],
      validation: { rules: [] },
      display: { layout: 'single', groups: [], preview: { template: '' } },
      metadata: { tags: [], complexity: 'simple', estimatedTime: '5m', useCases: [] },
    }));

    return NextResponse.json({ success: true, types: mapped }, { headers: cors });
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
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400, headers: cors });
    }

    const type = await prisma.marketingContentType.create({
      data: {
        applicationId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      type: {
        id: type.id,
        name: type.name,
        description: type.description || '',
        category: body.category || 'content',
        icon: body.icon || 'DocumentTextIcon',
        color: body.color || 'blue',
        isActive: true,
        isBuiltIn: false,
        version: '1.0.0',
        createdAt: type.createdAt.toISOString(),
        updatedAt: type.updatedAt.toISOString(),
        fields: body.fields || [],
        validation: body.validation || { rules: [] },
        display: body.display || { layout: 'single', groups: [], preview: { template: '' } },
        metadata: body.metadata || { tags: [], complexity: 'simple', estimatedTime: '5m', useCases: [] },
      },
    }, { status: 201, headers: cors });
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
    const { id, name, description } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400, headers: cors });

    const type = await prisma.marketingContentType.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json({
      success: true,
      type: {
        id: type.id,
        name: type.name,
        description: type.description || '',
        category: body.category || 'content',
        icon: body.icon || 'DocumentTextIcon',
        color: body.color || 'blue',
        isActive: true,
        isBuiltIn: false,
        version: '1.0.0',
        createdAt: type.createdAt.toISOString(),
        updatedAt: type.updatedAt.toISOString(),
        fields: body.fields || [],
        validation: body.validation || { rules: [] },
        display: body.display || { layout: 'single', groups: [], preview: { template: '' } },
        metadata: body.metadata || { tags: [], complexity: 'simple', estimatedTime: '5m', useCases: [] },
      },
    }, { headers: cors });
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

    await prisma.marketingContentType.deleteMany({ where: { id, applicationId } });
    return NextResponse.json({ success: true }, { headers: cors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }
}
