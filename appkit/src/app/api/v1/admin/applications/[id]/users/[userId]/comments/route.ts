import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const appId = params.id
    const userId = params.userId
    if (!UUID_REGEX.test(appId) || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Invalid application ID or user ID format' }, { status: 400 })
    }

    const comments = await prisma.userComment.findMany({
      where: { applicationId: appId, userId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ] as any,
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Failed to fetch user comments:', error)
    return NextResponse.json({ error: 'Failed to fetch user comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const appId = params.id
    const userId = params.userId
    if (!UUID_REGEX.test(appId) || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Invalid application ID or user ID format' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown) => typeof tag === 'string') : []
    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    const remindAt =
      typeof body.remindAt === 'string' && body.remindAt.trim()
        ? new Date(body.remindAt)
        : null

    const sPinned = typeof body.isPinned === 'boolean' ? body.isPinned : false

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const comment = await prisma.userComment.create({
      data: {
        applicationId: appId,
        userId,
        content,
        tags,
        attachments,
        isPinned: sPinned,
        remindAt: remindAt && !Number.isNaN(+remindAt) ? remindAt : null,
      } as any,
      include: { author: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user comment:', error)
    return NextResponse.json({ error: 'Failed to create user comment' }, { status: 500 })
  }
}
