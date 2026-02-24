// File Upload - Complete implementation with S3 integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'
import { randomBytes } from 'crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'appkit-uploads'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const applicationId = searchParams.get('applicationId')
    const fileType = searchParams.get('fileType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let whereClause: any = {}
    
    if (userId) {
      whereClause.userId = userId
    }
    
    if (applicationId) {
      whereClause.applicationId = applicationId
    }
    
    if (fileType) {
      whereClause.fileType = fileType
    }
    
    // Get files from database
    const files = await prisma.file.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        application: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: limit,
      skip: offset
    })
    
    // Get total count
    const totalCount = await prisma.file.count({ where: whereClause })
    
    // Format response
    const formattedFiles = files.map(file => ({
      id: file.id,
      userId: file.userId,
      userEmail: file.user.email,
      applicationId: file.applicationId,
      applicationName: file.application?.name,
      filename: file.filename,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
      isPublic: file.isPublic,
      storageProvider: file.storageProvider,
      metadata: file.metadata || {},
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    }))
    
    return NextResponse.json({
      success: true,
      files: formattedFiles,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      message: 'Files retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get files:', error)
    return NextResponse.json(
      { error: 'Failed to get files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const applicationId = formData.get('applicationId') as string
    const isPublic = formData.get('isPublic') === 'true'
    const isTemporary = formData.get('isTemporary') === 'true'
    const expiresIn = formData.get('expiresIn') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Generate unique file name
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${randomBytes(16).toString('hex')}.${fileExtension}`
    const s3Key = `uploads/${userId}/${uniqueFileName}`
    
    // Upload file to S3
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: file.stream(),
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        userId: userId,
        applicationId: applicationId || '',
        uploadedAt: new Date().toISOString()
      }
    }
    
    await s3Client.send(new PutObjectCommand(uploadParams))
    
    // Generate file URL
    const fileUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`
    
    // Calculate expiration date if temporary
    let expiresAt = null
    if (isTemporary && expiresIn) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn))
    }
    
    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        applicationId: applicationId || null,
        filename: uniqueFileName,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: BigInt(file.size),
        storagePath: s3Key,
        storageProvider: 's3',
        url: fileUrl,
        thumbnailUrl: null, // Would need separate processing
        isPublic,
        metadata: {
          s3Key,
          bucket: S3_BUCKET,
          region: process.env.AWS_REGION || 'us-east-1'
        }
      }
    })
    
    console.log(`🔐 File Uploaded: ${file.name}`, {
      fileId: fileRecord.id,
      userId,
      fileSize: file.size
    })
    
    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalFilename: fileRecord.originalFilename,
        mimeType: fileRecord.mimeType,
        fileSize: fileRecord.fileSize,
        url: fileRecord.url,
        isPublic: fileRecord.isPublic,
        storageProvider: fileRecord.storageProvider,
        createdAt: fileRecord.createdAt
      },
      message: 'File uploaded successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to upload file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')
    const userId = searchParams.get('userId')
    const deleteAll = searchParams.get('deleteAll') === 'true'
    
    if (deleteAll && userId) {
      // Get all files for user
      const files = await prisma.file.findMany({
        where: { userId }
      })
      
      // Delete from S3 and database
      for (const file of files) {
        if (file.metadata && typeof file.metadata === 'object' && 's3Key' in file.metadata) {
          try {
            await s3Client.send(new PutObjectCommand({
              Bucket: S3_BUCKET,
              Key: (file.metadata as any).s3Key
            }))
          } catch (error) {
            console.error(`Failed to delete S3 file: ${(file.metadata as any).s3Key}`, error)
          }
        }
      }
      
      await prisma.file.deleteMany({
        where: { userId }
      })
      
      return NextResponse.json({
        success: true,
        message: 'All files deleted successfully'
      })
    } else if (fileId) {
      // Get file record
      const file = await prisma.file.findUnique({
        where: { id: fileId }
      })
      
      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
      
      // Delete from S3
      if (file.metadata && typeof file.metadata === 'object' && 's3Key' in file.metadata) {
        try {
          await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: (file.metadata as any).s3Key
          }))
        } catch (error) {
          console.error(`Failed to delete S3 file: ${(file.metadata as any).s3Key}`, error)
        }
      }
      
      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      })
      
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'File ID or user ID required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to delete file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId, isPublic, isTemporary, expiresAt, metadata } = body
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }
    
    // Update file record
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        ...(isPublic !== undefined && { isPublic }),
        ...(metadata && { metadata }),
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      file: {
        id: updatedFile.id,
        isPublic: updatedFile.isPublic,
        metadata: updatedFile.metadata,
        updatedAt: updatedFile.updatedAt
      },
      message: 'File updated successfully'
    })
  } catch (error) {
    console.error('Failed to update file:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}
