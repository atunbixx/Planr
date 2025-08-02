import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/settings/profile/route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

describe('/api/settings/profile', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(cookies as jest.Mock).mockReturnValue({})
  })

  describe('GET /api/settings/profile', () => {
    it('returns user profile successfully', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'test-user-123',
        full_name: 'John Doe',
        wedding_date: '2024-06-15',
        partner_name: 'Jane Smith',
        venue: 'Garden Palace',
        guest_count: 150,
        avatar_url: 'https://example.com/avatar.jpg'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const singleMock = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: singleMock
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
      expect(singleMock).toHaveBeenCalled()
    })

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 404 when profile not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: singleMock
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Profile not found')
    })

    it('handles database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const dbError = new Error('Database connection failed')
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: dbError
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: singleMock
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch profile')
    })
  })

  describe('PUT /api/settings/profile', () => {
    it('updates profile successfully', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      }

      const updateData = {
        full_name: 'John Updated',
        wedding_date: '2024-07-20',
        partner_name: 'Jane Updated',
        venue: 'New Venue',
        guest_count: 200
      }

      const updatedProfile = {
        id: 'test-user-123',
        ...updateData,
        avatar_url: 'https://example.com/avatar.jpg'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedProfile,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
    })

    it('validates required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const invalidData = {
        full_name: '', // Empty name should fail validation
        wedding_date: 'invalid-date'
      }

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('validation')
    })

    it('handles partial updates', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const partialUpdate = {
        full_name: 'John Partial'
      }

      const updatedProfile = {
        id: 'test-user-123',
        full_name: 'John Partial',
        wedding_date: '2024-06-15',
        partner_name: 'Jane Smith',
        venue: 'Garden Palace',
        guest_count: 150
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedProfile,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.full_name).toBe('John Partial')
    })

    it('sanitizes input data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const maliciousData = {
        full_name: '<script>alert("XSS")</script>John',
        venue: 'Garden<img src=x onerror=alert("XSS")>Palace'
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'test-user-123' },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(maliciousData)
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
      // Verify that the update was called with sanitized data
      const updateCall = mockSupabase.from().update.mock.calls[0][0]
      expect(updateCall.full_name).not.toContain('<script>')
      expect(updateCall.venue).not.toContain('<img')
    })

    it('handles database update errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const updateData = {
        full_name: 'John Error'
      }

      const dbError = new Error('Update failed')
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: dbError
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update profile')
    })

    it('handles concurrent update conflicts', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const updateData = {
        full_name: 'John Concurrent',
        version: 1 // Version for optimistic locking
      }

      const conflictError = {
        code: '23505',
        message: 'Concurrent update conflict'
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: conflictError
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('conflict')
    })
  })

  describe('Edge Cases', () => {
    it('handles malformed JSON in request body', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile', {
        method: 'PUT',
        body: 'invalid json {'
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid request')
    })

    it('handles missing authorization header', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Missing authorization header' }
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('handles rate limiting', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const rateLimitError = {
        status: 429,
        message: 'Too many requests'
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: rateLimitError
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: singleMock
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/profile')
      const response = await GET(request)

      expect(response.status).toBe(429)
    })
  })
})