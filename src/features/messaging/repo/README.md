# Credit Management Repository

This repository handles messaging credit operations with atomic guarantees to prevent race conditions and ensure data consistency in high-concurrency scenarios.

## Overview

The `CreditRepository` provides atomic credit operations essential for the messaging system where multiple concurrent requests could attempt to decrement credits simultaneously. The implementation uses database-level atomic operations to ensure credits never go negative and maintain data integrity.

## Key Features

### 🔒 **Atomic Operations**
- **Conditional Updates**: Uses `updateMany` with `WHERE credits >= amount` condition
- **Race Condition Prevention**: Database-level atomicity prevents double-spending
- **Transaction Support**: Complex operations wrapped in database transactions
- **Consistency Guarantees**: Credits can never go negative

### ⚡ **High Performance**
- **Minimal Database Calls**: Efficient single-query operations where possible
- **Optimistic Updates**: Assumes success for better performance
- **Batch Operations**: Support for multiple credit operations in single transaction
- **Selective Queries**: Only fetch required fields to reduce network overhead

### 🛡️ **Error Handling**
- **Structured Errors**: Consistent error codes and HTTP status codes
- **Graceful Degradation**: Handles missing users and edge cases
- **Detailed Logging**: Comprehensive error logging for debugging
- **Input Validation**: Prevents invalid operations at repository level

## Core Methods

### Credit Balance Operations

#### `getBalance(userId: string)`
Returns current credit balance for a user.

```typescript
const result = await creditRepo.getBalance('user-123')
if (result.success) {
  console.log(`User has ${result.data} credits`)
}
```

#### `getBalanceRecord(userId: string)`
Returns full credit balance record with metadata.

```typescript
const result = await creditRepo.getBalanceRecord('user-123')
if (result.success && result.data) {
  console.log(`Balance: ${result.data.credits}, Updated: ${result.data.updatedAt}`)
}
```

### Atomic Credit Operations

#### `decrementAtomic(userId: string, units: number)`
**Critical Method**: Atomically decrements credits with condition check.

```typescript
// Attempt to decrement 10 credits
const result = await creditRepo.decrementAtomic('user-123', 10)

if (result.success && result.data === true) {
  console.log('Credits decremented successfully')
} else if (result.success && result.data === false) {
  console.log('Insufficient credits')
} else {
  console.error('Operation failed:', result.error)
}
```

**How Atomicity Works:**
```sql
-- Database operation performed
UPDATE credit_balances 
SET credits = credits - 10, updated_at = NOW()
WHERE user_id = 'user-123' AND credits >= 10;

-- If affected rows = 0, insufficient credits
-- If affected rows = 1, operation succeeded
```

#### `addCredits(userId: string, units: number)`
Adds credits to user balance (creates record if doesn't exist).

```typescript
const result = await creditRepo.addCredits('user-123', 50)
if (result.success) {
  console.log(`New balance: ${result.data.credits}`)
}
```

### Advanced Operations

#### `performTransaction(transactions: CreditTransaction[])`
Performs multiple credit operations atomically across multiple users.

```typescript
const transactions = [
  { userId: 'user-1', amount: 50, operation: 'add' },
  { userId: 'user-2', amount: 25, operation: 'subtract' },
  { userId: 'user-3', amount: 100, operation: 'add' }
]

const result = await creditRepo.performTransaction(transactions)
if (result.success) {
  console.log('All operations completed successfully')
} else {
  console.log('Transaction failed, all operations rolled back')
}
```

#### `hasSufficientCredits(userId: string, requiredAmount: number)`
Checks credit sufficiency without modifying balance.

```typescript
const result = await creditRepo.hasSufficientCredits('user-123', 25)
if (result.success && result.data) {
  console.log('User has sufficient credits')
}
```

## Data Types

### Core Types

```typescript
type CreditBalanceRecord = {
  userId: string
  credits: number
  updatedAt: Date
}

type CreditTransaction = {
  userId: string
  amount: number
  operation: 'add' | 'subtract'
  reason?: string  // Optional description
}
```

### Return Types

All methods return `RepositoryResult<T>`:

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

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `CREDIT_GET_FAILED` | 500 | Failed to retrieve balance |
| `CREDIT_DECREMENT_FAILED` | 500 | Atomic decrement operation failed |
| `CREDIT_ADD_FAILED` | 500 | Failed to add credits |
| `CREDIT_SET_FAILED` | 500 | Failed to set balance |
| `CREDIT_TRANSACTION_FAILED` | 500 | Multi-operation transaction failed |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits for operation |
| `INVALID_CREDIT_AMOUNT` | 400 | Negative or zero amount provided |
| `CREDIT_INIT_FAILED` | 500 | Failed to initialize balance |
| `CREDIT_DELETE_FAILED` | 500 | Failed to delete balance |

## Concurrency Scenarios

### Scenario 1: Multiple Decrements with Limited Credits

```typescript
// User has 10 credits, 3 operations try to decrement 5 each
// Only 2 operations should succeed

const operations = [
  creditRepo.decrementAtomic('user-123', 5),
  creditRepo.decrementAtomic('user-123', 5),
  creditRepo.decrementAtomic('user-123', 5)
]

const results = await Promise.all(operations)
// Exactly 2 will return { success: true, data: true }
// Exactly 1 will return { success: true, data: false }
```

### Scenario 2: Concurrent Add and Subtract

```typescript
// Concurrent operations that should both succeed
const [addResult, subtractResult] = await Promise.all([
  creditRepo.addCredits('user-123', 50),      // Always succeeds
  creditRepo.decrementAtomic('user-123', 30)  // Succeeds if sufficient credits
])
```

### Scenario 3: Transaction Rollback

```typescript
const transactions = [
  { userId: 'user-1', amount: 50, operation: 'add' },
  { userId: 'user-2', amount: 1000, operation: 'subtract' }, // Will fail
  { userId: 'user-3', amount: 25, operation: 'add' }
]

// If user-2 has insufficient credits, entire transaction rolls back
// No partial updates occur
const result = await creditRepo.performTransaction(transactions)
```

## Race Condition Prevention

### Database-Level Atomicity

The repository uses PostgreSQL's atomic operations to prevent race conditions:

```sql
-- Atomic decrement with condition
UPDATE credit_balances 
SET credits = credits - ?, updated_at = NOW()
WHERE user_id = ? AND credits >= ?;

-- Check affected rows to determine success
-- 0 rows = insufficient credits or user doesn't exist
-- 1 row = operation succeeded
```

### Transaction Isolation

Multi-operation transactions use proper isolation levels:

```typescript
await this.withTransaction(async (tx) => {
  // All operations in this block are atomic
  // Either all succeed or all are rolled back
  for (const transaction of transactions) {
    // Perform individual operations
  }
})
```

## Performance Considerations

### Optimized Queries

- **Single Query Operations**: Most operations use single database queries
- **Conditional Updates**: Avoid separate SELECT + UPDATE patterns
- **Minimal Data Transfer**: Only fetch required fields
- **Efficient Indexing**: Primary key operations are O(1)

### Expected Load Patterns

- **High Frequency**: Credit balance checks and decrements
- **Medium Frequency**: Credit additions and balance queries
- **Low Frequency**: Multi-user transactions and admin operations

### Scaling Considerations

- **Connection Pooling**: Repository works with connection pools
- **Read Replicas**: Balance queries can use read replicas
- **Horizontal Scaling**: Operations are stateless and can be distributed

## Testing

### Unit Tests

**File**: `__tests__/credit.repository.test.ts`

- ✅ Basic CRUD operations
- ✅ Atomic decrement scenarios
- ✅ Error handling and edge cases
- ✅ Input validation
- ✅ Transaction operations

**File**: `__tests__/credit.concurrency.test.ts`

- ✅ Race condition simulation
- ✅ Concurrent operation handling
- ✅ High-load scenarios
- ✅ Transaction rollback testing
- ✅ Mixed success/failure scenarios

### Test Coverage

- **Happy Path**: All operations succeed as expected
- **Edge Cases**: Zero balances, missing users, invalid inputs
- **Error Scenarios**: Database failures, constraint violations
- **Concurrency**: Multiple simultaneous operations
- **Atomicity**: Verification of atomic guarantees

### Running Tests

```bash
# Validate repository structure
node src/features/messaging/repo/__tests__/test-runner.js

# Run unit tests (requires test framework)
npm run test:unit -- credit.repository

# Run concurrency tests
npm run test:unit -- credit.concurrency

# Run integration tests with real database
npm run test:integration -- credit
```

## Integration Points

### Messaging Service

The repository is consumed by `MessagingService`:

```typescript
class MessagingService {
  private creditRepo = new CreditRepository()

  async sendMessage(request: SendMessageRequest) {
    const cost = this.calculateCost(request.channel, request.country)
    
    // Atomic credit check and decrement
    const decrementResult = await this.creditRepo.decrementAtomic(
      request.coupleId, 
      cost
    )
    
    if (!decrementResult.success || !decrementResult.data) {
      throw new InsufficientCreditsError(cost, await this.getCurrentBalance())
    }
    
    try {
      // Send message via provider
      return await this.sendViaProvider(request)
    } catch (error) {
      // Rollback credits on failure
      await this.creditRepo.addCredits(request.coupleId, cost)
      throw error
    }
  }
}
```

### API Endpoints

Indirectly used through services:

- `POST /api/messages/send` - Decrements credits for message sending
- `GET /api/credits/balance` - Retrieves current balance
- `POST /api/credits/add` - Admin endpoint to add credits
- `GET /api/admin/credits` - Admin dashboard for credit management

## Security Considerations

### Access Control

- **User Isolation**: All operations scoped to specific users
- **No Cross-User Access**: Users cannot access other users' credits
- **Admin Operations**: Separate methods for administrative functions

### Input Validation

- **Amount Validation**: Prevents negative or zero amounts
- **User ID Validation**: Ensures valid user identifiers
- **Operation Validation**: Validates transaction operation types

### Audit Trail

- **Update Timestamps**: All operations update `updatedAt` field
- **Operation Logging**: Comprehensive logging for audit purposes
- **Error Tracking**: Failed operations logged with context

## Monitoring and Observability

### Key Metrics

- **Credit Decrement Success Rate**: Percentage of successful decrements
- **Insufficient Credit Rate**: Frequency of insufficient credit errors
- **Transaction Rollback Rate**: Frequency of transaction failures
- **Average Operation Latency**: Performance monitoring

### Alerts

- **High Failure Rate**: Alert when decrement failures exceed threshold
- **Negative Balance Attempts**: Should never happen, indicates bug
- **Transaction Deadlocks**: Database-level concurrency issues
- **Slow Operations**: Performance degradation alerts

### Logging

```typescript
// Example log entries
logger.info('Credit decrement successful', {
  userId: 'user-123',
  amount: 10,
  remainingBalance: 90,
  operation: 'message_send'
})

logger.warn('Insufficient credits', {
  userId: 'user-123',
  required: 10,
  available: 5,
  operation: 'message_send'
})
```

## Migration and Deployment

### Database Schema

The repository works with the `credit_balances` table:

```sql
CREATE TABLE credit_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for performance (automatically created for primary key)
-- Additional indexes not needed for this simple structure
```

### Deployment Considerations

- **Zero Downtime**: Repository operations are backwards compatible
- **Connection Pooling**: Works with existing connection pool configuration
- **Read Replicas**: Balance queries can be directed to read replicas
- **Monitoring**: Integrate with existing application monitoring

## Best Practices

### Usage Patterns

```typescript
// ✅ Good: Check and decrement atomically
const result = await creditRepo.decrementAtomic(userId, cost)
if (result.success && result.data) {
  // Proceed with operation
}

// ❌ Bad: Separate check and decrement (race condition)
const balance = await creditRepo.getBalance(userId)
if (balance.data >= cost) {
  await creditRepo.decrementAtomic(userId, cost) // May fail due to race condition
}
```

### Error Handling

```typescript
// ✅ Good: Handle all possible outcomes
const result = await creditRepo.decrementAtomic(userId, cost)
if (!result.success) {
  // Handle system error
  throw new SystemError(result.error.message)
} else if (!result.data) {
  // Handle insufficient credits
  throw new InsufficientCreditsError(cost, currentBalance)
} else {
  // Success - proceed
}
```

### Transaction Usage

```typescript
// ✅ Good: Use transactions for multi-operation consistency
const transactions = [
  { userId: 'sender', amount: cost, operation: 'subtract' },
  { userId: 'recipient', amount: refund, operation: 'add' }
]
await creditRepo.performTransaction(transactions)

// ❌ Bad: Separate operations (partial failure possible)
await creditRepo.decrementAtomic('sender', cost)
await creditRepo.addCredits('recipient', refund) // May fail, leaving inconsistent state
```

## Future Enhancements

### Potential Improvements

1. **Credit History**: Track all credit transactions for audit
2. **Expiration**: Support for credit expiration dates
3. **Categories**: Different credit types (promotional, purchased, etc.)
4. **Limits**: Per-user credit limits and rate limiting
5. **Bulk Operations**: Optimized bulk credit operations

### Performance Optimizations

1. **Caching**: Cache frequently accessed balances
2. **Batching**: Batch multiple operations for efficiency
3. **Partitioning**: Partition large credit tables by user or date
4. **Read Replicas**: Direct read operations to replicas

This repository provides a robust foundation for credit management with strong consistency guarantees and excellent performance characteristics.