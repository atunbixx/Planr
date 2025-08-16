/**
 * EXAMPLE: Updated Guests Handler with Naming Compatibility
 * 
 * This demonstrates how to update existing handlers to support both
 * snake_case (legacy) and camelCase (modern) API conventions
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler } from '../base-handler'
import { GuestService } from '@/features/guests/service/guest.service'
import { 
  withCompatibility, 
  transformRequestBody, 
  ensureCamelCaseResponse,
  validateCamelCase 
} from '../compatibility'

// Modern validation schemas (camelCase only)
const createGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  plusOneAllowed: z.boolean().default(false),
  side: z.enum(['partner1', 'partner2', 'both']).optional(),
  // Normalized field names (no more snake_case)
  attendingCount: z.number().optional(),
  invitationSentAt: z.date().optional(),
  rsvpDeadline: z.date().optional()
})

// Legacy compatibility schema (supports both naming conventions)
const legacyCreateGuestSchema = z.object({
  // Modern camelCase fields
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  plusOneAllowed: z.boolean().default(false),
  side: z.enum(['partner1', 'partner2', 'both']).optional(),
  attendingCount: z.number().optional(),
  invitationSentAt: z.date().optional(),
  rsvpDeadline: z.date().optional(),
  
  // Legacy snake_case fields (will be converted)
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  plus_one_allowed: z.boolean().optional(),
  attending_count: z.number().optional(),
  invitation_sent_at: z.date().optional(),
  rsvp_deadline: z.date().optional()
}).refine(data => {
  // Ensure either camelCase OR snake_case is provided, not both
  const hasCamelCase = data.firstName !== undefined
  const hasSnakeCase = data.first_name !== undefined
  return hasCamelCase || hasSnakeCase
}, {
  message: "Either camelCase or snake_case field names must be provided"
})

const updateGuestSchema = createGuestSchema.partial()

export class GuestsCompatibleHandler extends BaseApiHandler {
  protected model = 'Guest' as const
  private guestService = new GuestService()
  
  /**
   * LIST: Get guests with query parameter compatibility
   */
  async list(request: NextRequest) {
    return withCompatibility(async (normalizedRequest) => {
      return this.handleRequest(normalizedRequest, async () => {
        // Parse normalized query parameters (automatically converted from snake_case)
        const url = new URL(normalizedRequest.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        
        // These params are now guaranteed to be camelCase
        const rsvpStatus = url.searchParams.get('rsvpStatus') // was rsvp_status
        const invitationStatus = url.searchParams.get('invitationStatus') // was invitation_status
        const attendingCount = url.searchParams.get('attendingCount') // was attending_count

        const result = await this.guestService.list({ 
          page, 
          limit, 
          rsvpStatus: rsvpStatus as any,
          invitationStatus: invitationStatus as any,
          attendingCount: attendingCount ? parseInt(attendingCount) : undefined
        })

        // Ensure response is camelCase compliant
        return this.success(ensureCamelCaseResponse(result))
      })
    }, {
      supportLegacyInput: true,
      logWarnings: true,
      addDeprecationWarning: true
    })(request)
  }

  /**
   * CREATE: Create guest with input compatibility
   */
  async create(request: NextRequest) {
    return NextResponse.json(
      {
        error: 'This endpoint is deprecated. Use POST /api/v1/guests instead.',
        documentation: '/api/docs'
      },
      { 
        status: 410,
        headers: { 'X-Handler': 'deprecated/guests-handler-compatible' }
      }
    );
  }

  /**
   * UPDATE: Update guest with input compatibility
   */
  async update(request: NextRequest, id: string) {
    return withCompatibility(async (normalizedRequest, normalizedBody) => {
      return this.handleRequest(normalizedRequest, async () => {
        // Validate against modern schema
        const validationResult = updateGuestSchema.safeParse(normalizedBody)
        
        if (!validationResult.success) {
          return this.error('Validation failed', 400, {
            errors: validationResult.error.format(),
            hint: 'Use camelCase field names (firstName, lastName, attendingCount, etc.)'
          })
        }

        const result = await this.guestService.update(id, validationResult.data)
        return this.success(ensureCamelCaseResponse(result))
      })
    }, {
      supportLegacyInput: true,
      logWarnings: true,
      addDeprecationWarning: true
    })(request)
  }

  /**
   * GET: Get single guest (no body transformation needed)
   */
  async get(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const result = await this.guestService.get(id)
      return this.success(ensureCamelCaseResponse(result))
    })
  }

  /**
   * DELETE: Delete guest (no body transformation needed)
   */
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      await this.guestService.delete(id)
      return this.success({ message: 'Guest deleted successfully' })
    })
  }

  /**
   * BULK IMPORT: Handle bulk operations with compatibility
   */
  async bulkImport(request: NextRequest) {
    return withCompatibility(async (normalizedRequest, normalizedBody) => {
      return this.handleRequest(normalizedRequest, async () => {
        // Expect array of guests
        if (!Array.isArray(normalizedBody?.guests)) {
          return this.error('Expected array of guests', 400)
        }

        // Validate each guest in the array
        const validationResults = normalizedBody.guests.map((guest: any, index: number) => {
          const result = createGuestSchema.safeParse(guest)
          if (!result.success) {
            return { index, errors: result.error.format() }
          }
          return { index, data: result.data }
        })

        const errors = validationResults.filter(r => 'errors' in r)
        if (errors.length > 0) {
          return this.error('Validation failed for some guests', 400, { errors })
        }

        const validGuests = validationResults.map(r => (r as any).data)
        const result = await this.guestService.bulkCreate(validGuests)
        
        return this.success(ensureCamelCaseResponse(result))
      })
    }, {
      supportLegacyInput: true,
      logWarnings: true,
      addDeprecationWarning: true
    })(request)
  }
}

/**
 * Usage in API route:
 * 
 * // app/api/guests/route.ts
 * import { GuestsCompatibleHandler } from '@/lib/api/handlers/guests-handler-compatible'
 * 
 * const handler = new GuestsCompatibleHandler()
 * 
 * export async function GET(request: NextRequest) {
 *   return handler.list(request)
 * }
 * 
 * export async function POST(request: NextRequest) {
 *   return handler.create(request)
 * }
 * 
 * // app/api/guests/[id]/route.ts
 * export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 *   return handler.get(request, params.id)
 * }
 * 
 * export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
 *   return handler.update(request, params.id)
 * }
 * 
 * export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
 *   return handler.delete(request, params.id)
 * }
 */

/**
 * Migration Strategy:
 * 
 * 1. **Phase 1**: Deploy compatibility handlers alongside existing ones
 * 2. **Phase 2**: Update frontend to use camelCase exclusively
 * 3. **Phase 3**: Monitor API usage for snake_case deprecation warnings
 * 4. **Phase 4**: Remove legacy compatibility after deprecation period
 * 5. **Phase 5**: Replace original handlers with simplified camelCase-only versions
 */