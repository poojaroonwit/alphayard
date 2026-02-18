// UUID utility - provides uuid v4 functionality
// This is a lightweight alternative to the uuid package

export const v4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Default export for compatibility
export default { v4 }

// Named export for compatibility with uuid package
export { v4 as uuidv4 }
