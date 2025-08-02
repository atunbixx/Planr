# PWA Implementation Documentation

## Overview

The Wedding Planner application has been configured as a Progressive Web App (PWA) with the following features:

1. **Installability** - Users can install the app to their home screen
2. **Offline Support** - Basic offline functionality with service worker caching
3. **App-like Experience** - Standalone display mode with custom theme
4. **Update Notifications** - Automatic update prompts when new versions are available
5. **Network Status** - Real-time network status indicators

## Implementation Details

### 1. Manifest Configuration (`/public/manifest.json`)
- App name, description, and theme colors
- Icon sets for various sizes (currently using SVG placeholders)
- Display mode set to "standalone" for app-like experience
- Shortcuts for quick access to key features (Guests, Budget, RSVP)

### 2. Service Worker (`/public/sw.js`)
- **Caching Strategies**:
  - Static assets: Cache-first strategy
  - HTML pages: Network-first with offline fallback
  - API calls: Network-only (not cached)
- **Background Sync**: Prepared for offline RSVP and message submissions
- **Push Notifications**: Ready for implementation
- **Update Management**: Skip waiting functionality for immediate updates

### 3. PWA Components (`/src/components/pwa/`)

#### InstallPrompt.tsx
- Detects PWA install capability
- Shows install prompt after 2-second delay
- Remembers dismissal for 7 days
- Handles installation flow

#### UpdatePrompt.tsx
- Monitors for service worker updates
- Shows update notification when new version available
- Allows immediate update or postponement
- Auto-checks for updates hourly

#### OfflineIndicator.tsx
- Shows offline/online status banner
- Displays at bottom of screen
- Auto-hides online notification after 3 seconds

#### NetworkStatus.tsx
- Shows network connection quality
- Displays connection type (4G, 3G, 2G, WiFi)
- Warns about slow connections
- Only visible in development or poor network conditions

#### PWAProvider.tsx
- Handles service worker registration
- Manages PWA lifecycle
- Sets up update checking

### 4. Layout Integration (`/src/app/layout.tsx`)
- Added PWA meta tags for iOS compatibility
- Integrated PWA components
- Set theme color and viewport configuration

## Setup Instructions

### 1. Icons Generation
Currently using SVG placeholders. For production:

```bash
# Generate placeholder icons
node scripts/generate-pwa-icons.js

# For production, replace with proper PNG icons:
# 1. Create a 1024x1024 source icon
# 2. Use online tools or ImageMagick to generate all sizes
# 3. Update manifest.json to use .png extensions
```

### 2. Testing PWA Features

#### Install Prompt Testing
1. Open the app in Chrome/Edge
2. Look for install icon in address bar
3. Or wait 2 seconds for custom install prompt

#### Offline Testing
1. Open DevTools > Network tab
2. Set to "Offline"
3. Navigate around the app
4. Should see offline indicator and cached pages

#### Update Testing
1. Make changes to any file
2. Rebuild and deploy
3. Refresh the page
4. Should see update prompt

### 3. Lighthouse Audit
Run Lighthouse audit in Chrome DevTools to verify PWA compliance:
- Performance score
- PWA checklist
- Best practices

## Future Enhancements

### 1. Enhanced Offline Support
- IndexedDB for offline data storage
- Queue offline form submissions
- Sync when back online

### 2. Push Notifications
- Vendor message notifications
- RSVP reminders
- Task deadlines

### 3. Advanced Caching
- Dynamic cache management
- Selective caching based on user behavior
- Cache size management

### 4. Performance Optimizations
- Lazy loading for better initial load
- Code splitting for routes
- Image optimization

### 5. Native Features
- Camera access for photo uploads
- Calendar integration
- Contact list access for guest management

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check browser console for errors
   - Ensure HTTPS or localhost
   - Clear browser cache and retry

2. **Install Prompt Not Showing**
   - Check if already installed
   - Verify manifest.json is valid
   - Ensure icons are accessible

3. **Updates Not Working**
   - Check service worker lifecycle
   - Verify skip waiting implementation
   - Clear browser storage and retry

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support (no install prompt)
- Safari: Limited support (no install prompt, limited service worker)

## Security Considerations

1. **HTTPS Required**: PWAs only work over HTTPS (except localhost)
2. **Content Security Policy**: Configure CSP headers appropriately
3. **Sensitive Data**: Don't cache sensitive user data
4. **API Keys**: Never include API keys in service worker

## Monitoring

1. Use browser DevTools Application tab to monitor:
   - Service worker status
   - Cache storage
   - Manifest validation

2. Analytics to track:
   - PWA installs
   - Offline usage
   - Update acceptance rates