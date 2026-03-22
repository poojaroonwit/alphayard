import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Upload requires multipart/form-data' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 10MB)' }, { status: 400 })
    }

    const extFromName = file.name.includes('.') ? file.name.split('.').pop() : ''
    const extFromMime = file.type.split('/')[1] || ''
    const extension = (extFromName || extFromMime || 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const fileName = `${Date.now()}_${randomBytes(8).toString('hex')}.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const subPath = path.join('applications', id)

    // Primary: configured dir or public/uploads (served as static files)
    if (process.env.APP_UPLOAD_DIR) {
      const baseDir = path.resolve(process.cwd(), process.env.APP_UPLOAD_DIR)
      const outDir = path.join(baseDir, subPath)
      const outPath = path.join(outDir, fileName)
      const publicBaseUrl = (process.env.APP_UPLOAD_BASE_URL || '/uploads').replace(/\/+$/, '')
      if (await tryWrite(outDir, outPath, buffer)) {
        const url = `/api/v1/admin/files/${subPath.replace(/\\/g, '/')}/${fileName}`;
        return NextResponse.json({
          file: { url, filename: fileName, id: fileName, mime_type: file.type }
        }, { status: 201 })
      }
    }

    // Try public/uploads (static serving, works in local dev)
    const publicDir = path.join(process.cwd(), 'public', 'uploads', subPath)
    const publicPath = path.join(publicDir, fileName)
    if (await tryWrite(publicDir, publicPath, buffer)) {
      const url = `/api/v1/admin/files/${subPath.replace(/\\/g, '/')}/${fileName}`;
      return NextResponse.json({
        file: { url, filename: fileName, id: fileName, mime_type: file.type }
      }, { status: 201 })
    }

    // Fallback: os.tmpdir() (writable in all container envs, served via API route)
    const tmpDir = path.join(os.tmpdir(), 'appkit_uploads', subPath)
    const tmpPath = path.join(tmpDir, fileName)
    if (await tryWrite(tmpDir, tmpPath, buffer)) {
      const url = `/api/v1/admin/files/${subPath.replace(/\\/g, '/')}/${fileName}`;
      return NextResponse.json({
        file: { url, filename: fileName, id: fileName, mime_type: file.type }
      }, { status: 201 })
    }

    return NextResponse.json({ error: 'Upload storage is not writable. Please configure APP_UPLOAD_DIR to a writable location.' }, { status: 500 })
  } catch (error) {
    console.error('Error uploading application file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
