'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'component' | 'app';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

const ERROR_RESET_TIMEOUT = 10000; // 10 seconds
const MAX_ERROR_COUNT = 3;

export class ErrorBoundaryWrapper extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    // Reset error boundary when resetKeys change
    if (props.resetKeys && props.resetOnPropsChange !== false) {
      if (JSON.stringify(props.resetKeys) !== JSON.stringify(state.previousResetKeys)) {
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          errorCount: 0,
          lastErrorTime: 0,
        };
      }
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, level = 'component' } = this.props;
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;

    // Reset error count if enough time has passed
    const errorCount = timeSinceLastError > ERROR_RESET_TIMEOUT 
      ? 1 
      : this.state.errorCount + 1;

    // Log the error
    logger.error(`Error caught by ${level} boundary`, error, {
      module: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        level,
        errorCount,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler', handlerError);
      }
    }

    // Update state
    this.setState({
      hasError: true,
      error,
      errorInfo,
      errorCount,
      lastErrorTime: now,
    });

    // Set up automatic recovery for component-level errors
    if (level === 'component' && errorCount < MAX_ERROR_COUNT) {
      this.scheduleReset();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  scheduleReset = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      logger.info('Auto-resetting error boundary after timeout');
      this.resetErrorBoundary();
    }, ERROR_RESET_TIMEOUT);
  };

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, isolate, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Check if we've hit the max error count
      if (errorCount >= MAX_ERROR_COUNT) {
        return (
          <div className="min-h-[400px] flex items-center justify-center p-8">
            <Card className="max-w-md w-full p-6 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Multiple Errors Detected
              </h2>
              <p className="text-muted-foreground mb-6">
                This component is experiencing repeated errors. Please reload the page to continue.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleReload} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      // Different error UI based on boundary level
      if (level === 'app' || level === 'page') {
        return (
          <div className="min-h-screen flex items-center justify-center p-8 bg-background">
            <Card className="max-w-lg w-full p-8">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">
                  {level === 'app' ? 'Application Error' : 'Page Error'}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {level === 'app' 
                    ? 'An unexpected error occurred in the application.'
                    : 'An error occurred while loading this page.'}
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-left mb-6 p-4 bg-muted rounded-lg">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={this.resetErrorBoundary} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      }

      // Component-level error (more compact)
      if (isolate) {
        return (
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Component Error</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This component couldn't load properly.
                </p>
                {errorCount < MAX_ERROR_COUNT && (
                  <Button
                    onClick={this.resetErrorBoundary}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Default component error (non-isolated)
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="p-6 text-center max-w-sm">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This section couldn't be displayed.
            </p>
            <Button onClick={this.resetErrorBoundary} size="sm">
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryWrapper {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryWrapper>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}