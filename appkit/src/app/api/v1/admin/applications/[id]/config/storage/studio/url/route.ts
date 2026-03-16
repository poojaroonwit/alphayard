import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// POST /api/v1/admin/applications/[id]/config/storage/studio/url
// Returns a presigned GET URL for a storage object (valid 15 minutes).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { storage, key } = await request.json()
  if (!storage?.bucket || !key) return NextResponse.json({ error: 'Missing storage config or key' }, { status: 400 })

  try {
    // If a public base URL is configured, use it directly
    if (storage.publicUrl) {
      const base = storage.publicUrl.replace(/\/$/, '')
      return NextResponse.json({ url: `${base}/${key}` })
    }

    const s3 = buildS3Client(storage)
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: storage.bucket, Key: key }), { expiresIn: 900 })
    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate URL' }, { status: 500 })
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
