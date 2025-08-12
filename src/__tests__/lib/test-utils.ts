import { jest } from '@jest/globals'
import { Guest, Couple, User, Vendor, BudgetCategory, BudgetExpense } from '@prisma/client'

// Test data factories
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  supabase_user_id: 'supabase-user-id',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: null,
  onboardingCompleted: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockCouple = (overrides?: Partial<Couple>): Couple => ({
  id: 'test-couple-id',
  userId: 'test-user-id',
  partner1Name: 'John',
  partner2Name: 'Jane',
  weddingDate: new Date('2024-06-15'),
  venue: 'Test Venue',
  budgetAmount: 50000,
  guestCount: 150,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockGuest = (overrides?: Partial<Guest>): Guest => ({
  id: 'test-guest-id',
  coupleId: 'test-couple-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  side: 'bride',
  relationship: 'friend',
  plusOneAllowed: true,
  plusOneName: null,
  dietaryRestrictions: null,
  notes: null,
  address: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockVendor = (overrides?: Partial<Vendor>): Vendor => ({
  id: 'test-vendor-id',
  coupleId: 'test-couple-id',
  name: 'Test Vendor',
  contactName: 'John Smith',
  phone: '+1234567890',
  email: 'vendor@example.com',
  website: 'https://testvendor.com',
  address: '123 Test St',
  categoryId: 'test-category-id',
  status: 'potential',
  priority: 'medium',
  rating: null,
  estimatedCost: 5000,
  actualCost: null,
  notes: null,
  meetingDate: null,
  contractSigned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockBudgetCategory = (overrides?: Partial<BudgetCategory>): BudgetCategory => ({
  id: 'test-category-id',
  coupleId: 'test-couple-id',
  name: 'Venue',
  budgetAmount: 20000,
  actualAmount: 0,
  color: '#3B82F6',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockBudgetExpense = (overrides?: Partial<BudgetExpense>): BudgetExpense => ({
  id: 'test-expense-id',
  coupleId: 'test-couple-id',
  categoryId: 'test-category-id',
  name: 'Wedding Venue Deposit',
  amount: 10000,
  isPaid: false,
  dueDate: new Date('2024-03-15'),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock Prisma client helpers
export const createMockPrismaClient = () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    couple: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    guest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    vendor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    budgetCategory: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budgetExpense: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invitation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  }

  return mockPrisma
}

// Cache test helpers
export const createMockCache = () => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  invalidateByTag: jest.fn(),
  invalidateByPattern: jest.fn(),
  clear: jest.fn(),
  cleanup: jest.fn(),
  getStats: jest.fn(() => ({ size: 0, tags: 0, entries: [] })),
})

// Test assertions helpers
export const expectCacheToBeCalledWith = (cache: any, key: string, data?: any) => {
  if (data) {
    expect(cache.set).toHaveBeenCalledWith(key, data, expect.any(Number), expect.any(Array))
  } else {
    expect(cache.get).toHaveBeenCalledWith(key)
  }
}

export const expectDatabaseQueryToBeCalledWith = (method: any, params: any) => {
  expect(method).toHaveBeenCalledWith(expect.objectContaining(params))
}

// Mock HTTP request helpers
export const createMockRequest = (data: any, method = 'GET') => ({
  method,
  json: jest.fn().mockResolvedValue(data),
  formData: jest.fn().mockResolvedValue(new FormData()),
  url: 'http://localhost:3000/api/test',
  headers: new Headers(),
})

export const createMockResponse = () => {
  const response = {
    json: jest.fn(),
    status: jest.fn(() => response),
  }
  return response
}

// Async test helpers
export const waitForAsync = () => new Promise(resolve => setImmediate(resolve))

// Clean up test data
export const clearAllMocks = () => {
  jest.clearAllMocks()
}