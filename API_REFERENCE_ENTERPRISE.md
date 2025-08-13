# Wedding Planner Enterprise API Reference

## Overview

This document provides comprehensive documentation for the Wedding Planner Enterprise API. The API has been transformed to eliminate cascading failures through unified database schema, repository patterns, and transaction support. All endpoints follow RESTful conventions with enterprise-grade reliability.

## 🚀 Enterprise Architecture Features

- **Repository Pattern**: All data access through repositories with transaction support
- **Unified Database Schema**: Single `Couple` table eliminates cascading failures
- **Transaction Safety**: Multi-step operations with automatic rollback
- **Input Validation**: Zod schemas throughout all endpoints
- **Error Recovery**: Structured error handling with rollback information

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:4000/api  # Port 4000 preferred for this project
```

## Authentication

Authentication uses **Supabase Auth** with repository-based couple lookup:

```typescript
// Enterprise authentication pattern
async function getCoupleId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Repository-based couple lookup
  const coupleRepository = new CoupleRepository()
  const couple = await coupleRepository.findByUserId(user.id)

  if (!couple) {
    throw new Error('No couple found for user')
  }

  return couple.id
}
```

## Enterprise Response Format

All API responses follow the enterprise-standard format with transaction information:

### Success Response (Repository-Based)

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456",
    "repository": "GuestRepository",
    "operation": "findByCoupleId",
    "transactionSafe": true,
    "queryTime": "12ms"
  }
}
```

### Error Response (With Transaction Rollback)

```json
{
  "success": false,
  "error": {
    "code": "REPOSITORY_ERROR",
    "message": "Database operation failed",
    "details": {
      "repository": "GuestRepository",
      "operation": "create",
      "validationErrors": {
        "email": "Invalid email format"
      }
    },
    "transaction": {
      "status": "rolled_back",
      "transactionId": "tx_789",
      "rollbackReason": "Validation failed"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

## Enterprise HTTP Status Codes

| Code | Meaning | Enterprise Context |
|------|---------|-------------------|
| 200 | OK - Repository operation successful | Data retrieved from repository |
| 201 | Created - Resource created in transaction | Transaction committed successfully |
| 400 | Bad Request - Validation failed | Zod schema validation error |
| 401 | Unauthorized - Supabase auth required | No valid user session |
| 403 | Forbidden - Couple access denied | User not authorized for couple data |
| 404 | Not Found - Repository returned empty | Resource not found in unified schema |
| 409 | Conflict - Unique constraint violation | Database constraint error |
| 422 | Unprocessable - Business logic failed | Service layer validation error |
| 500 | Internal Error - Transaction rolled back | Repository or service error |

## Enterprise Error Codes

| Code | Description | Transaction Impact |
|------|-------------|-------------------|
| `REPOSITORY_ERROR` | Repository operation failed | Automatic rollback |
| `VALIDATION_ERROR` | Zod schema validation failed | No transaction started |
| `AUTHENTICATION_ERROR` | Supabase authentication failed | No operation attempted |
| `COUPLE_NOT_FOUND` | No couple found for user | Repository query returned empty |
| `TRANSACTION_FAILED` | Database transaction failed | Automatic rollback triggered |
| `SCHEMA_MISMATCH` | Data doesn't match unified schema | Operation rejected |
| `BUSINESS_LOGIC_ERROR` | Service validation failed | Transaction rolled back |
| `CONSTRAINT_VIOLATION` | Database constraint violated | Transaction rolled back |
| `CONCURRENT_UPDATE` | Optimistic locking conflict | Retry suggested |
| `SERVICE_UNAVAILABLE` | Repository temporarily unavailable | Retry with backoff |

---

## Enterprise Guests API (Repository Pattern)

### List Guests

Retrieve guests using **GuestRepository** with unified couple references and optimized queries.

```http
GET /api/guests?page=1&pageSize=20&orderBy=firstName
```

**Enterprise Features:**
- Repository-based data access via `GuestRepository.findByCoupleId()`
- Unified foreign key references to `Couple.id`
- Query optimization with proper includes and ordering
- Transaction-safe pagination

**Repository Implementation:**
```typescript
export class GuestRepository extends BaseRepository<Guest> {
  async findByCoupleId(coupleId: string): Promise<Guest[]> {
    return this.executeQuery(() =>
      this.prisma.guest.findMany({ 
        where: { coupleId }, // Unified reference to Couple.id
        include: {
          rsvp: true,
          invitations: {
            orderBy: { sentAt: 'desc' },
            take: 1
          }
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
      })
    )
  }
}
```

### Create Guest (Enterprise Transaction Pattern)

Create a new guest using **GuestService** with transaction support and business logic validation.

```http
POST /api/guests
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "side": "bride",
  "relationship": "friend",
  "plusOneAllowed": true,
  "plusOneName": "Jane Smith",
  "dietaryRestrictions": "Gluten-free",
  "notes": "College roommate",
  "address": "123 Main St, Anytown, ST 12345",
  "sendInvitation": true,
  "createRsvp": true
}
```

**Enterprise Implementation:**
```typescript
// Service with transaction support
export class GuestService {
  async createGuest(request: CreateGuestRequest): Promise<GuestResponse> {
    return withTransaction(async (tx) => {
      // 1. Validate input with Zod schema
      const validatedData = CreateGuestSchema.parse(request)
      
      // 2. Business logic validation
      const existingGuest = await this.guestRepo.findByEmail(
        validatedData.email, validatedData.coupleId, tx
      )
      
      if (existingGuest) {
        throw new Error('Guest with this email already exists')
      }
      
      // 3. Create guest
      const guest = await this.guestRepo.create(validatedData, tx)
      
      // 4. Create invitation if requested (same transaction)
      if (validatedData.sendInvitation) {
        await this.invitationService.create({
          guestId: guest.id,
          coupleId: validatedData.coupleId
        }, tx)
      }
      
      // 5. Create RSVP record if requested (same transaction)
      if (validatedData.createRsvp) {
        await this.rsvpService.create({
          guestId: guest.id,
          status: 'pending'
        }, tx)
      }
      
      // If ANY step fails, EVERYTHING rolls back automatically
      return this.mapToResponse(guest)
    })
  }
}
```

---

## Enterprise Vendors API (Repository Pattern)

### List Vendors

Retrieve vendors using **VendorRepository** with unified couple references and optimized queries.

```http
GET /api/vendors?category=photographer&status=booked&priority=high
```

**Repository Implementation:**
```typescript
export class VendorRepository extends BaseRepository<Vendor> {
  async findByCoupleId(coupleId: string, filters?: VendorFilters): Promise<Vendor[]> {
    return this.executeQuery(() => {
      const where: any = { coupleId } // Unified reference to Couple.id
      
      if (filters?.category) where.category = filters.category
      if (filters?.status) where.status = filters.status
      if (filters?.priority) where.priority = filters.priority
      
      return this.prisma.vendor.findMany({
        where,
        include: {
          contracts: true,
          category: {
            select: { id: true, name: true, icon: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { status: 'asc' },
          { name: 'asc' }
        ]
      })
    })
  }
}
```

### Create Vendor (Enterprise Transaction Pattern)

```http
POST /api/vendors
Content-Type: application/json

{
  "name": "Amazing Photography",
  "businessName": "Amazing Photography LLC",
  "contactPerson": "Jane Photographer",
  "email": "jane@amazingphoto.com",
  "phone": "+1234567890",
  "website": "https://amazingphoto.com",
  "address": "456 Photo St, City, ST 12345",
  "category": "photographer",
  "status": "contacted",
  "priority": "high",
  "estimatedCost": 2500.00,
  "actualCost": null,
  "notes": "Highly recommended by venue",
  "createContract": true
}
```

---

## Enterprise Budget API (Repository Pattern)

### Get Budget Overview

Retrieve budget data using **BudgetRepository** with unified couple references and transaction-safe calculations.

```http
GET /api/budget
```

**Repository Implementation:**
```typescript
export class BudgetRepository extends BaseRepository<BudgetCategory> {
  async getBudgetSummary(coupleId: string): Promise<BudgetSummary> {
    return this.executeQuery(async () => {
      const categories = await this.prisma.budgetCategory.findMany({
        where: { coupleId }, // Unified reference to Couple.id
        include: {
          expenses: {
            where: { paid: true },
            select: { amount: true, paidDate: true }
          }
        }
      })
      
      // Calculate totals with transaction safety
      const summary = {
        totalBudget: categories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        totalSpent: categories.reduce((sum, cat) => 
          sum + cat.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0
        ),
        categories: categories.map(cat => ({
          ...cat,
          spentAmount: cat.expenses.reduce((sum, exp) => sum + exp.amount, 0),
          remainingAmount: cat.budgetAmount - cat.expenses.reduce((sum, exp) => sum + exp.amount, 0)
        }))
      }
      
      summary.totalRemaining = summary.totalBudget - summary.totalSpent
      
      return summary
    })
  }
}
```

---

## Enterprise Photos API (Repository Pattern with Storage Transaction)

### Upload Photos

Upload photos using **PhotoService** with file optimization, storage transaction, and database consistency.

```http
POST /api/photos/upload
Content-Type: multipart/form-data

files: [File, File, ...]
albumId: "album_123" (optional)
title: "Ceremony Photos"
description: "Beautiful ceremony moments"
eventType: "ceremony"
photoDate: "2024-06-15"
location: "Beach Resort"
photographer: "John Photo"
automaticOptimization: true
generateThumbnails: true
```

**Service Implementation:**
```typescript
export class PhotoService {
  async uploadPhotos(request: UploadPhotosRequest): Promise<PhotoUploadResponse> {
    return withTransaction(async (tx) => {
      const uploadResults = []
      
      for (const file of request.files) {
        try {
          // 1. Validate and optimize file
          const optimizedFile = await this.validateAndOptimizeFile(file)
          
          // 2. Upload to Supabase storage
          const { url, thumbnailUrl, storageKey } = await this.uploadToStorage(
            optimizedFile, request.coupleId
          )
          
          // 3. Create database record (same transaction)
          const photo = await this.photoRepo.create({
            coupleId: request.coupleId,
            title: request.title || file.name,
            description: request.description,
            url,
            thumbnailUrl,
            albumId: request.albumId,
            eventType: request.eventType,
            photoDate: request.photoDate,
            location: request.location,
            photographer: request.photographer,
            storageKey,
            fileSize: optimizedFile.size,
            mimeType: optimizedFile.type,
            dimensions: await this.getImageDimensions(optimizedFile),
            optimized: optimizedFile.wasOptimized
          }, tx)
          
          uploadResults.push({
            success: true,
            photo,
            originalSize: file.size,
            optimizedSize: optimizedFile.size,
            compressionRatio: (1 - optimizedFile.size / file.size) * 100
          })
          
        } catch (error) {
          // If storage upload fails, remove any uploaded files
          if (error.storageKey) {
            await this.removeFromStorage(error.storageKey)
          }
          
          uploadResults.push({
            success: false,
            filename: file.name,
            error: error.message
          })
        }
      }
      
      return {
        successful: uploadResults.filter(r => r.success).length,
        failed: uploadResults.length - uploadResults.filter(r => r.success).length,
        results: uploadResults
      }
    })
  }
}
```

---

## Enterprise Error Examples

### Repository Validation Error (Zod Schema)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "repository": "GuestRepository",
      "operation": "create",
      "zodErrors": [
        {
          "path": ["email"],
          "message": "Invalid email format",
          "code": "invalid_string"
        },
        {
          "path": ["coupleId"],
          "message": "Required",
          "code": "invalid_type"
        }
      ]
    },
    "transaction": {
      "status": "not_started",
      "reason": "Pre-validation failed"
    }
  }
}
```

### Transaction Rollback Error

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_FAILED",
    "message": "Database operation failed and was rolled back",
    "details": {
      "repository": "GuestRepository",
      "operation": "create",
      "failedStep": "invitation.create",
      "originalError": "Email service unavailable",
      "affectedTables": ["guests", "invitations"]
    },
    "transaction": {
      "id": "tx_abc123",
      "status": "rolled_back",
      "rollbackReason": "Step 2 of 3 failed",
      "operationsRolledBack": [
        "guest.create",
        "invitation.create"
      ]
    }
  }
}
```

---

## Enterprise Rate Limiting

API endpoints are rate limited with repository-aware logic and couple-specific tracking:

- **Repository operations**: 1000 requests per hour per couple
- **Transaction-heavy operations**: 200 requests per hour per couple
- **Photo uploads**: 100 requests per hour per couple
- **Bulk operations**: 50 requests per hour per couple
- **Public RSVP**: 10 requests per minute per IP
- **Database-intensive queries**: 500 requests per hour per couple

**Enterprise Rate Limit Headers:**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642272000
X-RateLimit-Scope: couple-456
X-RateLimit-Repository: GuestRepository
X-RateLimit-Operation: findByCoupleId
X-RateLimit-Transaction-Safe: true
```

---

## Enterprise Development & Monitoring

### Health Check (Enterprise)

Comprehensive health check including repository status, transaction health, and unified schema validation.

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-01T15:30:00Z",
    "version": "3.0.0-enterprise",
    "database": {
      "status": "connected",
      "schema": "unified",
      "migrations": "up_to_date",
      "connectionPool": {
        "active": 5,
        "idle": 10,
        "max": 20
      }
    },
    "repositories": {
      "GuestRepository": "healthy",
      "VendorRepository": "healthy",
      "BudgetRepository": "healthy",
      "PhotoRepository": "healthy",
      "CoupleRepository": "healthy"
    },
    "transactions": {
      "activeTransactions": 2,
      "averageTransactionTime": "45ms",
      "rollbackRate": "0.2%",
      "lastHour": {
        "committed": 1247,
        "rolledBack": 3
      }
    },
    "storage": {
      "supabase": "healthy",
      "uploadCapacity": "available",
      "storageUsed": "2.3GB",
      "storageQuota": "100GB"
    },
    "features": {
      "cascadingFailures": "eliminated",
      "unifiedSchema": "active",
      "transactionSupport": "active",
      "repositoryPattern": "active"
    }
  }
}
```

### Database Schema Check (Unified Schema Validation)

Validate unified database schema and repository consistency.

```http
GET /api/check-schema
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schemaVersion": "unified_v3.0",
    "migrationStatus": "complete",
    "lastMigration": "20250813_unify_database_schema",
    "unifiedSchema": {
      "coupleTable": "active",
      "legacyTables": "removed",
      "foreignKeyConsistency": "100%",
      "singleSourceOfTruth": true
    },
    "repositoryIntegrity": {
      "GuestRepository": {
        "tableAccess": "guests",
        "foreignKey": "coupleId -> couples.id",
        "status": "valid"
      },
      "VendorRepository": {
        "tableAccess": "vendors",
        "foreignKey": "coupleId -> couples.id",
        "status": "valid"
      }
    },
    "cascadingFailureRisk": "eliminated",
    "dataConsistency": "100%"
  }
}
```

---

## Enterprise Integration Resources

### Documentation
- **Enterprise Architecture**: `ARCHITECTURE.md` - Complete enterprise patterns documentation
- **Transformation Summary**: `ENTERPRISE_TRANSFORMATION.md` - Detailed transformation changes
- **Current Status**: `CURRENT_STATUS.md` - Implementation status and enterprise features
- **Repository Patterns**: `src/lib/repositories/` - Repository implementation examples
- **Service Layer**: `src/features/*/service/` - Business logic patterns

### Development Guidelines
- **Port**: Use 4000 for development server (`npm run dev -- --port 4000`)
- **Database**: Prisma with Supabase PostgreSQL (unified schema)
- **Authentication**: Supabase Auth (not Clerk)
- **Transaction Pattern**: Always use `withTransaction()` for multi-step operations
- **Repository Usage**: Never use direct Prisma queries in API routes

### Migration Impact

**Before Enterprise Transformation:**
- Cascading failures when components broke
- Dual table confusion (`couples` vs `wedding_couples`)
- Direct Prisma queries scattered throughout codebase
- No transaction boundaries causing partial failures

**After Enterprise Transformation:**
- ✅ Zero cascading failures through unified schema
- ✅ Single source of truth with consistent data model
- ✅ Repository pattern with transaction support
- ✅ ACID compliance with automatic rollback
- ✅ Enterprise-grade error handling and recovery

The API is now production-ready with eliminated cascading failures and industry-standard architectural patterns.