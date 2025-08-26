# Task 14: Logging and Monitoring Implementation - COMPLETED

## Overview
Implemented comprehensive logging and monitoring system with structured logging, sensitive data masking, performance tracking, and operational metrics for all key application operations.

## Files Created

### Core Logging System
- **`src/lib/logging/logger.ts`** - Structured logger with context, masking, and multiple output formats
- **`src/lib/logging/config.ts`** - Environment-based logging configuration and sensitive field patterns
- **`src/lib/logging/__tests__/logger.test.ts`** - Comprehensive test suite for logging functionality

### Monitoring & Metrics
- **`src/lib/monitoring/metrics.ts`** - Metrics collection service with counters, gauges, histograms, and timers
- **`src/lib/monitoring/operations.ts`** - Operation monitoring utilities for RSVP, messaging, and credit operations
- **`src/lib/monitoring/__tests__/metrics.test.ts`** - Test suite for monitoring functionality

### API Endpoints
- **`src/app/api/metrics/route.ts`** - Metrics API endpoint with authentication and Prometheus export
- **`src/app/api/health/monitoring/route.ts`** - Monitoring health check endpoint

### Middleware & Utilities
- **`src/lib/middleware/request-id.ts`** - Request ID tracking middleware for correlation

## Key Features

### 1. Structured Logging System
```typescript
// Environment-aware logging with multiple levels
logger.debug('Debug message', context, 'ServiceName', 'operationName')
logger.info('Info message', context, 'ServiceName', 'operationName')
logger.warn('Warning message', context, 'ServiceName', 'operationName')
logger.error('Error message', error, context, 'ServiceName', 'operationName')
```

**Features:**
- ✅ **Multiple log levels**: DEBUG, INFO, WARN, ERROR
- ✅ **Structured context**: Service name, operation name, request ID
- ✅ **Environment configuration**: Different settings for dev/test/prod
- ✅ **Multiple outputs**: Console logging + structured JSON for external services

### 2. Sensitive Data Masking
```typescript
// Automatically masks sensitive information
const context = {
  email: 'user@example.com',      // → 'us***@example.com'
  phone: '1234567890',            // → '***7890'
  password: 'secret123',          // → '***MASKED***'
  token: 'abc123def456',          // → '***MASKED***'
  apiKey: 'key_123456789',        // → '***MASKED***'
}
```

**Masked Fields:**
- 📧 **Email addresses**: Partial masking (first 2 chars + domain)
- 📱 **Phone numbers**: Last 4 digits only
- 🔐 **Passwords & tokens**: Complete masking
- 🔑 **API keys & secrets**: Complete masking
- 💳 **Financial data**: Credit cards, account numbers
- 🆔 **Personal data**: SSN, addresses

### 3. Performance Monitoring
```typescript
// Automatic performance tracking with thresholds
const monitoringResult = await OperationMonitoring.monitorRSVPSubmission(
  async () => {
    // Your operation here
    return await rsvpRepo.createOrUpdate(data)
  },
  {
    inviteId: 'invite_123',
    userId: 'user_456',
    isUpdate: false,
  }
)
```

**Performance Thresholds:**
- 🗄️ **Database operations**: 1s slow, 5s warning
- 🌐 **API calls**: 2s slow, 10s warning  
- 📧 **Messaging operations**: 3s slow, 15s warning
- 📝 **RSVP operations**: 1s slow, 5s warning

### 4. Metrics Collection
```typescript
// Counters for event tracking
monitoring.incrementCounter('rsvp_submissions_successful', 1, { type: 'create' })

// Gauges for current state
monitoring.setGauge('active_users', 42, { region: 'us-east' })

// Histograms for value distributions
monitoring.recordHistogram('response_time', 150, { endpoint: '/api/rsvp' }, 'ms')

// Timers for operation duration
monitoring.startTimer('database_query')
// ... operation ...
const duration = monitoring.endTimer('database_query')
```

**Metric Types:**
- 📊 **Counters**: Cumulative values (requests, errors, successes)
- 📈 **Gauges**: Current state values (active connections, memory usage)
- 📉 **Histograms**: Value distributions (response times, payload sizes)
- ⏱️ **Timers**: Operation durations with automatic histogram recording

### 5. Operation Monitoring Integration

#### RSVP Operations
```typescript
// Integrated into RSVPService.submitRSVP()
const monitoringResult = await OperationMonitoring.monitorRSVPSubmission(
  operation,
  {
    inviteId: rsvpData.inviteId,
    userId: invite.userId,
    isUpdate: existingRSVP.success && existingRSVP.data !== null,
  }
)

// Tracks:
// - rsvp_submissions_attempted
// - rsvp_submissions_successful  
// - rsvp_submissions_failed
// - rsvp_submission_duration
```

#### Messaging Operations
```typescript
// Integrated into MessagingService.sendMessage()
const monitoringResult = await OperationMonitoring.monitorMessagingOperation(
  operation,
  {
    userId: request.userId,
    provider: pricing.provider,
    messageType: request.channel === 'email' ? 'email' : 'sms',
    recipientCount: Array.isArray(request.to) ? request.to.length : 1,
    creditCost: pricing.cost,
  }
)

// Tracks:
// - messaging_operations_attempted
// - messaging_operations_successful
// - messaging_operations_failed
// - messaging_credits_consumed
// - messaging_operation_duration
```

#### Credit Operations
```typescript
// Integrated into CreditRepository.decrementAtomic()
const monitoringResult = await OperationMonitoring.monitorCreditOperation(
  operation,
  {
    userId,
    operationType: 'deduct',
    amount: units,
    reason: 'messaging_operation',
  }
)

// Tracks:
// - credit_operations_attempted
// - credit_operations_successful
// - credit_operations_failed
// - credit_operation_duration
```

### 6. Analytics Event Tracking
```typescript
// RSVP submission analytics
AnalyticsTracking.trackRSVPSubmission({
  inviteId: rsvpData.inviteId,
  userId: invite.userId,
  isUpdate,
  attendanceStatus: rsvpData.status,
  guestCount: rsvpData.partySize,
  responseTime: monitoringResult.duration,
})

// Messaging analytics
AnalyticsTracking.trackMessagingEvent({
  userId: request.userId,
  provider: pricing.provider,
  messageType: request.channel === 'email' ? 'email' : 'sms',
  recipientCount: Array.isArray(request.to) ? request.to.length : 1,
  creditCost: pricing.cost,
  success: true,
})

// Vendor page view analytics
AnalyticsTracking.trackVendorPageView({
  vendorSlug: context.vendorSlug,
  userId: context.userId,
  isSSR: context.isSSR,
  loadTime: context.loadTime,
})
```

### 7. Request ID Correlation
```typescript
// Automatic request ID generation and tracking
export function withRequestIdTracking<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest
    const requestId = getRequestId(request) || generateRequestId()
    
    logger.setRequestId(requestId)
    
    try {
      const response = await handler(...args)
      response.headers.set('x-request-id', requestId)
      return response
    } finally {
      logger.clearRequestId()
    }
  }
}
```

**Request Correlation:**
- 🔗 **Unique request IDs**: Generated for each API request
- 📋 **Cross-service tracking**: Same ID across all logs for a request
- 🔍 **Header propagation**: Request ID included in response headers
- 🧵 **Thread-safe**: Proper cleanup after request completion

### 8. Health Monitoring
```typescript
// GET /api/health/monitoring
{
  "status": "healthy",
  "monitoring": {
    "metricsCollected": true,
    "totalMetrics": 1247,
    "activeTimers": 2,
    "counters": 15,
    "gauges": 8
  },
  "errorRates": {
    "rsvp": 2.1,
    "messaging": 0.8,
    "credits": 0.0,
    "database": 1.2
  },
  "systemInfo": {
    "uptime": 3600,
    "memoryUsage": {
      "rss": 128,
      "heapUsed": 64,
      "heapTotal": 96
    }
  }
}
```

### 9. Metrics API & Prometheus Export
```typescript
// GET /api/metrics (authenticated)
{
  "operational": {
    "rsvp": {
      "attempted": 1250,
      "successful": 1225,
      "failed": 25,
      "successRate": 98.0
    },
    "messaging": {
      "attempted": 450,
      "successful": 446,
      "failed": 4,
      "creditsConsumed": 892,
      "successRate": 99.11
    }
  }
}

// GET /api/metrics/prometheus (authenticated)
# TYPE rsvp_submissions_attempted counter
rsvp_submissions_attempted 1250
# TYPE messaging_operations_successful counter  
messaging_operations_successful 446
```

## Environment Configuration

### Development
```typescript
{
  level: LogLevel.DEBUG,
  enableStructured: false,
  maskSensitiveData: false,
  enableRequestTracking: true,
  enablePerformanceLogging: true,
}
```

### Production
```typescript
{
  level: LogLevel.INFO,
  enableStructured: true,
  maskSensitiveData: true,
  enableRequestTracking: true,
  enablePerformanceLogging: true,
}
```

### Test
```typescript
{
  level: LogLevel.WARN,
  enableConsole: false,
  enableStructured: false,
  enableRequestTracking: false,
  enablePerformanceLogging: false,
}
```

## Service-Level Configuration
```typescript
services: {
  RSVPService: { enabled: true },
  MessagingService: { enabled: true },
  CreditRepository: { enabled: true },
  VendorService: { enabled: true },
  BudgetService: { enabled: true },
  AuthService: { enabled: true },
  DatabaseRepository: { enabled: true, level: LogLevel.WARN },
  MonitoringService: { enabled: true, level: LogLevel.INFO },
}
```

## Integration Examples

### 1. API Route Integration
```typescript
import { withRequestIdTracking } from '@/lib/middleware/request-id'
import { logger } from '@/lib/logging/logger'

export const POST = withRequestIdTracking(async (request: NextRequest) => {
  logger.info('API request received', { endpoint: '/api/rsvp' }, 'RSVPHandler', 'submitRSVP')
  
  try {
    // Your API logic here
    const result = await rsvpService.submitRSVP(data)
    
    logger.info('API request completed successfully', { 
      endpoint: '/api/rsvp',
      duration: '150ms' 
    }, 'RSVPHandler', 'submitRSVP')
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error('API request failed', error, { 
      endpoint: '/api/rsvp' 
    }, 'RSVPHandler', 'submitRSVP')
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
```

### 2. Service Integration
```typescript
import { logger } from '@/lib/logging/logger'
import { OperationMonitoring } from '@/lib/monitoring/operations'

export class MyService {
  async performOperation(data: any) {
    const result = await OperationMonitoring.monitorDatabaseOperation(
      async () => {
        logger.info('Starting database operation', { table: 'users' }, 'MyService', 'performOperation')
        
        const result = await this.db.users.create({ data })
        
        logger.info('Database operation completed', { 
          table: 'users',
          recordId: result.id 
        }, 'MyService', 'performOperation')
        
        return result
      },
      {
        table: 'users',
        operationType: 'create',
        userId: data.userId,
      }
    )
    
    return result
  }
}
```

## Monitoring Dashboard Data

### Key Metrics Tracked
- 📊 **RSVP Operations**: Submissions, success rate, response times
- 📧 **Messaging Operations**: Sends, failures, credit consumption, provider performance
- 💰 **Credit Operations**: Deductions, additions, balance checks, atomic operation success
- 🗄️ **Database Operations**: Query performance, connection health, error rates
- 🌐 **API Performance**: Response times, error rates, request volumes
- 👥 **User Analytics**: Page views, feature usage, conversion rates

### Error Tracking
- 🚨 **Automatic error categorization**: By service, operation type, error type
- 📈 **Error rate monitoring**: Real-time calculation with thresholds
- 🔍 **Error context**: Full context and stack traces (in development)
- 📊 **Error trends**: Historical error rate tracking

### Performance Insights
- ⚡ **Operation timing**: Automatic duration tracking for all monitored operations
- 🎯 **Performance thresholds**: Configurable slow/warning thresholds per operation type
- 📊 **Performance histograms**: Distribution analysis of operation times
- 🔍 **Performance bottlenecks**: Identification of slow operations

## Benefits

### 1. Operational Visibility
- ✅ **Real-time monitoring**: Live metrics and health status
- ✅ **Historical analysis**: Trend analysis and performance tracking
- ✅ **Error tracking**: Comprehensive error monitoring and alerting
- ✅ **Performance insights**: Bottleneck identification and optimization

### 2. Security & Compliance
- ✅ **Data protection**: Automatic masking of sensitive information
- ✅ **Audit trails**: Complete operation logging for compliance
- ✅ **Access control**: Authenticated access to metrics and logs
- ✅ **Privacy compliance**: GDPR/CCPA-friendly data handling

### 3. Developer Experience
- ✅ **Structured logging**: Consistent, searchable log format
- ✅ **Request correlation**: Easy debugging across services
- ✅ **Performance profiling**: Built-in timing for optimization
- ✅ **Test-friendly**: Configurable logging levels for testing

### 4. Production Readiness
- ✅ **External integration**: Prometheus export for monitoring systems
- ✅ **Health checks**: Comprehensive system health monitoring
- ✅ **Scalable architecture**: Efficient metrics collection and storage
- ✅ **Zero-downtime monitoring**: Non-blocking metrics collection

## Next Steps

With Task 14 completed, the application now has:
- ✅ **Comprehensive logging system** with sensitive data protection
- ✅ **Real-time monitoring** of all key operations
- ✅ **Performance tracking** with automatic threshold monitoring
- ✅ **Analytics event tracking** for business insights
- ✅ **Health monitoring** with error rate tracking
- ✅ **Production-ready observability** with external system integration

Ready to proceed with **Task 15: End-to-End Testing Suite** implementation.

## Usage Examples

### Viewing Metrics
```bash
# Get application metrics (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:3004/api/metrics

# Get Prometheus metrics (requires authentication)  
curl -H "Authorization: Bearer <token>" http://localhost:3004/api/metrics/prometheus

# Check monitoring health
curl http://localhost:3004/api/health/monitoring
```

### Log Analysis
```bash
# Development: View logs in console with full context
npm run dev

# Production: Structured JSON logs for external systems
NODE_ENV=production npm start
```

The logging and monitoring system provides complete observability into the application's behavior, performance, and health, enabling proactive issue detection and resolution.