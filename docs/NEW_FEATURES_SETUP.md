# Wedding Planner v2 - New Features Setup Guide

This guide covers the setup and configuration for the new Seating Planner and Day-of Wedding Dashboard features.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication
- Cloudinary account (for photos)
- Optional: Weather API key (OpenWeatherMap)
- Optional: Twilio account (for SMS)

## Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Environment Variables**
Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

Key variables to configure:
- `DATABASE_URL` - Your PostgreSQL connection string
- `CLERK_*` - Your Clerk authentication keys
- `CLOUDINARY_*` - Your Cloudinary credentials
- `WEBSOCKET_JWT_SECRET` - Generate a secure random string
- `WEATHER_API_KEY` - Your weather API key (optional)

3. **Generate Prisma Client**
```bash
npx prisma generate
```

4. **Run Database Migrations**
```bash
npx prisma db push
```

## Running the Application

### Development Mode

1. **Start the WebSocket server** (in one terminal):
```bash
npm run dev:ws
```

2. **Start Next.js** (in another terminal):
```bash
npm run dev
```

The application will be available at `http://localhost:4010`

### Production Mode

1. **Build the application**:
```bash
npm run build
```

2. **Start both servers**:
```bash
# Terminal 1
npm run start:ws

# Terminal 2
npm run start
```

## New Features Overview

### 1. Seating Planner

Interactive drag-and-drop seating arrangement tool with:
- **Canvas-based visualization** using Konva.js
- **Real-time collaboration** via WebSocket
- **Genetic algorithm optimization** for automatic seating arrangements
- **Export options**: PDF, PNG, CSV
- **Guest preferences**: Must sit together, cannot sit together, accessibility needs

**Access**: `/dashboard/seating`

### 2. Day-of Wedding Dashboard

Real-time coordination dashboard with:
- **Timeline management** with vendor assignments
- **Guest check-in** with QR code scanning
- **Vendor tracking** and check-in status
- **Issue reporting** and resolution tracking
- **Weather monitoring** for outdoor events
- **Emergency contacts** quick access
- **Real-time updates** via WebSocket

**Access**: `/dashboard/day-of`

### 3. Progressive Web App (PWA)

The application now works offline with:
- **Service worker** for offline caching
- **App installation** on mobile/desktop
- **Push notifications** (when configured)
- **Offline data sync**

## API Endpoints

### Seating Planner
- `GET/POST /api/seating/layouts` - Manage seating layouts
- `GET/POST/PUT/DELETE /api/seating/tables` - Manage tables
- `POST/DELETE /api/seating/assignments` - Assign guests to tables
- `POST /api/seating/optimize` - Run genetic algorithm optimization
- `POST /api/seating/export` - Export seating charts
- `GET/POST /api/seating/preferences` - Manage seating preferences

### Day-of Dashboard
- `GET/POST /api/day-of/timeline` - Timeline events
- `PUT /api/day-of/timeline/[id]` - Update event status
- `GET/POST /api/day-of/vendor-check-in` - Vendor check-ins
- `GET/POST /api/day-of/guest-check-in` - Guest check-ins
- `GET /api/day-of/guest-check-in/search` - Search guests
- `GET/POST /api/day-of/issues` - Issue management
- `GET/POST /api/day-of/emergency` - Emergency contacts
- `GET/POST /api/day-of/weather` - Weather updates

### QR Code
- `POST /api/qr/generate` - Generate QR codes for guests
- `POST /api/qr/scan` - Process QR code scans

### WebSocket
- `POST /api/ws/init` - Initialize WebSocket connection

## WebSocket Events

### Seating Namespace (`/seating`)
- `table:update` / `table:updated` - Table position/properties changed
- `guest:assign` / `guest:assigned` - Guest assigned to table
- `cursor:move` / `cursor:moved` - Collaborator cursor position
- `presence:update` / `presence:updated` - User presence status
- `optimization:progress` - Optimization algorithm progress

### Day-of Dashboard Namespace (`/day-of-dashboard`)
- `timeline:update` / `timeline:updated` - Timeline event status
- `vendor:checkin` / `vendor:checkedin` - Vendor check-in
- `guest:checkin` / `guest:checkedin` - Guest check-in
- `checkin:stats` - Updated check-in statistics
- `issue:report` / `issue:reported` - New issue reported
- `weather:update` / `weather:updated` - Weather conditions
- `emergency:broadcast` / `emergency:alert` - Emergency notifications

## Configuration Options

### Genetic Algorithm Parameters
When calling the optimization endpoint, you can customize:
- `populationSize` (default: 100)
- `maxGenerations` (default: 200)
- `mutationRate` (default: 0.05)
- `targetFitness` (default: 0.95)

### Export Options
- **PDF**: Page size (A4, Letter, A3), orientation (portrait, landscape)
- **PNG**: Resolution (1200x800, 1920x1080, 2400x1600)
- **CSV**: Include table numbers, guest names, meal choices, notes

### PWA Configuration
- Service worker caches static assets and API responses
- Offline-first strategy with network fallback
- Background sync for data updates
- Install prompts after 30 seconds

## Troubleshooting

### WebSocket Connection Issues
1. Ensure WebSocket server is running (`npm run dev:ws`)
2. Check CORS settings in `websocket-server.ts`
3. Verify authentication token generation
4. Check browser console for connection errors

### Database Issues
1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` is correct
3. Run `npx prisma db push` to sync schema
4. Check Prisma logs for errors

### PWA Not Working
1. PWA only works in production or with HTTPS
2. Check service worker registration in browser DevTools
3. Ensure manifest.json is accessible
4. Verify meta tags in layout.tsx

## Security Considerations

1. **WebSocket Authentication**: All WebSocket connections require JWT tokens
2. **Permission Checks**: API routes verify user ownership of resources
3. **Input Validation**: All inputs are validated using Zod schemas
4. **XSS Protection**: React automatically escapes content
5. **CORS**: Configured for your domain only
6. **Environment Variables**: Never commit `.env.local` file

## Performance Tips

1. **Use WebSocket for real-time features only**
2. **Enable compression in production**
3. **Lazy load heavy components (Konva canvas)**
4. **Use React.memo for expensive renders**
5. **Implement virtual scrolling for large guest lists**
6. **Cache API responses where appropriate**

## Support

For issues or questions:
1. Check the error logs in the console
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the Prisma schema matches the database

## Next Steps

1. Configure environment variables
2. Run database migrations
3. Start the development servers
4. Test the new features
5. Deploy to production with HTTPS for PWA support