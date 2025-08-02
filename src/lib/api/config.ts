// API Configuration
export const apiConfig = {
  // Base configuration
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  
  // Retry configuration
  retry: {
    enabled: process.env.NEXT_PUBLIC_API_RETRY_ENABLED !== 'false',
    maxAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_MAX || '3'),
    baseDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000'),
    maxDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_MAX_DELAY || '30000'),
  },
  
  // Cache configuration
  cache: {
    enabled: process.env.NEXT_PUBLIC_API_CACHE_ENABLED !== 'false',
    defaultStaleTime: parseInt(process.env.NEXT_PUBLIC_API_CACHE_STALE_TIME || '300000'), // 5 minutes
    defaultCacheTime: parseInt(process.env.NEXT_PUBLIC_API_CACHE_TIME || '600000'), // 10 minutes
  },
  
  // Feature flags
  features: {
    logging: process.env.NODE_ENV === 'development',
    detailedErrors: process.env.NODE_ENV === 'development',
    requestDeduplication: true,
    optimisticUpdates: true,
    offlineSupport: true,
  },
  
  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT || '60'),
    maxBurstRequests: parseInt(process.env.NEXT_PUBLIC_API_BURST_LIMIT || '10'),
  },
  
  // File upload limits
  upload: {
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800'), // 50MB
    maxFiles: parseInt(process.env.NEXT_PUBLIC_MAX_FILES || '10'),
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.NEXT_PUBLIC_API_PAGE_SIZE || '20'),
    maxLimit: parseInt(process.env.NEXT_PUBLIC_API_MAX_PAGE_SIZE || '100'),
  },
  
  // Real-time configuration (for future WebSocket support)
  realtime: {
    enabled: process.env.NEXT_PUBLIC_REALTIME_ENABLED === 'true',
    reconnectDelay: parseInt(process.env.NEXT_PUBLIC_REALTIME_RECONNECT_DELAY || '5000'),
    maxReconnectAttempts: parseInt(process.env.NEXT_PUBLIC_REALTIME_MAX_RECONNECTS || '5'),
  },
}

// Storage configuration
export const storageConfig = {
  photos: {
    bucket: process.env.NEXT_PUBLIC_PHOTOS_BUCKET || 'wedding-photos',
    maxSize: 52428800, // 50MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 800 },
    },
  },
  documents: {
    bucket: process.env.NEXT_PUBLIC_DOCUMENTS_BUCKET || 'wedding-documents',
    maxSize: 10485760, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  avatars: {
    bucket: process.env.NEXT_PUBLIC_AVATARS_BUCKET || 'avatars',
    maxSize: 5242880, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
}

// External service configuration
export const externalServicesConfig = {
  twilio: {
    enabled: process.env.NEXT_PUBLIC_TWILIO_ENABLED === 'true',
    from: process.env.NEXT_PUBLIC_TWILIO_FROM_NUMBER,
  },
  resend: {
    enabled: process.env.NEXT_PUBLIC_RESEND_ENABLED === 'true',
    from: process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'noreply@weddingplanner.com',
  },
  ai: {
    photoTagging: process.env.NEXT_PUBLIC_AI_PHOTO_TAGGING === 'true',
    photoEnhancement: process.env.NEXT_PUBLIC_AI_PHOTO_ENHANCEMENT === 'true',
    vendorRecommendations: process.env.NEXT_PUBLIC_AI_VENDOR_RECOMMENDATIONS === 'true',
    budgetOptimization: process.env.NEXT_PUBLIC_AI_BUDGET_OPTIMIZATION === 'true',
  },
}

// Security configuration
export const securityConfig = {
  // Content Security Policy
  csp: {
    enabled: process.env.NODE_ENV === 'production',
    reportUri: process.env.NEXT_PUBLIC_CSP_REPORT_URI,
  },
  
  // Request validation
  validation: {
    maxRequestSize: 10485760, // 10MB
    maxUrlLength: 2048,
    allowedOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || ['*'],
  },
  
  // Authentication
  auth: {
    sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '86400000'), // 24 hours
    refreshThreshold: parseInt(process.env.NEXT_PUBLIC_REFRESH_THRESHOLD || '3600000'), // 1 hour
  },
}

// Export helper to get typed config
export function getApiConfig<T extends keyof typeof apiConfig>(key: T): typeof apiConfig[T] {
  return apiConfig[key]
}

// Export helper to check feature flags
export function isFeatureEnabled(feature: keyof typeof apiConfig.features): boolean {
  return apiConfig.features[feature] ?? false
}