# Wedding Planner Dashboard Design

## Overview

The new wedding dashboard provides a comprehensive, at-a-glance view of all critical wedding planning information. It follows the burgundy (#6b140e) and white color scheme established in the landing page, with a clean, modern design that prioritizes essential information.

## Design Principles

1. **Information Hierarchy**: Most critical information (countdown, budget, RSVPs) is prominently displayed
2. **Visual Consistency**: Uses the same burgundy color palette and typography as the landing page
3. **Actionable Insights**: Every metric links to relevant actions
4. **Mobile Responsive**: Fully responsive grid layout that works on all devices
5. **Real-time Updates**: Connected to live API data for accurate information

## Dashboard Components

### 1. Welcome Section with Countdown
- **Purpose**: Immediate wedding date awareness and personal greeting
- **Design**: Burgundy gradient background matching brand colors
- **Features**:
  - Personalized welcome message
  - Large countdown showing days remaining
  - Wedding date display
  - Motivational message

### 2. Key Metrics Grid (4 Cards)
Essential information displayed in a scannable card format:

#### Budget Card
- Current spend vs. total budget
- Visual progress bar
- Percentage used and amount remaining
- Quick link to budget management

#### Guest Card
- Confirmed vs. total invited ratio
- Pending RSVPs badge
- Declined count (if any)
- Link to guest management

#### Vendor Card
- Booked vs. total vendors
- Visual confirmation indicator
- Pending confirmations count
- Link to vendor directory

#### Overall Progress Card
- Percentage of tasks completed
- Visual progress bar
- Task completion ratio
- Link to full checklist

### 3. Main Content Area (2/3 width)

#### This Week's Tasks
- **Purpose**: Keep planning on track with immediate priorities
- **Features**:
  - Color-coded status indicators (green/yellow/red)
  - Due dates for each task
  - Overdue items highlighted with badge
  - Quick link to full checklist
  - Hover effects for better interaction

#### Upcoming Payments
- **Purpose**: Financial deadline awareness
- **Features**:
  - Vendor name and payment amount
  - Due date with days remaining
  - Sorted by urgency
  - Link to payment management
  - Clean table-like layout

### 4. Right Sidebar (1/3 width)

#### Quick Actions
- **Purpose**: One-click access to common tasks
- **Actions**:
  - Send RSVP reminders
  - Contact vendors
  - Upload photos
  - Add expense
- **Design**: Full-width buttons with icons

#### Wedding Details
- **Purpose**: Quick reference for key details
- **Features**:
  - Venue name
  - Wedding theme
  - Color palette (visual swatches)
  - Edit link to settings
- **Design**: Soft gradient background to stand out

#### Recent Activity
- **Purpose**: Stay informed of latest updates
- **Features**:
  - Color-coded activity dots by type
  - Relative timestamps
  - 5 most recent activities
  - Auto-updates from API

## Technical Implementation

### Data Structure
```typescript
interface DashboardStats {
  // Wedding Info
  daysUntilWedding: number | null
  weddingDate: string | null
  venue: string | null
  
  // Budget
  totalBudget: number
  totalSpent: number
  budgetRemaining: number
  budgetUsedPercentage: number
  
  // Guests
  guestStats: {
    total: number
    confirmed: number
    pending: number
    declined: number
    needsRsvp: number
  }
  
  // Vendors
  vendorStats: {
    total: number
    booked: number
    pending: number
    contacted: number
    potential: number
  }
  
  // Tasks
  taskStats: {
    total: number
    completed: number
    thisWeek: number
    overdue: number
  }
  
  // Photos
  photoStats: {
    total: number
    withAlbums: number
    recent: number
  }
  
  // Payments
  upcomingPayments: Array<{
    vendor: string
    amount: number
    dueDate: string
    daysUntil: number
  }>
  
  // Activity
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}
```

### API Endpoint
- **Route**: `/api/dashboard/stats`
- **Method**: GET
- **Authentication**: Required (uses withAuth middleware)
- **Response**: Complete dashboard statistics
- **Performance**: Single API call loads entire dashboard

### Responsive Breakpoints
- **Mobile (<768px)**: Single column layout
- **Tablet (768px-1024px)**: 2 column grid
- **Desktop (>1024px)**: 3 column layout with sidebar

## Color Palette

- **Primary**: #6b140e (Burgundy)
- **Primary Dark**: #5a0f09
- **Background**: #f9fafb (Light gray)
- **Card Background**: White
- **Text Primary**: #111827 (Gray 900)
- **Text Secondary**: #6b7280 (Gray 500)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Yellow)
- **Error**: #ef4444 (Red)

## Future Enhancements

1. **Weather Widget**: For outdoor weddings
2. **Inspiration Board**: Quick access to saved ideas
3. **Communication Center**: Unread vendor messages
4. **Budget Alerts**: Smart notifications for overspending
5. **Timeline View**: Visual timeline of upcoming milestones
6. **Vendor Ratings**: Quick rate/review completed vendors
7. **Guest Seating**: Progress on table assignments
8. **Document Status**: Missing contracts or papers

## Benefits Over Previous Dashboard

1. **Information Density**: 10x more information in same space
2. **Visual Hierarchy**: Critical info immediately visible
3. **Actionable Design**: Every element links to actions
4. **Brand Consistency**: Matches landing page aesthetics
5. **Performance**: Single API call vs. multiple requests
6. **Mobile First**: Fully responsive from ground up

## Implementation Notes

- Uses real-time data from database
- Graceful loading states
- Error boundaries for resilience
- Accessible with ARIA labels
- Keyboard navigation support
- Print-friendly layout option