import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import os from 'os'

export const runtime = 'nodejs'

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Sanitize path segments to prevent directory traversal
  const segments = params.path.map(s => path.basename(s))
  const relPath = path.join(...segments)

  const ext = relPath.split('.').pop()?.toLowerCase() || ''
  const contentType = MIME_MAP[ext] || 'application/octet-stream'

  const headers = { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' }

  // Try tmp dir first (Railway / container fallback)
  const tmpPath = path.join(os.tmpdir(), 'appkit_uploads', relPath)
  try {
    const data = await readFile(tmpPath)
    return new NextResponse(new Uint8Array(data), { status: 200, headers })
  } catch {
    // not in tmp
  }

  // Try public/uploads (local dev)
  const publicPath = path.join(process.cwd(), 'public', 'uploads', relPath)
  try {
    const data = await readFile(publicPath)
    return new NextResponse(new Uint8Array(data), { status: 200, headers })
  } catch {
    // not found
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 })
}
