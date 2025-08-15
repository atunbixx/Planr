/**
 * Type definitions for casing transformation utilities
 */

export type CasingStyle = 'camelCase' | 'snake_case'

/**
 * Transform camelCase string to snake_case at type level
 */
export type CamelToSnake<T extends string> = T extends `${infer A}${infer B}`
  ? B extends Uncapitalize<B>
    ? `${Lowercase<A>}${CamelToSnake<B>}`
    : `${Lowercase<A>}_${CamelToSnake<Uncapitalize<B>>}`
  : T

/**
 * Transform snake_case string to camelCase at type level
 */
export type SnakeToCamel<T extends string> = T extends `${infer A}_${infer B}`
  ? `${A}${Capitalize<SnakeToCamel<B>>}`
  : T

/**
 * Transform object with camelCase keys to snake_case at type level
 */
export type ObjectToSnakeCase<T> = {
  [K in keyof T as CamelToSnake<string & K>]: T[K] extends Record<string, any>
    ? ObjectToSnakeCase<T[K]>
    : T[K]
}

/**
 * Transform object with snake_case keys to camelCase at type level
 */
export type ObjectToCamelCase<T> = {
  [K in keyof T as SnakeToCamel<string & K>]: T[K] extends Record<string, any>
    ? ObjectToCamelCase<T[K]>
    : T[K]
}

/**
 * Field mappings for critical naming conflicts
 */
export interface FieldMappings {
  readonly partner1_user_id: 'partner1UserId'
  readonly partner2_user_id: 'partner2UserId'
  readonly budget_total: 'totalBudget'
  readonly invitation_sent_at: 'invitationSentAt'
  readonly rsvp_deadline: 'rsvpDeadline'
  readonly attending_count: 'attendingCount'
  readonly couple_id: 'coupleId'
  readonly invited_at: 'invitedAt'
  readonly industry_typical: 'industryTypical'
  readonly display_order: 'displayOrder'
  readonly updated_at: 'updatedAt'
  readonly created_at: 'createdAt'
}

/**
 * Reverse field mappings (camelCase to snake_case)
 */
export type ReverseFieldMappings = {
  [K in keyof FieldMappings as FieldMappings[K]]: K
}

/**
 * Apply field mapping transformations
 */
export type ApplyFieldMappings<T> = {
  [K in keyof T as K extends keyof FieldMappings ? FieldMappings[K] : K]: T[K]
}

/**
 * Apply reverse field mapping transformations
 */
export type ApplyReverseFieldMappings<T> = {
  [K in keyof T as K extends keyof ReverseFieldMappings ? ReverseFieldMappings[K] : K]: T[K]
}

/**
 * Comprehensive input normalization type
 */
export type NormalizeInput<T> = ObjectToCamelCase<ApplyFieldMappings<T>>

/**
 * Legacy output transformation type
 */
export type LegacyOutput<T> = ObjectToSnakeCase<ApplyReverseFieldMappings<T>>

/**
 * Smart normalization based on detected casing style
 */
export type SmartNormalize<T> = T extends Record<string, any>
  ? ObjectToCamelCase<T>
  : T

/**
 * Validation result for camelCase compliance
 */
export interface CasingValidationResult {
  isValid: boolean
  violations: string[]
}

/**
 * API compatibility options
 */
export interface CompatibilityOptions {
  alwaysCamelCaseOutput?: boolean
  supportLegacyInput?: boolean
  logWarnings?: boolean
  addDeprecationWarning?: boolean
}

/**
 * Utility types for API handler transformations
 */
export type CompatibleRequestBody<T> = T | ObjectToSnakeCase<T>
export type NormalizedRequestBody<T> = ObjectToCamelCase<T>
export type CompatibleResponse<T> = ObjectToCamelCase<T>

/**
 * Legacy compatibility types for gradual migration
 */
export interface LegacyGuestFields {
  first_name?: string
  last_name?: string
  dietary_restrictions?: string
  plus_one_allowed?: boolean
  attending_count?: number
  invitation_sent_at?: Date
  rsvp_deadline?: Date
}

export interface ModernGuestFields {
  firstName: string
  lastName?: string
  dietaryRestrictions?: string
  plusOneAllowed?: boolean
  attendingCount?: number
  invitationSentAt?: Date
  rsvpDeadline?: Date
}

export type CompatibleGuestInput = ModernGuestFields | LegacyGuestFields | (ModernGuestFields & LegacyGuestFields)

/**
 * Type guard utilities
 */
export function isCamelCase(key: string): boolean
export function isSnakeCase(key: string): boolean
export function hasLegacyFields<T extends Record<string, any>>(obj: T): boolean
export function hasModernFields<T extends Record<string, any>>(obj: T): boolean