# RSVP and Messaging System Migration

**Migration ID:** `20250824_000000_rsvp_messaging_system`  
**Date:** 2025-08-24  
**Purpose:** Add RSVP system and messaging credits functionality to support Planr v1.0

## Overview

This migration adds the core database schema for:
- **RSVP System**: Invite management and guest responses
- **Messaging Credits**: Country-aware pricing for email/SMS/WhatsApp
- **Vendor Public Pages**: Slug field for SEO-friendly vendor URLs

## Schema Changes

### New Tables

1. **`invites`** - Invitation management
   - Links to users (couples)
   - Unique tokens for secure RSVP links
   - Country codes for pricing

2. **`invite_rsvps`** - Guest responses
   - Links to invites and users
   - Status tracking (pending/accepted/declined)
   - Party size and notes
   - Unique constraint on user+email for idempotency

3. **`credit_balances`** - Messaging credits
   - Per-user credit balance
   - Atomic operations support

### Modified Tables

1. **`vendors`** - Added `slug` field
   - Unique slugs for public vendor pages
   - Supports SSR/ISR implementation

### New Indexes

- `invites_user_idx` - Fast user lookup
- `invites_token_idx` - Fast token validation
- `invite_rsvps_user_idx` - Fast user RSVP lookup
- `invite_rsvps_invite_idx` - Fast invite RSVP lookup
- `vendors_slug_idx` - Fast vendor slug lookup

## Migration Files

- `migration.sql` - Forward migration
- `rollback.sql` - Rollback script (⚠️ destructive)
- `validate.js` - Validation script
- `README.md` - This documentation

## Running the Migration

### Prerequisites
```bash
# Ensure database is accessible
npm run db:status

# Backup database (recommended)
pg_dump $DATABASE_URL > backup_pre_rsvp_migration.sql
```

### Apply Migration
```bash
# Apply the migration
npx prisma migrate deploy

# Generate new Prisma client
npx prisma generate

# Validate migration
node prisma/migrations/20250824_000000_rsvp_messaging_system/validate.js

# Seed test data
npm run seed
```

### Rollback (if needed)
```bash
# ⚠️ WARNING: This will delete all RSVP and messaging data
psql $DATABASE_URL -f prisma/migrations/20250824_000000_rsvp_messaging_system/rollback.sql

# Regenerate client for old schema
npx prisma generate
```

## Testing

### Validation Script
```bash
node prisma/migrations/20250824_000000_rsvp_messaging_system/validate.js
```

### Manual Testing
```sql
-- Test invite creation
INSERT INTO invites (user_id, email, token, country) 
VALUES ('user-uuid', 'test@example.com', 'test-token-123', 'NG');

-- Test RSVP creation
INSERT INTO invite_rsvps (user_id, invite_id, email, status, party_size) 
VALUES ('user-uuid', 'invite-uuid', 'test@example.com', 'accepted', 2);

-- Test credit balance
INSERT INTO credit_balances (user_id, credits) 
VALUES ('user-uuid', 100);

-- Test vendor slug
UPDATE vendors SET slug = 'test-vendor-slug' WHERE id = 'vendor-uuid';
```

## Performance Considerations

### New Indexes
- All foreign keys are indexed for fast joins
- Token lookups are optimized for RSVP page loads
- User-based queries are optimized for dashboard views

### Expected Query Patterns
- Frequent: RSVP lookups by token
- Frequent: Credit balance checks
- Moderate: Vendor lookups by slug
- Infrequent: RSVP statistics aggregation

## Security Considerations

### Data Protection
- All tables use CASCADE deletes to maintain referential integrity
- Invite tokens should be cryptographically secure (handled in application)
- Email addresses are stored but should be masked in logs

### Access Patterns
- RSVP endpoints are public (token-based auth)
- Credit operations require user authentication
- Vendor pages are public (read-only)

## Monitoring

### Key Metrics to Track
- RSVP submission rate and errors
- Credit balance operations and failures
- Vendor page load performance
- Database query performance on new indexes

### Alerts to Set Up
- Failed RSVP submissions
- Credit balance going negative (should be impossible)
- Slow vendor slug lookups
- High error rates on new endpoints

## Compatibility

### Breaking Changes
- None - this is purely additive

### Application Updates Required
- New Prisma client generation
- New API endpoints for RSVP and messaging
- New pages for vendor public views and RSVP forms

### Environment Variables
Add to `.env`:
```
DEFAULT_REVALIDATE_SECONDS=900
RESEND_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
```

## Troubleshooting

### Common Issues

1. **Migration fails with "relation already exists"**
   - Check if tables were created manually
   - Run rollback and retry

2. **Prisma client errors after migration**
   - Run `npx prisma generate`
   - Restart application

3. **Foreign key constraint errors**
   - Ensure referenced users exist
   - Check UUID format consistency

4. **Unique constraint violations**
   - Check for duplicate tokens or user+email combinations
   - Clean up test data

### Recovery Steps

1. **If migration partially fails:**
   ```bash
   # Check which tables exist
   \dt invite*
   
   # Run rollback
   psql $DATABASE_URL -f rollback.sql
   
   # Fix issues and retry
   npx prisma migrate deploy
   ```

2. **If data corruption occurs:**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_pre_rsvp_migration.sql
   
   # Investigate and fix root cause
   # Retry migration
   ```

## Next Steps

After successful migration:

1. ✅ Implement repository layer (Task 2)
2. ✅ Implement service layer (Task 4-5)
3. ✅ Create API endpoints (Task 7-8)
4. ✅ Build user interfaces (Task 9-11)

## Support

For issues with this migration:
- Check validation script output
- Review application logs
- Consult database query performance
- Contact development team with specific error messages