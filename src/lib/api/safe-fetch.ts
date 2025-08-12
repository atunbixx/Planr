/**
 * Safe API Fetch Utilities
 * 
 * Provides resilient API communication with built-in error handling,
 * retries, and fallback mechanisms for safe feature integration.
 */

import { logFeatureUsage, FeatureFlag } from '@/lib/features/flags';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
  retryable?: boolean;
}

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  feature?: FeatureFlag;
  fallbackData?: any;
}

/**
 * Enhanced fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Safe API call with automatic error handling and retries
 */
export async function safeApiCall<T>(
  endpoint: string,
  options: SafeFetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    feature,
    fallbackData,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        ...fetchOptions,
        timeout,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      // Log feature API usage
      if (feature) {
        logFeatureUsage(feature, `api-${response.ok ? 'success' : 'error'}`);
      }

      if (!response.ok) {
        // Check if error is retryable
        const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
        
        if (retryable && attempt < retries) {
          lastError = new Error(`HTTP ${response.status}`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }

        return {
          error: `API error: ${response.status} ${response.statusText}`,
          status: response.status,
          retryable,
        };
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Log network errors
      if (feature) {
        logFeatureUsage(feature, 'api-network-error');
      }

      // Retry on network errors
      if (attempt < retries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`API call failed after ${retries} retries:`, endpoint, lastError);

  // Return fallback data if provided
  if (fallbackData !== undefined) {
    return { data: fallbackData, error: 'Using fallback data' };
  }

  return {
    error: lastError?.message || 'Network error',
    retryable: true,
  };
}

/**
 * Batch API calls with concurrency control
 */
export async function safeBatchApiCalls<T>(
  calls: Array<{ endpoint: string; options?: SafeFetchOptions }>,
  concurrency = 3
): Promise<ApiResponse<T>[]> {
  const results: ApiResponse<T>[] = [];
  const executing: Promise<void>[] = [];

  for (const call of calls) {
    const promise = safeApiCall<T>(call.endpoint, call.options).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Create a safe API client for a specific feature
 */
export function createFeatureApiClient(feature: FeatureFlag) {
  return {
    get: <T>(endpoint: string, options?: Omit<SafeFetchOptions, 'method'>) =>
      safeApiCall<T>(endpoint, { ...options, method: 'GET', feature }),
    
    post: <T>(endpoint: string, data?: any, options?: Omit<SafeFetchOptions, 'method' | 'body'>) =>
      safeApiCall<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
        feature,
      }),
    
    put: <T>(endpoint: string, data?: any, options?: Omit<SafeFetchOptions, 'method' | 'body'>) =>
      safeApiCall<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
        feature,
      }),
    
    delete: <T>(endpoint: string, options?: Omit<SafeFetchOptions, 'method'>) =>
      safeApiCall<T>(endpoint, { ...options, method: 'DELETE', feature }),
  };
}

/**
 * Health check for API endpoints
 */
export async function checkApiHealth(endpoint: string): Promise<boolean> {
  const result = await safeApiCall(endpoint, {
    method: 'GET',
    retries: 0,
    timeout: 5000,
  });
  
  return result.error === undefined;
}

/**
 * Circuit breaker for API calls
 */
export class ApiCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async call<T>(
    endpoint: string,
    options?: SafeFetchOptions
  ): Promise<ApiResponse<T>> {
    // Check circuit state
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime < this.resetTimeout) {
        return { error: 'Circuit breaker is open' };
      }
      this.state = 'half-open';
    }

    const result = await safeApiCall<T>(endpoint, options);

    if (result.error) {
      this.recordFailure();
    } else {
      this.recordSuccess();
    }

    return result;
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.warn('Circuit breaker opened due to repeated failures');
    }
  }

  private recordSuccess() {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
      console.info('Circuit breaker closed after successful call');
    }
  }
}