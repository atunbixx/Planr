# User Settings Database Schema

## Overview
The user settings system provides comprehensive preference management for the wedding planner application, including localization, themes, notifications, privacy, integrations, and more.

## Core Tables

### 1. `user_settings`
Main settings table storing user preferences.

**Key Features:**
- Localization settings (country, timezone, language, currency, date/time formats)
- Display preferences (theme, colors, fonts, animations)
- Notification preferences (email, push, SMS with granular control)
- Privacy settings (profile visibility, budget sharing, photo permissions)
- Wedding preferences (style, season, guest count estimate)
- Data export preferences (backup frequency, formats)
- Accessibility settings (high contrast, reduce motion, screen reader)
- Advanced settings (developer mode, beta features, analytics)

**Indexes:**
- `idx_user_settings_user` on user_id
- `idx_user_settings_couple` on couple_id
- `idx_user_settings_theme` on theme
- `idx_user_settings_language` on language

### 2. `region_defaults`
Pre-populated regional defaults for different countries.

**Features:**
- Country-specific date/time formats
- Default currencies and timezones
- Week start preferences
- Common languages and wedding traditions

**Pre-loaded Countries:** US, GB, CA, AU, FR, DE, ES, IT, JP, CN, IN, BR, MX, ZA, NG, KE, AE, SG, NZ, IE

### 3. `theme_definitions`
Available themes with color schemes.

**Built-in Themes:**
- `light` - Classic Light
- `dark` - Elegant Dark
- `rose` - Rose Garden
- `sage` - Sage Green
- `lavender` - Lavender Dreams
- `coral` - Coral Sunset

### 4. `notification_templates`
Multi-language notification templates for different channels.

**Channels:** email, push, SMS
**Types:** RSVP updates, payment reminders, task deadlines, vendor messages, etc.

### 5. `user_integration_settings`
Third-party service integrations.

**Integrations:**
- Calendar sync (Google, Outlook, Apple)
- Communication (Slack, Discord)
- Social media (Instagram, Pinterest)
- Email services (Mailchimp, SendGrid)
- Payment gateways (Stripe, PayPal)
- File storage (Dropbox, Google Drive)

### 6. `user_export_preferences`
Data export and privacy preferences.

**Features:**
- Granular control over what data to include in exports
- Privacy settings (anonymization, contact info exclusion)
- Format preferences per data type

### 7. `user_session_preferences`
UI state and temporary preferences.

**Features:**
- Dashboard layout and widget preferences
- View preferences (table/grid/card views)
- Persisted filters and sort orders
- Recent items and favorites
- Session activity tracking

### 8. `user_settings_audit`
Audit trail for all settings changes.

**Tracks:**
- All changes to settings tables
- Changed fields with old/new values
- User who made the change
- Timestamp and IP address

## Key Functions

### Initialization Functions
- `initialize_user_settings(user_id, country_code)` - Initialize basic settings
- `initialize_all_user_preferences(user_id, country_code)` - Initialize all preference tables

### Retrieval Functions
- `get_user_settings(user_id)` - Get settings with defaults
- `get_all_user_preferences(user_id)` - Get all preferences in one query
- `get_user_settings_for_api(user_id)` - Get formatted settings for API responses

### Utility Functions
- `update_session_activity(user_id)` - Update last active timestamp
- `cleanup_old_sessions(days)` - Remove old session data
- `validate_user_settings(user_id)` - Validate settings integrity
- `detect_user_region(ip_address)` - Placeholder for IP geolocation

## Views

### `v_user_complete_settings`
Comprehensive view joining all settings with user info, region defaults, and theme data.

### `v_user_notification_preferences`
Notification settings with available templates for the user's language.

### `v_user_integrations_summary`
Summary of all integrations grouped by type with counts.

### `v_user_session_state`
Current session state with activity status and recent items.

### `v_user_settings_summary`
Quick summary for dashboards and status checks.

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:
- Users can view/create/update their own settings
- Region defaults, themes, and templates are read-only for all authenticated users
- Audit logs are view-only for the user's own changes

## Triggers

- `update_user_settings_timestamp` - Auto-update last_updated on changes
- `audit_user_settings_changes` - Log all changes to audit table

## Usage Examples

### Initialize settings for a new user:
```sql
SELECT initialize_all_user_preferences('user-uuid', 'US');
```

### Get all settings for API:
```sql
SELECT get_user_settings_for_api('user-uuid');
```

### Update theme preference:
```sql
UPDATE user_settings 
SET theme = 'rose', accent_color = '#fda4af' 
WHERE user_id = 'user-uuid';
```

### Check user's integration status:
```sql
SELECT * FROM v_user_integrations_summary 
WHERE user_id = 'user-uuid';
```

### Validate settings:
```sql
SELECT validate_user_settings('user-uuid');
```

## Migration

Run the migrations in order:
1. `15-user-settings.sql` - Base tables
2. `18-user-settings-enhancements.sql` - Additional tables and triggers
3. `19-user-settings-views.sql` - Views and API functions
4. `20-user-settings-migration.sql` - Complete migration with validation

## Notes for Backend Implementation

1. **Auto-initialization**: Consider initializing settings automatically when a user signs up
2. **API Endpoints**: Use `get_user_settings_for_api()` for GET endpoints
3. **Partial Updates**: The schema supports updating individual preference groups
4. **Caching**: Session preferences can be cached aggressively
5. **Audit Trail**: All changes are automatically logged
6. **Localization**: Use region_defaults to provide smart defaults based on country
7. **Theme System**: Themes are extensible - new themes can be added to theme_definitions
8. **Integration Security**: Consider encrypting sensitive integration data (API keys, tokens)