import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/server/lib/prisma';
import bcrypt from 'bcryptjs';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req)
  const auth = await authenticate(req);
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401, headers: cors });
  
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: auth.admin.adminId || auth.admin.id },
      include: { role: true }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    return NextResponse.json({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role?.name,
      isSuperAdmin: adminUser.isSuperAdmin,
      avatarUrl: adminUser.avatarUrl,
      permissions: auth.admin.permissions
    }, { headers: cors });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'change-password') {
    const auth = await authenticate(req);
    if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401, headers: cors });

    try {
      const { currentPassword, newPassword } = await req.json();
      const adminId = auth.admin.adminId || auth.admin.id;

      if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: cors });

      const adminUser = await prisma.adminUser.findUnique({ where: { id: adminId } });
      if (!adminUser) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });

      const isValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
      if (!isValid) return NextResponse.json({ error: 'Invalid current password' }, { status: 400, headers: cors });

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.adminUser.update({
        where: { id: adminId },
        data: { passwordHash }
      });

      return NextResponse.json({ success: true, message: 'Password updated' }, { headers: cors });
    } catch (error) {
      console.error('Change password error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: cors });
}
