# Vendor Database Cleanup Plan

## Current Status
✅ **Vendor form is now working** - Fixed by providing all required database fields
✅ **Form only uses essential fields** - 15 form fields vs 30+ database fields  

## Database Fields Analysis

### **Form Fields (Keep These)**
- ✅ `id`, `couple_id`, `created_at`, `updated_at` (system)
- ✅ `name` (required)
- ✅ `business_name`, `category`, `status` (core)
- ✅ `email`, `phone`, `website`, `contact_person` (contact)
- ✅ `address`, `city`, `state`, `zip_code` (location)
- ✅ `estimated_cost` (financial)
- ✅ `notes`, `referral_source` (notes)

**Total: 17 fields**

### **Database-Only Fields (Remove These)**
- ❌ `country` (always 'US', not on form)
- ❌ `actual_cost`, `deposit_amount`, `deposit_due_date`, `final_payment_due` (not on form)
- ❌ `deposit_paid`, `contract_signed`, `insurance_verified`, `availability_confirmed` (not on form)
- ❌ `rating`, `meeting_date`, `meeting_notes`, `proposal_details`, `contract_terms`, `cancellation_policy` (not on form)
- ❌ `service_radius_miles`, `booking_lead_time_days`, `requires_deposit`, `deposit_percentage` (not on form)
- ❌ `total_bookings`, `total_reviews`, `average_rating`, `response_rate`, `response_time_hours` (not on form)

**Total: 18 unused fields**

## Migration Plan

### Phase 1: ✅ COMPLETED - Fix Current Issues
- Fixed vendor creation by providing all required fields
- Vendor form now works with existing database

### Phase 2: Future Database Cleanup (Optional)
When Supabase is stable, run the migration to:
1. Drop unused columns from `couple_vendors` table
2. Regenerate TypeScript types
3. Simplify the vendor hook to only use form fields

## Benefits of Cleanup
- 🚀 **Simpler code** - No need to provide 18 unused fields
- 🎯 **Clearer intent** - Database matches actual functionality  
- ⚡ **Better performance** - Smaller table, fewer indexes
- 🔧 **Easier maintenance** - Less complex schema

## Current Solution
The vendor hook now explicitly provides all required fields with sensible defaults, so vendor creation works perfectly without needing to change the database schema immediately.