/**
 * Test Helper Functions
 * Utility functions for testing the wedding planner application
 */

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test_user_123',
  clerkId: 'clerk_test_123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  imageUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockCouple = (overrides = {}) => ({
  id: 'couple_123',
  userId: 'test_user_123',
  partnerName: 'John & Jane Doe',
  weddingDate: new Date('2024-08-15T18:00:00Z'),
  venue: 'Sunset Gardens',
  location: 'Beautiful City, State',
  expectedGuests: 100,
  totalBudget: 50000,
  weddingStyle: 'Garden Party',
  onboardingCompleted: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockGuest = (overrides = {}) => ({
  id: 'guest_123',
  coupleId: 'couple_123',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  phone: '+1234567890',
  relationship: 'Friend',
  side: 'bride' as const,
  plusOne: true,
  rsvpStatus: 'pending' as const,
  invitationCode: 'ALICE123',
  dietaryNotes: null,
  specialRequests: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockVendor = (overrides = {}) => ({
  id: 'vendor_123',
  coupleId: 'couple_123',
  businessName: 'Perfect Moments Photography',
  contactName: 'Sarah Johnson',
  email: 'sarah@perfectmoments.com',
  phone: '+1555012345',
  website: 'https://perfectmoments.com',
  category: 'Photography',
  status: 'contacted' as const,
  estimatedCost: 3500,
  actualCost: null,
  contractSigned: false,
  contractDate: null,
  notes: 'Specializes in outdoor weddings',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockBudgetCategory = (overrides = {}) => ({
  id: 'category_123',
  coupleId: 'couple_123',
  name: 'Venue',
  allocatedAmount: 20000,
  priority: 'high' as const,
  color: '#8B5CF6',
  icon: '🏛️',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockBudgetExpense = (overrides = {}) => ({
  id: 'expense_123',
  coupleId: 'couple_123',
  categoryId: 'category_123',
  vendorId: 'vendor_123',
  name: 'Venue Deposit',
  amount: 5000,
  description: 'Initial deposit for Sunset Gardens',
  date: new Date('2024-03-15T10:00:00Z'),
  isPaid: true,
  paidDate: new Date('2024-03-15T10:00:00Z'),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockChecklistItem = (overrides = {}) => ({
  id: 'checklist_123',
  coupleId: 'couple_123',
  title: 'Book wedding venue',
  description: 'Research and book the perfect venue for our special day',
  category: 'Venue',
  timeframe: '12+ months before',
  priority: 'high' as const,
  isCompleted: false,
  completedAt: null,
  dueDate: new Date('2024-02-15T00:00:00Z'),
  assignedTo: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockPhoto = (overrides = {}) => ({
  id: 'photo_123',
  coupleId: 'couple_123',
  albumId: 'album_123',
  filename: 'engagement_001.jpg',
  originalName: 'DSC_001.jpg',
  cloudinaryId: 'wedding/engagement_001',
  url: 'https://res.cloudinary.com/wedding/image/upload/v1/engagement_001.jpg',
  thumbnailUrl: 'https://res.cloudinary.com/wedding/image/upload/c_thumb,w_300,h_300/v1/engagement_001.jpg',
  description: 'Beautiful sunset engagement photo',
  tags: ['engagement', 'sunset', 'romantic'],
  sortOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockPhotoAlbum = (overrides = {}) => ({
  id: 'album_123',
  coupleId: 'couple_123',
  name: 'Engagement Photos',
  description: 'Our beautiful engagement session at the park',
  isPublic: true,
  sortOrder: 0,
  coverPhotoId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Test data sets
export const mockUserData = {
  user: createMockUser(),
  couple: createMockCouple(),
}

export const mockGuestData = {
  guests: [
    createMockGuest({ name: 'Alice Johnson', side: 'bride', rsvpStatus: 'confirmed' }),
    createMockGuest({ id: 'guest_456', name: 'Bob Smith', side: 'groom', rsvpStatus: 'pending' }),
    createMockGuest({ id: 'guest_789', name: 'Carol Davis', side: 'mutual', rsvpStatus: 'declined' })
  ],
  statistics: {
    total: 3,
    confirmed: 1,
    declined: 1,
    pending: 1,
    estimatedAttendees: 2
  }
}

export const mockVendorData = {
  vendors: [
    createMockVendor({ businessName: 'Sunset Gardens', category: 'Venue', status: 'booked' }),
    createMockVendor({ id: 'vendor_456', businessName: 'Gourmet Catering', category: 'Catering', status: 'quoted' }),
    createMockVendor({ id: 'vendor_789', businessName: 'DJ Mike', category: 'Music', status: 'potential' })
  ]
}

export const mockBudgetData = {
  categories: [
    createMockBudgetCategory({ name: 'Venue', allocatedAmount: 20000 }),
    createMockBudgetCategory({ id: 'cat_456', name: 'Catering', allocatedAmount: 12500 }),
    createMockBudgetCategory({ id: 'cat_789', name: 'Photography', allocatedAmount: 5000 })
  ],
  expenses: [
    createMockBudgetExpense({ name: 'Venue Deposit', amount: 5000, isPaid: true }),
    createMockBudgetExpense({ id: 'exp_456', name: 'Photography Contract', amount: 2500, isPaid: false })
  ]
}

// API response helpers
export const createSuccessResponse = (data: any, message = 'Success') => ({
  success: true,
  message,
  data
})

export const createErrorResponse = (message: string, status = 400) => ({
  success: false,
  error: message,
  status
})

// Mock API responses
export const mockAPIResponses = {
  auth: {
    authenticated: createSuccessResponse(mockUserData.user),
    unauthenticated: createErrorResponse('Unauthorized', 401)
  },
  guests: {
    list: createSuccessResponse(mockGuestData),
    create: createSuccessResponse(createMockGuest()),
    update: createSuccessResponse(createMockGuest({ name: 'Updated Name' })),
    delete: createSuccessResponse(null, 'Guest deleted successfully')
  },
  rsvp: {
    valid: createSuccessResponse({
      guest: createMockGuest(),
      wedding: {
        coupleName: 'John & Jane Doe',
        date: '2024-08-15T18:00:00Z',
        venue: 'Sunset Gardens',
        location: 'Beautiful City, State'
      }
    }),
    invalid: createErrorResponse('Invitation not found', 404),
    submit: createSuccessResponse(null, 'RSVP submitted successfully')
  },
  vendors: {
    list: createSuccessResponse(mockVendorData.vendors),
    create: createSuccessResponse(createMockVendor()),
    update: createSuccessResponse(createMockVendor({ status: 'booked' }))
  },
  budget: {
    categories: createSuccessResponse(mockBudgetData.categories),
    expenses: createSuccessResponse(mockBudgetData.expenses),
    createCategory: createSuccessResponse(createMockBudgetCategory()),
    createExpense: createSuccessResponse(createMockBudgetExpense())
  }
}

// Test utilities
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
    })
  ) as jest.Mock
}

export const expectValidDate = (dateString: string) => {
  expect(dateString).toBeTruthy()
  expect(new Date(dateString).getTime()).not.toBeNaN()
}

export const expectValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  expect(uuid).toMatch(uuidRegex)
}

export const expectValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  expect(email).toMatch(emailRegex)
}