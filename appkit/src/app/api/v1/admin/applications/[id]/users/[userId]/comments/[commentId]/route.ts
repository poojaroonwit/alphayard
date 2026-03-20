import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string; commentId: string } }
) {
  try {
    const { id: appId, userId, commentId } = params

    if (!UUID_REGEX.test(appId) || !UUID_REGEX.test(userId) || !UUID_REGEX.test(commentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const isPinned = typeof body.isPinned === 'boolean' ? body.isPinned : undefined

    if (isPinned === undefined) {
      return NextResponse.json({ error: 'isPinned field is required' }, { status: 400 })
    }

    const updatedComment = await prisma.userComment.update({
      where: {
        id: commentId,
        applicationId: appId,
        userId: userId,
      },
      data: {
        isPinned,
      } as any,
      include: { author: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Failed to update user comment:', error)
    return NextResponse.json({ error: 'Failed to update user comment' }, { status: 500 })
  }
}
