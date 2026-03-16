import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// POST /api/v1/admin/applications/[id]/config/storage/studio/delete
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { storage, key } = await request.json()
  if (!storage?.bucket || !key) return NextResponse.json({ error: 'Missing storage config or key' }, { status: 400 })

  try {
    const s3 = buildS3Client(storage)
    await s3.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: key }))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 })
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
