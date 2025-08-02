# Wedding Planner Settings Page Design

## Overview
A comprehensive settings page following the New York Magazine-inspired editorial design system with sophisticated typography, clean layouts, and thoughtful user experience.

## Design System Integration

### Typography
- **Headers**: Playfair Display serif font for elegance
- **Body**: Inter sans-serif for readability
- **Uppercase labels**: Letter-spacing for sophistication

### Color Palette
- **Primary**: Black (#0A0A0A) for main actions and active states
- **Paper**: White (#FFFFFF) backgrounds
- **Accent**: Red (#FF3366) for focus states
- **Gray Scale**: Various grays for subtle UI elements
- **Wedding Themes**: 
  - Blush (#F8F0F0)
  - Sage (#9CAF88)
  - Cream (#FDF6E3)
  - Navy (#1E3A8A)

### Component Styling
- **Cards**: Clean white cards with subtle shadows and borders
- **Inputs**: Rounded borders with black focus states
- **Buttons**: Black primary buttons with uppercase text
- **Toggle Switches**: Custom styled with smooth transitions

## Page Structure

### Header
- Back arrow navigation to dashboard
- Page title "Settings" in Playfair Display
- Global "Save Changes" button

### Tab Navigation
- Sticky tab bar for easy navigation
- Six main sections with icons:
  1. Profile
  2. Account
  3. Notifications
  4. Theme
  5. Privacy
  6. Integrations

## Section Details

### 1. Profile Tab
**Personal Information Card**
- Full Name (editable)
- Email Address (read-only)
- Wedding Date (date picker)

**Wedding Details Card**
- Partner's Name
- Venue
- Expected Guest Count

**Profile Photo Card**
- Avatar upload functionality
- File type and size restrictions

### 2. Account Tab
**Password Card**
- Current password field
- New password field
- Confirm password field
- Update button

**Two-Factor Authentication Card**
- SMS authentication toggle
- Status display

**Danger Zone Card**
- Red-themed warning design
- Account deletion option

### 3. Notifications Tab
**Email Notifications Card**
- Toggle switches for:
  - General updates
  - Task reminders
  - Vendor messages
  - Guest RSVP alerts
  - Budget alerts

**Email Frequency Card**
- Daily digest toggle
- Weekly report toggle

### 4. Theme Tab
**Color Scheme Card**
- Visual color palette selector
- Four wedding theme options
- Active state with black border

**Display Preferences Card**
- Font size dropdown (Small/Medium/Large)
- Compact mode toggle

### 5. Privacy Tab
**Privacy Settings Card**
- Profile visibility dropdown
- Share with vendors toggle
- Guest photo uploads toggle

**Data Management Card**
- Export data button
- Data retention information

### 6. Integrations Tab
**Connected Services Card**
- Google Calendar
- Instagram
- Pinterest
- Dropbox
- Each with connect/disconnect buttons

**API Access Card**
- API key display (masked)
- Show/Copy functionality
- Documentation link

## Mobile Responsiveness

### Breakpoints
- **Mobile**: Single column layout
- **Tablet**: 2-column grid where applicable
- **Desktop**: Full layout with sidebars

### Mobile Optimizations
- Horizontal scroll for tab navigation
- Stacked cards on small screens
- Touch-friendly toggle switches
- Appropriately sized tap targets

## Interactive Elements

### Form Validation
- Real-time validation feedback
- Error states with red borders
- Success messages via toast notifications

### State Management
- Local state for form data
- Async updates to Supabase
- Loading states during save operations

### Accessibility
- Proper label associations
- Screen reader friendly toggle switches
- Keyboard navigation support
- Focus states for all interactive elements

## Technical Implementation

### Dependencies
- React hooks for state management
- Supabase for data persistence
- Custom UI components following design system
- Toast notifications for user feedback

### Performance Considerations
- Lazy loading for heavy components
- Debounced form updates
- Optimistic UI updates

## Future Enhancements
1. Profile photo cropping tool
2. Theme preview before applying
3. Bulk notification settings
4. OAuth integration setup
5. Advanced privacy controls
6. Webhook configuration for API