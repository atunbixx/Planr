# Wedding Planner Database Audit Report

## 🔍 **Comprehensive Analysis of Missing Database Tables & Elements**

Based on systematic analysis of the codebase, here are all the missing database tables and elements that need to be created:

---

## ✅ **EXISTING TABLES** (Already Created)
1. **couples** → **wedding_couples** (renamed)
2. **guests** → **wedding_guests** (renamed)  
3. **couple_vendors**
4. **budget_categories**
5. **budget_expenses**
6. **tasks**
7. **timeline_items**
8. **activity_feed**
9. **messages**
10. **seating_tables**
11. **seating_assignments**
12. **vendor_availability**
13. **vendor_date_overrides**
14. **vendor_appointments**

---

## ❌ **MISSING TABLES** (Need to be Created)

### 1. **photos** Table
**Referenced in:** `src/components/photos/PhotoUpload.tsx`, `src/components/photos/PhotoGallery.tsx`
```sql
CREATE TABLE photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  original_filename text,
  file_size integer,
  mime_type text,
  storage_path text NOT NULL,
  url text,
  caption text,
  tags text[],
  is_favorite boolean DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

### 2. **vendors** Table (Master Vendor Directory)
**Referenced in:** `src/hooks/useVendors.ts`, `supabase/migrations/20250801112000_create_vendor_availability.sql`
```sql
CREATE TABLE vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  category text NOT NULL,
  description text,
  website text,
  address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  service_radius_miles integer DEFAULT 50,
  average_rating decimal(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

### 3. **budget_items** Table
**Referenced in:** `src/components/budget/BudgetAnalytics.tsx`
```sql
CREATE TABLE budget_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  estimated_cost decimal(10,2),
  actual_cost decimal(10,2),
  paid_amount decimal(10,2) DEFAULT 0,
  vendor_id uuid REFERENCES couple_vendors(id) ON DELETE SET NULL,
  due_date date,
  paid_date date,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

---

## 🔧 **TABLE NAME INCONSISTENCIES** (Need Fixing)

### Current Issues:
1. **Code references `couples`** but **database has `wedding_couples`**
2. **Code references `wedding_guests`** but **some places use `guests`**

### Files with Inconsistent References:
- `src/lib/supabase.ts` - uses `couples` (should be `wedding_couples`)
- `debug-login-flow.js` - uses `couples` (should be `wedding_couples`)
- `src/app/auth/signin/page.tsx` - uses `couples` (should be `wedding_couples`)

---

## 🚨 **CRITICAL MISSING ELEMENTS**

### 1. **Row Level Security (RLS) Policies Missing**
These tables need RLS policies:
- `photos`
- `vendors` 
- `budget_items`

### 2. **Indexes Missing**
Performance indexes needed for:
- `photos` table (couple_id, created_at, tags)
- `vendors` table (category, city, verified)
- `budget_items` table (couple_id, category_id, due_date)

### 3. **Storage Bucket Policies**
The `wedding-photos` storage bucket exists but may need additional policies for:
- File size limits
- File type restrictions
- User-specific folder access

---

## 📋 **REQUIRED MIGRATIONS TO CREATE**

### Migration 1: Create Missing Core Tables
```sql
-- Create photos table
-- Create vendors table  
-- Create budget_items table
```

### Migration 2: Fix Table Name References
```sql
-- Update all code references from 'couples' to 'wedding_couples'
-- Ensure consistent naming across codebase
```

### Migration 3: Add Missing RLS Policies
```sql
-- Add RLS policies for photos, vendors, budget_items
-- Add proper security constraints
```

### Migration 4: Add Performance Indexes
```sql
-- Add indexes for better query performance
-- Add foreign key constraints where missing
```

---

## 🎯 **IMMEDIATE ACTION ITEMS**

### High Priority:
1. **Create `photos` table** - Photo upload is completely broken
2. **Create `vendors` table** - Vendor availability system references this
3. **Fix table name inconsistencies** - Multiple pages failing due to wrong table names

### Medium Priority:
4. **Create `budget_items` table** - Budget analytics needs this
5. **Add missing RLS policies** - Security requirement
6. **Add performance indexes** - Query optimization

### Low Priority:
7. **Storage bucket policy refinements** - Enhanced security
8. **Add missing foreign key constraints** - Data integrity

---

## 🔍 **AFFECTED PAGES/FEATURES**

### Completely Broken:
- `/dashboard/photos` - Missing `photos` table
- `/dashboard/vendors` - References missing `vendors` table
- Budget analytics - Missing `budget_items` table

### Partially Broken:
- Authentication flow - Wrong table name (`couples` vs `wedding_couples`)
- Guest management - Inconsistent table naming
- Vendor appointments - Missing master `vendors` table

### Working:
- Dashboard main page ✅
- Tasks management ✅
- Timeline management ✅
- Seating chart ✅

---

## 📊 **SUMMARY STATISTICS**

- **Total Tables Needed:** 17
- **Currently Existing:** 14
- **Missing:** 3 critical tables
- **Name Inconsistencies:** 2 tables
- **Broken Features:** 3 major features
- **Security Issues:** 3 tables without RLS

**Estimated Fix Time:** 2-3 hours to create all missing elements and fix inconsistencies.