import { NextApiRequest, NextApiResponse } from 'next'
import { ContentPage } from '../../../services/productionCmsService'

// Mock database - replace with actual database
let contentDatabase: ContentPage[] = []

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const content: ContentPage = req.body

    // Validate required fields
    if (!content.title || !content.slug) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and slug are required' 
      })
    }

    // Generate ID if not provided (new content)
    if (!content.id) {
      content.id = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      content.createdAt = new Date().toISOString()
    }

    // Update timestamp
    content.updatedAt = new Date().toISOString()

    // Ensure status is draft for save operation
    content.status = 'draft'

    // Find existing content or add new
    const existingIndex = contentDatabase.findIndex(c => c.id === content.id)
    
    if (existingIndex >= 0) {
      // Update existing content
      contentDatabase[existingIndex] = content
    } else {
      // Add new content
      contentDatabase.push(content)
    }

    // In a real application, you would save to a database here
    // await database.save(content)

    res.status(200).json({
      success: true,
      message: 'Content saved successfully',
      data: content
    })

  } catch (error) {
    console.error('Save error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
