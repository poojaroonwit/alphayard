import { NextRequest, NextResponse } from 'next/server';
import { authenticate, hasPermission } from '@/lib/auth';
import { prisma } from '@/server/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
  if (!hasPermission(auth.admin, 'system:read')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;

    const providersRaw = await prisma.oAuthProvider.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    // Mask secrets
    const providers = providersRaw.map((p: any) => {
      const pc = p.platformConfig as any;
      return {
        ...p,
        clientSecret: p.clientSecret ? '••••••••' : null,
        platformConfig: pc ? {
          ...pc,
          web: pc.web ? { ...pc.web, clientSecret: pc.web.clientSecret ? '••••••••' : undefined } : undefined,
        } : null,
      };
    });

    return NextResponse.json({ providers });
  } catch (error: any) {
    console.error('Get OAuth providers error:', error);
    return NextResponse.json({ error: 'Failed to get OAuth providers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
  if (!hasPermission(auth.admin, 'system:manage')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const provider = await prisma.oAuthProvider.create({
      data: {
        applicationId: data.applicationId,
        providerName: data.providerName,
        displayName: data.displayName,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        authorizationUrl: data.authorizationUrl,
        tokenUrl: data.tokenUrl,
        userinfoUrl: data.userinfoUrl,
        scopes: data.scopes || [],
        claimsMapping: data.claimsMapping || {},
        allowSignup: data.allowSignup !== undefined ? data.allowSignup : true,
        requireEmailVerified: data.requireEmailVerified !== undefined ? data.requireEmailVerified : true,
        autoLinkByEmail: data.autoLinkByEmail !== undefined ? data.autoLinkByEmail : false,
        iconUrl: data.iconUrl,
        buttonColor: data.buttonColor,
        buttonText: data.buttonText,
        jwksUrl: data.jwksUrl,
        allowedDomains: data.allowedDomains || [],
        defaultRole: data.defaultRole,
        displayOrder: data.displayOrder || 0,
        platformConfig: data.platformConfig || null,
      }
    });

    return NextResponse.json({
      provider: {
        ...provider,
        clientSecret: '••••••••',
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create OAuth provider error:', error);
    return NextResponse.json({ error: 'Failed to create OAuth provider' }, { status: 500 });
  }
}
