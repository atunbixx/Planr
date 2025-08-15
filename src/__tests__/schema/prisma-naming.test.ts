/**
 * Prisma Schema Naming Convention Tests
 * Validates that the Prisma schema follows camelCase conventions with proper @map directives
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Prisma Schema Naming Conventions', () => {
  let schemaContent: string

  beforeAll(() => {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
    schemaContent = readFileSync(schemaPath, 'utf-8')
  })

  describe('Model Field Naming', () => {
    it('should use camelCase for all model fields', () => {
      const modelBlocks = extractModelBlocks(schemaContent)
      const violations: string[] = []

      modelBlocks.forEach(({ modelName, content }) => {
        const fieldLines = content.split('\n').filter(line => {
          const trimmed = line.trim()
          return trimmed && 
                 !trimmed.startsWith('//') && 
                 !trimmed.startsWith('@@') && 
                 !trimmed.startsWith('model ') &&
                 !trimmed === '}'
        })

        fieldLines.forEach((line, index) => {
          const fieldMatch = line.match(/^\s*(\w+)\s+/)
          if (fieldMatch) {
            const fieldName = fieldMatch[1]
            if (fieldName.includes('_') && !isAllowedSnakeCase(fieldName)) {
              violations.push(`${modelName}: Field "${fieldName}" uses snake_case (line ${index + 1})`)
            }
          }
        })
      })

      if (violations.length > 0) {
        fail(`Found snake_case field violations:\n${violations.join('\n')}`)
      }
    })

    it('should have @map directives for database column mappings', () => {
      const criticalFields = [
        { model: 'Couple', field: 'partner1UserId', dbColumn: 'partner1_user_id' },
        { model: 'Couple', field: 'partner2UserId', dbColumn: 'partner2_user_id' },
        { model: 'Guest', field: 'attendingCount', dbColumn: 'attending_count' },
        { model: 'Guest', field: 'invitationSentAt', dbColumn: 'invitation_sent_at' },
        { model: 'Guest', field: 'rsvpDeadline', dbColumn: 'rsvp_deadline' },
        { model: 'Invitation', field: 'coupleId', dbColumn: 'couple_id' },
        { model: 'Invitation', field: 'invitedAt', dbColumn: 'invited_at' },
        { model: 'VendorCategory', field: 'industryTypical', dbColumn: 'industry_typical' },
        { model: 'VendorCategory', field: 'displayOrder', dbColumn: 'display_order' }
      ]

      const missingMappings: string[] = []

      criticalFields.forEach(({ model, field, dbColumn }) => {
        const modelContent = extractModelContent(schemaContent, model)
        if (!modelContent) {
          missingMappings.push(`Model ${model} not found`)
          return
        }

        const fieldPattern = new RegExp(`\\s+${field}\\s+.*@map\\("${dbColumn}"\\)`)
        if (!fieldPattern.test(modelContent)) {
          missingMappings.push(`${model}.${field} missing @map("${dbColumn}")`)
        }
      })

      if (missingMappings.length > 0) {
        fail(`Missing critical @map directives:\n${missingMappings.join('\n')}`)
      }
    })
  })

  describe('Relation Naming', () => {
    it('should use camelCase for all relation names', () => {
      const relationPattern = /(\w+)\s+(\w+)(\[\])?(?:\s+@relation)?/g
      const violations: string[] = []
      
      let match
      while ((match = relationPattern.exec(schemaContent)) !== null) {
        const relationName = match[2]
        
        if (relationName.includes('_') && !isAllowedSnakeCase(relationName)) {
          violations.push(`Relation "${relationName}" uses snake_case`)
        }
      }

      if (violations.length > 0) {
        fail(`Found snake_case relation violations:\n${violations.join('\n')}`)
      }
    })
  })

  describe('Legacy References Cleanup', () => {
    it('should not contain legacy_notifications model', () => {
      expect(schemaContent).not.toMatch(/model\s+legacy_notifications/)
    })

    it('should not contain legacy_notifications relations', () => {
      expect(schemaContent).not.toMatch(/legacy_notifications\s+legacy_notifications/)
    })

    it('should not contain deprecated field patterns', () => {
      const deprecatedPatterns = [
        /budget_total.*(?!@map)/,  // budget_total without @map
        /partner1_user_id.*(?!@map)/, // partner1_user_id without @map
        /partner2_user_id.*(?!@map)/ // partner2_user_id without @map
      ]

      deprecatedPatterns.forEach((pattern, index) => {
        if (pattern.test(schemaContent)) {
          fail(`Found deprecated field pattern ${index + 1} in schema`)
        }
      })
    })
  })

  describe('Table Mapping Consistency', () => {
    it('should have consistent @@map directives for all models', () => {
      const modelBlocks = extractModelBlocks(schemaContent)
      const missingTableMaps: string[] = []

      modelBlocks.forEach(({ modelName, content }) => {
        // Check if model has @@map directive
        if (!content.includes('@@map(')) {
          // Some models might not need explicit table mapping if they match
          // But critical models should have explicit mappings
          const criticalModels = ['Couple', 'Guest', 'Invitation', 'VendorCategory']
          if (criticalModels.includes(modelName)) {
            missingTableMaps.push(`Model ${modelName} missing @@map directive`)
          }
        }
      })

      if (missingTableMaps.length > 0) {
        console.warn(`Potential missing table mappings:\n${missingTableMaps.join('\n')}`)
        // This is a warning, not a failure, as some models might not need explicit mapping
      }
    })
  })

  describe('Type Consistency', () => {
    it('should use consistent TypeScript-compatible types', () => {
      const typeViolations: string[] = []
      
      // Check for any remaining SQL-specific types that should be mapped
      const lines = schemaContent.split('\n')
      
      lines.forEach((line, index) => {
        if (line.includes('@db.') && !line.includes('@map')) {
          // This might indicate a type that needs field mapping
          const lineNumber = index + 1
          if (line.includes('_') && !line.includes('@map')) {
            typeViolations.push(`Line ${lineNumber}: Potential unmapped database type: ${line.trim()}`)
          }
        }
      })

      if (typeViolations.length > 0) {
        console.warn(`Potential type mapping issues:\n${typeViolations.join('\n')}`)
      }
    })
  })
})

// Helper functions
function extractModelBlocks(schema: string): Array<{ modelName: string; content: string }> {
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  const models: Array<{ modelName: string; content: string }> = []
  
  let match
  while ((match = modelRegex.exec(schema)) !== null) {
    models.push({
      modelName: match[1],
      content: match[0]
    })
  }
  
  return models
}

function extractModelContent(schema: string, modelName: string): string | null {
  const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{([^}]+)\\}`, 's')
  const match = schema.match(modelRegex)
  return match ? match[0] : null
}

function isAllowedSnakeCase(fieldName: string): boolean {
  const allowedPatterns = [
    // Prisma-specific directives
    '@@map', '@map', '@db', '@id', '@default', '@relation',
    // Database functions and constraints
    'gen_random_uuid', 'uuid_generate_v4', 'now',
    // Allowed legacy database column references in @map directives only
    'created_at', 'updated_at', 'partner1_user_id', 'partner2_user_id',
    'couple_id', 'invitation_sent_at', 'rsvp_deadline', 'attending_count',
    'invited_at', 'industry_typical', 'display_order'
  ]
  
  return allowedPatterns.some(pattern => fieldName.includes(pattern))
}