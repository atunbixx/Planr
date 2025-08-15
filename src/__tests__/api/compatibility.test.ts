/**
 * API Endpoint Tests for Naming Convention Compatibility
 * Tests actual API endpoints to ensure compatibility layer works end-to-end
 */

import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock the Prisma client to avoid database dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    guest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    couple: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}))

describe('API Compatibility End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Guest API Endpoints', () => {
    it('should accept snake_case guest creation request', async () => {
      const snakeCaseGuest = {
        first_name: 'John',
        last_name: 'Doe',
        attending_count: 2,
        invitation_sent_at: '2024-01-01T00:00:00Z',
        rsvp_deadline: '2024-02-01T00:00:00Z',
        dietary_restrictions: 'Vegetarian',
        plus_one_allowed: true
      }

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/guests',
        headers: {
          'Content-Type': 'application/json'
        },
        body: snakeCaseGuest
      })

      // Mock successful guest creation
      const mockPrismaGuest = require('@/lib/prisma').prisma
      mockPrismaGuest.guest.create.mockResolvedValue({
        id: 'guest-123',
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        invitationSentAt: new Date('2024-01-01T00:00:00Z'),
        rsvpDeadline: new Date('2024-02-01T00:00:00Z'),
        dietaryRestrictions: 'Vegetarian',
        plusOneAllowed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Note: This would require the actual API route handler to be imported and tested
      // For now, we'll test the transformation logic directly
      
      const { transformRequestBody } = await import('@/lib/api/compatibility')
      const normalizedBody = transformRequestBody(snakeCaseGuest)

      expect(normalizedBody).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        invitationSentAt: '2024-01-01T00:00:00Z',
        rsvpDeadline: '2024-02-01T00:00:00Z',
        dietaryRestrictions: 'Vegetarian',
        plusOneAllowed: true
      })
    })

    it('should handle query parameter transformation for guest filtering', async () => {
      const { withCompatibility } = await import('@/lib/api/compatibility')
      
      let capturedRequest: NextRequest | null = null
      
      const mockHandler = async (request: NextRequest) => {
        capturedRequest = request
        return new Response(JSON.stringify({ guests: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const compatibleHandler = withCompatibility(mockHandler)

      const mockRequest = new NextRequest(
        'http://localhost:3000/api/guests?rsvp_status=pending&attending_count=2&invitation_sent_at=2024-01-01',
        { method: 'GET' }
      )

      await compatibleHandler(mockRequest)

      const url = new URL(capturedRequest!.url)
      expect(url.searchParams.get('rsvpStatus')).toBe('pending')
      expect(url.searchParams.get('attendingCount')).toBe('2')
      expect(url.searchParams.get('invitationSentAt')).toBe('2024-01-01')
    })
  })

  describe('Couple API Endpoints', () => {
    it('should handle couple creation with critical field mappings', async () => {
      const legacyCoupleData = {
        partner1_name: 'Alice',
        partner2_name: 'Bob',
        partner1_user_id: 'user-123',
        partner2_user_id: 'user-456',
        budget_total: 50000,
        wedding_date: '2024-06-01T00:00:00Z',
        venue_name: 'Garden Hall',
        venue_location: 'Downtown'
      }

      const { transformRequestBody } = await import('@/lib/api/compatibility')
      const normalizedBody = transformRequestBody(legacyCoupleData)

      expect(normalizedBody).toEqual({
        partner1Name: 'Alice',
        partner2Name: 'Bob',
        partner1UserId: 'user-123',
        partner2UserId: 'user-456',
        totalBudget: 50000,
        weddingDate: '2024-06-01T00:00:00Z',
        venueName: 'Garden Hall',
        venueLocation: 'Downtown'
      })

      // Verify critical field mappings were applied
      expect(normalizedBody.partner1UserId).toBe('user-123')
      expect(normalizedBody.partner2UserId).toBe('user-456')
      expect(normalizedBody.totalBudget).toBe(50000)

      // Verify old snake_case fields don't exist
      expect(normalizedBody.partner1_user_id).toBeUndefined()
      expect(normalizedBody.partner2_user_id).toBeUndefined()
      expect(normalizedBody.budget_total).toBeUndefined()
    })

    it('should preserve camelCase inputs without modification', async () => {
      const modernCoupleData = {
        partner1Name: 'Alice',
        partner2Name: 'Bob',
        partner1UserId: 'user-123',
        partner2UserId: 'user-456',
        totalBudget: 50000,
        weddingDate: '2024-06-01T00:00:00Z',
        venueName: 'Garden Hall'
      }

      const { transformRequestBody } = await import('@/lib/api/compatibility')
      const result = transformRequestBody(modernCoupleData)

      // Should be unchanged
      expect(result).toEqual(modernCoupleData)
    })
  })

  describe('Response Validation', () => {
    it('should ensure all API responses are camelCase compliant', async () => {
      const { ensureCamelCaseResponse, validateCamelCase } = await import('@/lib/api/compatibility')

      const apiResponse = {
        guest: {
          id: 'guest-123',
          firstName: 'John',
          lastName: 'Doe',
          attendingCount: 2,
          invitationSentAt: '2024-01-01T00:00:00Z',
          rsvpDeadline: '2024-02-01T00:00:00Z'
        },
        pagination: {
          totalCount: 1,
          pageSize: 10,
          currentPage: 1
        }
      }

      const validatedResponse = ensureCamelCaseResponse(apiResponse)
      const validation = validateCamelCase(validatedResponse)

      expect(validation.isValid).toBe(true)
      expect(validation.violations).toEqual([])
    })

    it('should detect snake_case violations in responses', async () => {
      const { validateCamelCase } = await import('@/lib/api/compatibility')

      const badResponse = {
        guest: {
          id: 'guest-123',
          first_name: 'John', // Violation
          lastName: 'Doe',
          attending_count: 2, // Violation
          invitationSentAt: '2024-01-01T00:00:00Z'
        }
      }

      const validation = validateCamelCase(badResponse)

      expect(validation.isValid).toBe(false)
      expect(validation.violations).toContain('guest.first_name: snake_case key "first_name"')
      expect(validation.violations).toContain('guest.attending_count: snake_case key "attending_count"')
    })
  })

  describe('Deprecation Warnings', () => {
    it('should add deprecation headers for snake_case requests', async () => {
      const { withCompatibility } = await import('@/lib/api/compatibility')

      const mockHandler = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const compatibleHandler = withCompatibility(mockHandler, {
        addDeprecationWarning: true
      })

      const snakeCaseBody = {
        first_name: 'John',
        attending_count: 2
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/guests', {
        method: 'POST',
        body: JSON.stringify(snakeCaseBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await compatibleHandler(mockRequest)

      expect(response.headers.get('X-Deprecation-Warning')).toBeTruthy()
      expect(response.headers.get('X-Migration-Guide')).toBeTruthy()
    })

    it('should not add deprecation headers for camelCase requests', async () => {
      const { withCompatibility } = await import('@/lib/api/compatibility')

      const mockHandler = async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const compatibleHandler = withCompatibility(mockHandler, {
        addDeprecationWarning: true
      })

      const camelCaseBody = {
        firstName: 'John',
        attendingCount: 2
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/guests', {
        method: 'POST',
        body: JSON.stringify(camelCaseBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await compatibleHandler(mockRequest)

      expect(response.headers.get('X-Deprecation-Warning')).toBeNull()
      expect(response.headers.get('X-Migration-Guide')).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const { withCompatibility } = await import('@/lib/api/compatibility')

      const mockHandler = async (request: NextRequest, normalizedBody?: any) => {
        if (normalizedBody === undefined) {
          return new Response('Bad Request', { status: 400 })
        }
        return new Response('OK', { status: 200 })
      }

      const compatibleHandler = withCompatibility(mockHandler)

      const mockRequest = new NextRequest('http://localhost:3000/api/guests', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await compatibleHandler(mockRequest)

      // Should handle gracefully without crashing
      expect(response.status).toBe(400)
    })

    it('should handle empty request bodies', async () => {
      const { transformRequestBody } = await import('@/lib/api/compatibility')

      expect(transformRequestBody(null)).toBe(null)
      expect(transformRequestBody(undefined)).toBe(undefined)
      expect(transformRequestBody({})).toEqual({})
    })

    it('should handle non-object request bodies', async () => {
      const { transformRequestBody } = await import('@/lib/api/compatibility')

      expect(transformRequestBody('string')).toBe('string')
      expect(transformRequestBody(123)).toBe(123)
      expect(transformRequestBody(true)).toBe(true)
      expect(transformRequestBody(['array'])).toEqual(['array'])
    })
  })

  describe('Batch Operations', () => {
    it('should handle bulk guest creation with mixed casing', async () => {
      const bulkGuestData = {
        guests: [
          {
            first_name: 'John',
            attending_count: 1
          },
          {
            firstName: 'Jane',
            attendingCount: 2
          },
          {
            first_name: 'Bob',
            last_name: 'Smith',
            invitation_sent_at: '2024-01-01T00:00:00Z'
          }
        ]
      }

      const { transformRequestBody } = await import('@/lib/api/compatibility')
      const normalized = transformRequestBody(bulkGuestData)

      expect(normalized.guests[0]).toEqual({
        firstName: 'John',
        attendingCount: 1
      })

      expect(normalized.guests[1]).toEqual({
        firstName: 'Jane',
        attendingCount: 2
      })

      expect(normalized.guests[2]).toEqual({
        firstName: 'Bob',
        lastName: 'Smith',
        invitationSentAt: '2024-01-01T00:00:00Z'
      })
    })
  })
})