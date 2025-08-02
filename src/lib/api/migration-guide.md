# API Migration Guide

This guide shows how to migrate from direct Supabase queries to the new centralized API layer.

## Benefits of the New API Layer

1. **Security**: All data fetching happens server-side with proper authentication
2. **Performance**: Built-in caching, retry logic, and request deduplication
3. **Developer Experience**: Type-safe APIs, consistent error handling, and React hooks
4. **Observability**: Request/response logging and performance monitoring
5. **Maintainability**: Centralized business logic and data transformations

## Migration Examples

### Before: Direct Supabase Query (Client-Side)

```typescript
// ❌ OLD WAY - Direct client-side Supabase query
import { createBrowserClient } from '@/lib/supabase-client'

function VendorList() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function fetchVendors() {
      try {
        const supabase = createBrowserClient()
        
        // Direct query - exposes database structure
        const { data, error } = await supabase
          .from('couple_vendors')
          .select('*')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setVendors(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchVendors()
  }, [coupleId])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <VendorGrid vendors={vendors} />
}
```

### After: Using the New API Layer

```typescript
// ✅ NEW WAY - Using centralized API with hooks
import { useVendors } from '@/lib/api'

function VendorList() {
  const { vendors, isLoading, error, refetch } = useVendors({
    // Type-safe filters
    status: 'booked',
    category: 'photography'
  }, {
    // Built-in features
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Auto-refresh every 30s
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <VendorGrid vendors={vendors} />
}
```

## Common Migration Patterns

### 1. Simple Data Fetching

```typescript
// Before
const { data: couples } = await supabase
  .from('couples')
  .select('*')
  .single()

// After
const { couple } = useCurrentCouple()
```

### 2. Data Mutations

```typescript
// Before
const { error } = await supabase
  .from('couple_vendors')
  .update({ status: 'booked' })
  .eq('id', vendorId)

// After
const { updateStatus } = useVendorManagement()
updateStatus({ 
  id: vendorId, 
  status: 'booked',
  notes: 'Deposit paid' 
})
```

### 3. Complex Queries with Joins

```typescript
// Before - Multiple queries
const { data: vendor } = await supabase
  .from('couple_vendors')
  .select('*')
  .eq('id', vendorId)
  .single()

const { data: expenses } = await supabase
  .from('budget_expenses')
  .select('*')
  .eq('vendor_id', vendorId)

// After - Single API call with all data
const { data: vendor } = useVendor(vendorId)
// vendor includes related expenses, documents, contacts, etc.
```

### 4. Real-time Updates

```typescript
// Before - Manual subscription
const subscription = supabase
  .from('messages')
  .on('INSERT', handleNewMessage)
  .subscribe()

// After - Built into hooks
const { messages } = useMessages({
  conversation_id: conversationId
}, {
  refetchInterval: 10000 // Polling for now
})
```

### 5. File Uploads

```typescript
// Before - Direct storage access
const { data, error } = await supabase.storage
  .from('photos')
  .upload(path, file)

// After - API with progress tracking
const { uploadPhoto } = usePhotoGallery()
uploadPhoto({
  file,
  options: {
    album_id: albumId,
    tags: ['ceremony', 'outdoor'],
    onProgress: (progress) => {
      console.log(`${progress.percentage}% uploaded`)
    }
  }
})
```

### 6. Error Handling

```typescript
// Before - Inconsistent error handling
try {
  const { data, error } = await supabase.from('vendors').select()
  if (error) {
    console.error(error)
    toast.error('Failed to load vendors')
  }
} catch (err) {
  console.error(err)
}

// After - Consistent error handling
const { error } = useVendors()
// Errors are automatically logged and formatted
// Can use global error boundary or inline handling
```

### 7. Optimistic Updates

```typescript
// Before - Manual optimistic updates
setVendors(prev => prev.map(v => 
  v.id === vendorId ? { ...v, status: 'booked' } : v
))

const { error } = await supabase
  .from('couple_vendors')
  .update({ status: 'booked' })
  .eq('id', vendorId)

if (error) {
  // Revert on error
  setVendors(originalVendors)
}

// After - Built-in optimistic updates
const { updateStatus } = useVendorManagement()
updateStatus({
  id: vendorId,
  status: 'booked'
}, {
  // Automatic optimistic update and rollback
  onMutate: async ({ id, status }) => {
    // Return context for rollback
    return { previousVendors }
  },
  onError: (err, variables, context) => {
    // Automatic rollback using context
  }
})
```

## API Endpoints Reference

### Budget API
- `GET /api/budget` - Get budget overview
- `GET /api/budget/analytics` - Get budget analytics
- `GET /api/budget/categories` - List categories
- `POST /api/budget/categories` - Create category
- `PATCH /api/budget/categories/:id` - Update category
- `DELETE /api/budget/categories/:id` - Delete category
- `GET /api/budget/items` - List items with filters
- `POST /api/budget/items` - Create item
- `PATCH /api/budget/items/:id` - Update item
- `DELETE /api/budget/items/:id` - Delete item

### Vendors API
- `GET /api/vendors` - List vendors with filters
- `GET /api/vendors/:id` - Get vendor details
- `POST /api/vendors` - Create vendor
- `PATCH /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `POST /api/vendors/:id/book` - Book vendor
- `POST /api/vendors/compare` - Compare vendors
- `POST /api/vendors/recommendations` - Get recommendations

### Photos API
- `GET /api/photos` - List photos with filters
- `POST /api/photos` - Upload photo
- `POST /api/photos/bulk` - Upload multiple photos
- `PATCH /api/photos/:id` - Update photo
- `DELETE /api/photos/:id` - Delete photo
- `GET /api/photos/albums` - List albums
- `POST /api/photos/albums` - Create album
- `POST /api/photos/:id/ai/enhance` - AI enhance photo

### Messages API
- `GET /api/messages/conversations` - List conversations
- `POST /api/messages/send` - Send message
- `POST /api/messages/read` - Mark as read
- `POST /api/messages/typing` - Send typing indicator
- `POST /api/messages/upload` - Upload attachment

## Best Practices

1. **Use Composite Hooks**: Prefer `useVendorManagement()` over individual hooks
2. **Handle Loading States**: Always show loading indicators
3. **Handle Errors**: Use error boundaries or inline error handling
4. **Optimize Refetching**: Use appropriate refetch intervals
5. **Cache Strategically**: Use stale-while-revalidate patterns
6. **Batch Operations**: Use bulk endpoints when available

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check authentication and RLS policies
2. **404 Not Found**: Verify the resource exists and user has access
3. **429 Too Many Requests**: Implement proper throttling
4. **Network Errors**: Check offline handling

### Debugging

```typescript
// Enable debug logging
import { apiLogger } from '@/lib/api'

// View recent API calls
const logs = apiLogger.getLogs()
console.table(logs)

// Filter by status
const errors = apiLogger.getLogs({ status: 400 })

// Export logs for debugging
const logData = apiLogger.exportLogs()
```

## Next Steps

1. Start with high-traffic components
2. Migrate one domain at a time (e.g., all vendor queries)
3. Add proper error boundaries
4. Implement proper loading states
5. Add analytics tracking
6. Set up monitoring alerts