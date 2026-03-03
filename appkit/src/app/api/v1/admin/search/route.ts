import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: { applications: [], circles: [], users: [] } })
    }

    const [applications, circles, users] = await Promise.all([
      prisma.application.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, slug: true }
      }),
      prisma.circle.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { circleCode: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, circleCode: true, applicationId: true }
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true }
      })
    ])

    return NextResponse.json({
      results: {
        applications,
        circles,
        users
      }
    })
  } catch (error) {
    console.error('Global search error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
