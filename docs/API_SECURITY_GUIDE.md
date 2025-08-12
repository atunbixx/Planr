# Enterprise API Security Guide

## Overview

This guide describes the comprehensive security headers and CORS configuration implemented for the Wedding Planner API. The system provides defense-in-depth security with flexible configuration options for different environments and use cases.

## Security Headers

### Default Security Headers

The following security headers are applied to all responses by default:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Restrictive CSP | Prevents XSS and data injection |
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME type sniffing |
| X-XSS-Protection | 1; mode=block | Enables XSS filter (legacy browsers) |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer information |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Enforces HTTPS |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Restricts browser features |

### Content Security Policy (CSP)

Default CSP configuration:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https: wss:;
```

For production, use stricter CSP:
```typescript
contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self';"
```

### Strict Transport Security (HSTS)

HSTS is automatically enabled in production:
- Max age: 1 year (31536000 seconds)
- Includes subdomains
- Preload ready

## CORS Configuration

### Default CORS Settings

```typescript
cors: {
  origin: process.env.NEXT_PUBLIC_APP_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version', 'X-Correlation-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
}
```

### CORS Strategies

#### 1. Single Origin
```typescript
cors: {
  origin: 'https://weddingplanner.com',
  credentials: true,
}
```

#### 2. Multiple Origins
```typescript
cors: {
  origin: ['https://app.weddingplanner.com', 'https://admin.weddingplanner.com'],
  credentials: true,
}
```

#### 3. Dynamic Origin Validation
```typescript
cors: {
  origin: (origin) => {
    const allowedPatterns = [
      /^https:\/\/.*\.weddingplanner\.com$/,
      /^http:\/\/localhost:\d+$/,
    ];
    return allowedPatterns.some(pattern => pattern.test(origin));
  },
}
```

#### 4. Public API (Allow All)
```typescript
cors: {
  origin: '*',
  credentials: false, // Cannot use credentials with wildcard
  methods: ['GET'],
}
```

## Implementation

### Automatic Application

Security headers are automatically applied in `middleware.ts`:

```typescript
// All requests get security headers
const securityHeaders = pathname.startsWith('/api/') 
  ? apiSecurityHeaders 
  : defaultSecurityHeaders;

return securityHeaders.addHeaders(response, request);
```

### Route-Specific Security

Apply custom security configuration to specific routes:

```typescript
import { withSecurityHeaders } from '@/infrastructure/api/middleware/securityHeaders';

export const GET = withSecurityHeaders(
  async (request) => {
    // Your route logic
    return NextResponse.json({ data: 'secure' });
  },
  {
    // Custom security configuration
    cors: {
      origin: 'https://trusted-domain.com',
      credentials: true,
    },
    customHeaders: {
      'X-Custom-Security': 'enabled',
    },
  }
);
```

### Manual Security Headers

For fine-grained control:

```typescript
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: 'secure' });
  
  // Add specific headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
}
```

## Common Patterns

### 1. Public API Endpoint

```typescript
export const publicEndpoint = withSecurityHeaders(
  async (request) => {
    return NextResponse.json({ public: true });
  },
  {
    cors: {
      origin: '*',
      methods: ['GET'],
      maxAge: 86400,
    },
    // Remove sensitive headers
    strictTransportSecurity: false,
  }
);
```

### 2. Authenticated API

```typescript
export const authenticatedEndpoint = withSecurityHeaders(
  async (request) => {
    // Verify authentication
    const token = request.headers.get('Authorization');
    if (!verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ secure: true });
  },
  {
    cors: {
      origin: 'https://app.weddingplanner.com',
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  }
);
```

### 3. Webhook Endpoint

```typescript
export const webhookEndpoint = withSecurityHeaders(
  async (request) => {
    // Verify webhook signature
    const signature = request.headers.get('X-Webhook-Signature');
    if (!verifySignature(request, signature)) {
      return NextResponse.json({ error: 'Invalid' }, { status: 401 });
    }
    
    return NextResponse.json({ received: true });
  },
  {
    cors: false, // No CORS for webhooks
    contentSecurityPolicy: false,
    customHeaders: {
      'X-Webhook-Processed': 'true',
    },
  }
);
```

### 4. File Download

```typescript
export const downloadEndpoint = withSecurityHeaders(
  async (request) => {
    const file = await generateFile();
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="wedding-plan.pdf"',
      },
    });
  },
  {
    customHeaders: {
      'Cache-Control': 'no-cache, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  }
);
```

## Environment-Specific Configuration

### Development

```typescript
const devSecurityHeaders = new SecurityHeaders({
  cors: {
    origin: '*', // Allow all origins
    credentials: true,
  },
  strictTransportSecurity: false, // No HSTS
  contentSecurityPolicy: false, // Relaxed CSP
});
```

### Staging

```typescript
const stagingSecurityHeaders = new SecurityHeaders({
  cors: {
    origin: ['https://*.vercel.app', 'https://staging.weddingplanner.com'],
    credentials: true,
  },
  customHeaders: {
    'X-Environment': 'staging',
    'X-Robots-Tag': 'noindex, nofollow',
  },
});
```

### Production

```typescript
const productionSecurityHeaders = new SecurityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self';",
  cors: {
    origin: 'https://weddingplanner.com',
    credentials: true,
  },
  strictTransportSecurity: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
});
```

## Security Best Practices

### 1. Principle of Least Privilege

Only allow what's necessary:
```typescript
// Bad: Too permissive
cors: { origin: '*', methods: '*' }

// Good: Specific allowlist
cors: { 
  origin: 'https://app.weddingplanner.com',
  methods: ['GET', 'POST']
}
```

### 2. Defense in Depth

Layer multiple security measures:
```typescript
{
  contentSecurityPolicy: "strict CSP here",
  frameOptions: 'DENY',
  contentTypeOptions: true,
  xssProtection: true,
  cors: { /* strict CORS */ },
}
```

### 3. Regular Security Audits

```typescript
// Log security events
onSecurityViolation: (violation) => {
  logger.warn('Security violation detected', {
    type: violation.type,
    directive: violation.violatedDirective,
    uri: violation.blockedURI,
  });
}
```

### 4. Validate Origins Dynamically

```typescript
const allowedOrigins = new Set([
  'https://weddingplanner.com',
  'https://app.weddingplanner.com',
]);

cors: {
  origin: (origin) => {
    // Check against database or configuration
    return allowedOrigins.has(origin) || 
           isValidSubdomain(origin);
  }
}
```

## Testing Security Headers

### Unit Tests

```typescript
describe('Security Headers', () => {
  it('should include security headers', async () => {
    const response = await GET(mockRequest);
    
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toBeDefined();
  });
  
  it('should handle CORS preflight', async () => {
    const request = new Request('https://api.example.com', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://app.example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    
    const response = await middleware(request);
    
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
  });
});
```

### Security Testing Tools

1. **Security Headers Check**
   ```bash
   curl -I https://your-api.com/api/endpoint | grep -E "X-Frame-Options|X-Content-Type"
   ```

2. **CORS Testing**
   ```bash
   curl -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://your-api.com/api/endpoint
   ```

3. **CSP Validation**
   - Use browser developer tools
   - Check console for CSP violations
   - Use online CSP validators

## Troubleshooting

### Common Issues

1. **CORS Errors**
   ```
   Access to fetch at 'https://api.com' from origin 'https://app.com' has been blocked by CORS policy
   ```
   **Solution**: Add origin to allowed list or check credentials setting

2. **CSP Violations**
   ```
   Refused to load the script because it violates the Content Security Policy directive
   ```
   **Solution**: Update CSP to allow required resources

3. **Mixed Content**
   ```
   Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
   ```
   **Solution**: Ensure all resources use HTTPS

### Debug Mode

Enable debug logging for security headers:

```typescript
const securityHeaders = new SecurityHeaders({
  debug: true,
  onViolation: (details) => {
    console.log('Security violation:', details);
  },
});
```

## Compliance

The security configuration helps meet various compliance requirements:

- **OWASP Top 10**: Addresses multiple security risks
- **PCI DSS**: Secure transmission requirements
- **GDPR**: Data protection through security headers
- **SOC 2**: Security controls for service organizations

## Migration Guide

### From Basic Headers to Enterprise Security

1. **Phase 1**: Add basic security headers
   ```typescript
   response.headers.set('X-Frame-Options', 'DENY');
   ```

2. **Phase 2**: Implement CORS
   ```typescript
   response.headers.set('Access-Control-Allow-Origin', origin);
   ```

3. **Phase 3**: Add CSP
   ```typescript
   response.headers.set('Content-Security-Policy', csp);
   ```

4. **Phase 4**: Use security middleware
   ```typescript
   export default withSecurityHeaders(handler, config);
   ```

## Monitoring

Track security header effectiveness:

```typescript
// Log security metrics
logger.info('Security headers applied', {
  endpoint: request.url,
  corsOrigin: request.headers.get('Origin'),
  securityHeaders: Array.from(response.headers.keys()),
});

// Monitor CSP violations
addEventListener('securitypolicyviolation', (e) => {
  logger.warn('CSP violation', {
    violatedDirective: e.violatedDirective,
    blockedURI: e.blockedURI,
    lineNumber: e.lineNumber,
  });
});
```