import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// POST /api/v1/admin/applications/[id]/config/storage/studio/list
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const { storage, prefix = '' } = await request.json()
  if (!storage?.bucket) return NextResponse.json({ error: 'Missing storage config' }, { status: 400 })

  try {
    const s3 = buildS3Client(storage)
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: storage.bucket,
      Prefix: prefix || undefined,
      Delimiter: '/',
      MaxKeys: 500,
    }))

    const folders = (res.CommonPrefixes || []).map((p: any) => ({
      key: p.Prefix,
      size: 0,
      lastModified: '',
      contentType: 'folder',
    }))

    const files = (res.Contents || []).map((obj: any) => ({
      key: obj.Key,
      size: obj.Size || 0,
      lastModified: obj.LastModified?.toISOString() || '',
      contentType: '',
    }))

    return NextResponse.json({ objects: [...folders, ...files] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list objects' }, { status: 500 })
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
