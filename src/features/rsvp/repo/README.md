# RSVP Repository Layer

This directory contains the data access layer for the RSVP system, following the existing repository patterns in the application.

## Architecture

The repository layer provides a clean abstraction over database operations, using the established patterns:

- **BaseRepository**: Extended for common database operations and transactions
- **RepositoryResult**: Consistent return type for all operations
- **Error Handling**: Structured error responses with codes and status codes
- **Type Safety**: Full TypeScript support with Prisma-generated types

## Repositories

### RSVPRepository

Handles RSVP (guest response) data operations.

**Key Features:**
- **Idempotent Operations**: Uses upsert with userId+email unique constraint
- **Statistics Aggregation**: Provides formatted stats for dashboard display
- **Filtering Support**: List RSVPs with optional status filtering
- **Relationship Queries**: Includes invite data when needed

**Methods:**
- `createOrUpdate(data)` - Create or update RSVP with idempotency
- `getStats(userId)` - Get aggregated RSVP statistics
- `list(userId, filters?)` - List RSVPs with optional filtering
- `findByInviteAndEmail(inviteId, email)` - Find specific RSVP
- `delete(userId, rsvpId)` - Delete RSVP (user-scoped)

### InviteRepository

Handles invitation management and token operations.

**Key Features:**
- **Token Management**: Unique token generation and validation
- **Email Deduplication**: Find-or-create pattern for invites
- **Country Support**: Store country codes for pricing
- **Security**: User-scoped operations to prevent unauthorized access

**Methods:**
- `create(data)` - Create new invite with unique token
- `getByToken(token)` - Find invite by token (for RSVP pages)
- `getById(id)` - Find invite by ID
- `list(userId)` - List all invites for user
- `findOrCreateByEmail(userId, email, token, country?)` - Idempotent invite creation
- `update(id, userId, data)` - Update invite (user-scoped)
- `delete(id, userId)` - Delete invite and cascade RSVPs
- `isTokenUnique(token)` - Check token availability

## Data Types

### Core Types

```typescript
// RSVP record structure
type InviteRSVPRecord = {
  id: string
  userId: string
  inviteId: string
  email: string
  status: RsvpStatus  // 'pending' | 'accepted' | 'declined'
  partySize: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Invite record structure
type InviteRecord = {
  id: string
  userId: string
  email: string
  token: string
  country?: string  // ISO country code
  createdAt: Date
  updatedAt: Date
}

// Statistics format
type RSVPStats = {
  total: number
  pending: number
  accepted: number
  declined: number
  totalGuests: number  // Sum of party sizes
}
```

### Input Types

```typescript
// RSVP creation/update
type RSVPCreateData = {
  userId: string
  inviteId: string
  email: string
  status: RsvpStatus
  partySize: number
  notes?: string
}

// Invite creation
type InviteCreateData = {
  userId: string
  email: string
  token: string
  country?: string
}
```

## Error Handling

All repository methods return `RepositoryResult<T>` with consistent error structure:

```typescript
interface RepositoryResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode?: number
  }
}
```

### Error Codes

**RSVP Repository:**
- `RSVP_UPSERT_FAILED` (500) - Database error during create/update
- `RSVP_STATS_FAILED` (500) - Error calculating statistics
- `RSVP_LIST_FAILED` (500) - Error listing RSVPs
- `RSVP_FIND_FAILED` (500) - Error finding specific RSVP
- `RSVP_DELETE_FAILED` (500) - Error deleting RSVP

**Invite Repository:**
- `INVITE_TOKEN_EXISTS` (409) - Token already in use
- `INVITE_CREATE_FAILED` (500) - Database error during creation
- `INVITE_GET_FAILED` (500) - Error retrieving invite
- `INVITE_LIST_FAILED` (500) - Error listing invites
- `INVITE_FIND_CREATE_FAILED` (500) - Error in find-or-create operation
- `INVITE_UPDATE_FAILED` (500) - Error updating invite
- `INVITE_DELETE_FAILED` (500) - Error deleting invite
- `INVITE_TOKEN_CHECK_FAILED` (500) - Error checking token uniqueness

## Usage Examples

### Creating an RSVP

```typescript
const rsvpRepo = new RSVPRepository()

const result = await rsvpRepo.createOrUpdate({
  userId: 'user-123',
  inviteId: 'invite-456',
  email: 'guest@example.com',
  status: 'accepted',
  partySize: 2,
  notes: 'Looking forward to it!'
})

if (result.success) {
  console.log('RSVP created:', result.data)
} else {
  console.error('Error:', result.error)
}
```

### Getting RSVP Statistics

```typescript
const statsResult = await rsvpRepo.getStats('user-123')

if (statsResult.success) {
  const stats = statsResult.data
  console.log(`Total RSVPs: ${stats.total}`)
  console.log(`Accepted: ${stats.accepted}`)
  console.log(`Total Guests: ${stats.totalGuests}`)
}
```

### Creating an Invite

```typescript
const inviteRepo = new InviteRepository()

const result = await inviteRepo.create({
  userId: 'user-123',
  email: 'guest@example.com',
  token: 'unique-token-abc123',
  country: 'NG'
})

if (result.success) {
  console.log('Invite created:', result.data)
} else if (result.error?.code === 'INVITE_TOKEN_EXISTS') {
  console.log('Token already exists, generate a new one')
}
```

### Finding Invite by Token (RSVP Page)

```typescript
const tokenResult = await inviteRepo.getByToken('invite-token-123')

if (tokenResult.success && tokenResult.data) {
  const invite = tokenResult.data
  console.log(`Invite for ${invite.email} from user ${invite.userId}`)
} else {
  console.log('Invalid or expired invite token')
}
```

## Database Relationships

The repositories handle the following relationships:

```
User (couple)
├── Invite[] (one-to-many)
│   └── InviteRSVP[] (one-to-many)
└── InviteRSVP[] (one-to-many, direct relation)
```

**Key Constraints:**
- `Invite.token` - Unique across all invites
- `InviteRSVP.userId + email` - Unique (idempotency key)
- All foreign keys have CASCADE delete for data integrity

## Testing

### Unit Tests

Located in `__tests__/` directory:
- `rsvp.repository.test.ts` - Tests for RSVPRepository
- `invite.repository.test.ts` - Tests for InviteRepository

**Test Coverage:**
- ✅ Happy path operations
- ✅ Error handling scenarios
- ✅ Constraint violations
- ✅ Edge cases (empty results, null values)
- ✅ Database error simulation

### Running Tests

```bash
# Validate repository structure
node src/features/rsvp/repo/__tests__/test-runner.js

# Run unit tests (requires test framework setup)
npm run test:unit

# Run integration tests (requires test database)
npm run test:integration
```

## Performance Considerations

### Optimized Queries

- **Indexes**: All foreign keys and frequently queried fields are indexed
- **Aggregations**: Statistics use efficient `groupBy` operations
- **Filtering**: Optional filters to reduce result sets
- **Relationships**: Selective includes to avoid over-fetching

### Expected Query Patterns

- **High Frequency**: Token lookups for RSVP pages
- **Medium Frequency**: RSVP statistics for dashboards
- **Low Frequency**: Full RSVP lists and invite management

### Database Indexes

```sql
-- Automatically created by Prisma migration
CREATE INDEX invites_user_idx ON invites(user_id);
CREATE INDEX invites_token_idx ON invites(token);
CREATE INDEX invite_rsvps_user_idx ON invite_rsvps(user_id);
CREATE INDEX invite_rsvps_invite_idx ON invite_rsvps(invite_id);
CREATE UNIQUE INDEX invite_rsvps_user_email_unique ON invite_rsvps(user_id, email);
```

## Security Considerations

### Data Access Control

- **User Scoping**: All operations are scoped to the authenticated user
- **No Cross-User Access**: Users cannot access other users' invites/RSVPs
- **Token Security**: Tokens should be cryptographically secure (handled in service layer)

### Input Validation

- **Email Format**: Validated at service layer with Zod
- **Party Size Limits**: Enforced at service layer (1-10 guests)
- **Status Values**: Constrained by Prisma enum
- **SQL Injection**: Prevented by Prisma's query builder

## Integration Points

### Service Layer

Repositories are consumed by:
- `RSVPService` - Business logic and validation
- `InviteService` - Token generation and management
- `MessagingService` - Country-based pricing lookup

### API Layer

Indirectly used through services by:
- `POST /api/rsvp` - Public RSVP submission
- `GET /api/rsvp/stats` - Dashboard statistics
- `POST /api/invites` - Invite creation
- `GET /api/invites` - Invite management

## Migration Compatibility

This repository layer is designed to work with the database schema created in:
- Migration: `20250824_000000_rsvp_messaging_system`
- Tables: `invites`, `invite_rsvps`
- Relations: User → Invite → InviteRSVP

## Next Steps

1. **Service Layer** - Implement business logic and validation
2. **API Handlers** - Create HTTP endpoints using repositories via services
3. **Integration Tests** - Test with real database connections
4. **Performance Testing** - Validate query performance under load