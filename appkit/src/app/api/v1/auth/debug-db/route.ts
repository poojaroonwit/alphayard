import { NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.oAuthClient.findMany({
      select: { clientId: true, applicationId: true, name: true }
    });
    
    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
