import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/server/lib/prisma'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id
    if (!UUID_REGEX.test(appId)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 })
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { applicationId: appId },
      orderBy: { updatedAt: 'desc' },
    })

    const defaultTemplates = await prisma.emailTemplate.findMany({
      where: { applicationId: null, isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ templates, defaultTemplates })
  } catch (error) {
    console.error('Failed to fetch email templates:', error)
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id
    if (!UUID_REGEX.test(appId)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const assignDefaultTemplateId = typeof body.assignDefaultTemplateId === 'string' ? body.assignDefaultTemplateId.trim() : ''

    if (assignDefaultTemplateId) {
      if (!UUID_REGEX.test(assignDefaultTemplateId)) {
        return NextResponse.json({ error: 'Invalid default template ID format' }, { status: 400 })
      }

      const defaultTemplate = await prisma.emailTemplate.findUnique({
        where: { id: assignDefaultTemplateId },
      })
      if (!defaultTemplate || defaultTemplate.applicationId !== null) {
        return NextResponse.json({ error: 'Default template not found' }, { status: 404 })
      }

      const duplicateBySlug = await prisma.emailTemplate.findFirst({
        where: { applicationId: appId, slug: defaultTemplate.slug },
      })
      if (duplicateBySlug) {
        return NextResponse.json(
          { template: duplicateBySlug, message: 'Template with this slug already assigned to application' },
          { status: 200 }
        )
      }

      const template = await prisma.emailTemplate.create({
        data: {
          applicationId: appId,
          name: defaultTemplate.name,
          slug: defaultTemplate.slug,
          subject: defaultTemplate.subject,
          htmlContent: defaultTemplate.htmlContent,
          textContent: defaultTemplate.textContent,
          variables: (defaultTemplate.variables ?? []) as Prisma.InputJsonValue,
          isActive: defaultTemplate.isActive,
        },
      })

      return NextResponse.json({ template }, { status: 201 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const htmlContent = typeof body.htmlContent === 'string' ? body.htmlContent : ''
    const textContent = typeof body.textContent === 'string' ? body.textContent : ''
    const variables = Array.isArray(body.variables) ? body.variables : []
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true

    if (!name || !slug || !subject) {
      return NextResponse.json({ error: 'name, slug, and subject are required' }, { status: 400 })
    }

    // Check for duplicate slug within this application
    const existing = await prisma.emailTemplate.findFirst({
      where: { applicationId: appId, slug },
    })
    if (existing) {
      return NextResponse.json({ error: `A template with slug '${slug}' already exists for this application` }, { status: 409 })
    }

    const template = await prisma.emailTemplate.create({
      data: {
        applicationId: appId,
        name,
        slug,
        subject,
        htmlContent,
        textContent,
        variables,
        isActive,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Failed to create email template:', error)
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
  }
}
