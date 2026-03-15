import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/server/lib/prisma';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request);
  const auth = await authenticate(request);
  
  if (auth.error) {
    return NextResponse.json(
      { error: auth.error, error_description: 'Unauthorized' },
      { status: auth.status || 401, headers: corsHeaders }
    );
  }

  // @ts-ignore
  const userId = auth.admin?.id || auth.admin?.adminId;
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'User ID not found' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { inviteCode, pinCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'bad_request', error_description: 'Invite code is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find the circle by invite code or PIN code
    // Note: In a real system, we'd check if inviteCode is actually a PIN or an alphanumeric code
    const circle = await prisma.circle.findFirst({
      where: {
        OR: [
          { circleCode: inviteCode },
          { pinCode: inviteCode } // Supporting both as "inviteCode" in the request for flexibility
        ]
      }
    });

    if (!circle) {
      return NextResponse.json(
        { error: 'not_found', error_description: 'Circle not found with the provided code' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if membership already exists
    const existingMember = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId: circle.id,
          userId
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'conflict', error_description: 'User is already a member of this circle', circle },
        { status: 409, headers: corsHeaders }
      );
    }

    // Add member to circle
    const newMember = await prisma.circleMember.create({
      data: {
        userId,
        circleId: circle.id,
        role: 'member'
      },
      include: {
        circle: true
      }
    });

    return NextResponse.json(
      { success: true, message: 'Joined circle successfully', circle: newMember.circle },
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[POST /api/v1/circles/join] Error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to join circle' },
      { status: 500, headers: corsHeaders }
    );
  }
}
