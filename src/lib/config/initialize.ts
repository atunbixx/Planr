/**
 * Application Initialization
 * Runs critical startup checks and configurations
 */

import { envValidator } from './env-validation';

// Track if initialization has been completed
let initialized = false;

/**
 * Initialize application configuration and perform startup checks
 */
export function initializeApp(): void {
  if (initialized) {
    return; // Already initialized
  }

  console.log('🚀 Initializing Wedding Planner Application...');

  try {
    // Step 1: Validate environment variables
    console.log('📋 Validating environment configuration...');
    const config = envValidator.validate(process.env.NODE_ENV === 'production');
    
    if (!config) {
      const errors = envValidator.getErrors();
      if (errors.length > 0) {
        console.error('❌ Environment validation failed. Please check your .env file.');
        if (process.env.NODE_ENV === 'production') {
          // In production, fail fast
          process.exit(1);
        }
      }
    } else {
      console.log('✅ Environment configuration validated successfully');
    }

    // Step 2: Display warnings if any
    const warnings = envValidator.getWarnings();
    if (warnings.length > 0) {
      console.warn('⚠️  Configuration warnings detected:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    // Step 3: Log application mode
    console.log(`📦 Running in ${process.env.NODE_ENV || 'development'} mode`);
    
    // Step 4: Log feature flags status
    if (process.env.NODE_ENV === 'development') {
      console.log('🎛️  Feature Flags:');
      const featureFlags = [
        'NEXT_PUBLIC_ENABLE_SEATING',
        'NEXT_PUBLIC_ENABLE_CHECKLIST',
        'NEXT_PUBLIC_ENABLE_TIMELINE',
        'NEXT_PUBLIC_ENABLE_MESSAGING',
        'NEXT_PUBLIC_ENABLE_QR_CODES',
        'NEXT_PUBLIC_ENABLE_WEATHER',
      ];
      
      featureFlags.forEach(flag => {
        const enabled = process.env[flag] === 'true';
        console.log(`   - ${flag.replace('NEXT_PUBLIC_ENABLE_', '')}: ${enabled ? '✅' : '❌'}`);
      });
    }

    // Step 5: Security reminders for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Security Reminder: Using development configuration');
      console.log('   Ensure production secrets are properly configured before deployment');
    }

    initialized = true;
    console.log('✨ Application initialization complete\n');
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

/**
 * Check if the application has been initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

// Auto-initialize when this module is imported (for Next.js)
if (typeof window === 'undefined') {
  // Server-side only
  initializeApp();
}