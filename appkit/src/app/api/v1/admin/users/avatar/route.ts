import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error || !auth.admin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Upload requires multipart/form-data' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const userId = formData.get('userId') as string

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 5MB)' }, { status: 400 })
    }

    const extFromName = file.name.includes('.') ? file.name.split('.').pop() : ''
    const extFromMime = file.type.split('/')[1] || ''
    const extension = (extFromName || extFromMime || 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const fileName = `avatar_${Date.now()}_${randomBytes(8).toString('hex')}.${extension}`

    const baseUploadDir = process.env.APP_UPLOAD_DIR
      ? path.resolve(process.cwd(), process.env.APP_UPLOAD_DIR)
      : path.join(process.cwd(), 'public', 'uploads')
    const publicBaseUrl = (process.env.APP_UPLOAD_BASE_URL || '/uploads').replace(/\/+$/, '')
    const outputDir = path.join(baseUploadDir, 'avatars')

    const buffer = Buffer.from(await file.arrayBuffer())
    const outputPath = path.join(outputDir, fileName)

    await mkdir(outputDir, { recursive: true })
    await writeFile(outputPath, buffer)

    const url = `${publicBaseUrl}/avatars/${fileName}`

    // If userId provided, update the user in DB
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url }
      })
    }

    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}
