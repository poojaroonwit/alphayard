// Simple ID generator utility
// This provides a lightweight alternative to uuid for generating unique IDs

let counter = 0

export const generateId = (prefix: string = 'id'): string => {
  counter++
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}_${timestamp}_${counter}_${random}`
}

export const generateComponentId = (): string => {
  return generateId('comp')
}

export const generateContentId = (): string => {
  return generateId('content')
}

export const generateTemplateId = (): string => {
  return generateId('template')
}

// UUID v4 compatible function (simplified)
export const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
