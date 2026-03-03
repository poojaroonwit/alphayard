import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const circleId = params.id
    
    // Generate a 6-digit pin code
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Generate a unique circle code (short slug)
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      select: { name: true }
    })

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
    }

    const circleCode = circle.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 10) + '-' + Math.random().toString(36).substring(2, 6)

    const updatedCircle = await prisma.circle.update({
      where: { id: circleId },
      data: {
        pinCode,
        circleCode
      }
    })

    return NextResponse.json({
      id: updatedCircle.id,
      pinCode: updatedCircle.pinCode,
      circleCode: updatedCircle.circleCode
    })
  } catch (error) {
    console.error('Error generating circle codes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const circle = await prisma.circle.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        pinCode: true,
        circleCode: true
      }
    })

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
    }

    return NextResponse.json(circle)
  } catch (error) {
    console.error('Error fetching circle codes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
