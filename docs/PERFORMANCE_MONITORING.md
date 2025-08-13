# Performance Monitoring Documentation

This document outlines the comprehensive performance monitoring and logging system implemented for the Wedding Planner v2 application.

## Overview

The monitoring system provides:
- **Comprehensive logging** with structured data and performance metrics
- **API monitoring** with request/response tracking and analytics
- **Cache performance** monitoring and optimization recommendations
- **Real-time health checks** and system status reporting
- **Automated alerting** for performance degradation and errors

## Architecture

### Core Components

1. **Logger** - Structured logging with performance tracking
2. **ApiMonitor** - API request/response monitoring and metrics
3. **PerformanceMonitor** - Cache and query performance tracking
4. **BaseRepository** - Automatic monitoring for all database operations
5. **Monitoring Dashboard API** - Real-time metrics and reporting

### Data Flow

```
API Request → ApiMonitor → Repository → Logger/PerformanceMonitor → Dashboard
     ↓              ↓           ↓              ↓                    ↓
 Request ID    Metrics    Cache Stats    Structured Logs    Real-time Analytics
```

## Logger System

### Features

- **5 Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Structured Logging**: JSON-formatted with context and metadata
- **Performance Metrics**: Automatic duration and memory tracking
- **Sensitive Data Protection**: Automatic redaction of passwords, tokens, etc.
- **Query Logging**: Database operation performance tracking
- **User Activity Tracking**: Action logging with user context

### Usage Examples

```typescript
import { logger } from '@/lib/monitoring/Logger'

// Basic logging
logger.info('User logged in successfully', { userId: '123', method: 'email' })
logger.error('Database connection failed', error, { host: 'localhost', port: 5432 })

// Specialized logging
logger.logQuery('findUserById', 45, true, { userId: '123', cached: false })
logger.logApiCall('GET', '/api/users', 200, 120, { userId: '123' })
logger.logUserAction('123', 'create_guest', { guestId: '456', coupleId: '789' })
```

### Configuration

```typescript
const logger = Logger.getInstance({
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  maxEntries: 10000,
  includeSensitive: false
})
```

## API Monitoring

### Features

- **Request/Response Tracking**: Complete API lifecycle monitoring
- **Performance Metrics**: Response times, memory usage, error rates
- **Request Correlation**: Unique request IDs for tracing
- **Error Analysis**: Automatic error categorization and reporting
- **Client Information**: IP addresses, user agents, user identification

### Automatic Monitoring

All API routes are automatically monitored when using the wrapper:

```typescript
import { apiMonitor } from '@/lib/monitoring/ApiMonitor'

export async function GET(request: NextRequest) {
  return apiMonitor.wrapHandler(async (req) => {
    // Your API logic here
    return NextResponse.json({ success: true })
  }, 'getUserData')(request)
}
```

### Manual Monitoring

```typescript
// Record custom metrics
apiMonitor.recordMetrics({
  requestId: 'req_123',
  method: 'GET',
  path: '/api/custom',
  statusCode: 200,
  duration: 150,
  memoryUsage: 1024,
  timestamp: new Date(),
  userId: '123'
})

// Get analytics
const stats = apiMonitor.getStats({
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date()
})
```

## Cache Performance Monitoring

### Automatic Tracking

The BaseRepository automatically tracks:
- **Query Performance**: Execution times and success rates
- **Cache Effectiveness**: Hit/miss ratios and performance gains
- **Memory Usage**: Cache size and memory impact
- **Slow Queries**: Operations exceeding performance thresholds

### Repository Integration

```typescript
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user') // Automatic monitoring enabled
  }

  async findById(id: string): Promise<User | null> {
    return this.executeQueryWithCache(
      `user:id:${id}`,
      () => prisma.user.findUnique({ where: { id } }),
      { cacheType: 'user', tags: ['user', `user:${id}`] }
    )
    // Automatic logging: query time, cache hit/miss, memory usage
  }
}
```

### Performance Recommendations

The system automatically generates recommendations based on:
- Cache hit rates below 60%
- Average query times above 500ms
- High number of slow queries
- Excessive memory usage

## Monitoring Dashboard API

### Endpoints

#### GET `/api/admin/monitoring`

**Parameters:**
- `report`: `overview` | `api` | `performance` | `logs` | `health` | `export`
- `timeRange`: `1h` | `24h` | `7d` | `30d`

**Examples:**

```bash
# System overview
GET /api/admin/monitoring?report=overview&timeRange=24h

# API analytics
GET /api/admin/monitoring?report=api&timeRange=1h

# Performance metrics
GET /api/admin/monitoring?report=performance

# Recent logs
GET /api/admin/monitoring?report=logs&timeRange=1h

# Health status
GET /api/admin/monitoring?report=health

# Export all data
GET /api/admin/monitoring?report=export&timeRange=7d
```

### Response Examples

#### Overview Report
```json
{
  "success": true,
  "data": {
    "timestamp": "2023-12-07T10:30:00.000Z",
    "timeRange": "24h",
    "system": {
      "uptime": 86400,
      "memory": { "heapUsed": 50331648, "heapTotal": 134217728 },
      "cpu": { "user": 1000000, "system": 500000 }
    },
    "api": {
      "totalRequests": 1250,
      "averageResponseTime": 125.5,
      "errorRate": 2.4,
      "slowestEndpoints": [...]
    },
    "cache": {
      "repository": { "size": 150, "hitRatio": 0.75 },
      "userData": { "size": 50, "hitRatio": 0.85 }
    },
    "performance": {
      "cacheHitRate": 0.75,
      "avgQueryTime": 45.2,
      "slowQueries": [...]
    },
    "health": {
      "api": true,
      "cache": true,
      "memory": true,
      "errors": false
    }
  }
}
```

#### Health Report
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "uptime": 86400,
    "checks": {
      "api": {
        "healthy": true,
        "details": {
          "errorRate": 2.1,
          "avgResponseTime": 120.5,
          "totalRequests": 500
        }
      },
      "cache": {
        "healthy": true,
        "details": {
          "hitRate": 0.75,
          "avgQueryTime": 45.2
        }
      },
      "memory": {
        "healthy": true,
        "details": {
          "heapUsed": 50331648,
          "heapTotal": 134217728,
          "usagePercentage": 37.5
        }
      }
    },
    "recommendations": []
  }
}
```

## Performance Optimization

### Query Optimization

The system automatically identifies:
- **Slow Queries**: Operations > 1000ms
- **Frequent Queries**: High-volume operations that benefit from caching
- **Memory-Intensive Operations**: Queries with high memory impact
- **Cache Misses**: Operations that could benefit from better caching

### Recommendations Engine

Based on metrics, the system provides:

1. **Cache Optimization**
   - Increase TTL for stable data
   - Implement more aggressive caching for frequently accessed data
   - Add cache warming for predictable access patterns

2. **Query Optimization**
   - Database index suggestions
   - Query refactoring recommendations
   - Bulk operation opportunities

3. **Memory Management**
   - Cache size optimization
   - Memory leak detection
   - Garbage collection optimization

4. **API Performance**
   - Response payload optimization
   - Request batching opportunities
   - Rate limiting recommendations

## Alerting and Notifications

### Health Thresholds

- **API Error Rate**: > 5%
- **Cache Hit Rate**: < 60%
- **Memory Usage**: > 80%
- **Average Query Time**: > 500ms
- **Recent Errors**: > 10 in 1 hour

### Alert Examples

```javascript
// Health check results
{
  healthy: false,
  checks: {
    api: { healthy: false, details: { errorRate: 7.2 } },
    cache: { healthy: true, details: { hitRate: 0.78 } }
  },
  recommendations: [
    "API error rate is high (7.2%). Investigate error logs.",
    "Consider implementing circuit breaker pattern for failing endpoints."
  ]
}
```

## Integration Examples

### Custom API Route with Monitoring

```typescript
import { apiMonitor } from '@/lib/monitoring/ApiMonitor'
import { logger } from '@/lib/monitoring/Logger'

export async function POST(request: NextRequest) {
  return apiMonitor.wrapHandler(async (req) => {
    const startTime = performance.now()
    
    try {
      const body = await req.json()
      
      // Your business logic
      const result = await processUserData(body)
      
      // Log successful operation
      logger.info('User data processed successfully', {
        userId: body.userId,
        operationType: 'data_processing',
        recordsProcessed: result.count
      })
      
      return NextResponse.json({ 
        success: true, 
        data: result 
      })
      
    } catch (error) {
      // Error automatically logged by apiMonitor
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      )
    }
  }, 'processUserData')(request)
}
```

### Repository with Custom Monitoring

```typescript
export class CustomRepository extends BaseRepository<CustomEntity> {
  constructor() {
    super('customEntity')
  }

  async findComplex(params: ComplexParams): Promise<CustomEntity[]> {
    const startTime = performance.now()
    
    try {
      const result = await this.executeQueryWithCache(
        `custom:complex:${JSON.stringify(params)}`,
        async () => {
          // Complex database operation
          const data = await this.performComplexQuery(params)
          
          // Log custom metrics
          logger.debug('Complex query executed', {
            entityName: this.entityName,
            params,
            resultCount: data.length,
            queryComplexity: 'high'
          })
          
          return data
        },
        { 
          cacheType: 'repository', 
          tags: ['customEntity', 'complex', `user:${params.userId}`] 
        }
      )
      
      const duration = performance.now() - startTime
      
      // Log successful operation with custom context
      logger.info('Complex query completed', {
        entityName: this.entityName,
        duration,
        resultCount: result.length,
        cacheUsed: duration < 10 // Likely cached if very fast
      })
      
      return result
      
    } catch (error) {
      // Error automatically logged by BaseRepository
      throw error
    }
  }
}
```

## Monitoring Best Practices

### 1. Log Levels

- **DEBUG**: Development debugging, cache operations, query details
- **INFO**: User actions, successful operations, system events
- **WARN**: Performance issues, validation warnings, recoverable errors
- **ERROR**: Operation failures, API errors, database issues
- **CRITICAL**: System failures, security issues, data corruption

### 2. Context Information

Always include relevant context:
```typescript
logger.info('Guest RSVP updated', {
  guestId,
  coupleId,
  userId,
  rsvpStatus: 'attending',
  previousStatus: 'pending',
  source: 'web_app'
})
```

### 3. Performance Tracking

Track critical operations:
```typescript
const startTime = performance.now()
const result = await expensiveOperation()
const duration = performance.now() - startTime

logger.logQuery('expensiveOperation', duration, true, {
  recordsProcessed: result.length,
  complexity: 'high',
  optimized: duration < 1000
})
```

### 4. Error Handling

Provide comprehensive error context:
```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Risky operation failed', error, {
    operationId: 'risky_op_123',
    userId,
    attemptCount: 3,
    lastAttempt: new Date(),
    context: operationContext
  })
  throw error
}
```

### 5. Cache Monitoring

Monitor cache effectiveness:
```typescript
const cacheKey = `expensive:${params.id}`
const cached = cache.get(cacheKey)

if (cached) {
  logger.logCacheOperation('READ', cacheKey, true, {
    size: JSON.stringify(cached).length,
    age: Date.now() - cached.timestamp
  })
} else {
  const result = await expensiveComputation(params)
  cache.set(cacheKey, result)
  
  logger.logCacheOperation('WRITE', cacheKey, false, {
    size: JSON.stringify(result).length,
    computationTime: performance.now() - startTime
  })
}
```

## Troubleshooting Guide

### High API Error Rate

1. Check error logs for patterns:
   ```bash
   GET /api/admin/monitoring?report=logs&timeRange=1h
   ```

2. Identify failing endpoints:
   ```bash
   GET /api/admin/monitoring?report=api&timeRange=1h
   ```

3. Review system health:
   ```bash
   GET /api/admin/monitoring?report=health
   ```

### Poor Cache Performance

1. Review cache statistics:
   ```bash
   GET /api/admin/monitoring?report=performance
   ```

2. Analyze cache patterns:
   ```bash
   GET /api/admin/cache?action=stats
   ```

3. Adjust cache configuration based on recommendations

### Memory Issues

1. Monitor memory trends over time
2. Check for memory leaks in logs
3. Review cache sizes and eviction policies
4. Analyze slow queries that might be memory-intensive

### Performance Degradation

1. Review slow query logs
2. Check cache hit rates
3. Analyze API response times
4. Monitor system resource usage

## Future Enhancements

1. **External Monitoring Integration** - Connect with APM tools like New Relic, Datadog
2. **Custom Dashboards** - Build React-based monitoring dashboards
3. **Alerting System** - Email/Slack notifications for health issues
4. **Predictive Analytics** - ML-based performance prediction and optimization
5. **Distributed Tracing** - Request tracing across microservices
6. **Custom Metrics** - Business-specific KPIs and metrics

This monitoring system provides comprehensive visibility into application performance, enabling proactive optimization and rapid issue resolution.