/**
 * Feature Flag System
 * 
 * Centralized feature flag management for safe integration of new features.
 * All new features should be behind a flag to enable progressive rollout.
 */

// Feature flag definitions
export const FEATURE_FLAGS = {
  // Phase 1 Features
  SEATING_PLANNER: process.env.NEXT_PUBLIC_ENABLE_SEATING === 'true',
  WEDDING_CHECKLIST: process.env.NEXT_PUBLIC_ENABLE_CHECKLIST === 'true',
  DAY_OF_TIMELINE: process.env.NEXT_PUBLIC_ENABLE_TIMELINE === 'true',
  
  // Phase 2 Features
  MESSAGING_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_MESSAGING === 'true',
  QR_CODE_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_QR_CODES === 'true',
  WEATHER_INTEGRATION: process.env.NEXT_PUBLIC_ENABLE_WEATHER === 'true',
  
  // Phase 3 Features
  COLLABORATIVE_PLANNING: process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === 'true',
  DATA_EXPORT: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
  PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true',
  WEBSOCKET_SUPPORT: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
  
  // Feature Groups
  PHASE_1_FEATURES: process.env.NEXT_PUBLIC_ENABLE_PHASE_1 === 'true',
  PHASE_2_FEATURES: process.env.NEXT_PUBLIC_ENABLE_PHASE_2 === 'true',
  PHASE_3_FEATURES: process.env.NEXT_PUBLIC_ENABLE_PHASE_3 === 'true',
  ALL_FEATURES: process.env.NEXT_PUBLIC_ENABLE_ALL_FEATURES === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // All features override
  if (FEATURE_FLAGS.ALL_FEATURES) return true;
  
  // Phase-based overrides
  if (feature in PHASE_1_FEATURES && FEATURE_FLAGS.PHASE_1_FEATURES) return true;
  if (feature in PHASE_2_FEATURES && FEATURE_FLAGS.PHASE_2_FEATURES) return true;
  if (feature in PHASE_3_FEATURES && FEATURE_FLAGS.PHASE_3_FEATURES) return true;
  
  // Individual feature flag
  return FEATURE_FLAGS[feature] || false;
}

// Phase 1 feature list
const PHASE_1_FEATURES = [
  'SEATING_PLANNER',
  'WEDDING_CHECKLIST', 
  'DAY_OF_TIMELINE'
] as const;

// Phase 2 feature list
const PHASE_2_FEATURES = [
  'MESSAGING_SYSTEM',
  'QR_CODE_SYSTEM',
  'WEATHER_INTEGRATION'
] as const;

// Phase 3 feature list
const PHASE_3_FEATURES = [
  'COLLABORATIVE_PLANNING',
  'DATA_EXPORT',
  'PERFORMANCE_MONITORING',
  'WEBSOCKET_SUPPORT'
] as const;

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlag[])
    .filter(feature => isFeatureEnabled(feature));
}

/**
 * Feature availability by user role/plan
 * Can be extended for premium features
 */
export function isFeatureAvailableForUser(
  feature: FeatureFlag,
  userPlan?: 'free' | 'premium' | 'enterprise'
): boolean {
  // First check if feature is enabled globally
  if (!isFeatureEnabled(feature)) return false;
  
  // Add plan-based restrictions here if needed
  // For now, all enabled features are available to all users
  return true;
}

/**
 * Development-only feature flags
 * These features are only available in development mode
 */
export const DEV_FEATURES = {
  DEBUG_PANEL: process.env.NODE_ENV === 'development',
  API_EXPLORER: process.env.NODE_ENV === 'development',
  PERFORMANCE_PROFILER: process.env.NODE_ENV === 'development',
};

/**
 * Feature flag configuration for dynamic updates
 * Can be extended to fetch flags from a remote service
 */
export interface FeatureFlagConfig {
  feature: FeatureFlag;
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Log feature flag usage for monitoring
 */
export function logFeatureUsage(feature: FeatureFlag, action: string) {
  if (process.env.NODE_ENV === 'production') {
    // In production, this could send to analytics
    console.log(`Feature usage: ${feature} - ${action}`);
  }
}