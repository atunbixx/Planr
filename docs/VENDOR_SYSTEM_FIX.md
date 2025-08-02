# Vendor Management System Fix Documentation

## Problem Summary
The vendor management system was broken because:
1. The `couple_vendors` table was missing required columns that the application code expected
2. The vendor detail page was trying to query a non-existent `vendors` table
3. Missing database views and helper functions for vendor operations

## Solution Implemented

### 1. Database Schema Fix
Created migration `20250802070000_fix_vendor_schema.sql` that adds missing columns:
- `country` - Default 'US'
- `actual_cost` - Track actual vs estimated costs
- `deposit_amount`, `deposit_paid` - Deposit tracking
- `contract_signed`, `insurance_verified`, `availability_confirmed` - Status flags
- `rating`, `average_rating` - Vendor ratings
- `service_radius_miles`, `booking_lead_time_days` - Service details
- `requires_deposit`, `deposit_percentage` - Payment terms
- Performance metrics fields

### 2. Database Views and Functions
Created migration `20250802071000_vendor_views_and_policies.sql` that adds:

#### Views:
- `vendors` - Backward compatibility view mapping to `couple_vendors`
- `vendor_details` - Detailed vendor info with calculated fields
- `vendor_statistics` - Aggregated statistics by couple
- `vendors_by_category` - Vendors grouped by category

#### Functions:
- `get_vendor_recommendations()` - Suggests missing essential vendors
- `get_vendor_budget_summary()` - Calculates budget totals
- `search_vendors()` - Advanced search with filters

### 3. Code Updates
- Fixed vendor detail page to use `couple_vendors` table
- Vendor hook already correctly uses `couple_vendors`
- Vendor listing page works correctly

### 4. Sample Data
Created `seed_vendors.sql` with 15 sample vendors across categories:
- Venues (2)
- Catering (2)
- Photography (2)
- Videography (1)
- Florist (2)
- Music/DJ (1)
- Band (1)
- Beauty (1)
- Cake (1)
- Transportation (1)
- Wedding Planner (1)

## Installation Instructions

### Option 1: Using the Fix Script (Recommended)
```bash
# Make the script executable
chmod +x scripts/fix-vendor-schema.sh

# Run the fix script
./scripts/fix-vendor-schema.sh
```

### Option 2: Manual Migration
```bash
# Run migrations manually
psql "$DATABASE_URL" -f supabase/migrations/20250802070000_fix_vendor_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20250802071000_vendor_views_and_policies.sql
psql "$DATABASE_URL" -f supabase/seed_vendors.sql
```

### Option 3: Using Supabase CLI
```bash
# If using Supabase CLI
supabase db push
supabase db seed -f supabase/seed_vendors.sql
```

## Testing the Fix

### Quick Test
```bash
# Run the test script
node scripts/test-vendor-system.js
```

### Manual Testing
1. Start the development server: `npm run dev`
2. Navigate to `/dashboard/vendors`
3. You should see:
   - Vendor statistics cards
   - List of sample vendors (if seed data was loaded)
   - "Add Vendor" button
4. Try adding a new vendor
5. Click on a vendor to see detail page
6. Test the messaging feature

## Features Working After Fix

### Vendor Management
- ✅ List all vendors with filtering
- ✅ Add new vendors with full form
- ✅ View vendor details
- ✅ Edit vendor information
- ✅ Delete vendors
- ✅ Search vendors by name/business/contact
- ✅ Filter by category and status

### Vendor Details
- ✅ Contact information display
- ✅ Financial tracking (estimated/actual costs)
- ✅ Deposit management
- ✅ Contract status tracking
- ✅ Rating system
- ✅ Notes and referral tracking

### Statistics and Reports
- ✅ Total vendor count
- ✅ Booked vendor count
- ✅ Total estimated costs
- ✅ Average ratings
- ✅ Category breakdown

### Integration Features
- ✅ Messaging system ready
- ✅ Calendar integration prepared
- ✅ Contract management prepared
- ✅ Activity feed logging

## Database Schema

### couple_vendors Table
```sql
- id (UUID, Primary Key)
- couple_id (UUID, Foreign Key)
- name (VARCHAR, Required)
- business_name (VARCHAR)
- category (vendor_category enum)
- status (vendor_status enum)
- Contact fields (email, phone, website, contact_person)
- Location fields (address, city, state, zip_code, country)
- Financial fields (estimated_cost, actual_cost, deposit_amount, etc.)
- Status flags (contract_signed, deposit_paid, etc.)
- Performance metrics (rating, total_bookings, etc.)
- Timestamps (created_at, updated_at)
```

### Vendor Categories
- venue, catering, photography, videography, florist
- music_dj, band, transportation, beauty, attire
- jewelry, invitations, decoration, lighting, rentals
- officiant, planner, cake, entertainment, security
- insurance, other

### Vendor Statuses
- researching, contacted, meeting_scheduled
- proposal_received, quoted, booked
- confirmed, cancelled

## Troubleshooting

### Common Issues

1. **"relation couple_vendors does not exist"**
   - Run the initial migration first
   - Check if you're connected to the right database

2. **"permission denied for table couple_vendors"**
   - Check RLS policies are enabled
   - Ensure user is authenticated
   - Verify couple profile exists

3. **"enum type vendor_category does not exist"**
   - Run the initial wedding schema migration
   - These enums are created in `20250730230127_initial_wedding_schema.sql`

4. **No vendors showing up**
   - Check if seed data was loaded
   - Verify you have a couple profile
   - Check browser console for errors

### Debug Commands
```bash
# Check if table exists
psql "$DATABASE_URL" -c "\dt couple_vendors"

# Check enum types
psql "$DATABASE_URL" -c "\dT vendor_*"

# Count vendors
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM couple_vendors;"

# Check RLS policies
psql "$DATABASE_URL" -c "SELECT * FROM pg_policies WHERE tablename = 'couple_vendors';"
```

## Future Enhancements

### Planned Features
1. **Vendor Reviews**: Full review system with photos
2. **Document Management**: Upload and store contracts
3. **Payment Tracking**: Track all payments and invoices
4. **Vendor Marketplace**: Browse and discover new vendors
5. **Automated Reminders**: Payment and meeting reminders
6. **Vendor Analytics**: Performance and cost analysis

### API Endpoints Ready
- `/api/vendors` - CRUD operations
- `/api/vendors/[id]/messages` - Messaging
- `/api/vendors/[id]/appointments` - Scheduling
- `/api/vendors/[id]/contracts` - Contract management

## Security Considerations

### RLS Policies
All vendor data is protected by Row Level Security:
- Users can only see vendors for their couple
- Both partners have full access to vendor data
- Vendor data is isolated between couples

### Data Privacy
- No vendor data is shared between couples
- Sensitive financial information is protected
- Contact information is only visible to the couple

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database migrations ran successfully
3. Ensure you're logged in with a valid couple profile
4. Check the Supabase logs for database errors

For additional help, refer to:
- Supabase documentation
- Next.js documentation
- Project README.md