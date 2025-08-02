import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/toast'

// Mock user for testing
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    wedding_date: '2024-06-15',
    partner_name: 'Partner Name',
    venue: 'Test Venue',
    guest_count: '150',
    avatar_url: 'https://example.com/avatar.jpg',
    notifications: {
      emailUpdates: true,
      taskReminders: true,
      vendorMessages: true,
      guestRsvpAlerts: true,
      budgetAlerts: true,
      dailyDigest: false,
      weeklyReport: true
    },
    theme: {
      colorScheme: 'wedding-blush',
      fontSize: 'medium',
      compactMode: false
    },
    privacy: {
      profileVisibility: 'private',
      shareWithVendors: false,
      allowGuestUploads: true,
      dataExport: true
    }
  }
}

// Mock auth context
const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn()
}

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: any
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { authContext = mockAuthContext, ...renderOptions } = options || {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider value={authContext}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Utility to wait for loading states
export async function waitForLoadingToFinish(container: HTMLElement) {
  const { waitFor } = await import('@testing-library/react')
  
  await waitFor(() => {
    const loadingElements = container.querySelectorAll('[aria-busy="true"], .loading, .skeleton')
    expect(loadingElements.length).toBe(0)
  })
}

// Mock Supabase client
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    })),
    storage: {
      from: jest.fn((bucket: string) => ({
        upload: jest.fn().mockResolvedValue({ 
          data: { path: 'test-path' }, 
          error: null 
        }),
        getPublicUrl: jest.fn().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/file.jpg' } 
        }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        download: jest.fn().mockResolvedValue({ 
          data: new Blob(), 
          error: null 
        })
      }))
    }
  }
}

// Form data helpers
export const validProfileData = {
  fullName: 'John Doe',
  email: 'john@example.com',
  weddingDate: '2024-12-25',
  partnerName: 'Jane Smith',
  venue: 'Beach Resort',
  guestCount: '200'
}

export const validPasswordData = {
  currentPassword: 'CurrentPass123!',
  newPassword: 'NewPass123!@#',
  confirmPassword: 'NewPass123!@#'
}

export const defaultNotificationPreferences = {
  emailUpdates: true,
  taskReminders: true,
  vendorMessages: true,
  guestRsvpAlerts: true,
  budgetAlerts: true,
  dailyDigest: false,
  weeklyReport: true
}

export const defaultThemePreferences = {
  colorScheme: 'wedding-blush',
  fontSize: 'medium',
  compactMode: false
}

export const defaultPrivacySettings = {
  profileVisibility: 'private',
  shareWithVendors: false,
  allowGuestUploads: true,
  dataExport: true
}

// API response mocks
export function mockSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function mockErrorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// File upload helpers
export function createMockFile(
  name: string, 
  size: number, 
  type: string
): File {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

export const validImageFile = createMockFile('avatar.jpg', 1024, 'image/jpeg')
export const largImageFile = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg')
export const invalidFile = createMockFile('document.pdf', 1024, 'application/pdf')

// Accessibility helpers
export async function checkAccessibility(container: HTMLElement) {
  // Check for basic accessibility requirements
  const issues: string[] = []

  // Check images have alt text
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      issues.push(`Image missing alt text: ${img.src}`)
    }
  })

  // Check form inputs have labels
  const inputs = container.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    if (id && !ariaLabel) {
      const label = container.querySelector(`label[for="${id}"]`)
      if (!label) {
        issues.push(`Input missing label: ${id}`)
      }
    }
  })

  // Check buttons have accessible text
  const buttons = container.querySelectorAll('button')
  buttons.forEach(button => {
    const text = button.textContent?.trim()
    const ariaLabel = button.getAttribute('aria-label')
    if (!text && !ariaLabel) {
      issues.push('Button missing accessible text')
    }
  })

  return issues
}

// Performance helpers
export function measureRenderTime(callback: () => void): number {
  const start = performance.now()
  callback()
  return performance.now() - start
}

// Local storage helpers
export function mockLocalStorage() {
  const storage: { [key: string]: string } = {}
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    })
  }
}

// Session storage helpers
export function mockSessionStorage() {
  const storage: { [key: string]: string } = {}
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    })
  }
}

// Animation helpers
export function mockIntersectionObserver() {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver as any
}

// Match media helpers
export function mockMatchMedia(matches: boolean = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  })
}