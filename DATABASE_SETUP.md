# Wedding Planner Database Setup Guide

This guide explains how to set up and configure the database for the Wedding Planner application using Prisma ORM with Supabase PostgreSQL.

## Architecture Overview

The application uses a clean backend architecture with:

- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **Repository Pattern**: Clean abstraction layer for data access
- **Error Handling**: Comprehensive error management system
- **Validation**: Zod schemas for input validation
- **Authentication**: Clerk integration with proper user context

## Database Configuration

### Environment Variables

Ensure these variables are set in your `.env.local`:

```env
# Prisma Database Configuration
DATABASE_URL="your-supabase-connection-string"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Schema Overview

The database schema includes:

- **Core Entities**: couples, vendors, guests, tasks, timeline_items
- **Budget Management**: budget_categories, budget_expenses, payment_schedules
- **Communication**: messages, vendor_messages, message_threads
- **Marketplace**: marketplace_vendors, vendor_packages, vendor_reviews
- **Advanced Features**: activity_feed, couple_settings, notifications

## Setup Instructions

### 1. Database Migration

Run Prisma migrations to set up the database schema:

```bash
# Generate Prisma client
npm run prisma:generate

# Apply migrations to database
npm run prisma:migrate

# Optionally: Push schema directly (for development)
npm run prisma:push
```

### 2. Database Seeding

Seed the database with initial data:

```bash
# Run the seed script
npm run prisma:seed

# Or use the API endpoint
curl -X POST http://localhost:3000/api/database/setup
```

### 3. Verify Setup

Check database health:

```bash
# Via API endpoint
curl http://localhost:3000/api/database/setup

# Or check Prisma Studio
npm run prisma:studio
```

## Repository Pattern

### Base Repository

All repositories extend `BaseRepository` which provides:

- Generic CRUD operations
- Transaction support
- Health checks
- Pagination helpers
- Error handling

### Couples Repository

```typescript
import { CouplesRepository } from '@/lib/db/repository'

const couplesRepo = new CouplesRepository()

// Find by user ID
const couple = await couplesRepo.findByUserId(userId)

// Create new couple
const newCouple = await couplesRepo.create(coupleData)

// Update couple
const updated = await couplesRepo.update(coupleId, updateData)

// Get with statistics
const coupleWithStats = await couplesRepo.getCoupleWithStats(coupleId)
```

### Vendors Repository

```typescript
import { VendorsRepository } from '@/lib/db/repository'

const vendorsRepo = new VendorsRepository()

// Find by couple ID
const vendors = await vendorsRepo.findByCoupleId(coupleId)

// Search by name
const results = await vendorsRepo.searchByName('photographer')

// Filter by category
const caterers = await vendorsRepo.findByCategory('catering')
```

## API Architecture

### Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    type: string
    statusCode: number
    timestamp: Date
  }
  metadata?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}
```

### Error Handling

Custom error classes provide specific error types:

```typescript
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError,
  DatabaseError 
} from '@/lib/errors'

// Validation error
throw new ValidationError('Invalid email format', 'email')

// Not found error
throw new NotFoundError('Couple not found', 'couple')

// Database error
throw new DatabaseError('Query failed', query, errorCode)
```

### Authentication

API routes use Clerk for authentication:

```typescript
import { getAuthContext } from '@/lib/auth/clerk.helper'

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { userId } = await getAuthContext(req)
  
  // Your authenticated logic here
})
```

## Data Validation

### Zod Schemas

Input validation uses Zod schemas:

```typescript
import { validateCreateCouple } from '@/lib/validation/couples.schema'

// Validate create couple input
const validatedData = validateCreateCouple({
  partner1_name: 'John',
  partner2_name: 'Jane',
  wedding_date: '2024-06-15',
  guest_count_estimate: 150
})
```

### Available Schemas

- `CreateCoupleSchema`: Couple creation validation
- `UpdateCoupleSchema`: Couple update validation
- `CoupleFiltersSchema`: Query parameter validation
- `OnboardingCompletionSchema`: Onboarding flow validation

## Database Performance

### Indexes

The system creates these indexes for optimal performance:

- `idx_couples_user_ids`: User lookup optimization
- `idx_vendors_couple_category`: Vendor filtering
- `idx_guests_couple_rsvp`: RSVP status queries
- `idx_tasks_couple_status`: Task management
- `idx_budget_expenses_couple_date`: Financial tracking
- `idx_timeline_items_couple_date`: Event scheduling
- `idx_messages_couple_read`: Communication
- `idx_vendor_messages_thread`: Message threading

### Query Optimization

The repository pattern includes:

- Pagination support
- Selective field loading
- Relation includes only when needed
- Proper WHERE clause construction
- Connection pooling through Prisma

## Migration Strategy

### Development

1. Make schema changes in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev`
3. Test changes locally
4. Commit migration files

### Production

1. Review migration files
2. Backup database
3. Run: `npx prisma migrate deploy`
4. Verify deployment

### Rollback Plan

1. Database backup restoration
2. Prisma migration rollback (if needed)
3. Application rollback to previous version

## Monitoring & Maintenance

### Health Checks

```typescript
import { checkDatabaseHealth } from '@/lib/migrations/setup'

const isHealthy = await checkDatabaseHealth()
```

### Performance Monitoring

- Monitor slow queries
- Track connection pool usage
- Monitor error rates
- Set up alerts for failures

### Regular Maintenance

- Regular VACUUM on PostgreSQL
- Index maintenance
- Connection pool optimization
- Query performance analysis

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Check DATABASE_URL format
   - Verify Supabase connection limits
   - Check firewall settings

2. **Migration Failures**
   - Check schema conflicts
   - Verify user permissions
   - Review migration logs

3. **Performance Issues**
   - Check missing indexes
   - Review query patterns
   - Monitor connection pool

### Debug Mode

Enable debug logging:

```env
DATABASE_URL="your-url?connection_limit=5&pool_timeout=0&log=query"
```

### Support

- Prisma Documentation: https://www.prisma.io/docs
- Supabase Documentation: https://supabase.com/docs
- Project Repository Issues: For project-specific problems

## Security Considerations

### Data Protection

- All sensitive data encrypted at rest
- Connection strings secured
- User isolation through couple_id
- Input validation on all endpoints

### Access Control

- Authentication required for all operations
- User can only access their couple data
- Vendor data isolated by couple
- Admin functions protected

### Best Practices

- Never expose raw database errors
- Validate all inputs
- Use prepared statements (via Prisma)
- Regular security audits
- Keep dependencies updated

## Next Steps

1. Set up monitoring dashboards
2. Implement caching layer
3. Add automated backups
4. Set up performance alerts
5. Plan for scaling strategies