# Enterprise API Versioning Guide

## Overview

This guide describes the enterprise-grade API versioning system implemented for the Wedding Planner application. The system supports multiple versioning strategies, automatic migration between versions, and comprehensive deprecation management.

## Features

- **Multiple Versioning Strategies**: URL-based, header-based, query parameter-based, or mixed
- **Version Migration**: Automatic data transformation between API versions
- **Deprecation Management**: Sunset dates, warnings, and migration paths
- **Version Validation**: Automatic validation of supported versions
- **Backward Compatibility**: Support for multiple versions simultaneously
- **Type Safety**: Full TypeScript support with type-safe handlers

## Versioning Strategies

### 1. URL-Based Versioning

```
GET /api/v1/users
GET /api/v2/users
GET /api/v2.1/users
```

### 2. Header-Based Versioning

```
GET /api/users
X-API-Version: 2.0
```

### 3. Query Parameter Versioning

```
GET /api/users?api-version=2.0
```

### 4. Mixed Strategy (Default)

The system checks in order:
1. URL path
2. Request header
3. Query parameter
4. Falls back to default version

## Implementation

### Basic Setup

```typescript
import { ApiVersioning, defaultVersioningConfig } from '@/infrastructure/api/versioning/ApiVersioning';

// Configure versioning
const versioningConfig = {
  defaultVersion: { major: 2, minor: 0 },
  supportedVersions: [
    { major: 1, minor: 0 },
    { major: 2, minor: 0 },
    { major: 2, minor: 1 },
  ],
  deprecatedVersions: [
    { major: 1, minor: 0 }, // Will be sunset in 6 months
  ],
  strategy: 'mixed',
};
```

### Creating Versioned Endpoints

```typescript
import { createVersionedHandler } from '@/infrastructure/api/versioning/ApiVersioning';

export const GET = createVersionedHandler(
  {
    '1.0': async (request, version) => {
      // Version 1.0 logic
      return NextResponse.json({ version: '1.0', data: 'legacy' });
    },
    
    '2.0': async (request, version) => {
      // Version 2.0 logic
      return NextResponse.json({ version: '2.0', data: 'current' });
    },
    
    '2.1': async (request, version) => {
      // Version 2.1 logic
      return NextResponse.json({ version: '2.1', data: 'latest' });
    },
  },
  versioningConfig
);
```

### Version Migration

```typescript
import { VersionMigrator } from '@/infrastructure/api/versioning/ApiVersioning';

const migrator = new VersionMigrator();

// Register migration from v1 to v2
migrator.registerMigration({
  from: { major: 1, minor: 0 },
  to: { major: 2, minor: 0 },
  migrateRequest: (v1Data) => {
    // Transform v1 request to v2 format
    return {
      ...v1Data,
      newField: 'default value',
    };
  },
  migrateResponse: (v2Data) => {
    // Transform v2 response back to v1 format
    const { newField, ...v1Data } = v2Data;
    return v1Data;
  },
});
```

### Using Middleware

```typescript
// middleware.ts
import { versioningMiddleware } from '@/infrastructure/api/middleware/apiVersioning';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const versionResponse = await versioningMiddleware(request);
    if (versionResponse) return versionResponse;
  }
  
  return NextResponse.next();
}
```

### With Route Handlers

```typescript
// app/api/users/route.ts
import { withApiVersion } from '@/infrastructure/api/middleware/apiVersioning';

export const GET = withApiVersion(async (request, version) => {
  // Version is automatically extracted and validated
  
  if (version.major === 1) {
    // V1 logic
  } else if (version.major === 2) {
    // V2 logic
  }
  
  return NextResponse.json({ version: `${version.major}.${version.minor}` });
});
```

## Response Headers

The system automatically adds version-related headers:

```
X-API-Version: 2.0
X-API-Version-Supported: 1.0, 2.0, 2.1
X-API-Version-Deprecated: true (if using deprecated version)
X-API-Version-Sunset-Date: 2024-06-01T00:00:00Z
X-API-Version-Latest: 2.1
Warning: 299 - "API version 1.0 is deprecated"
```

## Best Practices

### 1. Version Planning

- Use semantic versioning (major.minor.patch)
- Major versions for breaking changes
- Minor versions for new features
- Patch versions for bug fixes (optional)

### 2. Deprecation Strategy

```typescript
// Give users 6 months notice before sunset
const config = {
  deprecatedVersions: [
    { major: 1, minor: 0 }, // Deprecated now
  ],
  sunsetVersions: [
    { major: 0, minor: 9 }, // No longer available
  ],
};
```

### 3. Documentation

Document version differences clearly:

```typescript
/**
 * @api {get} /api/users Get Users
 * @apiVersion 2.0.0
 * 
 * @apiDescription
 * v2.0 Changes:
 * - Added 'profile' field to response
 * - Renamed 'name' to 'firstName' and 'lastName'
 * - Added optional 'includeProfile' query parameter
 * 
 * @apiDeprecated use version 2.1
 */
```

### 4. Client Communication

```typescript
// Check version headers in response
const response = await fetch('/api/users');
const currentVersion = response.headers.get('X-API-Version');
const isDeprecated = response.headers.get('X-API-Version-Deprecated') === 'true';

if (isDeprecated) {
  console.warn('Using deprecated API version:', currentVersion);
  const sunsetDate = response.headers.get('X-API-Version-Sunset-Date');
  console.warn('This version will be removed on:', sunsetDate);
}
```

## Testing Versioned APIs

```typescript
// Test different versions
describe('API Versioning', () => {
  it('should handle v1 requests', async () => {
    const response = await fetch('/api/v1/users');
    expect(response.headers.get('X-API-Version')).toBe('1.0');
  });
  
  it('should handle v2 requests', async () => {
    const response = await fetch('/api/users', {
      headers: { 'X-API-Version': '2.0' }
    });
    expect(response.headers.get('X-API-Version')).toBe('2.0');
  });
  
  it('should reject sunset versions', async () => {
    const response = await fetch('/api/users?api-version=0.9');
    expect(response.status).toBe(410); // Gone
  });
});
```

## Migration Timeline Example

```
Version 1.0 - Released January 2023
  ↓
Version 2.0 - Released June 2023
  - Version 1.0 marked as deprecated
  - 6-month sunset notice given
  ↓
Version 2.1 - Released September 2023
  - Bug fixes and minor features
  ↓
January 2024
  - Version 1.0 sunset (returns 410 Gone)
  - Only versions 2.0 and 2.1 supported
```

## Error Handling

The system provides clear error messages for version issues:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "API version 3.0 is not supported",
    "details": {
      "version": "3.0",
      "supportedVersions": ["1.0", "2.0", "2.1"],
      "latestVersion": "2.1"
    }
  }
}
```

## Configuration Reference

```typescript
interface VersionConfig {
  // Default version to use when none specified
  defaultVersion: ApiVersion;
  
  // List of all supported versions
  supportedVersions: ApiVersion[];
  
  // Versions that are deprecated but still functional
  deprecatedVersions?: ApiVersion[];
  
  // Versions that are no longer available
  sunsetVersions?: ApiVersion[];
  
  // Versioning strategy to use
  strategy: 'url' | 'header' | 'query' | 'mixed';
  
  // Header name for version (default: 'X-API-Version')
  headerName?: string;
  
  // Query parameter name (default: 'api-version')
  queryParam?: string;
}
```

## Monitoring and Analytics

Track version usage to plan deprecations:

```typescript
logger.info('API version usage', {
  version: apiVersion,
  endpoint: request.url,
  deprecated: isDeprecated,
  timestamp: new Date().toISOString(),
});
```

Use this data to:
- Track adoption of new versions
- Monitor deprecated version usage
- Plan sunset dates based on actual usage
- Identify clients that need to upgrade