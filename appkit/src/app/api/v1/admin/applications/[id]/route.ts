import { NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 }
      )
    }
    
    // Fetch the specific application
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userApplications: true }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Transform to match the expected frontend interface
    const formattedApp = {
      id: application.id,
      name: application.name,
      description: application.description || 'No description provided.',
      status: application.isActive ? 'active' : 'inactive',
      users: application._count.userApplications,
      createdAt: application.createdAt.toISOString(),
      lastModified: application.updatedAt.toISOString(),
      plan: 'free', // Default fallback since plan isn't on the model directly
      domain: application.slug ? `${application.slug}.appkit.com` : undefined // Fallback slug
    }

    return NextResponse.json({ application: formattedApp })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}
