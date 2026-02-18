import { ContentFormData, ValidationResult, ValidationError } from '../types/content'

// Validation rules
export const validationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/
  },
  slug: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-z0-9\-_]+$/
  },
  content: {
    required: true,
    minLength: 10
  }
}

// Validation functions
export const validateTitle = (title: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!title || title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title is required',
      code: 'REQUIRED'
    })
  } else {
    if (title.length < validationRules.title.minLength) {
      errors.push({
        field: 'title',
        message: `Title must be at least ${validationRules.title.minLength} characters long`,
        code: 'MIN_LENGTH'
      })
    }
    
    if (title.length > validationRules.title.maxLength) {
      errors.push({
        field: 'title',
        message: `Title must be no more than ${validationRules.title.maxLength} characters long`,
        code: 'MAX_LENGTH'
      })
    }
    
    if (!validationRules.title.pattern.test(title)) {
      errors.push({
        field: 'title',
        message: 'Title contains invalid characters',
        code: 'INVALID_PATTERN'
      })
    }
  }
  
  return errors
}

export const validateSlug = (slug: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!slug || slug.trim().length === 0) {
    errors.push({
      field: 'slug',
      message: 'Slug is required',
      code: 'REQUIRED'
    })
  } else {
    if (slug.length < validationRules.slug.minLength) {
      errors.push({
        field: 'slug',
        message: `Slug must be at least ${validationRules.slug.minLength} characters long`,
        code: 'MIN_LENGTH'
      })
    }
    
    if (slug.length > validationRules.slug.maxLength) {
      errors.push({
        field: 'slug',
        message: `Slug must be no more than ${validationRules.slug.maxLength} characters long`,
        code: 'MAX_LENGTH'
      })
    }
    
    if (!validationRules.slug.pattern.test(slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
        code: 'INVALID_PATTERN'
      })
    }
  }
  
  return errors
}

export const validateContent = (components: any[]): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!components || components.length === 0) {
    errors.push({
      field: 'components',
      message: 'Content must have at least one component',
      code: 'REQUIRED'
    })
  } else {
    // Validate each component
    components.forEach((component, index) => {
      if (!component.type) {
        errors.push({
          field: `components[${index}].type`,
          message: 'Component type is required',
          code: 'REQUIRED'
        })
      }
      
      if (!component.id) {
        errors.push({
          field: `components[${index}].id`,
          message: 'Component ID is required',
          code: 'REQUIRED'
        })
      }
      
      // Validate component-specific props
      if (component.type === 'text' && (!component.props?.content || component.props.content.trim().length === 0)) {
        errors.push({
          field: `components[${index}].content`,
          message: 'Text content is required',
          code: 'REQUIRED'
        })
      }
      
      if (component.type === 'image' && !component.props?.src) {
        errors.push({
          field: `components[${index}].src`,
          message: 'Image source is required',
          code: 'REQUIRED'
        })
      }
    })
  }
  
  return errors
}

export const validateContentForm = (data: ContentFormData): ValidationResult => {
  const errors: ValidationError[] = []
  
  // Validate title
  errors.push(...validateTitle(data.title))
  
  // Validate slug
  errors.push(...validateSlug(data.slug))
  
  // Validate content
  errors.push(...validateContent(data.components))
  
  // Validate type
  if (!data.type) {
    errors.push({
      field: 'type',
      message: 'Content type is required',
      code: 'REQUIRED'
    })
  }
  
  // Validate status
  if (!data.status) {
    errors.push({
      field: 'status',
      message: 'Content status is required',
      code: 'REQUIRED'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Utility functions
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const sanitizeTitle = (title: string): string => {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, validationRules.title.maxLength)
}

export const sanitizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, validationRules.slug.maxLength)
}

// Field validation helpers
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find(e => e.field === field)
  return error ? error.message : null
}

export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some(e => e.field === field)
}

export const getFieldErrorClass = (errors: ValidationError[], field: string): string => {
  return hasFieldError(errors, field) 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
}
