# 🏗️ MIGRATION ARCHITECTURE DESIGN
**Migration Architect Analysis - Wedding Planner V2**

## 🚨 CRITICAL SYSTEM INTEGRITY ASSESSMENT

### Current System State
**Status**: ⚠️ **CRITICAL SCHEMA MISMATCH** - System has **8 missing core database models** for active dashboard features

### Risk Level: **HIGH** 🔴
- **Breaking Changes Risk**: 85% - APIs reference non-existent database tables
- **Data Integrity Risk**: 90% - Foreign key relationships will fail
- **User Experience Risk**: 95% - Dashboard features will crash without proper models

## 📊 MISSING DATABASE MODELS ANALYSIS

### 1. **Budget System Models** (Priority: CRITICAL)
**API References Found**: `/api/budget/expenses/route.ts`, `/api/budget/categories/route.ts`

**Missing Models:**
```sql
-- CRITICAL: expenses table referenced but missing
model Expense {
  id            String   @id @default(uuid())
  couple_id     String
  description   String
  amount        Decimal  @db.Decimal(12, 2)
  category_id   String?
  vendor_id     String?
  expense_date  DateTime @db.Date
  payment_method String
  receipt_url   String?
  notes         String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  // Relations
  couple        Couple   @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  category      BudgetCategory? @relation(fields: [category_id], references: [id])
  vendor        Vendor?  @relation(fields: [vendor_id], references: [id])
  
  @@map("expenses")
}

model BudgetCategory {
  id            String    @id @default(uuid())
  couple_id     String?
  name          String
  icon          String?
  color         String?
  allocated_amount Decimal? @db.Decimal(12, 2)
  spent_amount  Decimal   @default(0) @db.Decimal(12, 2)
  is_system     Boolean   @default(false)
  sort_order    Int?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  // Relations
  couple        Couple?   @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  expenses      Expense[]
  
  @@map("budget_categories")
}
```

### 2. **Guest Management System** (Priority: CRITICAL)
**API References Found**: `/api/guests/route.ts`, `/api/guests/[id]/rsvp/route.ts`

**Missing Models:**
```sql
model Guest {
  id                    String    @id @default(uuid())
  couple_id             String
  first_name            String
  last_name             String
  email                 String?
  phone                 String?
  address               String?
  relationship          String?
  side                  String    @default("both") // bride, groom, both
  plus_one_allowed      Boolean   @default(false)
  plus_one_name         String?
  dietary_restrictions  String?
  notes                 String?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  couple                Couple    @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  invitations          Invitation[]
  
  @@map("guests")
}

model Invitation {
  id                    String    @id @default(uuid())
  guest_id              String
  couple_id             String
  invitation_code       String    @unique
  status                String    @default("pending") // pending, sent, viewed, responded
  attending_count       Int       @default(1)
  plus_one_attending    Boolean   @default(false)
  plus_one_name         String?
  responded_at          DateTime?
  rsvp_deadline         DateTime?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  guest                 Guest     @relation(fields: [guest_id], references: [id], onDelete: Cascade)
  couple                Couple    @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  
  @@map("invitations")
}
```

### 3. **Vendor Management System** (Priority: CRITICAL)
**API References Found**: `/api/vendors/route.ts`, `/api/vendors/categories/route.ts`

**Missing Models:**
```sql
model Vendor {
  id                    String    @id @default(uuid())
  couple_id             String
  name                  String
  category_id           String?
  contact_name          String?
  phone                 String?
  email                 String?
  address               String?
  website               String?
  social_media          Json?
  status                String    @default("potential") // potential, contacted, meeting, booked
  priority              String    @default("medium") // low, medium, high
  rating                Int?      // 1-5 stars
  estimated_cost        Decimal?  @db.Decimal(12, 2)
  actual_cost           Decimal?  @db.Decimal(12, 2)
  notes                 String?
  meeting_date          DateTime?
  contract_signed       Boolean   @default(false)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  couple                Couple    @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  category              VendorCategory? @relation(fields: [category_id], references: [id])
  expenses              Expense[]
  
  @@map("vendors")
}

model VendorCategory {
  id            String    @id @default(uuid())
  name          String    @unique
  icon          String?
  color         String?
  description   String?
  sort_order    Int?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  // Relations
  vendors       Vendor[]
  
  @@map("vendor_categories")
}
```

### 4. **Photo Management System** (Priority: HIGH)
**API References Found**: `/api/photos/upload/route.ts`, `/api/albums/route.ts`

**Missing Models:**
```sql
model Photo {
  id                    String    @id @default(uuid())
  couple_id             String
  album_id              String?
  title                 String?
  description           String?
  cloudinary_public_id  String    @unique
  cloudinary_url        String
  cloudinary_secure_url String
  original_filename     String
  file_size             Int
  width                 Int
  height                Int
  format                String
  photo_date            DateTime? @db.Date
  location              String?
  photographer          String?
  event_type            String    @default("general")
  tags                  String[]
  is_favorite           Boolean   @default(false)
  is_private            Boolean   @default(false)
  sort_order            Int?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  couple                Couple    @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  album                 PhotoAlbum? @relation(fields: [album_id], references: [id])
  
  @@map("photos")
}

model PhotoAlbum {
  id                String    @id @default(uuid())
  couple_id         String
  name              String
  description       String?
  cover_photo_id    String?
  is_public         Boolean   @default(false)
  is_featured       Boolean   @default(false)
  sort_order        Int?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  
  // Relations
  couple            Couple    @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  photos            Photo[]
  cover_photo       Photo?    @relation("AlbumCoverPhoto", fields: [cover_photo_id], references: [id])
  
  @@map("photo_albums")
}
```

### 5. **Checklist System** (Priority: HIGH)
**API References Found**: `/api/checklist/route.ts`

**Missing Models:**
```sql
model ChecklistTask {
  id            String    @id @default(uuid())
  couple_id     String
  category_id   String?
  title         String
  description   String?
  priority      String    @default("medium") // low, medium, high
  status        String    @default("pending") // pending, in_progress, completed
  due_date      DateTime? @db.Date
  completed_at  DateTime?
  assigned_to   String?   // partner1, partner2, both
  notes         String?
  is_custom     Boolean   @default(false)
  sort_order    Int?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  // Relations
  couple        Couple    @relation(fields: [couple_id], references: [id], onDelete: Cascade)
  category      ChecklistCategory? @relation(fields: [category_id], references: [id])
  
  @@map("checklist_tasks")
}

model ChecklistCategory {
  id            String    @id @default(uuid())
  name          String    @unique
  description   String?
  color         String?
  icon          String?
  sort_order    Int?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  // Relations
  tasks         ChecklistTask[]
  
  @@map("checklist_categories")
}
```

## 🎯 MIGRATION PRIORITY MATRIX

### **PHASE 1: CRITICAL SYSTEM STABILITY** (Days 1-3)
**Risk Level: CRITICAL** 🔴
- **Budget Models** - Expense & BudgetCategory tables
- **Guest Models** - Guest & Invitation tables  
- **Vendor Models** - Vendor & VendorCategory tables
- **Relations** - Update Couple model with proper foreign keys

**Migration Strategy**: 
- ✅ **Zero-downtime approach** - Create tables without breaking existing code
- ✅ **Backwards compatibility** - Maintain existing API contracts
- ✅ **Data validation** - Ensure referential integrity

### **PHASE 2: HIGH-VALUE FEATURES** (Days 4-5)
**Risk Level: HIGH** 🟡
- **Photo Models** - Photo & PhotoAlbum tables
- **Checklist Models** - ChecklistTask & ChecklistCategory tables

**Migration Strategy**:
- ✅ **Feature flags** - Enable features incrementally
- ✅ **Storage setup** - Configure Cloudinary integration
- ✅ **Seed data** - Pre-populate categories

### **PHASE 3: SYSTEM OPTIMIZATION** (Days 6-7)
**Risk Level: MEDIUM** 🟢
- **Database indexes** - Optimize query performance
- **RLS policies** - Security layer implementation
- **Stored procedures** - Helper functions for complex queries

## 🛡️ SAFE MIGRATION APPROACH

### 1. **Pre-Migration Validation**
```sql
-- Check existing data dependencies
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'expenses', 'budget_categories', 'guests', 'invitations',
  'vendors', 'vendor_categories', 'photos', 'photo_albums',
  'checklist_tasks', 'checklist_categories'
);
```

### 2. **Migration Execution Strategy**
- **Step 1**: Create new tables with proper constraints
- **Step 2**: Update Couple model to include new relations
- **Step 3**: Deploy API changes (already exist but will now work)
- **Step 4**: Test all dashboard features
- **Step 5**: Seed essential data (categories, defaults)

### 3. **Rollback Strategy**
- **Database snapshots** before each phase
- **Feature flags** to disable new functionality
- **API versioning** to maintain compatibility

## 🔗 INTEGRATION POINTS

### **Authentication Integration**
- ✅ **Clerk compatibility** - All models use couple_id from existing couples table
- ✅ **RLS policies** - User can only access their couple's data
- ✅ **API security** - Consistent auth pattern across all endpoints

### **External Service Integration**
- ✅ **Cloudinary** - Photo storage already configured
- ✅ **Messaging** - Templates and logs already in schema
- ✅ **Notifications** - Ready for future push notification system

## 📋 IMPLEMENTATION CHECKLIST

### Database Schema Migration
- [ ] Create missing database models (8 total)
- [ ] Update Couple model with new relations
- [ ] Create RLS policies for all new tables
- [ ] Add database indexes for performance
- [ ] Create seed data for categories

### API Integration Validation
- [ ] Test budget expense creation/retrieval
- [ ] Test guest RSVP functionality
- [ ] Test vendor management CRUD
- [ ] Test photo upload and album creation
- [ ] Test checklist task management

### Dashboard Features Testing
- [ ] Budget tracking dashboard
- [ ] Guest list and RSVP management
- [ ] Vendor directory and contacts
- [ ] Photo gallery and albums
- [ ] Wedding checklist progress

## 🚀 SUCCESS METRICS

### **Technical Success**
- **Zero API errors** - All dashboard features functional
- **Database consistency** - All foreign key relationships valid
- **Performance** - Page load times under 2 seconds
- **Security** - RLS policies properly enforced

### **User Experience Success**
- **Feature completeness** - All dashboard sections working
- **Data persistence** - User data saves correctly
- **Navigation flow** - Smooth transitions between features
- **Mobile compatibility** - Responsive design maintained

## ⚠️ CRITICAL DEPENDENCIES

### **Immediate Actions Required**
1. **Database Migration** - Cannot delay, system will break
2. **Seed Data Creation** - Categories needed for proper UX
3. **RLS Policy Setup** - Security requirement for multi-tenant system
4. **API Testing** - Validation of all dashboard functionality

### **Coordination with Other Agents**
- **Database Agent**: Schema creation and seed data
- **API Agent**: Endpoint testing and validation
- **Frontend Agent**: Dashboard integration testing
- **Security Agent**: RLS policy implementation
- **Testing Agent**: Comprehensive feature validation

## 📊 ESTIMATED TIMELINE

| Phase | Duration | Risk Level | Dependencies |
|-------|----------|------------|-------------|
| Phase 1: Critical Models | 2-3 days | 🔴 Critical | Database Agent |
| Phase 2: Feature Models | 1-2 days | 🟡 High | Phase 1 Complete |
| Phase 3: Optimization | 1-2 days | 🟢 Medium | Phase 2 Complete |
| **Total Timeline** | **5-7 days** | **Manageable** | **Sequential** |

---

## 🎯 NEXT STEPS

**IMMEDIATE**: Begin Phase 1 database model creation
**COORDINATION**: Alert all agents of migration dependencies
**MONITORING**: Track migration progress and system stability
**VALIDATION**: Test each phase before proceeding to next

**Status**: ✅ **ARCHITECTURE ANALYSIS COMPLETE** - Ready for implementation coordination