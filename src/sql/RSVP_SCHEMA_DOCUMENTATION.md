# RSVP Database Schema Documentation

## Overview
This document outlines the comprehensive RSVP database schema designed for the wedding planner application. The schema provides robust tracking, security, and analytics capabilities for managing RSVPs.

## Core Tables

### 1. **rsvp_sessions** (21-rsvp-sessions.sql)
Tracks all RSVP access attempts and sessions for security and analytics.

**Key Features:**
- Session tracking with unique tokens
- IP address and user agent logging
- Device type detection
- Access status tracking (success, invalid_code, expired, blocked)
- Geographic location data
- Suspicious activity flagging

**Key Functions:**
- `track_rsvp_access()` - Logs RSVP access attempts
- `get_rsvp_session_analytics()` - Provides session analytics

### 2. **rsvp_responses** (22-rsvp-responses.sql)
Stores detailed RSVP response history with versioning support.

**Key Features:**
- Response versioning for tracking changes
- Attendance status tracking
- Meal preferences and dietary restrictions
- Plus-one details
- Transportation and accommodation needs
- Communication preferences
- Response method tracking (online, phone, mail, etc.)

**Key Functions:**
- `submit_rsvp_response()` - Handles RSVP submissions
- `get_rsvp_history()` - Returns response history for a guest
- `get_rsvp_summary()` - Provides RSVP statistics

### 3. **plus_one_guests** (23-plus-one-management.sql)
Enhanced tracking for guest plus-ones with detailed information.

**Key Features:**
- Separate records for plus-one guests
- Relationship tracking
- Child guest support
- Individual meal preferences
- Table assignments

**Related Tables:**
- `plus_one_rules` - Manages plus-one policies

**Key Functions:**
- `upsert_plus_one_guest()` - Add or update plus-one information
- `get_plus_one_statistics()` - Plus-one analytics
- `check_plus_one_eligibility()` - Validates plus-one eligibility

### 4. **rsvp_meal_selections** (24-rsvp-meal-enhancements.sql)
Advanced meal tracking with course-by-course selections.

**Key Features:**
- Multiple course selections
- Comprehensive dietary flags
- Allergy tracking
- Beverage preferences
- Special dietary needs
- Portion and texture modifications

**Related Tables:**
- `meal_service_schedule` - Service timing and locations

**Key Functions:**
- `save_meal_selections()` - Stores meal choices
- `get_meal_selection_report()` - Comprehensive meal reporting

### 5. **rsvp_security_audit** (25-rsvp-security-audit.sql)
Comprehensive security event tracking and threat detection.

**Key Features:**
- Security event logging
- Threat scoring
- IP blocking capabilities
- Rate limiting
- Geographic anomaly detection
- Multiple security event types

**Related Tables:**
- `rsvp_ip_blocklist` - Manages blocked IPs
- `rsvp_rate_limits` - Rate limiting tracking

**Key Functions:**
- `log_security_event()` - Records security events
- `check_and_block_ip()` - Automatic IP blocking
- `check_rate_limit()` - Rate limit enforcement
- `get_security_dashboard()` - Security metrics

### 6. **wedding_guests enhancements** (27-wedding-guests-rsvp-enhancements.sql)
Additional columns for comprehensive RSVP tracking.

**New Columns:**
- Communication preferences
- Transportation needs
- Accommodation requirements
- Event-specific attendance (rehearsal, ceremony, reception)
- Guest priority levels
- Special needs tracking

**Key Functions:**
- `update_guest_rsvp_details()` - Updates guest RSVP information
- `increment_rsvp_reminder()` - Tracks reminder communications
- `get_guests_by_event_attendance()` - Filters guests by event
- `get_accommodation_summary()` - Accommodation analytics
- `get_transportation_summary()` - Transportation needs

## Dashboard Views (26-rsvp-dashboard-views.sql)

### Main Views:
1. **rsvp_dashboard** - Comprehensive RSVP statistics
2. **rsvp_response_timeline** - Response tracking over time
3. **rsvp_table_summary** - Table assignment overview
4. **rsvp_pending_reminders** - Outstanding RSVP tracking
5. **rsvp_meal_course_summary** - Meal selection by course
6. **rsvp_dietary_summary** - Dietary restriction overview

### Key Analytics Functions:
- `get_rsvp_analytics_by_period()` - Time-based analytics
- `get_guest_communication_summary()` - Communication preferences
- `get_rsvp_reminder_list()` - Reminder prioritization

## Security Features

### Access Control:
- Row Level Security (RLS) on all tables
- Couple-based data isolation
- Public access for RSVP submissions with security controls

### Threat Detection:
- IP-based rate limiting
- Geographic anomaly detection
- Device fingerprinting
- Suspicious pattern recognition
- Automatic blocking mechanisms

### Audit Trail:
- Complete session logging
- Security event tracking
- Response versioning
- IP and user agent logging

## Performance Optimizations

### Indexes:
- Strategic indexes on foreign keys
- Composite indexes for dashboard queries
- Specialized indexes for search operations

### Views:
- Pre-aggregated dashboard views
- Optimized summary statistics
- Efficient timeline queries

## Integration Points

### With Existing Tables:
- `couples` - Multi-tenant isolation
- `wedding_guests` - Core guest data
- `meal_options` - Meal selection choices
- `activity_feed` - Activity logging

### API Integration:
- Session-based access control
- Rate-limited endpoints
- Security event logging
- Analytics data access

## Usage Patterns

### Guest RSVP Flow:
1. Access via invite code → `track_rsvp_access()`
2. Submit response → `submit_rsvp_response()`
3. Add plus-ones → `upsert_plus_one_guest()`
4. Select meals → `save_meal_selections()`

### Admin Dashboard:
1. View statistics → `rsvp_dashboard` view
2. Send reminders → `get_rsvp_reminder_list()`
3. Monitor security → `get_security_dashboard()`
4. Generate reports → Various summary functions

## Migration Order

Execute migrations in this order:
1. 21-rsvp-sessions.sql
2. 22-rsvp-responses.sql
3. 23-plus-one-management.sql
4. 24-rsvp-meal-enhancements.sql
5. 25-rsvp-security-audit.sql
6. 26-rsvp-dashboard-views.sql
7. 27-wedding-guests-rsvp-enhancements.sql

## Best Practices

1. **Security**: Always validate invite codes through `track_rsvp_access()`
2. **Rate Limiting**: Implement rate limiting on all public endpoints
3. **Audit Trail**: Log all significant events to security audit
4. **Data Integrity**: Use transactions for multi-table updates
5. **Performance**: Utilize dashboard views for analytics queries