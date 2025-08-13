/**
 * ID Generation Utilities - Consistent ID generation across the app
 */

import { randomUUID } from 'crypto'

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return randomUUID()
}

/**
 * Generate a short ID for public use (e.g., invitation codes)
 */
export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Generate a numeric ID for sequential purposes
 */
export function generateNumericId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5)
}

/**
 * Generate a prefixed ID with timestamp
 */
export function generatePrefixedId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Generate invitation code for RSVP
 */
export function generateInvitationCode(): string {
  return generateShortId(6)
}

/**
 * Generate idempotency key for API requests
 */
export function generateIdempotencyKey(): string {
  return generateId()
}