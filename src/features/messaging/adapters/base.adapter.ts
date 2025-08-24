/**
 * Base message adapter interface and types
 * Defines the contract for all messaging providers
 */

export interface MessageRequest {
  to: string
  templateId?: string
  variables?: Record<string, string>
  metadata?: Record<string, any>
}

export interface EmailMessageRequest extends MessageRequest {
  subject?: string
  htmlContent?: string
  textContent?: string
  fromEmail?: string
  fromName?: string
}

export interface SMSMessageRequest extends MessageRequest {
  message: string
  fromNumber?: string
}

export interface WhatsAppMessageRequest extends MessageRequest {
  message: string
  mediaUrl?: string
  mediaType?: 'image' | 'document' | 'video'
}

export interface MessageResponse {
  success: boolean
  messageId: string
  providerMessageId?: string
  status: 'sent' | 'queued' | 'failed'
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: Record<string, any>
}

export interface AdapterConfig {
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  timeout?: number
  retries?: number
  [key: string]: any
}

export interface AdapterStats {
  totalSent: number
  totalFailed: number
  lastSent?: Date
  lastError?: Date
  averageLatency?: number
}

export abstract class BaseMessageAdapter {
  protected config: AdapterConfig
  protected stats: AdapterStats

  constructor(config: AdapterConfig) {
    this.config = config
    this.stats = {
      totalSent: 0,
      totalFailed: 0
    }
  }

  /**
   * Send a message via the provider
   */
  abstract send(request: MessageRequest): Promise<MessageResponse>

  /**
   * Validate the message request
   */
  abstract validateRequest(request: MessageRequest): { valid: boolean; error?: string }

  /**
   * Get adapter configuration (without sensitive data)
   */
  getConfig(): Omit<AdapterConfig, 'apiKey' | 'apiSecret'> {
    const { apiKey, apiSecret, ...safeConfig } = this.config
    return safeConfig
  }

  /**
   * Get adapter statistics
   */
  getStats(): AdapterStats {
    return { ...this.stats }
  }

  /**
   * Check if adapter is properly configured
   */
  abstract isConfigured(): boolean

  /**
   * Test adapter connectivity
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>

  /**
   * Get supported features for this adapter
   */
  abstract getSupportedFeatures(): string[]

  /**
   * Update statistics after sending
   */
  protected updateStats(success: boolean, latency?: number): void {
    if (success) {
      this.stats.totalSent++
      this.stats.lastSent = new Date()
    } else {
      this.stats.totalFailed++
      this.stats.lastError = new Date()
    }

    if (latency !== undefined) {
      // Calculate rolling average latency
      if (this.stats.averageLatency) {
        this.stats.averageLatency = (this.stats.averageLatency + latency) / 2
      } else {
        this.stats.averageLatency = latency
      }
    }
  }

  /**
   * Validate common message fields
   */
  protected validateCommonFields(request: MessageRequest): { valid: boolean; error?: string } {
    if (!request.to) {
      return { valid: false, error: 'Recipient (to) is required' }
    }

    if (request.to.length === 0) {
      return { valid: false, error: 'Recipient cannot be empty' }
    }

    return { valid: true }
  }

  /**
   * Create error response
   */
  protected createErrorResponse(error: string, code: string = 'ADAPTER_ERROR', details?: any): MessageResponse {
    return {
      success: false,
      messageId: `error_${Date.now()}`,
      status: 'failed',
      error: {
        code,
        message: error,
        details
      }
    }
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(
    messageId: string, 
    providerMessageId?: string, 
    status: 'sent' | 'queued' = 'sent',
    metadata?: Record<string, any>
  ): MessageResponse {
    return {
      success: true,
      messageId,
      providerMessageId,
      status,
      metadata
    }
  }

  /**
   * Handle HTTP errors consistently
   */
  protected handleHttpError(error: any, operation: string): MessageResponse {
    console.error(`${this.constructor.name} ${operation} failed:`, error)

    let errorMessage = 'Unknown error occurred'
    let errorCode = 'HTTP_ERROR'

    if (error.response) {
      // HTTP error response
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`
      errorCode = `HTTP_${error.response.status}`
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - no response received'
      errorCode = 'NETWORK_ERROR'
    } else if (error.message) {
      // Other error
      errorMessage = error.message
      errorCode = 'REQUEST_ERROR'
    }

    return this.createErrorResponse(errorMessage, errorCode, {
      operation,
      originalError: error.message
    })
  }

  /**
   * Retry logic for failed requests
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
      }
    }

    throw lastError
  }
}