import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'video/mp4', 'video/webm']

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
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Upload requires multipart/form-data' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const type = (formData.get('type') as string) || 'general'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is too large (max 10MB)' }, { status: 400 })
    }

    const extFromName = file.name.includes('.') ? file.name.split('.').pop() : ''
    const extFromMime = file.type.split('/')[1] || ''
    const extension = (extFromName || extFromMime || 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const fileName = `${Date.now()}_${randomBytes(8).toString('hex')}.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Primary: configured dir or public/uploads (served as static files)
    if (process.env.APP_UPLOAD_DIR) {
      const baseDir = path.resolve(process.cwd(), process.env.APP_UPLOAD_DIR)
      const outDir = path.join(baseDir, type)
      const outPath = path.join(outDir, fileName)
      const publicBaseUrl = (process.env.APP_UPLOAD_BASE_URL || '/uploads').replace(/\/+$/, '')
      if (await tryWrite(outDir, outPath, buffer)) {
        return NextResponse.json({
          file: { url: `/api/v1/admin/files/${type}/${fileName}`, filename: fileName, id: fileName, mime_type: file.type },
        }, { status: 201 })
      }
    }

    // Try public/uploads (static serving, works in local dev)
    const publicDir = path.join(process.cwd(), 'public', 'uploads', type)
    const publicPath = path.join(publicDir, fileName)
    if (await tryWrite(publicDir, publicPath, buffer)) {
      return NextResponse.json({
        file: { url: `/api/v1/admin/files/${type}/${fileName}`, filename: fileName, id: fileName, mime_type: file.type },
      }, { status: 201 })
    }

    // Fallback: os.tmpdir() (writable in all container envs, served via API route)
    const tmpDir = path.join(os.tmpdir(), 'appkit_uploads', type)
    const tmpPath = path.join(tmpDir, fileName)
    if (await tryWrite(tmpDir, tmpPath, buffer)) {
      return NextResponse.json({
        file: { url: `/api/v1/admin/files/${type}/${fileName}`, filename: fileName, id: fileName, mime_type: file.type },
      }, { status: 201 })
    }

    return NextResponse.json({ error: 'Upload storage is not writable. Please configure APP_UPLOAD_DIR.' }, { status: 500 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
