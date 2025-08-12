# Next Implementation Steps

## Overview

We've successfully implemented the core infrastructure for the Seating Planner and Day-of Dashboard features. Here's what needs to be done next to complete the implementation.

## 1. Database Setup

### Required Prisma Schema Updates

Add the following models to your `prisma/schema.prisma`:

```prisma
enum TableShape {
  round
  rectangular
  square
  oval
  custom
}

enum SeatingPreferenceType {
  must_sit_together
  cannot_sit_together
  near_entrance
  near_bar
  near_dance_floor
  near_restroom
  away_from_speakers
  wheelchair_accessible
}

enum EventStatus {
  scheduled
  in_progress
  completed
  delayed
  cancelled
}

enum VendorCheckInStatus {
  not_arrived
  checked_in
  setup_complete
  departed
}

enum IssueStatus {
  reported
  acknowledged
  in_progress
  resolved
  escalated
}

enum IssuePriority {
  low
  medium
  high
  critical
}

enum WeatherCondition {
  clear
  partly_cloudy
  cloudy
  light_rain
  heavy_rain
  storm
  snow
}

// Add these models...
```

### Run Migrations

```bash
# Apply the SQL migrations we created
npx prisma db push
npx prisma generate
```

## 2. Complete API Implementation

### Seating Service
Location: `/src/lib/api/seating.ts`

Implement the actual database queries for:
- Layout CRUD operations
- Table management
- Guest assignment logic
- Preference validation
- Export functionality

### Day-of Dashboard Service
Location: `/src/lib/api/day-of-dashboard.ts`

The service is ready but needs:
- WebSocket integration in API routes
- Background job for weather updates
- Push notification triggers

## 3. WebSocket Server Setup

### Install Dependencies
```bash
npm install socket.io @types/socket.io
npm install socket.io-client
```

### Create WebSocket Server
Add to your Next.js custom server or API route:

```typescript
// src/pages/api/socket.ts
import { Server } from 'socket.io';
import { initializeWebSocketServer } from '@/lib/websocket/server';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    initializeWebSocketServer(io);
  }
  res.end();
}
```

## 4. Complete UI Components

### Missing Components to Create:

1. **Seating Optimization Modal**
   - UI for genetic algorithm parameters
   - Progress indicator
   - Results preview

2. **Export Dialog**
   - Format selection (PDF/PNG/CSV)
   - Options (include dietary info, etc.)
   - Preview

3. **Guest Check-in Scanner**
   - QR code scanner component
   - Manual search fallback

4. **Weather Widget**
   - Current conditions display
   - Hourly forecast
   - Alerts for outdoor events

5. **Emergency Contacts Quick Access**
   - Floating action button
   - Quick dial interface

## 5. Implement Core Algorithms

### Seating Optimization Algorithm
Location: `/src/lib/algorithms/seating-optimizer.ts`

```typescript
export class GeneticSeatingOptimizer {
  // Implement genetic algorithm
  // Population generation
  // Fitness calculation
  // Crossover and mutation
  // Constraint validation
}
```

### Conflict Detection
- Check preference violations
- Validate capacity constraints
- Accessibility requirements

## 6. Mobile Optimization

### Touch Interactions
- Implement pinch-to-zoom for seating canvas
- Swipe gestures for timeline navigation
- Long-press for quick actions

### Responsive Layouts
- Mobile-specific navigation
- Bottom sheets for mobile
- Condensed information display

## 7. Testing Implementation

### Unit Tests
```typescript
// Example test structure
describe('SeatingService', () => {
  it('should assign guest to table', async () => {
    // Test implementation
  });
  
  it('should detect preference violations', async () => {
    // Test implementation
  });
});
```

### E2E Tests
- Seating planner drag-and-drop
- Real-time updates
- Offline functionality

## 8. Performance Optimizations

### Canvas Rendering
- Implement virtualization for large venues
- Level-of-detail rendering
- Efficient redraw logic

### Data Loading
- Implement pagination for guest lists
- Lazy loading for timeline events
- Optimistic updates

## 9. Security & Permissions

### Role-Based Access
- Couple: Full access
- Wedding Coordinator: Day-of dashboard access
- Vendors: Limited check-in access
- Guests: Read-only for their info

### API Security
- Rate limiting
- Input validation
- CORS configuration

## 10. Deployment Preparation

### Environment Variables
```env
# Add to .env
WEBSOCKET_URL=wss://your-domain.com
WEATHER_API_KEY=your-weather-api-key
PUSH_NOTIFICATION_KEY=your-push-key
```

### Build Optimization
- Code splitting for features
- Image optimization
- Bundle size analysis

## 11. Documentation

### User Guides
- Seating planner tutorial
- Day-of dashboard guide
- Troubleshooting guide

### API Documentation
- WebSocket event reference
- REST endpoint documentation
- Integration examples

## Priority Order

1. **Database Setup** (Required first)
2. **Complete API Implementation** 
3. **WebSocket Server Setup**
4. **Core Algorithm Implementation**
5. **Complete UI Components**
6. **Mobile Optimization**
7. **Testing**
8. **Performance & Security**
9. **Documentation**

## Estimated Timeline

- **Week 1**: Database, API, WebSocket setup
- **Week 2**: Core algorithms and missing UI components
- **Week 3**: Mobile optimization and testing
- **Week 4**: Performance, security, and documentation

## Quick Start Commands

```bash
# Install additional dependencies
npm install socket.io socket.io-client konva react-konva
npm install @react-pdf/renderer canvas

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# Test offline functionality
# 1. Open DevTools
# 2. Go to Application > Service Workers
# 3. Check "Offline" mode
```

## Support Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [PWA Best Practices](https://web.dev/pwa/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

This implementation plan provides a clear path forward. Start with the database setup and work through each section systematically. The architecture is designed to be scalable and maintainable.