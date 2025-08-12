#!/usr/bin/env ts-node

import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'

// Migration script to convert existing API routes to enterprise patterns

interface MigrationTask {
  name: string
  description: string
  execute: () => Promise<void>
}

const tasks: MigrationTask[] = [
  {
    name: 'Update API Routes',
    description: 'Migrate existing API routes to use enterprise patterns',
    execute: async () => {
      console.log('🔄 Migrating API routes...')
      
      // List of API routes to migrate
      const apiRoutes = [
        'src/app/api/vendors/route.ts',
        'src/app/api/guests/route.ts',
        'src/app/api/budget/categories/route.ts',
        'src/app/api/budget/expenses/route.ts',
        'src/app/api/photos/route.ts',
        'src/app/api/dashboard/stats/route.ts',
      ]
      
      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const migrated = migrateRouteContent(content)
          
          // Create v2 version
          const v2Path = fullPath.replace('/api/', '/api/v2/')
          const v2Dir = path.dirname(v2Path)
          
          await fs.mkdir(v2Dir, { recursive: true })
          await fs.writeFile(v2Path, migrated)
          
          console.log(`✅ Migrated ${route} -> ${v2Path}`)
        } catch (error) {
          console.error(`❌ Failed to migrate ${route}:`, error)
        }
      }
    }
  },
  
  {
    name: 'Update Service Layer',
    description: 'Create service wrappers for existing logic',
    execute: async () => {
      console.log('🔄 Creating service layer...')
      
      // Generate service interfaces
      const services = [
        { name: 'PhotoService', domain: 'photo' },
        { name: 'BudgetService', domain: 'budget' },
        { name: 'NotificationService', domain: 'notification' },
      ]
      
      for (const service of services) {
        const servicePath = `src/application/services/${service.domain}.service.ts`
        const template = generateServiceTemplate(service.name, service.domain)
        
        await fs.mkdir(path.dirname(servicePath), { recursive: true })
        await fs.writeFile(servicePath, template)
        
        console.log(`✅ Created ${service.name}`)
      }
    }
  },
  
  {
    name: 'Update Frontend API Calls',
    description: 'Update frontend to use v2 endpoints',
    execute: async () => {
      console.log('🔄 Updating frontend API calls...')
      
      const frontendFiles = await glob('src/**/*.{ts,tsx}', {
        ignore: ['**/node_modules/**', '**/api/**']
      })
      
      let updatedCount = 0
      
      for (const file of frontendFiles) {
        try {
          let content = await fs.readFile(file, 'utf-8')
          let updated = false
          
          // Update API endpoints
          const apiPatterns = [
            { from: /\/api\/vendors/g, to: '/api/v2/vendors' },
            { from: /\/api\/guests/g, to: '/api/v2/guests' },
            { from: /\/api\/budget/g, to: '/api/v2/budget' },
            { from: /\/api\/photos/g, to: '/api/v2/photos' },
            { from: /\/api\/dashboard\/stats/g, to: '/api/v2/dashboard/stats' },
          ]
          
          for (const pattern of apiPatterns) {
            if (pattern.from.test(content)) {
              content = content.replace(pattern.from, pattern.to)
              updated = true
            }
          }
          
          if (updated) {
            await fs.writeFile(file, content)
            updatedCount++
          }
        } catch (error) {
          console.error(`❌ Failed to update ${file}:`, error)
        }
      }
      
      console.log(`✅ Updated ${updatedCount} frontend files`)
    }
  },
  
  {
    name: 'Generate Type Definitions',
    description: 'Generate TypeScript types from Prisma schema',
    execute: async () => {
      console.log('🔄 Generating type definitions...')
      
      // This would normally use Prisma's type generation
      // For now, we'll create a types file
      const typesContent = `// Auto-generated types from Prisma schema

export interface Vendor {
  id: string
  coupleId: string
  categoryId: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  status: VendorStatus
  estimatedCost?: number
  actualCost?: number
  contractSigned: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Guest {
  id: string
  coupleId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  side: GuestSide
  relationship?: string
  attendingStatus: AttendingStatus
  plusOneAllowed: boolean
  plusOneName?: string
  mealPreference?: MealPreference
  dietaryRestrictions?: string
  allergies?: string[]
  notes?: string
  invitationSent: boolean
  invitationSentAt?: Date
  rsvpReceivedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface BudgetCategory {
  id: string
  coupleId: string
  name: string
  icon: string
  color: string
  priority: BudgetPriority
  allocatedAmount: number
  spentAmount: number
  createdAt: Date
  updatedAt: Date
}

export interface BudgetExpense {
  id: string
  coupleId: string
  categoryId: string
  vendorId?: string
  vendorName?: string
  description: string
  amount: number
  expenseType: ExpenseType
  paymentStatus: PaymentStatus
  paymentMethod?: string
  dueDate?: Date
  paidDate?: Date
  receiptUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}
`
      
      await fs.writeFile('src/shared/types/models.ts', typesContent)
      console.log('✅ Generated type definitions')
    }
  },
  
  {
    name: 'Setup Environment',
    description: 'Update environment variables',
    execute: async () => {
      console.log('🔄 Setting up environment...')
      
      const envExample = `# Existing variables
${await fs.readFile('.env.example', 'utf-8')}

# Enterprise features
APP_VERSION=1.0.0
SERVICE_NAME=wedding-planner
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
SESSION_SECRET=your-32-character-secret-here-change-me
ENCRYPTION_KEY=your-32-character-encryption-key-change
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_METRICS=true
ENABLE_TRACING=true
ENABLE_CACHE=true
`
      
      await fs.writeFile('.env.example', envExample)
      console.log('✅ Updated .env.example')
    }
  }
]

function migrateRouteContent(content: string): string {
  // Add imports
  const imports = `import { NextRequest, NextResponse } from 'next/server'
import { routeHandler } from '@/core/errors'
import { requireAuthAndPermission, Permission } from '@/infrastructure/auth'
import { metricsMiddleware } from '@/core/monitoring'
import { rateLimiters } from '@/core/security'
import { getService, TOKENS } from '@/core/di'
import { logger } from '@/core/logging/logger'
\n`
  
  // Replace auth() with new pattern
  content = content.replace(
    /const\s*{\s*userId\s*}\s*=\s*await\s*auth\(\)/g,
    'const user = await authService.getCurrentUser()'
  )
  
  // Wrap handlers
  content = content.replace(
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g,
    (match, method) => {
      const permission = method === 'GET' ? 'read' : 'write'
      return `export const ${method} = routeHandler(
  requireAuthAndPermission(Permission.VENDOR_${permission.toUpperCase()})(
    metricsMiddleware(
      rateLimiters.${permission}.middleware()(
        async (`
    }
  )
  
  return imports + content
}

function generateServiceTemplate(name: string, domain: string): string {
  return `import { injectable, inject } from 'tsyringe'
import { TOKENS } from '@/core/di'
import { UserContext } from '@/infrastructure/auth'
import { Trace } from '@/core/monitoring'
import { logger } from '@/core/logging/logger'

// Service interface
export interface I${name} {
  // Add methods here
}

// Implementation
@injectable()
export class ${name} implements I${name} {
  constructor(
    // Add dependencies here
  ) {}
  
  @Trace()
  async example(user: UserContext): Promise<void> {
    logger.info('${name} method called', { userId: user.userId })
    // Implement logic here
  }
}
`
}

// Run migration
async function main() {
  console.log('🚀 Starting enterprise migration...\n')
  
  for (const task of tasks) {
    console.log(`\n📋 ${task.name}`)
    console.log(`   ${task.description}`)
    
    try {
      await task.execute()
    } catch (error) {
      console.error(`\n❌ Task failed: ${task.name}`, error)
      process.exit(1)
    }
  }
  
  console.log('\n✅ Migration completed successfully!')
  console.log('\n📝 Next steps:')
  console.log('1. Review the generated v2 API routes')
  console.log('2. Update any custom logic in the service layer')
  console.log('3. Run tests to ensure everything works')
  console.log('4. Gradually switch frontend to use v2 endpoints')
}

main().catch(console.error)