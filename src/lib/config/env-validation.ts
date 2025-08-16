/**
 * Environment Variable Validation
 * Ensures all required environment variables are set with proper values
 */

import { z } from 'zod';

// Define the environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  
  // Security - Critical secrets that must not use defaults
  QR_CODE_SECRET: z.string().min(32, 'QR_CODE_SECRET must be at least 32 characters').refine(
    val => val !== 'default-secret' && !val.includes('secret') && !val.includes('default'),
    'QR_CODE_SECRET must be a secure value, not a default or placeholder'
  ).optional(),
  
  WEBHOOK_SECRET: z.string().min(16, 'WEBHOOK_SECRET must be at least 16 characters').refine(
    val => val !== 'your-webhook-secret' && !val.includes('secret') && !val.includes('your'),
    'WEBHOOK_SECRET must be a secure value, not a placeholder'
  ).optional(),
  
  WEBSOCKET_JWT_SECRET: z.string().min(32, 'WEBSOCKET_JWT_SECRET must be at least 32 characters').refine(
    val => val !== 'your-websocket-secret-key' && !val.includes('secret') && !val.includes('your'),
    'WEBSOCKET_JWT_SECRET must be a secure value, not a placeholder'
  ).optional(),
  
  // Optional but validated if present
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  REDIS_PASSWORD: z.string().min(1).optional(),
  BACKUP_ENCRYPTION_KEY: z.string().min(32).optional(),
  INTERNAL_API_KEY: z.string().min(32).optional(),
  
  // Feature flags (optional, with defaults)
  NEXT_PUBLIC_ENABLE_SEATING: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_CHECKLIST: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_TIMELINE: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_MESSAGING: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_QR_CODES: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_WEATHER: z.string().transform(val => val === 'true').optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

class EnvironmentValidator {
  private config: EnvConfig | null = null;
  private validationErrors: string[] = [];
  private warnings: string[] = [];

  /**
   * Validate environment variables on startup
   * @param throwOnError - Whether to throw an error if validation fails
   * @returns Validated environment configuration
   */
  validate(throwOnError = true): EnvConfig | null {
    try {
      // Parse and validate environment variables
      this.config = envSchema.parse(process.env);
      
      // Additional security checks
      this.performSecurityChecks();
      
      // Log warnings if any
      if (this.warnings.length > 0) {
        console.warn('⚠️  Environment Configuration Warnings:');
        this.warnings.forEach(warning => console.warn(`   - ${warning}`));
      }
      
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        console.error('❌ Environment Validation Failed:');
        this.validationErrors.forEach(err => console.error(`   - ${err}`));
        
        if (throwOnError) {
          throw new Error(`Environment validation failed:\n${this.validationErrors.join('\n')}`);
        }
      }
      return null;
    }
  }

  /**
   * Perform additional security checks on environment variables
   */
  private performSecurityChecks(): void {
    if (!this.config) return;

    // Check for production mode requirements
    if (this.config.NODE_ENV === 'production') {
      // Ensure critical security variables are set in production
      const requiredInProduction = [
        'QR_CODE_SECRET',
        'WEBHOOK_SECRET',
        'WEBSOCKET_JWT_SECRET',
        'INTERNAL_API_KEY',
        'BACKUP_ENCRYPTION_KEY'
      ];

      requiredInProduction.forEach(key => {
        if (!process.env[key]) {
          this.warnings.push(`${key} should be set in production for security`);
        }
      });

      // Ensure APP_URL is set in production
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        this.warnings.push('NEXT_PUBLIC_APP_URL should be set in production');
      }

      // Check for secure protocols
      if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
        this.warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production');
      }
    }

    // Check for common insecure patterns
    const secretKeys = Object.keys(process.env).filter(key => 
      key.includes('SECRET') || 
      key.includes('KEY') || 
      key.includes('TOKEN') ||
      key.includes('PASSWORD')
    );

    secretKeys.forEach(key => {
      const value = process.env[key];
      if (value && (
        value.includes('example') ||
        value.includes('test') ||
        value.includes('demo') ||
        value.includes('123456') ||
        value.includes('password') ||
        value === 'secret'
      )) {
        this.warnings.push(`${key} appears to contain an insecure value`);
      }
    });
  }

  /**
   * Get validation errors
   */
  getErrors(): string[] {
    return this.validationErrors;
  }

  /**
   * Get validation warnings
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  /**
   * Get validated config
   */
  getConfig(): EnvConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Export validated config (will be null if validation fails)
export const validatedEnv = envValidator.validate(process.env.NODE_ENV === 'production');

// Helper function to get a validated environment variable
export function getEnvVar<K extends keyof EnvConfig>(key: K): EnvConfig[K] | undefined {
  return validatedEnv?.[key];
}

// Helper function to ensure a required environment variable is set
export function requireEnvVar<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const value = getEnvVar(key);
  if (value === undefined || value === null) {
    throw new Error(`Required environment variable ${String(key)} is not set`);
  }
  return value;
}