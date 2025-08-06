# Offline Functionality Documentation

## Overview

The Wedding Planner app now includes comprehensive offline functionality, allowing users to access and modify their data even without an internet connection. This is particularly useful for mobile users at venues with poor connectivity.

## Features

### 1. Service Worker Implementation

- **Enhanced Caching**: All static assets (JS, CSS, images) are cached for offline access
- **API Response Caching**: GET requests are cached with a 5-minute expiration
- **Background Sync**: Failed POST/PUT/DELETE requests are queued and synced when online
- **Push Notifications**: Support for push notifications when online

### 2. IndexedDB Storage

Local storage for all critical data:
- Couple profile information
- Vendors list and details
- Budget items
- Photos metadata (with optional blob storage)
- Messages
- Sync queue for pending changes
- Application settings

### 3. Offline UI Components

#### Connection Status Indicator
Shows at the top of the screen when:
- User goes offline (persistent red banner)
- User comes back online (temporary green banner)

#### Sync Status Component
Displays in the header showing:
- Current connection status
- Number of pending changes
- Number of sync errors
- Last sync timestamp
- Manual sync button

#### Offline Indicator
Shows whether the current page is available offline

### 4. Data Synchronization

#### Automatic Sync
- Syncs when coming back online
- Periodic sync every 5 minutes when online
- Syncs when app becomes visible

#### Conflict Resolution
- Last-write-wins strategy by default
- Manual conflict resolution available for critical data
- Retry mechanism with exponential backoff

## Implementation Guide

### 1. Using Offline Data Hooks

```typescript
import { useOfflineVendors } from '@/hooks/use-offline-data';

function VendorsPage() {
  const {
    data: vendors,
    loading,
    isOnline,
    syncStatus,
    saveItem,
    deleteItem,
    sync
  } = useOfflineVendors(userId);

  // Use vendors data...
}
```

### 2. Offline API Client

```typescript
import { offlineApi } from '@/lib/offline/api-client';

// Make a request that works offline
const response = await offlineApi.get('/vendors');
if (response.offline) {
  console.log('Data served from cache');
}
```

### 3. Manual Data Management

```typescript
import { offlineDb } from '@/lib/offline/db';

// Save vendor
await offlineDb.saveVendor({
  id: 'vendor-1',
  name: 'Awesome Photography',
  category: 'Photography',
  // ... other fields
});

// Get vendors
const vendors = await offlineDb.getVendors(userId);
```

## File Structure

```
src/
├── lib/
│   └── offline/
│       ├── db.ts              # IndexedDB wrapper
│       ├── sync-manager.ts    # Synchronization logic
│       └── api-client.ts      # Offline-aware API client
├── components/
│   └── offline/
│       ├── connection-status.tsx    # Connection indicator
│       ├── sync-status.tsx         # Sync status display
│       ├── offline-indicator.tsx   # Page offline status
│       └── service-worker-provider.tsx  # SW registration
├── hooks/
│   └── use-offline-data.ts    # React hooks for offline data
└── service-worker.ts           # Service worker (compiles to public/sw.js)

public/
├── sw-enhanced.js             # Enhanced service worker
├── offline.html               # Offline fallback page
└── manifest.json              # PWA manifest
```

## Service Worker Strategies

### Static Assets (JS, CSS)
- **Strategy**: Cache First
- **Expiration**: 30 days
- **Benefits**: Fast loading, works offline

### Images
- **Strategy**: Cache First
- **Expiration**: 7 days
- **Benefits**: Reduced bandwidth, offline viewing

### API Requests (GET)
- **Strategy**: Network First with Cache Fallback
- **Timeout**: 5 seconds
- **Expiration**: 5 minutes
- **Benefits**: Fresh data when online, cached data when offline

### API Mutations (POST, PUT, DELETE)
- **Strategy**: Queue for Background Sync
- **Retry**: 3 attempts with exponential backoff
- **Benefits**: Never lose user changes

## Browser Support

- Chrome/Edge: Full support including background sync
- Firefox: Full support except background sync (uses fallback)
- Safari: Limited service worker support, basic offline functionality
- Mobile browsers: Good support on Android, limited on iOS

## Performance Considerations

1. **Initial Load**: First visit caches all critical assets (~2-5MB)
2. **Storage Quota**: Monitor usage, implement cleanup for old data
3. **Sync Performance**: Batch operations to reduce API calls
4. **Memory Usage**: Lazy load large datasets

## Testing Offline Functionality

1. **Chrome DevTools**:
   - Network tab → "Offline" checkbox
   - Application tab → Service Workers → "Offline"

2. **Manual Testing**:
   - Turn off WiFi/cellular data
   - Test all CRUD operations
   - Turn connection back on and verify sync

3. **Automated Testing**:
   ```javascript
   // Playwright example
   await context.setOffline(true);
   // Perform operations
   await context.setOffline(false);
   // Verify sync
   ```

## Common Issues and Solutions

### Issue: Service Worker Not Updating
**Solution**: Implement skip waiting and reload

### Issue: Storage Quota Exceeded
**Solution**: Implement data cleanup, request persistent storage

### Issue: Sync Conflicts
**Solution**: Implement proper conflict resolution strategy

### Issue: Push Notifications Not Working
**Solution**: Check notification permissions, HTTPS requirement

## Best Practices

1. **Always provide offline feedback** - Show clear indicators when offline
2. **Queue don't fail** - Queue mutations instead of showing errors
3. **Cache strategically** - Don't cache everything, focus on critical data
4. **Monitor storage** - Implement cleanup strategies
5. **Test thoroughly** - Test offline scenarios regularly
6. **Graceful degradation** - Provide basic functionality even without SW support

## Future Enhancements

1. **Selective Sync**: Allow users to choose what to sync
2. **Compression**: Compress cached data to save space
3. **P2P Sync**: Sync between devices on same network
4. **Offline Analytics**: Track offline usage patterns
5. **Advanced Conflict Resolution**: Three-way merge for complex data