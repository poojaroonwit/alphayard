import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/server/lib/prisma'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export const runtime = 'nodejs'

async function tryWrite(dir: string, filePath: string, buffer: Buffer): Promise<boolean> {
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(filePath, buffer)
    return true
  } catch {
    return false
  }
}

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
    const buffer = Buffer.from(await file.arrayBuffer())

    let url: string | null = null

    // Primary: configured dir
    if (process.env.APP_UPLOAD_DIR) {
      const baseDir = path.resolve(process.cwd(), process.env.APP_UPLOAD_DIR)
      const outDir = path.join(baseDir, 'avatars')
      if (await tryWrite(outDir, path.join(outDir, fileName), buffer)) {
        url = `/api/v1/admin/files/avatars/${fileName}`
      }
    }

    // Try public/uploads (static serving, works in local dev)
    if (!url) {
      const outDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
      if (await tryWrite(outDir, path.join(outDir, fileName), buffer)) {
        url = `/api/v1/admin/files/avatars/${fileName}`
      }
    }

    // Fallback: os.tmpdir()
    if (!url) {
      const outDir = path.join(os.tmpdir(), 'appkit_uploads', 'avatars')
      if (await tryWrite(outDir, path.join(outDir, fileName), buffer)) {
        url = `/api/v1/admin/files/avatars/${fileName}`
      }
    }

    if (!url) {
      return NextResponse.json({ error: 'Upload storage is not writable. Please configure APP_UPLOAD_DIR.' }, { status: 500 })
    }

    // If userId provided, update the user in DB
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url }
      })
    }

    return NextResponse.json({
      url,
      file: { url, filename: fileName, id: fileName, mime_type: file.type }
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}
