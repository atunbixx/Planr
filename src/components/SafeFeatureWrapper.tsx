'use client';

import React, { Suspense, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { FEATURE_FLAGS, FeatureFlag, isFeatureEnabled, logFeatureUsage } from '@/lib/features/flags';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SafeFeatureWrapperProps {
  feature: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error fallback component for feature failures
 */
function DefaultErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Feature Temporarily Unavailable</AlertTitle>
      <AlertDescription>
        We're experiencing issues with this feature. Please try again later.
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2 text-xs">
            <summary>Error details</summary>
            <pre className="mt-1 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Default loading fallback
 */
function DefaultLoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

/**
 * Safe wrapper component for feature-flagged functionality
 * 
 * Features:
 * - Feature flag checking
 * - Error boundary protection
 * - Loading state handling
 * - Usage tracking
 * - Graceful fallbacks
 */
export function SafeFeatureWrapper({
  feature,
  children,
  fallback = null,
  loadingFallback,
  errorFallback,
  onError,
}: SafeFeatureWrapperProps) {
  // Check if feature is enabled
  if (!isFeatureEnabled(feature)) {
    logFeatureUsage(feature, 'blocked');
    return <>{fallback}</>;
  }

  // Log feature access
  React.useEffect(() => {
    logFeatureUsage(feature, 'accessed');
  }, [feature]);

  // Error handler
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Feature error in ${feature}:`, error, errorInfo);
    logFeatureUsage(feature, 'error');
    onError?.(error, errorInfo);
  };

  return (
    <ErrorBoundary
      FallbackComponent={errorFallback || DefaultErrorFallback}
      onError={handleError}
      onReset={() => logFeatureUsage(feature, 'reset')}
    >
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Hook for checking feature availability
 */
export function useFeature(feature: FeatureFlag): boolean {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    setEnabled(isFeatureEnabled(feature));
  }, [feature]);

  return enabled;
}

/**
 * Conditional feature renderer
 */
export function FeatureGate({ 
  feature, 
  children,
  fallback = null 
}: {
  feature: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const enabled = useFeature(feature);
  return <>{enabled ? children : fallback}</>;
}