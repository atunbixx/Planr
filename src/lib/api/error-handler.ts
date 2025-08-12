import { toast } from 'sonner'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ErrorContext {
  operation: string
  resource?: string
  details?: any
}

// User-friendly error messages
const errorMessages: Record<string, string> = {
  // Network errors
  'network_error': 'Unable to connect to the server. Please check your internet connection.',
  'timeout': 'The request took too long. Please try again.',
  
  // Authentication errors
  'unauthorized': 'Please sign in to continue.',
  'forbidden': 'You don\'t have permission to access this resource.',
  'session_expired': 'Your session has expired. Please sign in again.',
  
  // Validation errors
  'validation_error': 'Please check your input and try again.',
  'invalid_input': 'The information provided is invalid.',
  'missing_required_fields': 'Please fill in all required fields.',
  
  // Resource errors
  'not_found': 'The requested item could not be found.',
  'already_exists': 'This item already exists.',
  'conflict': 'This action conflicts with existing data.',
  
  // Server errors
  'server_error': 'Something went wrong on our end. Please try again later.',
  'maintenance': 'The service is temporarily unavailable for maintenance.',
  
  // Specific feature errors
  'budget_exceeded': 'This would exceed your budget limit.',
  'guest_limit_reached': 'You\'ve reached the maximum number of guests.',
  'invalid_rsvp_code': 'Invalid RSVP code. Please check and try again.',
  'photo_upload_failed': 'Failed to upload photo. Please try again.',
  'message_send_failed': 'Failed to send message. Please try again.',
  
  // Default
  'unknown_error': 'An unexpected error occurred. Please try again.'
}

export function getErrorMessage(error: any, context?: ErrorContext): string {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code]
    }
    return error.message
  }
  
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return errorMessages.network_error
  }
  
  // Handle timeout errors
  if (error.name === 'AbortError') {
    return errorMessages.timeout
  }
  
  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 401:
        return errorMessages.unauthorized
      case 403:
        return errorMessages.forbidden
      case 404:
        return errorMessages.not_found
      case 409:
        return errorMessages.conflict
      case 422:
        return errorMessages.validation_error
      case 500:
      case 502:
      case 503:
        return errorMessages.server_error
      case 504:
        return errorMessages.timeout
    }
  }
  
  // Context-specific messages
  if (context?.operation) {
    const operationMessages: Record<string, string> = {
      'create_guest': 'Failed to add guest. Please try again.',
      'update_guest': 'Failed to update guest information.',
      'delete_guest': 'Failed to remove guest.',
      'send_invitation': 'Failed to send invitation.',
      'create_vendor': 'Failed to add vendor.',
      'upload_photo': 'Failed to upload photo.',
      'save_settings': 'Failed to save settings.',
      'export_data': 'Failed to export data.'
    }
    
    if (operationMessages[context.operation]) {
      return operationMessages[context.operation]
    }
  }
  
  // Default message
  return error.message || errorMessages.unknown_error
}

export function handleApiError(error: any, context?: ErrorContext, showToast = true): void {
  const message = getErrorMessage(error, context)
  
  // Log error for debugging
  console.error('[API Error]', {
    error,
    context,
    message
  })
  
  // Show user-friendly toast
  if (showToast) {
    toast.error(message, {
      duration: 5000,
      action: error.status === 401 ? {
        label: 'Sign In',
        onClick: () => window.location.href = '/sign-in'
      } : undefined
    })
  }
  
  // Track error (integrate with error tracking service)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: message,
      fatal: error.status >= 500
    })
  }
}

// Retry logic for transient errors
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}