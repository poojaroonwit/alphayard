import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// POST /api/v1/admin/applications/[id]/config/storage/test
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { storage } = await request.json()
  if (!storage?.bucket || !storage?.accessKey || !storage?.secretKey) {
    return NextResponse.json({ ok: false, message: 'Bucket, access key, and secret key are required' }, { status: 400 })
  }

  try {
    const s3 = buildS3Client(storage)
    await s3.send(new ListObjectsV2Command({ Bucket: storage.bucket, MaxKeys: 1 }))
    return NextResponse.json({ ok: true, message: `Connected to bucket "${storage.bucket}" successfully` })
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message || 'Connection failed' })
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
