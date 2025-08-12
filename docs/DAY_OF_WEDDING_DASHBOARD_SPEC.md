# Day-of Wedding Dashboard - Technical Specification

## Overview

The Day-of Wedding Dashboard is a real-time command center that coordinates all wedding day activities, vendor statuses, timeline management, and emergency protocols. It transforms chaotic wedding day execution into a smooth, monitored operation accessible by the couple, wedding party, and vendors.

## Core Requirements

### Functional Requirements
1. **Live Timeline Management**: Real-time schedule with dynamic updates
2. **Vendor Coordination**: Check-in system, status tracking, and communications
3. **Guest Management**: Arrival tracking, seating assistance, dietary alerts
4. **Emergency Protocols**: Quick access to contacts, backup plans, and issue escalation
5. **Multi-User Access**: Role-based dashboards for couple, coordinators, and vendors
6. **Offline Capability**: Critical functions work without internet connection

### Non-Functional Requirements
- **Real-time Updates**: <100ms latency for status changes
- **Mobile First**: Optimized for phones used on-the-go
- **Reliability**: 99.99% uptime on wedding day
- **Offline Mode**: Progressive Web App with service workers
- **Battery Efficient**: Optimized for all-day mobile use

## Database Schema Design

```sql
-- Wedding day timeline events
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  event_name VARCHAR(200) NOT NULL,
  event_type EVENT_TYPE NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  duration_minutes INTEGER NOT NULL,
  location VARCHAR(200),
  responsible_vendor_id UUID REFERENCES vendors(id),
  responsible_person VARCHAR(100),
  status EVENT_STATUS NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  dependencies JSONB, -- Array of dependent event IDs
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  order_index INTEGER NOT NULL, -- For manual ordering
  CONSTRAINT unique_timeline_order UNIQUE(couple_id, order_index)
);

-- Vendor check-ins and status
CREATE TABLE vendor_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  scheduled_arrival TIMESTAMP NOT NULL,
  actual_arrival TIMESTAMP,
  checked_in_by UUID REFERENCES users(id),
  setup_completed_at TIMESTAMP,
  service_started_at TIMESTAMP,
  service_completed_at TIMESTAMP,
  breakdown_completed_at TIMESTAMP,
  status VENDOR_DAY_STATUS NOT NULL DEFAULT 'not_arrived',
  location VARCHAR(200),
  contact_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  issues JSONB, -- Array of issues/concerns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  contact_type CONTACT_TYPE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_primary_contact UNIQUE(couple_id, contact_type, is_primary) WHERE is_primary = true
);

-- Day-of issues and resolutions
CREATE TABLE wedding_day_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reported_by UUID REFERENCES users(id),
  issue_type ISSUE_TYPE NOT NULL,
  severity ISSUE_SEVERITY NOT NULL,
  description TEXT NOT NULL,
  affected_vendor_id UUID REFERENCES vendors(id),
  affected_event_id UUID REFERENCES timeline_events(id),
  status ISSUE_STATUS NOT NULL DEFAULT 'open',
  assigned_to VARCHAR(100),
  resolved_at TIMESTAMP,
  resolution TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Guest arrivals and assistance
CREATE TABLE guest_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_by UUID REFERENCES users(id),
  table_assisted BOOLEAN DEFAULT false,
  special_needs_noted TEXT,
  meal_served BOOLEAN DEFAULT false,
  notes TEXT,
  CONSTRAINT unique_guest_checkin UNIQUE(guest_id)
);

-- Weather tracking
CREATE TABLE weather_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  temperature DECIMAL(4,1),
  conditions VARCHAR(100),
  wind_speed INTEGER,
  precipitation_chance INTEGER,
  alerts TEXT,
  backup_plan_activated BOOLEAN DEFAULT false
);

-- Enum types
CREATE TYPE EVENT_TYPE AS ENUM (
  'preparation', 'ceremony', 'cocktail', 'reception', 
  'photography', 'transportation', 'setup', 'breakdown', 'other'
);

CREATE TYPE EVENT_STATUS AS ENUM (
  'scheduled', 'in_progress', 'completed', 'delayed', 'cancelled'
);

CREATE TYPE VENDOR_DAY_STATUS AS ENUM (
  'not_arrived', 'arrived', 'setting_up', 'ready', 
  'in_service', 'breaking_down', 'departed', 'issue'
);

CREATE TYPE CONTACT_TYPE AS ENUM (
  'venue', 'coordinator', 'emergency', 'medical', 'transportation', 'other'
);

CREATE TYPE ISSUE_TYPE AS ENUM (
  'vendor_late', 'vendor_no_show', 'equipment_failure', 'weather',
  'guest_issue', 'timeline_delay', 'catering', 'venue', 'other'
);

CREATE TYPE ISSUE_SEVERITY AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ISSUE_STATUS AS ENUM ('open', 'in_progress', 'resolved', 'escalated');

-- Indexes for performance
CREATE INDEX idx_timeline_couple_time ON timeline_events(couple_id, scheduled_time);
CREATE INDEX idx_vendor_checkins_status ON vendor_checkins(couple_id, status);
CREATE INDEX idx_issues_open ON wedding_day_issues(couple_id, status) WHERE status != 'resolved';
CREATE INDEX idx_guest_checkins_time ON guest_checkins(checked_in_at);
```

## API Architecture

### Day-of Service Layer

```typescript
// src/lib/api/day-of-wedding.ts
export class DayOfWeddingService {
  // Timeline Management
  async getTimeline(coupleId: string, date: Date): Promise<TimelineEvent[]>
  async createTimelineEvent(data: CreateTimelineEventDto): Promise<TimelineEvent>
  async updateTimelineEvent(eventId: string, data: UpdateTimelineEventDto): Promise<TimelineEvent>
  async startEvent(eventId: string): Promise<TimelineEvent>
  async completeEvent(eventId: string): Promise<TimelineEvent>
  async delayEvent(eventId: string, minutes: number, reason: string): Promise<TimelineEvent>
  async reorderTimeline(coupleId: string, eventIds: string[]): Promise<TimelineEvent[]>

  // Vendor Coordination
  async getVendorStatuses(coupleId: string): Promise<VendorCheckIn[]>
  async checkInVendor(vendorId: string, data: CheckInDto): Promise<VendorCheckIn>
  async updateVendorStatus(vendorId: string, status: VendorDayStatus): Promise<VendorCheckIn>
  async reportVendorIssue(vendorId: string, issue: VendorIssueDto): Promise<WeddingDayIssue>
  async getVendorTimeline(vendorId: string): Promise<VendorSchedule>

  // Guest Management
  async checkInGuest(guestId: string): Promise<GuestCheckIn>
  async bulkCheckInGuests(guestIds: string[]): Promise<GuestCheckIn[]>
  async getGuestStats(): Promise<GuestArrivalStats>
  async findGuestByName(name: string): Promise<GuestWithTable[]>
  async noteSpecialNeed(guestId: string, need: string): Promise<GuestCheckIn>

  // Issue Management
  async reportIssue(data: CreateIssueDto): Promise<WeddingDayIssue>
  async updateIssueStatus(issueId: string, status: IssueStatus): Promise<WeddingDayIssue>
  async assignIssue(issueId: string, assignee: string): Promise<WeddingDayIssue>
  async resolveIssue(issueId: string, resolution: string): Promise<WeddingDayIssue>
  async getActiveIssues(coupleId: string): Promise<WeddingDayIssue[]>

  // Emergency Contacts
  async getEmergencyContacts(coupleId: string): Promise<EmergencyContact[]>
  async addEmergencyContact(data: CreateEmergencyContactDto): Promise<EmergencyContact>
  
  // Weather & Contingency
  async updateWeather(coupleId: string, data: WeatherUpdateDto): Promise<WeatherUpdate>
  async activateBackupPlan(coupleId: string, reason: string): Promise<void>
  
  // Real-time Notifications
  async broadcastUpdate(coupleId: string, update: DayOfUpdate): Promise<void>
  async sendVendorAlert(vendorId: string, alert: VendorAlert): Promise<void>
  async notifyCoordinators(coupleId: string, notification: CoordinatorNotification): Promise<void>
}
```

### REST API Endpoints

```typescript
// Timeline Management
GET    /api/day-of/timeline              - Get wedding day timeline
POST   /api/day-of/timeline/events       - Create timeline event
PUT    /api/day-of/timeline/events/:id   - Update event
POST   /api/day-of/timeline/events/:id/start - Start event
POST   /api/day-of/timeline/events/:id/complete - Complete event
POST   /api/day-of/timeline/events/:id/delay - Delay event
PUT    /api/day-of/timeline/reorder      - Reorder timeline

// Vendor Coordination
GET    /api/day-of/vendors               - Get all vendor statuses
POST   /api/day-of/vendors/:id/check-in  - Check in vendor
PUT    /api/day-of/vendors/:id/status    - Update vendor status
POST   /api/day-of/vendors/:id/issue     - Report vendor issue
GET    /api/day-of/vendors/:id/schedule  - Get vendor timeline

// Guest Management  
POST   /api/day-of/guests/:id/check-in   - Check in guest
POST   /api/day-of/guests/bulk-check-in  - Bulk check in
GET    /api/day-of/guests/stats          - Get arrival statistics
GET    /api/day-of/guests/search         - Search guests
PUT    /api/day-of/guests/:id/needs      - Note special needs

// Issue Management
POST   /api/day-of/issues                - Report new issue
PUT    /api/day-of/issues/:id/status     - Update issue status
PUT    /api/day-of/issues/:id/assign     - Assign issue
PUT    /api/day-of/issues/:id/resolve    - Resolve issue
GET    /api/day-of/issues/active         - Get active issues

// Emergency & Weather
GET    /api/day-of/emergency-contacts    - Get emergency contacts
POST   /api/day-of/weather               - Update weather
POST   /api/day-of/backup-plan/activate  - Activate backup plan

// WebSocket Events
WS     /api/day-of/live                  - Real-time updates
```

## Frontend Architecture

### Component Structure

```typescript
// Main Dashboard Components
DayOfDashboard/
├── DashboardContainer.tsx          // Main container with role-based routing
├── Timeline/
│   ├── TimelineView.tsx           // Main timeline display
│   ├── TimelineEvent.tsx          // Individual event card
│   ├── TimelineProgress.tsx       // Visual progress indicator
│   ├── CurrentEvent.tsx           // Highlighted current event
│   └── DelayModal.tsx             // Event delay interface
├── VendorHub/
│   ├── VendorGrid.tsx             // All vendor status grid
│   ├── VendorCard.tsx             // Individual vendor status
│   ├── VendorCheckIn.tsx          // Check-in interface
│   ├── VendorTimeline.tsx         // Vendor-specific schedule
│   └── VendorChat.tsx             // Quick messaging
├── GuestManagement/
│   ├── ArrivalStats.tsx           // Real-time arrival statistics
│   ├── GuestSearch.tsx            // Find guest interface
│   ├── CheckInScanner.tsx         // QR code scanner
│   ├── SeatingAssist.tsx          // Table lookup helper
│   └── SpecialNeeds.tsx           // Dietary/accessibility alerts
├── IssueTracker/
│   ├── IssueList.tsx              // Active issues display
│   ├── IssueCard.tsx              // Issue detail card
│   ├── ReportIssue.tsx            // Quick issue reporting
│   ├── IssueTimeline.tsx          // Issue history
│   └── ResolutionForm.tsx         // Issue resolution interface
├── ControlCenter/
│   ├── EmergencyContacts.tsx      // Quick access contacts
│   ├── WeatherWidget.tsx          // Live weather updates
│   ├── BackupPlans.tsx            // Contingency protocols
│   ├── Announcements.tsx          // Broadcast messages
│   └── TeamChat.tsx               // Coordinator communication
├── Mobile/
│   ├── MobileTimeline.tsx         // Simplified timeline
│   ├── QuickActions.tsx           // Common action buttons
│   ├── VendorQuickView.tsx        // Vendor status list
│   └── IssueReporter.tsx          // Mobile issue reporting
└── Shared/
    ├── StatusBadge.tsx            // Consistent status indicators
    ├── TimeDisplay.tsx            // Countdown/elapsed time
    ├── NotificationToast.tsx      // Real-time notifications
    ├── OfflineIndicator.tsx       // Connection status
    └── RoleGate.tsx               // Role-based component access

// Role-Specific Views
views/
├── CoupleView.tsx                 // Full dashboard for couple
├── CoordinatorView.tsx            // Coordinator dashboard
├── VendorView.tsx                 // Limited vendor access
└── StaffView.tsx                  // Staff member view
```

### State Management

```typescript
// Using Zustand with persistence for offline capability
interface DayOfWeddingStore {
  // Timeline State
  timeline: TimelineEvent[]
  currentEvent: TimelineEvent | null
  upcomingEvents: TimelineEvent[]
  timeline_status: 'on_time' | 'delayed' | 'ahead'
  
  // Vendor State
  vendors: VendorCheckIn[]
  vendorAlerts: VendorAlert[]
  
  // Guest State  
  guestStats: {
    expected: number
    arrived: number
    seated: number
    arrivalRate: number[]
  }
  recentCheckIns: GuestCheckIn[]
  
  // Issues
  activeIssues: WeddingDayIssue[]
  resolvedIssues: WeddingDayIssue[]
  
  // Emergency
  emergencyContacts: EmergencyContact[]
  weatherStatus: WeatherUpdate | null
  backupPlanActive: boolean
  
  // Real-time
  connectedUsers: ConnectedUser[]
  lastSync: Date
  isOffline: boolean
  
  // Actions
  loadDashboard: () => Promise<void>
  updateTimelineEvent: (eventId: string, update: Partial<TimelineEvent>) => void
  checkInVendor: (vendorId: string) => Promise<void>
  checkInGuest: (guestId: string) => Promise<void>
  reportIssue: (issue: CreateIssueDto) => Promise<void>
  syncOfflineData: () => Promise<void>
}

// Offline persistence
const useDayOfWeddingStore = create<DayOfWeddingStore>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'day-of-wedding-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        timeline: state.timeline,
        vendors: state.vendors,
        emergencyContacts: state.emergencyContacts,
        lastSync: state.lastSync
      })
    }
  )
);
```

### Real-time Updates

```typescript
// WebSocket connection for live updates
interface DayOfWebSocketEvents {
  // Timeline events
  'timeline:updated': (event: TimelineEvent) => void
  'timeline:started': (eventId: string) => void
  'timeline:completed': (eventId: string) => void
  'timeline:delayed': (eventId: string, delay: number) => void
  
  // Vendor events
  'vendor:checked_in': (vendor: VendorCheckIn) => void
  'vendor:status_changed': (vendorId: string, status: VendorDayStatus) => void
  'vendor:issue': (issue: VendorIssue) => void
  
  // Guest events
  'guest:arrived': (stats: GuestArrivalStats) => void
  'guest:checked_in': (guest: GuestCheckIn) => void
  
  // Issue events
  'issue:created': (issue: WeddingDayIssue) => void
  'issue:updated': (issue: WeddingDayIssue) => void
  'issue:resolved': (issueId: string) => void
  
  // System events
  'weather:update': (weather: WeatherUpdate) => void
  'backup:activated': (reason: string) => void
  'user:joined': (user: ConnectedUser) => void
  'user:left': (userId: string) => void
}

// Hook for real-time connection
const useDayOfWebSocket = () => {
  const { coupleId } = useAuth();
  const store = useDayOfWeddingStore();
  
  useEffect(() => {
    const socket = io('/day-of', {
      query: { coupleId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity
    });
    
    // Timeline updates
    socket.on('timeline:updated', (event) => {
      store.updateTimelineEvent(event.id, event);
      showNotification(`Timeline updated: ${event.event_name}`);
    });
    
    // Vendor updates
    socket.on('vendor:checked_in', (vendor) => {
      store.updateVendor(vendor);
      playSound('check-in');
      showNotification(`${vendor.name} has arrived`);
    });
    
    // Issue alerts
    socket.on('issue:created', (issue) => {
      store.addIssue(issue);
      if (issue.severity === 'critical') {
        playSound('alert');
        showUrgentNotification(issue);
      }
    });
    
    // Connection management
    socket.on('connect', () => {
      store.setOnlineStatus(true);
      store.syncOfflineData();
    });
    
    socket.on('disconnect', () => {
      store.setOnlineStatus(false);
    });
    
    return () => socket.disconnect();
  }, [coupleId]);
};
```

### Mobile-First UI Components

```typescript
// Current event display with quick actions
const CurrentEventCard: React.FC = () => {
  const currentEvent = useCurrentEvent();
  const [showActions, setShowActions] = useState(false);
  
  if (!currentEvent) return <NoCurrentEvent />;
  
  const progress = calculateEventProgress(currentEvent);
  
  return (
    <Card className="current-event-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{currentEvent.event_name}</h2>
            <p className="text-muted-foreground">{currentEvent.location}</p>
          </div>
          <StatusBadge status={currentEvent.status} size="large" />
        </div>
      </CardHeader>
      
      <CardContent>
        <ProgressBar value={progress} className="mb-4" />
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <TimeDisplay
            label="Started"
            time={currentEvent.actual_start_time}
            scheduled={currentEvent.scheduled_time}
          />
          <TimeDisplay
            label="Duration"
            duration={currentEvent.duration_minutes}
            elapsed={getElapsedMinutes(currentEvent.actual_start_time)}
          />
        </div>
        
        {currentEvent.responsible_vendor_id && (
          <VendorQuickCard vendorId={currentEvent.responsible_vendor_id} />
        )}
        
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => completeEvent(currentEvent.id)}
            className="flex-1"
            size="lg"
          >
            Mark Complete
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowActions(true)}
            size="lg"
          >
            More Actions
          </Button>
        </div>
      </CardContent>
      
      <QuickActionsSheet
        open={showActions}
        onClose={() => setShowActions(false)}
        event={currentEvent}
      />
    </Card>
  );
};

// Vendor status grid
const VendorStatusGrid: React.FC = () => {
  const vendors = useVendorStatuses();
  const [filter, setFilter] = useState<VendorDayStatus | 'all'>('all');
  
  const filteredVendors = filter === 'all' 
    ? vendors 
    : vendors.filter(v => v.status === filter);
  
  const statusCounts = useMemo(() => 
    vendors.reduce((acc, vendor) => {
      acc[vendor.status] = (acc[vendor.status] || 0) + 1;
      return acc;
    }, {} as Record<VendorDayStatus, number>)
  , [vendors]);
  
  return (
    <div className="vendor-status-grid">
      <div className="status-filter-tabs">
        <Tab
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={vendors.length}
        >
          All Vendors
        </Tab>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Tab
            key={status}
            active={filter === status}
            onClick={() => setFilter(status as VendorDayStatus)}
            count={count}
          >
            {formatVendorStatus(status)}
          </Tab>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map(vendor => (
          <VendorStatusCard
            key={vendor.id}
            vendor={vendor}
            onStatusChange={(status) => updateVendorStatus(vendor.id, status)}
            onIssueReport={() => reportVendorIssue(vendor.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Offline Capability

```typescript
// Service Worker for offline functionality
// public/service-worker.js
const CACHE_NAME = 'wedding-day-v1';
const urlsToCache = [
  '/dashboard/day-of',
  '/api/day-of/emergency-contacts',
  '/api/day-of/timeline',
  '/api/day-of/vendors'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Cache-first strategy for GET requests
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
  }
  
  // Queue POST/PUT requests when offline
  if (['POST', 'PUT'].includes(event.request.method)) {
    event.respondWith(
      fetch(event.request.clone()).catch(() => {
        return saveRequestForSync(event.request.clone());
      })
    );
  }
});

// Background sync for offline changes
self.addEventListener('sync', event => {
  if (event.tag === 'sync-wedding-updates') {
    event.waitUntil(syncOfflineData());
  }
});

// Offline data sync manager
const OfflineSyncManager = {
  queue: [] as OfflineRequest[],
  
  addToQueue(request: OfflineRequest) {
    this.queue.push({
      ...request,
      timestamp: new Date(),
      id: generateId()
    });
    this.saveQueue();
  },
  
  async syncAll() {
    const failed: OfflineRequest[] = [];
    
    for (const request of this.queue) {
      try {
        await this.syncRequest(request);
      } catch (error) {
        failed.push(request);
      }
    }
    
    this.queue = failed;
    this.saveQueue();
    
    return {
      synced: this.queue.length - failed.length,
      failed: failed.length
    };
  },
  
  async syncRequest(request: OfflineRequest) {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
    
    return response;
  }
};
```

### Emergency Protocols UI

```typescript
// Quick access emergency interface
const EmergencyPanel: React.FC = () => {
  const contacts = useEmergencyContacts();
  const [showAllContacts, setShowAllContacts] = useState(false);
  
  const primaryContacts = contacts.filter(c => c.is_primary);
  
  return (
    <Card className="emergency-panel">
      <CardHeader>
        <h3 className="text-lg font-bold text-red-600">Emergency Contacts</h3>
      </CardHeader>
      
      <CardContent>
        {/* Primary contacts always visible */}
        <div className="space-y-2 mb-4">
          {primaryContacts.map(contact => (
            <EmergencyContactCard
              key={contact.id}
              contact={contact}
              primary
            />
          ))}
        </div>
        
        {/* Quick dial buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => callEmergency('911')}
          >
            🚨 Call 911
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => callVenueEmergency()}
          >
            🏛️ Venue Emergency
          </Button>
        </div>
        
        {/* Backup plans */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Backup Plans</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => activateBackupPlan('weather')}
            >
              🌧️ Weather Backup Plan
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => activateBackupPlan('vendor')}
            >
              👥 Vendor No-Show Protocol
            </Button>
          </div>
        </div>
        
        <Button
          variant="link"
          onClick={() => setShowAllContacts(true)}
          className="w-full mt-4"
        >
          View All Contacts ({contacts.length})
        </Button>
      </CardContent>
      
      <AllContactsSheet
        open={showAllContacts}
        onClose={() => setShowAllContacts(false)}
        contacts={contacts}
      />
    </Card>
  );
};
```

### Performance Monitoring

```typescript
// Real-time performance metrics
const PerformanceMonitor = {
  metrics: {
    timelineAccuracy: 0,
    vendorPunctuality: 0,
    guestArrivalRate: 0,
    issueResolutionTime: 0
  },
  
  calculateTimelineAccuracy(timeline: TimelineEvent[]): number {
    const completed = timeline.filter(e => e.status === 'completed');
    if (completed.length === 0) return 100;
    
    const delayMinutes = completed.reduce((total, event) => {
      const scheduled = new Date(event.scheduled_time).getTime();
      const actual = new Date(event.actual_start_time!).getTime();
      return total + Math.abs(actual - scheduled) / 60000;
    }, 0);
    
    return Math.max(0, 100 - (delayMinutes / completed.length) * 5);
  },
  
  calculateVendorPunctuality(vendors: VendorCheckIn[]): number {
    const arrived = vendors.filter(v => v.actual_arrival);
    if (arrived.length === 0) return 100;
    
    const onTime = arrived.filter(v => {
      const scheduled = new Date(v.scheduled_arrival).getTime();
      const actual = new Date(v.actual_arrival!).getTime();
      return actual - scheduled <= 15 * 60000; // 15 min grace
    });
    
    return (onTime.length / arrived.length) * 100;
  },
  
  trackGuestArrivalRate(checkIns: GuestCheckIn[], expected: number): number[] {
    const now = new Date();
    const rates = [];
    
    for (let i = 0; i < 12; i++) {
      const periodStart = new Date(now.getTime() - (i + 1) * 5 * 60000);
      const periodEnd = new Date(now.getTime() - i * 5 * 60000);
      
      const arrivals = checkIns.filter(c => {
        const time = new Date(c.checked_in_at).getTime();
        return time >= periodStart.getTime() && time < periodEnd.getTime();
      });
      
      rates.unshift((arrivals.length / expected) * 100);
    }
    
    return rates;
  }
};

// Performance dashboard widget
const PerformanceWidget: React.FC = () => {
  const metrics = usePerformanceMetrics();
  
  return (
    <Card className="performance-widget">
      <CardHeader>
        <h4 className="text-sm font-medium">Performance Metrics</h4>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <MetricRow
            label="Timeline Accuracy"
            value={metrics.timelineAccuracy}
            format="percentage"
            threshold={90}
          />
          <MetricRow
            label="Vendor Punctuality"
            value={metrics.vendorPunctuality}
            format="percentage"
            threshold={85}
          />
          <MetricRow
            label="Guest Arrival Rate"
            value={metrics.currentArrivalRate}
            format="percentage"
            showTrend
          />
          <MetricRow
            label="Avg Issue Resolution"
            value={metrics.avgResolutionTime}
            format="minutes"
            threshold={15}
          />
        </div>
      </CardContent>
    </Card>
  );
};
```

## Role-Based Access Control

```typescript
// Role definitions and permissions
enum DayOfRole {
  COUPLE = 'couple',
  COORDINATOR = 'coordinator',
  VENDOR = 'vendor',
  STAFF = 'staff',
  GUEST = 'guest'
}

interface RolePermissions {
  timeline: {
    view: boolean
    modify: boolean
    complete: boolean
  }
  vendors: {
    viewAll: boolean
    checkIn: boolean
    updateStatus: boolean
  }
  guests: {
    checkIn: boolean
    viewStats: boolean
    search: boolean
  }
  issues: {
    view: boolean
    create: boolean
    resolve: boolean
  }
  emergency: {
    viewContacts: boolean
    activateBackup: boolean
  }
}

const ROLE_PERMISSIONS: Record<DayOfRole, RolePermissions> = {
  [DayOfRole.COUPLE]: {
    timeline: { view: true, modify: true, complete: true },
    vendors: { viewAll: true, checkIn: true, updateStatus: true },
    guests: { checkIn: true, viewStats: true, search: true },
    issues: { view: true, create: true, resolve: true },
    emergency: { viewContacts: true, activateBackup: true }
  },
  [DayOfRole.COORDINATOR]: {
    timeline: { view: true, modify: true, complete: true },
    vendors: { viewAll: true, checkIn: true, updateStatus: true },
    guests: { checkIn: true, viewStats: true, search: true },
    issues: { view: true, create: true, resolve: true },
    emergency: { viewContacts: true, activateBackup: true }
  },
  [DayOfRole.VENDOR]: {
    timeline: { view: true, modify: false, complete: false },
    vendors: { viewAll: false, checkIn: false, updateStatus: false },
    guests: { checkIn: false, viewStats: false, search: false },
    issues: { view: false, create: true, resolve: false },
    emergency: { viewContacts: false, activateBackup: false }
  },
  [DayOfRole.STAFF]: {
    timeline: { view: true, modify: false, complete: false },
    vendors: { viewAll: true, checkIn: true, updateStatus: false },
    guests: { checkIn: true, viewStats: true, search: true },
    issues: { view: true, create: true, resolve: false },
    emergency: { viewContacts: true, activateBackup: false }
  }
};

// Role-based routing
const DayOfDashboardRouter: React.FC = () => {
  const userRole = useUserRole();
  
  switch (userRole) {
    case DayOfRole.COUPLE:
    case DayOfRole.COORDINATOR:
      return <FullDashboard />;
    
    case DayOfRole.VENDOR:
      return <VendorDashboard />;
    
    case DayOfRole.STAFF:
      return <StaffDashboard />;
    
    default:
      return <NoAccessMessage />;
  }
};
```

## Testing Strategy

### Unit Tests

```typescript
describe('DayOfWeddingService', () => {
  describe('Timeline Management', () => {
    it('should handle event delays with cascade updates', async () => {
      const timeline = await createTestTimeline();
      const firstEvent = timeline[0];
      
      // Delay first event by 30 minutes
      await service.delayEvent(firstEvent.id, 30, 'Vendor late');
      
      // Verify cascade updates
      const updated = await service.getTimeline(coupleId, weddingDate);
      
      expect(updated[0].status).toBe('delayed');
      expect(updated[1].scheduled_time).toBe(
        addMinutes(timeline[1].scheduled_time, 30)
      );
    });
    
    it('should prevent timeline conflicts', async () => {
      const event1 = await createTimelineEvent({
        scheduled_time: '2024-06-01T14:00:00',
        duration_minutes: 60
      });
      
      // Try to create overlapping event
      await expect(
        createTimelineEvent({
          scheduled_time: '2024-06-01T14:30:00',
          duration_minutes: 60
        })
      ).rejects.toThrow('Timeline conflict');
    });
  });
  
  describe('Vendor Coordination', () => {
    it('should track vendor status progression', async () => {
      const vendor = await createTestVendor();
      
      // Check in vendor
      await service.checkInVendor(vendor.id, {
        arrival_time: new Date()
      });
      
      // Update status
      await service.updateVendorStatus(vendor.id, 'setting_up');
      await service.updateVendorStatus(vendor.id, 'ready');
      
      const status = await service.getVendorStatus(vendor.id);
      expect(status.status).toBe('ready');
      expect(status.status_history).toHaveLength(3);
    });
  });
});
```

### Integration Tests

```typescript
describe('Day-of Dashboard E2E', () => {
  it('should handle complete vendor workflow', async () => {
    await page.goto('/dashboard/day-of');
    
    // Check in vendor
    await page.click('[data-vendor-id="photographer"] [data-action="check-in"]');
    await expect(page).toHaveText(
      '[data-vendor-id="photographer"] .status',
      'Arrived'
    );
    
    // Update to ready
    await page.click('[data-vendor-id="photographer"] [data-action="ready"]');
    await expect(page).toHaveText(
      '[data-vendor-id="photographer"] .status',
      'Ready'
    );
    
    // Verify timeline update
    await expect(page).toHaveText(
      '[data-event="ceremony"] .vendor-status',
      'Photographer Ready'
    );
  });
  
  it('should sync offline changes', async () => {
    await page.goto('/dashboard/day-of');
    
    // Go offline
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    
    // Make changes
    await page.click('[data-guest-id="guest-1"] [data-action="check-in"]');
    
    // Go back online
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    
    // Verify sync
    await page.waitForSelector('.sync-success-toast');
    
    // Verify data persisted
    await page.reload();
    await expect(page).toHaveText(
      '[data-guest-id="guest-1"] .status',
      'Checked In'
    );
  });
});
```

## Deployment & Performance

### Infrastructure Requirements

```yaml
# Kubernetes deployment for high availability
apiVersion: apps/v1
kind: Deployment
metadata:
  name: day-of-dashboard
spec:
  replicas: 3  # Multiple replicas for wedding day
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime
  template:
    spec:
      containers:
      - name: app
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### Performance Targets
- **Initial Load**: <1s on 4G network
- **Update Latency**: <100ms for status changes  
- **Offline Sync**: <5s for full sync
- **Battery Usage**: <5% per hour on mobile

### Monitoring & Alerts

```typescript
// Monitoring configuration
const DayOfMonitoring = {
  alerts: [
    {
      name: 'Timeline Delay',
      condition: 'timeline_delay_minutes > 30',
      severity: 'warning',
      notify: ['coordinator', 'couple']
    },
    {
      name: 'Vendor No-Show',
      condition: 'vendor_arrival_delay > 60',
      severity: 'critical',
      notify: ['coordinator', 'couple', 'backup_vendor']
    },
    {
      name: 'High Issue Count',
      condition: 'open_issues > 5',
      severity: 'warning',
      notify: ['coordinator']
    }
  ],
  
  metrics: [
    'timeline_accuracy',
    'vendor_punctuality',
    'guest_arrival_rate',
    'issue_resolution_time',
    'system_response_time',
    'websocket_connections',
    'offline_sync_success_rate'
  ]
};
```

---

## Implementation Timeline

### Week 1-2: Backend Infrastructure
- Database schema and migrations
- Core service layer implementation
- REST API endpoints
- WebSocket server setup

### Week 3-4: Core Dashboard
- Timeline management UI
- Vendor coordination interface
- Basic real-time updates
- Mobile responsive design

### Week 5-6: Advanced Features
- Guest management system
- Issue tracking and resolution
- Emergency protocols
- Offline capability

### Week 7-8: Polish & Testing
- Role-based access control
- Performance optimization
- Comprehensive testing
- Load testing for wedding day

This Day-of Wedding Dashboard will transform the most stressful day into a well-orchestrated celebration, providing peace of mind through real-time coordination and comprehensive oversight of all wedding day activities.