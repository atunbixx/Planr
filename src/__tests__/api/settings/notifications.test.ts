import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/settings/notifications/route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

describe('/api/settings/notifications', () => {
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
      upsert: jest.fn(() => ({
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

  describe('GET /api/settings/notifications', () => {
    it('returns notification preferences successfully', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      }

      const mockNotifications = {
        user_id: 'test-user-123',
        email_updates: true,
        task_reminders: true,
        vendor_messages: true,
        guest_rsvp_alerts: true,
        budget_alerts: true,
        daily_digest: false,
        weekly_report: true,
        push_enabled: false,
        sms_enabled: false
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const singleMock = jest.fn().mockResolvedValue({
        data: mockNotifications,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: singleMock
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockNotifications)
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_preferences')
    })

    it('returns default preferences when none exist', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/settings/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('email_updates', true)
      expect(data).toHaveProperty('task_reminders', true)
      expect(data).toHaveProperty('vendor_messages', true)
    })

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/settings/notifications', () => {
    it('updates notification preferences successfully', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com'
      }

      const updateData = {
        email_updates: false,
        task_reminders: true,
        vendor_messages: false,
        guest_rsvp_alerts: true,
        budget_alerts: true,
        daily_digest: true,
        weekly_report: false
      }

      const updatedPreferences = {
        user_id: 'test-user-123',
        ...updateData,
        push_enabled: false,
        sms_enabled: false,
        updated_at: new Date().toISOString()
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedPreferences,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedPreferences)
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_preferences')
    })

    it('validates boolean values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const invalidData = {
        email_updates: 'yes', // Should be boolean
        task_reminders: 123   // Should be boolean
      }

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid notification preferences')
    })

    it('handles partial updates', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const partialUpdate = {
        email_updates: false,
        daily_digest: true
      }

      const updatedPreferences = {
        user_id: 'test-user-123',
        email_updates: false,
        task_reminders: true,
        vendor_messages: true,
        guest_rsvp_alerts: true,
        budget_alerts: true,
        daily_digest: true,
        weekly_report: true
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedPreferences,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.email_updates).toBe(false)
      expect(data.daily_digest).toBe(true)
    })

    it('creates new preferences if none exist', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const newPreferences = {
        email_updates: true,
        task_reminders: false
      }

      const createdPreferences = {
        user_id: 'test-user-123',
        ...newPreferences,
        vendor_messages: true,
        guest_rsvp_alerts: true,
        budget_alerts: true,
        daily_digest: false,
        weekly_report: true,
        created_at: new Date().toISOString()
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: createdPreferences,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(newPreferences)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user_id).toBe('test-user-123')
      const upsertCall = mockSupabase.from().upsert.mock.calls[0][0]
      expect(upsertCall).toHaveProperty('user_id', 'test-user-123')
    })

    it('handles database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const updateData = {
        email_updates: false
      }

      const dbError = new Error('Database error')
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: dbError
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update notification preferences')
    })
  })

  describe('Notification Channel Management', () => {
    it('handles push notification setup', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const pushSetup = {
        push_enabled: true,
        push_token: 'test-push-token-123',
        device_type: 'ios'
      }

      const updatedPreferences = {
        user_id: 'test-user-123',
        push_enabled: true,
        push_token: 'test-push-token-123',
        device_type: 'ios'
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedPreferences,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(pushSetup)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.push_enabled).toBe(true)
      expect(data.push_token).toBe('test-push-token-123')
    })

    it('handles SMS notification setup', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const smsSetup = {
        sms_enabled: true,
        phone_number: '+1234567890',
        phone_verified: true
      }

      const updatedPreferences = {
        user_id: 'test-user-123',
        sms_enabled: true,
        phone_number: '+1234567890',
        phone_verified: true
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedPreferences,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(smsSetup)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sms_enabled).toBe(true)
      expect(data.phone_number).toBe('+1234567890')
    })
  })

  describe('Notification Schedule Management', () => {
    it('handles quiet hours configuration', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })

      const quietHours = {
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'America/New_York'
      }

      const updatedPreferences = {
        user_id: 'test-user-123',
        ...quietHours
      }

      const singleMock = jest.fn().mockResolvedValue({
        data: updatedPreferences,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: singleMock
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(quietHours)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quiet_hours_enabled).toBe(true)
      expect(data.quiet_hours_start).toBe('22:00')
      expect(data.quiet_hours_end).toBe('08:00')
    })
  })
})