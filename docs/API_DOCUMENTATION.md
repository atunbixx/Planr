# Wedding Planner v2 API Documentation

## Overview

The Wedding Planner v2 API provides a comprehensive set of endpoints for managing all aspects of wedding planning. The API is built with Next.js API routes and uses a consistent field transformation layer to handle database field naming conventions.

## Key Features

- **Type-safe API client** with full TypeScript support
- **Automatic field transformation** between snake_case (database) and camelCase (JavaScript)
- **Consistent error handling** with user-friendly messages
- **Response caching** for improved performance
- **Loading state management** with React hooks
- **Optimistic updates** for better UX

## Base Configuration

```typescript
import { api } from '@/lib/api/client'

// All API calls return a standardized response format:
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  errors?: any
}
```

## Authentication

All API endpoints require authentication via Clerk. The authentication is handled automatically by the middleware.

## API Client Usage

### Basic Usage

```typescript
// List guests with pagination
const response = await api.guests.list({ 
  page: 1, 
  limit: 20,
  rsvpStatus: 'confirmed' 
})

// Create a new guest
const newGuest = await api.guests.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  rsvpStatus: 'pending'
})

// Update a guest
const updated = await api.guests.update(guestId, {
  rsvpStatus: 'confirmed',
  dietaryRestrictions: 'Vegetarian'
})
```

### Using with React Hooks

```typescript
import { useApiState } from '@/hooks/useApiState'

function MyComponent() {
  const guestsApi = useApiState<Guest[]>([], {
    onError: (error) => console.error('Failed to load guests:', error)
  })

  const loadGuests = async () => {
    const response = await guestsApi.execute(api.guests.list())
    // Data is automatically stored in guestsApi.state.data
  }

  if (guestsApi.state.loading) return <LoadingSpinner />
  if (guestsApi.state.error) return <ErrorMessage />
  
  return <GuestList guests={guestsApi.state.data} />
}
```

## Endpoints

### Guests

#### List Guests
```typescript
api.guests.list(params?: {
  page?: number
  limit?: number
  rsvpStatus?: string
})
```

#### Create Guest
```typescript
api.guests.create(data: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  rsvpStatus: string
  dietaryRestrictions?: string
  plusOneAllowed: boolean
  plusOneName?: string
  tableNumber?: number
})
```

#### Update Guest
```typescript
api.guests.update(id: string, data: Partial<Guest>)
```

#### Delete Guest
```typescript
api.guests.delete(id: string)
```

#### Update RSVP
```typescript
api.guests.updateRsvp(id: string, data: {
  status: string
  dietaryRestrictions?: string
  plusOneName?: string
})
```

### Vendors

#### List Vendors
```typescript
api.vendors.list(params?: {
  page?: number
  limit?: number
  category?: string
  status?: string
})
```

Returns:
```typescript
{
  vendors: Vendor[]
  categories: any[]
  stats: VendorStats
  costs: VendorCosts
  pagination: PaginationInfo
}
```

#### Create/Update/Delete Vendor
```typescript
api.vendors.create(data: Partial<Vendor>)
api.vendors.update(id: string, data: Partial<Vendor>)
api.vendors.delete(id: string)
```

### Budget

#### Get Budget Summary
```typescript
api.budget.summary()
```

Returns:
```typescript
{
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  categories: (BudgetCategory & { spent: number })[]
}
```

#### Budget Categories
```typescript
api.budget.categories.list()
api.budget.categories.create(data: Partial<BudgetCategory>)
api.budget.categories.update(id: string, data: Partial<BudgetCategory>)
api.budget.categories.delete(id: string)
```

#### Budget Expenses
```typescript
api.budget.expenses.list(params?: { categoryId?: string })
api.budget.expenses.create(data: Partial<BudgetExpense>)
api.budget.expenses.update(id: string, data: Partial<BudgetExpense>)
api.budget.expenses.delete(id: string)
```

### Timeline

#### List Timeline Events
```typescript
api.timeline.list(params?: {
  date?: string
  vendorId?: string
})
```

#### Create/Update/Delete Timeline Event
```typescript
api.timeline.create(data: Partial<TimelineEvent>)
api.timeline.update(id: string, data: Partial<TimelineEvent>)
api.timeline.delete(id: string)
```

#### Share Timeline
```typescript
api.timeline.share(date: string)
```

### Checklist

#### List Checklist Items
```typescript
api.checklist.list(params?: {
  category?: string
  completed?: boolean
  priority?: string
})
```

Returns:
```typescript
{
  items: ChecklistItem[]
  stats: {
    total: number
    completed: number
    pending: number
    completionPercentage: number
    byCategory: Record<string, { total: number; completed: number }>
  }
}
```

#### Checklist Operations
```typescript
api.checklist.create(data: Partial<ChecklistItem>)
api.checklist.update(id: string, data: Partial<ChecklistItem>)
api.checklist.toggleComplete(id: string)
api.checklist.delete(id: string)
api.checklist.bulkComplete(itemIds: string[])
```

### Photos

#### List Photos
```typescript
api.photos.list(params?: {
  albumId?: string
  tags?: string[]
  isFavorite?: boolean
  page?: number
  limit?: number
})
```

#### Photo Operations
```typescript
api.photos.create(data: Partial<Photo>)
api.photos.update(id: string, data: Partial<Photo>)
api.photos.delete(id: string)
api.photos.bulkToggleFavorite(photoIds: string[], isFavorite: boolean)
```

### Albums

#### Album Operations
```typescript
api.albums.list()
api.albums.get(id: string)
api.albums.create(data: Partial<Album>)
api.albums.update(id: string, data: Partial<Album>)
api.albums.delete(id: string)
```

### Messages

#### List Messages
```typescript
api.messages.list(params?: {
  status?: string
  type?: string
  recipientId?: string
  page?: number
  limit?: number
})
```

#### Send Messages
```typescript
api.messages.send({
  recipientIds: string[]
  subject: string
  content: string
  type?: string
  templateId?: string
  variables?: Record<string, string>
  scheduledFor?: string
})
```

#### Message Templates
```typescript
api.messages.templates.list()
api.messages.templates.create(data: Partial<MessageTemplate>)
api.messages.templates.update(id: string, data: Partial<MessageTemplate>)
api.messages.templates.delete(id: string)
```

#### Message Logs
```typescript
api.messages.logs(params?: {
  messageId?: string
  startDate?: string
  endDate?: string
})
```

### Settings

#### User Preferences
```typescript
api.settings.preferences.get()
api.settings.preferences.update(data: Partial<UserPreferences>)
```

#### Wedding Details
```typescript
api.settings.wedding.get()
api.settings.wedding.update(data: Partial<WeddingDetails>)
```

#### Collaborators
```typescript
api.settings.collaborators.list()
api.settings.collaborators.invite({
  email: string
  role?: string
  permissions?: string[]
})
api.settings.collaborators.update(id: string, {
  role?: string
  permissions?: string[]
})
api.settings.collaborators.remove(id: string)
```

### Dashboard

#### Dashboard Statistics
```typescript
api.dashboard.stats()
```

Returns comprehensive statistics including:
- Wedding details and countdown
- Guest statistics
- Budget summary
- Vendor status
- Checklist progress
- Photo counts
- Message statistics

#### Recent Activity
```typescript
api.dashboard.activity(limit?: number)
```

## Error Handling

The API client includes comprehensive error handling with user-friendly messages:

```typescript
try {
  const response = await api.guests.create(data)
  // Handle success
} catch (error) {
  // Error is automatically displayed as a toast notification
  // You can also handle it manually:
  if (error instanceof ApiError) {
    console.error('API Error:', error.message)
    console.error('Error Code:', error.code)
    console.error('HTTP Status:', error.status)
  }
}
```

### Common Error Codes

- `validation_error` - Input validation failed
- `not_found` - Resource not found
- `unauthorized` - Authentication required
- `permission_denied` - Insufficient permissions
- `network_error` - Network connection failed
- `timeout` - Request timed out
- `server_error` - Internal server error

## Caching

The API client includes automatic caching for GET requests:

### Cache Configuration

```typescript
// Default cache TTLs by endpoint:
- Dashboard stats: 10 minutes
- Guest/Vendor lists: 5 minutes
- Budget data: 5 minutes
- Settings: 30 minutes
- Message templates: 1 hour
- Photos/Albums: 5-10 minutes
```

### Cache Management

```typescript
// Caching is automatic for supported endpoints
// The cache is automatically invalidated when mutations occur

// To force a fresh request, you can:
const response = await api.guests.list() // Uses cache if available
// Then immediately:
const freshResponse = await api.guests.list() // Will use cache

// Mutations automatically invalidate related caches
await api.guests.create(data) // This invalidates the guest list cache
```

## Type Definitions

All API responses are fully typed. Import types from the API client:

```typescript
import type {
  Guest,
  Vendor,
  BudgetCategory,
  BudgetExpense,
  TimelineEvent,
  ChecklistItem,
  Photo,
  Album,
  Message,
  MessageTemplate,
  UserPreferences,
  WeddingDetails,
  Collaborator,
  DashboardStats
} from '@/lib/api/client'
```

## Field Transformation

The API automatically transforms field names between the database (snake_case) and JavaScript (camelCase):

```typescript
// You write:
api.guests.create({
  firstName: 'John',
  plusOneAllowed: true
})

// API transforms to:
// first_name: 'John',
// plus_one_allowed: true

// And transforms back in responses:
// Database: created_at, updated_at
// JavaScript: createdAt, updatedAt
```

## Best Practices

1. **Use the provided hooks** for React components:
   ```typescript
   const { state, execute } = useApiState()
   ```

2. **Handle loading states** to improve UX:
   ```typescript
   if (state.loading) return <LoadingSpinner />
   ```

3. **Leverage caching** for frequently accessed data

4. **Use TypeScript** for type safety and better developer experience

5. **Handle errors gracefully** with try-catch blocks or error boundaries

6. **Batch operations** when possible to reduce API calls

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per user
- 1000 requests per hour per user

## Webhooks

Webhook endpoints are available for:
- Twilio SMS integration: `/api/webhooks/twilio`
- Resend email integration: `/api/webhooks/resend`

## Support

For issues or questions about the API:
1. Check the error message and code
2. Review the browser console for detailed error information
3. Ensure you're authenticated
4. Verify the request payload matches the expected format