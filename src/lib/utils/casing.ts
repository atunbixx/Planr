/**
 * Casing transformation utilities for API compatibility
 * Supports both snake_case (legacy) and camelCase (modern) formats
 */

export type CasingStyle = 'camelCase' | 'snake_case'

/** Helper to check for plain object (not null, not array, not Date) */
function isObjectLike(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function objectToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const transformed: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      transformed[snakeKey] = objectToSnakeCase(value)
    } else if (Array.isArray(value)) {
      transformed[snakeKey] = value.map(item => 
        typeof item === 'object' && item !== null ? objectToSnakeCase(item) : item
      )
    } else {
      transformed[snakeKey] = value
    }
  }
  
  return transformed
}

/**
 * Transform object keys from snake_case to camelCase
 */
export function objectToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const transformed: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      transformed[camelKey] = objectToCamelCase(value)
    } else if (Array.isArray(value)) {
      transformed[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null ? objectToCamelCase(item) : item
      )
    } else {
      transformed[camelKey] = value
    }
  }
  
  return transformed
}

/**
 * Field name mapping for critical fields to prevent breaking changes
 */
export const FIELD_MAPPINGS = {
  // Couple model critical mappings
  partner1_user_id: 'partner1UserId',
  partner2_user_id: 'partner2UserId',
  budget_total: 'totalBudget',
  
  // Guest model critical mappings
  invitation_sent_at: 'invitationSentAt',
  rsvp_deadline: 'rsvpDeadline',
  attending_count: 'attendingCount',
  
  // Invitation model critical mappings
  couple_id: 'coupleId',
  invited_at: 'invitedAt',
  
  // VendorCategory model critical mappings
  industry_typical: 'industryTypical',
  display_order: 'displayOrder',
  updated_at: 'updatedAt',
  created_at: 'createdAt',
} as const

/**
 * Apply field mappings to object (snake_case to camelCase)
 */
export function applyFieldMappings<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = { ...obj }
  
  for (const [snakeField, camelField] of Object.entries(FIELD_MAPPINGS)) {
    if (snakeField in result) {
      result[camelField] = result[snakeField]
      delete result[snakeField]
    }
  }
  
  return result
}

/**
 * Apply reverse field mappings to object (camelCase to snake_case)  
 */
export function applyReverseFieldMappings<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = { ...obj }
  const reverseMap = Object.fromEntries(
    Object.entries(FIELD_MAPPINGS).map(([snake, camel]) => [camel, snake])
  )
  
  for (const [camelField, snakeField] of Object.entries(reverseMap)) {
    if (camelField in result) {
      result[snakeField] = result[camelField]
      delete result[camelField]
    }
  }
  
  return result
}

/**
 * Comprehensive transformation: snake_case input → camelCase output
 * Handles both automatic conversion and explicit field mappings
 */
export function normalizeInput<T extends Record<string, any>>(input: T): Record<string, any> {
  // First apply explicit field mappings
  let result = applyFieldMappings(input)
  
  // Then apply general snake_case to camelCase conversion
  result = objectToCamelCase(result)
  
  return result
}

/**
 * Comprehensive transformation: camelCase internal → snake_case output (for legacy compatibility)
 * Handles both automatic conversion and explicit field mappings
 */
export function legacyOutput<T extends Record<string, any>>(internal: T): Record<string, any> {
  // First apply reverse field mappings
  let result = applyReverseFieldMappings(internal)
  
  // Then apply general camelCase to snake_case conversion
  result = objectToSnakeCase(result)
  
  return result
}

/**
 * Detect the casing style of an object based on its keys
 */
export function detectCasingStyle(obj: unknown): CasingStyle {
  if (Array.isArray(obj)) {
    // Inspect first element if it's an object
    const first = obj.find((v) => isObjectLike(v))
    if (first) return detectCasingStyle(first)
    return 'camelCase'
  }
  if (!isObjectLike(obj)) {
    return 'camelCase'
  }
  const keys = Object.keys(obj)
  if (keys.length === 0) return 'camelCase'
  const snakeCount = keys.filter(key => key.includes('_')).length
  const camelCount = keys.filter(key => /[A-Z]/.test(key)).length
  
  return snakeCount > camelCount ? 'snake_case' : 'camelCase'
}

/**
 * Smart normalization: automatically detect input format and normalize to camelCase
 * - Preserves the original type T (objects, arrays, primitives)
 * - Handles arrays by normalizing each element
 */
export function smartNormalize<T>(input: T): T {
  // Arrays: normalize each element if object-like
  if (Array.isArray(input)) {
    if (input.length === 0) return input
    const style = detectCasingStyle(input)
    const arr = input as unknown[]
    const normalized = arr.map((item) => {
      if (!isObjectLike(item)) return item
      return style === 'snake_case' ? normalizeInput(item) : objectToCamelCase(item)
    })
    return normalized as unknown as T
  }

  // Non-objects or Date: return as-is
  if (!isObjectLike(input)) {
    return input
  }

  // Plain objects: detect casing and normalize
  const style = detectCasingStyle(input)
  const result = style === 'snake_case' ? normalizeInput(input) : objectToCamelCase(input)
  return result as unknown as T
}