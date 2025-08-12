# Wedding Planner v2 - Feature Documentation

## Table of Contents
1. [Overview](#overview)
2. [Seating Planner](#seating-planner)
3. [Day-of Wedding Dashboard](#day-of-wedding-dashboard)
4. [Technical Architecture](#technical-architecture)
5. [API Reference](#api-reference)
6. [WebSocket Events](#websocket-events)
7. [Database Schema](#database-schema)
8. [Security](#security)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)

## Overview

The Wedding Planner v2 introduces two major features:
- **Seating Planner**: Interactive drag-and-drop seating arrangement with AI optimization
- **Day-of Wedding Dashboard**: Real-time coordination tool for the wedding day

Both features support real-time collaboration, offline functionality, and mobile optimization.

## Seating Planner

### Features
- **Visual Canvas Editor**: Drag-and-drop interface using Konva.js
- **Table Management**: Support for various table shapes (round, rectangular, square, oval, custom)
- **Guest Assignment**: Easy guest-to-table assignment with visual feedback
- **Seating Preferences**: Configure guest relationships and special requirements
- **AI Optimization**: Genetic algorithm for optimal seating arrangements
- **Export Options**: Generate PDF, PNG, or CSV exports
- **Real-time Collaboration**: Multiple users can work on the same layout simultaneously

### User Guide

#### Creating a Layout
1. Navigate to `/dashboard/seating`
2. Click "Create New Layout"
3. Enter layout name and optional notes
4. Start adding tables to your canvas

#### Adding Tables
1. Click "Add Table" button
2. Select table shape and capacity
3. Click on canvas to place table
4. Drag tables to rearrange

#### Assigning Guests
1. Open guest panel on the right
2. Search for guests or browse list
3. Drag guest to desired table
4. Or click guest then click table slot

#### Setting Preferences
1. Click "Preferences" button
2. Add relationship preferences:
   - Must sit together
   - Cannot sit together
3. Add location preferences:
   - Near entrance/bar/dance floor
   - Away from speakers
   - Wheelchair accessible

#### Running Optimization
1. Click "Optimize Seating"
2. Configure parameters (optional):
   - Population size (default: 100)
   - Max generations (default: 200)
   - Target fitness (default: 0.95)
3. Click "Start Optimization"
4. Review results and apply

#### Exporting
1. Click "Export" button
2. Choose format:
   - **PDF**: Best for printing
   - **PNG**: Best for sharing digitally
   - **CSV**: Best for spreadsheets
3. Configure options
4. Download file

## Day-of Wedding Dashboard

### Features
- **Timeline Management**: Track ceremony and reception events
- **Guest Check-in**: Manual search or QR code scanning
- **Vendor Tracking**: Monitor vendor arrivals and status
- **Issue Reporting**: Track and resolve day-of problems
- **Weather Monitoring**: Real-time weather updates for outdoor events
- **Emergency Contacts**: Quick access to important numbers
- **Real-time Updates**: All changes sync instantly across devices

### User Guide

#### Timeline Management
1. View timeline on main dashboard
2. Click events to update status:
   - Pending → In Progress → Completed
3. Add notes for actual vs scheduled times
4. Vendors automatically linked to events

#### Guest Check-in
**Manual Check-in:**
1. Use search bar to find guest
2. Click "Check In" button
3. View table assignment and notes

**QR Code Check-in:**
1. Click "Scan QR" button
2. Allow camera permissions
3. Point at guest's QR code
4. Automatic check-in with confirmation

#### Vendor Management
1. View vendor list in dashboard
2. Mark arrival status:
   - On Time
   - Late
   - No Show
3. Add notes for any issues

#### Issue Tracking
1. Click "Report Issue"
2. Select category:
   - Technical
   - Vendor
   - Guest
   - Venue
   - Other
3. Set priority level
4. Track resolution progress

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.io WebSockets
- **Canvas**: Konva.js for seating visualization
- **State**: Zustand for client state
- **Auth**: Clerk for authentication
- **PWA**: Service Workers for offline

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  API Routes     │────▶│   PostgreSQL    │
│   (React UI)    │     │  (REST APIs)    │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  WebSocket      │     │    Prisma       │
│  (Real-time)    │     │    (ORM)        │
└─────────────────┘     └─────────────────┘
```

## API Reference

### Seating Planner APIs

#### Layouts
- `GET /api/seating/layouts?eventId={id}` - Get all layouts
- `POST /api/seating/layouts` - Create new layout
- `PUT /api/seating/layouts/{id}` - Update layout
- `DELETE /api/seating/layouts/{id}` - Delete layout

#### Tables
- `GET /api/seating/tables?layoutId={id}` - Get tables
- `POST /api/seating/tables` - Create table
- `PUT /api/seating/tables/{id}` - Update table
- `DELETE /api/seating/tables/{id}` - Delete table

#### Assignments
- `POST /api/seating/assignments` - Assign guest
- `DELETE /api/seating/assignments/{id}` - Remove assignment

#### Optimization
- `POST /api/seating/optimize` - Run optimization
- `GET /api/seating/optimize/status` - Check status

### Day-of Dashboard APIs

#### Timeline
- `GET /api/day-of/timeline?eventId={id}` - Get timeline
- `POST /api/day-of/timeline` - Create event
- `PUT /api/day-of/timeline/{id}` - Update status

#### Check-ins
- `GET /api/day-of/guest-check-in/stats` - Get statistics
- `POST /api/day-of/guest-check-in` - Check in guest
- `GET /api/day-of/guest-check-in/search` - Search guests

#### Issues
- `GET /api/day-of/issues` - Get all issues
- `POST /api/day-of/issues` - Report issue
- `PUT /api/day-of/issues/{id}` - Update issue

## WebSocket Events

### Seating Namespace (`/seating`)

#### Client → Server
- `table:update` - Update table position/properties
- `guest:assign` - Assign guest to table
- `cursor:move` - Share cursor position
- `presence:update` - Update user presence

#### Server → Client
- `table:updated` - Table was updated
- `guest:assigned` - Guest was assigned
- `cursor:moved` - Cursor position changed
- `user:left` - User disconnected

### Day-of Namespace (`/day-of-dashboard`)

#### Client → Server
- `timeline:update` - Update event status
- `vendor:checkin` - Check in vendor
- `guest:checkin` - Check in guest
- `issue:report` - Report new issue

#### Server → Client
- `timeline:updated` - Timeline updated
- `vendor:checkedin` - Vendor checked in
- `guest:checkedin` - Guest checked in
- `checkin:stats` - Statistics updated

## Database Schema

### Core Models
```prisma
model SeatingLayout {
  id          String   @id @default(cuid())
  name        String
  eventId     String
  venueLayout Json?
  notes       String?
  isActive    Boolean  @default(true)
  tables      Table[]
  preferences SeatingPreference[]
  event       Event    @relation(fields: [eventId], references: [id])
}

model Table {
  id          String   @id @default(cuid())
  layoutId    String
  name        String
  capacity    Int
  shape       TableShape
  x           Float
  y           Float
  width       Float
  height      Float
  rotation    Float    @default(0)
  assignments SeatingAssignment[]
  layout      SeatingLayout @relation(fields: [layoutId], references: [id])
}

model GuestCheckIn {
  id            String   @id @default(cuid())
  eventId       String
  guestId       String
  checkedIn     Boolean  @default(false)
  checkInTime   DateTime?
  checkInMethod String?
  notes         String?
}
```

## Security

### Authentication
- All API routes require Clerk authentication
- WebSocket connections use JWT tokens
- User permissions validated on each request

### Data Protection
- Input validation on all endpoints
- SQL injection prevention via Prisma
- XSS protection through React
- CORS configured for production domains

### Best Practices
- Never expose sensitive data in responses
- Validate user ownership of resources
- Rate limit API endpoints
- Monitor for suspicious activity

## Performance

### Optimization Strategies
- **Lazy Loading**: Heavy components loaded on demand
- **Memoization**: Expensive calculations cached
- **Debouncing**: WebSocket events throttled
- **Virtual Rendering**: Large lists virtualized
- **Service Worker**: Assets cached for offline

### Benchmarks
- Seating optimization: <5s for 200 guests
- Real-time sync: <100ms latency
- Page load: <2s on 3G network
- Canvas rendering: 60fps with 50 tables

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
1. Check WebSocket server is running
2. Verify WEBSOCKET_URL in .env
3. Check browser console for errors
4. Ensure authentication token is valid

#### Seating Optimization Stuck
1. Reduce population size
2. Lower max generations
3. Check for impossible constraints
4. Verify sufficient table capacity

#### PWA Not Installing
1. Ensure HTTPS in production
2. Check manifest.json is accessible
3. Verify service worker registration
4. Clear browser cache

#### Database Errors
1. Run `npx prisma generate`
2. Run `npx prisma db push`
3. Check DATABASE_URL is correct
4. Verify PostgreSQL is running

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('debug', 'wedding-planner:*');
```

### Support Channels
- GitHub Issues: Report bugs
- Documentation: This guide
- Logs: Check browser/server console

## Conclusion

The Wedding Planner v2 features provide a comprehensive solution for wedding planning and day-of coordination. The real-time collaboration, offline support, and mobile optimization ensure a smooth experience for all users.

For additional help or feature requests, please refer to the project repository.