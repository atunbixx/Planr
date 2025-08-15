/**
 * Integration Tests for Naming Convention Compatibility
 * Validates the entire naming normalization system end-to-end
 */

import { NextRequest } from 'next/server'
import { withCompatibility, transformRequestBody, validateCamelCase } from '@/lib/api/compatibility'
import { normalizeInput, smartNormalize, detectCasingStyle } from '@/lib/utils/casing'

describe('Naming Compatibility Integration Tests', () => {
  describe('API Request Transformation Pipeline', () => {
    it('should handle complete guest creation flow with snake_case input', async () => {
      // Simulate snake_case API request (legacy client)
      const snakeCaseRequest = {
        first_name: 'John',
        last_name: 'Doe',
        attending_count: 2,
        invitation_sent_at: '2024-01-01T00:00:00Z',
        rsvp_deadline: '2024-02-01T00:00:00Z',
        dietary_restrictions: 'Vegetarian',
        plus_one_allowed: true
      }

      // Transform using the compatibility layer
      const normalized = normalizeInput(snakeCaseRequest)

      // Verify complete transformation
      expect(normalized).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        invitationSentAt: '2024-01-01T00:00:00Z',
        rsvpDeadline: '2024-02-01T00:00:00Z',
        dietaryRestrictions: 'Vegetarian',
        plusOneAllowed: true
      })

      // Verify camelCase compliance
      const validation = validateCamelCase(normalized)
      expect(validation.isValid).toBe(true)
      expect(validation.violations).toEqual([])
    })

    it('should handle couple creation with critical field mappings', async () => {
      const legacyCoupleRequest = {
        partner1_name: 'Alice',
        partner2_name: 'Bob',
        partner1_user_id: 'user-123',
        partner2_user_id: 'user-456',
        budget_total: 50000,
        wedding_date: '2024-06-01',
        venue_name: 'Garden Hall'
      }

      const normalized = normalizeInput(legacyCoupleRequest)

      expect(normalized).toEqual({
        partner1Name: 'Alice',
        partner2Name: 'Bob',
        partner1UserId: 'user-123', // Critical field mapping
        partner2UserId: 'user-456', // Critical field mapping
        totalBudget: 50000, // Critical field mapping
        weddingDate: '2024-06-01',
        venueName: 'Garden Hall'
      })

      const validation = validateCamelCase(normalized)
      expect(validation.isValid).toBe(true)
    })

    it('should preserve modern camelCase requests unchanged', async () => {
      const modernRequest = {
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        invitationSentAt: '2024-01-01T00:00:00Z',
        rsvpDeadline: '2024-02-01T00:00:00Z',
        dietaryRestrictions: 'Vegetarian'
      }

      const result = smartNormalize(modernRequest)

      // Should be unchanged since already camelCase
      expect(result).toEqual(modernRequest)
      
      const validation = validateCamelCase(result)
      expect(validation.isValid).toBe(true)
    })
  })

  describe('API Handler Wrapper Integration', () => {
    it('should properly wrap handlers with compatibility middleware', async () => {
      let processedBody: any = null
      
      // Mock handler that captures the processed body
      const mockHandler = async (request: NextRequest, normalizedBody?: any) => {
        processedBody = normalizedBody
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Create compatibility wrapper
      const compatibleHandler = withCompatibility(mockHandler, {
        supportLegacyInput: true,
        logWarnings: false,
        addDeprecationWarning: true
      })

      // Simulate request with snake_case body
      const snakeCaseBody = {
        first_name: 'Jane',
        attending_count: 1,
        invitation_sent_at: '2024-01-01T00:00:00Z'
      }

      const mockRequest = new NextRequest('http://localhost:3000/api/guests', {
        method: 'POST',
        body: JSON.stringify(snakeCaseBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await compatibleHandler(mockRequest)

      // Verify response success
      expect(response.status).toBe(200)
      
      // Verify body was normalized to camelCase
      expect(processedBody).toEqual({
        firstName: 'Jane',
        attendingCount: 1,
        invitationSentAt: '2024-01-01T00:00:00Z'
      })

      // Verify deprecation headers were added
      expect(response.headers.get('X-Deprecation-Warning')).toBeTruthy()
      expect(response.headers.get('X-Migration-Guide')).toBeTruthy()
    })

    it('should handle query parameter transformation', async () => {
      let receivedRequest: NextRequest | null = null
      
      const mockHandler = async (request: NextRequest) => {
        receivedRequest = request
        return new Response('OK')
      }

      const compatibleHandler = withCompatibility(mockHandler, {
        supportLegacyInput: true
      })

      // Request with snake_case query parameters
      const requestUrl = 'http://localhost:3000/api/guests?rsvp_status=pending&attending_count=2&invitation_sent_at=2024-01-01'
      const mockRequest = new NextRequest(requestUrl, { method: 'GET' })

      await compatibleHandler(mockRequest)

      // Verify query parameters were normalized
      const url = new URL(receivedRequest!.url)
      expect(url.searchParams.get('rsvpStatus')).toBe('pending')
      expect(url.searchParams.get('attendingCount')).toBe('2')
      expect(url.searchParams.get('invitationSentAt')).toBe('2024-01-01')
      
      // Old snake_case params should not exist
      expect(url.searchParams.get('rsvp_status')).toBeNull()
      expect(url.searchParams.get('attending_count')).toBeNull()
      expect(url.searchParams.get('invitation_sent_at')).toBeNull()
    })
  })

  describe('Validation and Detection Integration', () => {
    it('should detect and validate different casing styles', () => {
      const snakeObj = {
        first_name: 'John',
        attending_count: 2,
        invitation_sent_at: '2024-01-01'
      }

      const camelObj = {
        firstName: 'John',
        attendingCount: 2,
        invitationSentAt: '2024-01-01'
      }

      expect(detectCasingStyle(snakeObj)).toBe('snake_case')
      expect(detectCasingStyle(camelObj)).toBe('camelCase')

      // Validate violations
      const snakeValidation = validateCamelCase(snakeObj)
      expect(snakeValidation.isValid).toBe(false)
      expect(snakeValidation.violations.length).toBeGreaterThan(0)

      const camelValidation = validateCamelCase(camelObj)
      expect(camelValidation.isValid).toBe(true)
      expect(camelValidation.violations).toEqual([])
    })

    it('should handle nested object validation', () => {
      const nestedObject = {
        guest: {
          firstName: 'John',
          attendingCount: 2,
          invitation: {
            sentAt: '2024-01-01',
            rsvp_deadline: '2024-02-01' // Violation
          }
        },
        metadata: {
          created_at: '2024-01-01', // Violation
          version: '1.0'
        }
      }

      const validation = validateCamelCase(nestedObject)
      expect(validation.isValid).toBe(false)
      expect(validation.violations).toContain('guest.invitation.rsvp_deadline: snake_case key "rsvp_deadline"')
      expect(validation.violations).toContain('metadata.created_at: snake_case key "created_at"')
    })
  })

  describe('Critical Field Mappings Integration', () => {
    it('should handle all critical Couple model fields', () => {
      const legacyCouple = {
        partner1_user_id: 'user-1',
        partner2_user_id: 'user-2',
        budget_total: 50000,
        partner1_name: 'Alice',
        partner2_name: 'Bob',
        wedding_date: '2024-06-01'
      }

      const normalized = normalizeInput(legacyCouple)

      expect(normalized.partner1UserId).toBe('user-1')
      expect(normalized.partner2UserId).toBe('user-2')
      expect(normalized.totalBudget).toBe(50000)
      expect(normalized.partner1Name).toBe('Alice')
      expect(normalized.partner2Name).toBe('Bob')
      expect(normalized.weddingDate).toBe('2024-06-01')

      // Verify no snake_case fields remain
      expect(normalized.partner1_user_id).toBeUndefined()
      expect(normalized.partner2_user_id).toBeUndefined()
      expect(normalized.budget_total).toBeUndefined()
    })

    it('should handle all critical Guest model fields', () => {
      const legacyGuest = {
        couple_id: 'couple-123',
        first_name: 'John',
        last_name: 'Doe',
        attending_count: 2,
        invitation_sent_at: '2024-01-01T00:00:00Z',
        rsvp_deadline: '2024-02-01T00:00:00Z',
        dietary_restrictions: 'Vegetarian',
        plus_one_allowed: true
      }

      const normalized = normalizeInput(legacyGuest)

      expect(normalized.coupleId).toBe('couple-123')
      expect(normalized.firstName).toBe('John')
      expect(normalized.lastName).toBe('Doe')
      expect(normalized.attendingCount).toBe(2)
      expect(normalized.invitationSentAt).toBe('2024-01-01T00:00:00Z')
      expect(normalized.rsvpDeadline).toBe('2024-02-01T00:00:00Z')
      expect(normalized.dietaryRestrictions).toBe('Vegetarian')
      expect(normalized.plusOneAllowed).toBe(true)

      // Verify no snake_case fields remain
      expect(normalized.couple_id).toBeUndefined()
      expect(normalized.attending_count).toBeUndefined()
      expect(normalized.invitation_sent_at).toBeUndefined()
      expect(normalized.rsvp_deadline).toBeUndefined()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(normalizeInput(null)).toBe(null)
      expect(normalizeInput(undefined)).toBe(undefined)
      expect(smartNormalize(null)).toBe(null)
      expect(smartNormalize(undefined)).toBe(undefined)
    })

    it('should handle arrays with mixed objects', () => {
      const mixedArray = [
        { first_name: 'John', attending_count: 1 },
        { firstName: 'Jane', attendingCount: 2 },
        null,
        { last_name: 'Smith' }
      ]

      const normalized = mixedArray.map(item => item ? normalizeInput(item) : item)

      expect(normalized[0]).toEqual({ firstName: 'John', attendingCount: 1 })
      expect(normalized[1]).toEqual({ firstName: 'Jane', attendingCount: 2 })
      expect(normalized[2]).toBe(null)
      expect(normalized[3]).toEqual({ lastName: 'Smith' })
    })

    it('should handle primitive values and dates', () => {
      const testObj = {
        name: 'John',
        count: 42,
        active: true,
        created_at: new Date('2024-01-01'),
        tags: ['tag1', 'tag2'],
        metadata: null
      }

      const normalized = normalizeInput(testObj)

      expect(normalized.name).toBe('John')
      expect(normalized.count).toBe(42)
      expect(normalized.active).toBe(true)
      expect(normalized.createdAt).toBeInstanceOf(Date)
      expect(normalized.tags).toEqual(['tag1', 'tag2'])
      expect(normalized.metadata).toBe(null)
    })
  })

  describe('Performance and Scale Testing', () => {
    it('should handle large object transformations efficiently', () => {
      const largeObject = {
        guests: Array.from({ length: 100 }, (_, i) => ({
          first_name: `Guest${i}`,
          last_name: `LastName${i}`,
          attending_count: Math.floor(Math.random() * 4) + 1,
          invitation_sent_at: '2024-01-01T00:00:00Z',
          rsvp_deadline: '2024-02-01T00:00:00Z'
        }))
      }

      const startTime = performance.now()
      const normalized = normalizeInput(largeObject)
      const endTime = performance.now()

      // Should complete transformation in reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)

      // Verify all guests were transformed correctly
      expect(normalized.guests).toHaveLength(100)
      normalized.guests.forEach((guest: any, index: number) => {
        expect(guest.firstName).toBe(`Guest${index}`)
        expect(guest.lastName).toBe(`LastName${index}`)
        expect(guest.attendingCount).toBeGreaterThanOrEqual(1)
        expect(guest.attendingCount).toBeLessThanOrEqual(4)
        expect(guest.invitationSentAt).toBe('2024-01-01T00:00:00Z')
        expect(guest.rsvpDeadline).toBe('2024-02-01T00:00:00Z')
        
        // No snake_case fields should remain
        expect(guest.first_name).toBeUndefined()
        expect(guest.attending_count).toBeUndefined()
        expect(guest.invitation_sent_at).toBeUndefined()
      })
    })
  })
})