import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// POST /api/v1/admin/applications/[id]/config/storage/studio/mkdir
// Creates a "folder" in the bucket by uploading a zero-byte object with a trailing slash key.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { storage, key } = await request.json()
  if (!storage?.bucket || !key) return NextResponse.json({ error: 'Missing storage config or key' }, { status: 400 })

  const folderKey = key.endsWith('/') ? key : `${key}/`

  try {
    const s3 = buildS3Client(storage)
    await s3.send(new PutObjectCommand({ Bucket: storage.bucket, Key: folderKey, Body: '' }))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create folder' }, { status: 500 })
  }
}

function buildS3Client(storage: any) {
  return new S3Client({
    region: storage.region || 'us-east-1',
    credentials: { accessKeyId: storage.accessKey, secretAccessKey: storage.secretKey },
    ...(storage.endpoint ? {
      endpoint: storage.endpoint,
      forcePathStyle: storage.usePathStyle ?? true,
    } : {}),
  })
}
