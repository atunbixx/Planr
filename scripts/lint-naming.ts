#!/usr/bin/env tsx

/**
 * Custom Naming Convention Linter
 * Enforces camelCase naming standards and prevents snake_case regressions
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { exit } from 'process'

interface NamingViolation {
  file: string
  line: number
  column: number
  type: 'snake_case_property' | 'snake_case_variable' | 'inconsistent_casing'
  message: string
  suggestion?: string
}

const ALLOWED_SNAKE_CASE_FIELDS = new Set([
  // Database column mappings (legacy compatibility)
  'created_at', 'updated_at', 'partner1_user_id', 'partner2_user_id',
  'couple_id', 'invitation_sent_at', 'rsvp_deadline', 'attending_count',
  'invited_at', 'industry_typical', 'display_order',
  // Prisma-specific fields
  '@@map', '@map'
])

const EXCLUDED_DIRECTORIES = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '__tests__',
  'casing.ts', 'compatibility.ts', 'transformations.ts', 'field-mappings.ts'
])

const INCLUDED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function isSnakeCase(str: string): boolean {
  return str.includes('_') && str === str.toLowerCase()
}

function scanFile(filePath: string): NamingViolation[] {
  const violations: NamingViolation[] = []
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1
      
      // Skip comments and strings
      const cleanLine = line
        .replace(/\/\/.*$/, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/"[^"]*"/g, '""') // Remove string literals
        .replace(/'[^']*'/g, "''") // Remove string literals
        .replace(/`[^`]*`/g, '``') // Remove template literals
      
      // Check for snake_case object properties
      const propertyRegex = /[\s\{,](\w*_\w+)\s*:/g
      let match
      
      while ((match = propertyRegex.exec(cleanLine)) !== null) {
        const property = match[1]
        
        if (!ALLOWED_SNAKE_CASE_FIELDS.has(property) && isSnakeCase(property)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            column: match.index + match[0].indexOf(property),
            type: 'snake_case_property',
            message: `Property "${property}" uses snake_case. Use camelCase instead.`,
            suggestion: snakeToCamel(property)
          })
        }
      }
      
      // Check for snake_case variable declarations
      const variableRegex = /(?:const|let|var)\s+(\w*_\w+)/g
      
      while ((match = variableRegex.exec(cleanLine)) !== null) {
        const variable = match[1]
        
        if (isSnakeCase(variable)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            column: match.index + match[0].indexOf(variable),
            type: 'snake_case_variable',
            message: `Variable "${variable}" uses snake_case. Use camelCase instead.`,
            suggestion: snakeToCamel(variable)
          })
        }
      }
      
      // Check for Prisma queries with snake_case field references
      const prismaRegex = /(?:where|select|include|orderBy)[\s\S]*?\{[\s\S]*?(\w*_\w+)\s*:/g
      
      while ((match = prismaRegex.exec(cleanLine)) !== null) {
        const field = match[1]
        
        if (!ALLOWED_SNAKE_CASE_FIELDS.has(field) && isSnakeCase(field)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            column: match.index + match[0].indexOf(field),
            type: 'inconsistent_casing',
            message: `Prisma field "${field}" should use camelCase after schema normalization.`,
            suggestion: snakeToCamel(field)
          })
        }
      }
    })
  } catch (error) {
    console.warn(`Warning: Could not scan file ${filePath}:`, error instanceof Error ? error.message : error)
  }
  
  return violations
}

function scanDirectory(dirPath: string): NamingViolation[] {
  const violations: NamingViolation[] = []
  
  try {
    const entries = readdirSync(dirPath)
    
    for (const entry of entries) {
      if (EXCLUDED_DIRECTORIES.has(entry)) {
        continue
      }
      
      const fullPath = join(dirPath, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        violations.push(...scanDirectory(fullPath))
      } else if (stat.isFile() && INCLUDED_EXTENSIONS.has(extname(entry))) {
        // Skip test files and compatibility files
        if (entry.includes('.test.') || entry.includes('.spec.') || 
            entry.includes('casing') || entry.includes('compatibility')) {
          continue
        }
        
        violations.push(...scanFile(fullPath))
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}:`, error instanceof Error ? error.message : error)
  }
  
  return violations
}

function formatViolations(violations: NamingViolation[]): void {
  if (violations.length === 0) {
    console.log('✅ No naming convention violations found!')
    return
  }
  
  console.log(`❌ Found ${violations.length} naming convention violation(s):\n`)
  
  // Group violations by file
  const violationsByFile = violations.reduce((acc, violation) => {
    if (!acc[violation.file]) {
      acc[violation.file] = []
    }
    acc[violation.file].push(violation)
    return acc
  }, {} as Record<string, NamingViolation[]>)
  
  Object.entries(violationsByFile).forEach(([file, fileViolations]) => {
    console.log(`📁 ${file}`)
    
    fileViolations.forEach(violation => {
      const typeIcon = {
        snake_case_property: '🔸',
        snake_case_variable: '🔹',
        inconsistent_casing: '⚠️'
      }[violation.type]
      
      console.log(`  ${typeIcon} Line ${violation.line}:${violation.column} - ${violation.message}`)
      
      if (violation.suggestion) {
        console.log(`      💡 Suggestion: Use "${violation.suggestion}" instead`)
      }
    })
    
    console.log() // Empty line between files
  })
}

function main() {
  console.log('🔍 Scanning for naming convention violations...\n')
  
  const srcPath = join(process.cwd(), 'src')
  const violations = scanDirectory(srcPath)
  
  formatViolations(violations)
  
  // Additional checks for specific patterns
  console.log('🔍 Checking for specific anti-patterns...\n')
  
  const antiPatterns = [
    'partner1_user_id',
    'partner2_user_id', 
    'attending_count',
    'invitation_sent_at',
    'rsvp_deadline'
  ]
  
  let hasAntiPatterns = false
  
  antiPatterns.forEach(pattern => {
    const patternViolations = violations.filter(v => 
      v.message.includes(pattern) && 
      !v.file.includes('transformations.ts') &&
      !v.file.includes('casing.ts') &&
      !v.file.includes('compatibility.ts')
    )
    
    if (patternViolations.length > 0) {
      hasAntiPatterns = true
      console.log(`⚠️  Found ${patternViolations.length} usage(s) of deprecated field "${pattern}"`)
    }
  })
  
  if (!hasAntiPatterns) {
    console.log('✅ No deprecated field patterns found!')
  }
  
  // Exit with error code if violations found
  if (violations.length > 0) {
    console.log('\n❌ Naming convention violations detected. Please fix the issues above.')
    console.log('💡 Run "npm run lint:naming:fix" for automatic fixes (coming soon)')
    exit(1)
  } else {
    console.log('\n✅ All naming conventions are compliant!')
    exit(0)
  }
}

if (require.main === module) {
  main()
}