import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// POST /api/v1/admin/applications/[id]/config/storage/studio/upload
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request)
  if (auth.error || !auth.admin) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const storageRaw = formData.get('storage') as string | null
  const prefix = (formData.get('prefix') as string) || ''

  if (!file || !storageRaw) return NextResponse.json({ error: 'Missing file or storage config' }, { status: 400 })

  const storage = JSON.parse(storageRaw)
  const key = prefix ? `${prefix}${file.name}` : file.name

  try {
    const s3 = buildS3Client(storage)
    const arrayBuffer = await file.arrayBuffer()
    await s3.send(new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type || 'application/octet-stream',
    }))
    return NextResponse.json({ ok: true, key })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
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
