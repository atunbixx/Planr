/**
 * Field Validation Layer
 * Validates API requests against the field mappings to prevent mismatches
 */

import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'
import { ZodSchema } from 'zod'

export class FieldValidationError extends Error {
  constructor(
    public model: string,
    public invalidFields: string[],
    public validFields: string[]
  ) {
    super(
      `Invalid fields for ${model}: ${invalidFields.join(', ')}. ` +
      `Valid fields are: ${validFields.join(', ')}`
    )
    this.name = 'FieldValidationError'
  }
}

/**
 * Validates that all fields in the data object are valid for the given model
 */
export function validateModelFields<T extends Record<string, any>>(
  model: keyof typeof FIELD_MAPPINGS,
  data: T,
  allowPartial: boolean = false
): void {
  const fieldMappings = FIELD_MAPPINGS[model]
  
  if (!fieldMappings) {
    throw new Error(`No field mappings found for model: ${model}`)
  }

  // Check for deprecated model
  if ('_deprecated' in fieldMappings && fieldMappings._deprecated) {
    throw new Error(
      `Model ${model} is deprecated. Use ${fieldMappings._useInstead} instead.`
    )
  }

  const validFields = Object.values(fieldMappings).filter(
    field => typeof field === 'string'
  )
  
  const dataFields = Object.keys(data)
  const invalidFields = dataFields.filter(field => !validFields.includes(field))

  if (invalidFields.length > 0) {
    throw new FieldValidationError(model as string, invalidFields, validFields)
  }
}

/**
 * Validates Prisma where queries to ensure correct field names
 */
export function validateWhereQuery<T extends Record<string, any>>(
  model: keyof typeof FIELD_MAPPINGS,
  where: T
): void {
  const fieldMappings = FIELD_MAPPINGS[model]
  
  if (!fieldMappings) {
    throw new Error(`No field mappings found for model: ${model}`)
  }

  const validFields = Object.values(fieldMappings).filter(
    field => typeof field === 'string'
  )

  // Check all fields in the where clause
  const checkFields = (obj: any, path: string = ''): void => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      // Skip Prisma operators
      if (['OR', 'AND', 'NOT'].includes(key)) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            checkFields(item, `${currentPath}[${index}]`)
          })
        } else {
          checkFields(value, currentPath)
        }
        continue
      }

      // Skip Prisma comparison operators
      if (['gt', 'gte', 'lt', 'lte', 'equals', 'not', 'in', 'notIn', 'contains', 'startsWith', 'endsWith'].includes(key)) {
        continue
      }

      // Check if it's a valid field
      if (!validFields.includes(key)) {
        throw new FieldValidationError(
          model as string,
          [key],
          validFields
        )
      }
    }
  }

  checkFields(where)
}

/**
 * Creates a validated Zod schema that ensures field names match the database
 */
export function createValidatedSchema<T>(
  model: keyof typeof FIELD_MAPPINGS,
  schema: ZodSchema<T>
): ZodSchema<T> {
  return schema.transform((data) => {
    validateModelFields(model, data as any, true)
    return data
  })
}

/**
 * Validates that required fields exist in the field mappings
 */
export function validateRequiredFields(
  model: keyof typeof FIELD_MAPPINGS,
  requiredFields: string[]
): void {
  const fieldMappings = FIELD_MAPPINGS[model]
  
  if (!fieldMappings) {
    throw new Error(`No field mappings found for model: ${model}`)
  }

  const validFields = Object.values(fieldMappings).filter(
    field => typeof field === 'string'
  )

  const invalidRequired = requiredFields.filter(field => !validFields.includes(field))
  
  if (invalidRequired.length > 0) {
    throw new FieldValidationError(
      model as string,
      invalidRequired,
      validFields
    )
  }
}

/**
 * Runtime validation for API responses to ensure they match expected fields
 */
export function validateApiResponse<T extends Record<string, any>>(
  model: keyof typeof FIELD_MAPPINGS,
  response: T
): T {
  const fieldMappings = FIELD_MAPPINGS[model]
  
  if (!fieldMappings) {
    throw new Error(`No field mappings found for model: ${model}`)
  }

  const validFields = Object.values(fieldMappings).filter(
    field => typeof field === 'string'
  )

  // Check response fields
  const responseFields = Object.keys(response)
  const extraFields = responseFields.filter(field => 
    !validFields.includes(field) && 
    !['id', 'createdAt', 'updatedAt'].includes(field) // Allow common fields
  )

  if (extraFields.length > 0) {
    console.warn(
      `API response for ${model} contains unexpected fields: ${extraFields.join(', ')}`
    )
  }

  return response
}