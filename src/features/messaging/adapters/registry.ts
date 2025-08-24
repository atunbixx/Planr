import { MessageAdapter, AdapterFactory } from './base.adapter'
import { ResendAdapter } from './resend.adapter'
import { TwilioAdapter } from './twilio.adapter'
import { SESAdapter } from './ses.adapter'

/**
 * Adapter registry for managing message adapters
 */
export class AdapterRegistry {
  private static instance: AdapterRegistry
  private adapters: Map<string, MessageAdapter> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry()
    }
    return AdapterRegistry.instance
  }

  /**
   * Initialize all adapters with their configurations
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Register adapter classes
      AdapterFactory.register('resend', ResendAdapter)
      AdapterFactory.register('twilio', TwilioAdapter)
      AdapterFactory.register('ses', SESAdapter)

      // Initialize adapters with their configurations
      await this.initializeAdapter('resend', {
        apiKey: process.env.RESEND_API_KEY || '',
        fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@planr.app',
        fromName: process.env.RESEND_FROM_NAME || 'Planr'
      })

      await this.initializeAdapter('twilio', {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || '',
        whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || ''
      })

      await this.initializeAdapter('ses', {
        region: process.env.AWS_SES_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        fromEmail: process.env.SES_FROM_EMAIL || 'noreply@planr.app',
        fromName: process.env.SES_FROM_NAME || 'Planr'
      })

      this.initialized = true
      console.log('Message adapters initialized successfully')
    } catch (error) {
      console.error('Failed to initialize message adapters:', error)
      throw error
    }
  }

  /**
   * Initialize a specific adapter
   */
  private async initializeAdapter(name: string, config: Record<string, string>): Promise<void> {
    try {
      const adapter = AdapterFactory.create(name, config)
      
      if (!adapter) {
        console.warn(`Failed to create adapter: ${name}`)
        return
      }

      // Validate configuration
      const isValid = await adapter.validateConfig()
      
      if (!isValid) {
        console.warn(`Invalid configuration for adapter: ${name}`)
        return
      }

      this.adapters.set(name, adapter)
      console.log(`Adapter initialized: ${name}`, {
        provider: name,
        supportedChannels: adapter.getInfo().supportedChannels,
        operation: 'adapter_init'
      })
    } catch (error) {
      console.error(`Error initializing adapter ${name}:`, error)
    }
  }

  /**
   * Get an adapter by name
   */
  getAdapter(name: string): MessageAdapter | null {
    return this.adapters.get(name) || null
  }

  /**
   * Get adapter for a specific channel
   */
  getAdapterForChannel(channel: string, preferredProvider?: string): MessageAdapter | null {
    // If preferred provider is specified and supports the channel, use it
    if (preferredProvider) {
      const adapter = this.getAdapter(preferredProvider)
      if (adapter && adapter.supportsChannel(channel)) {
        return adapter
      }
    }

    // Find first adapter that supports the channel
    for (const [name, adapter] of this.adapters) {
      if (adapter.supportsChannel(channel)) {
        return adapter
      }
    }

    return null
  }

  /**
   * Get all available adapters
   */
  getAllAdapters(): Map<string, MessageAdapter> {
    return new Map(this.adapters)
  }

  /**
   * Get adapters that support a specific channel
   */
  getAdaptersForChannel(channel: string): MessageAdapter[] {
    const adapters: MessageAdapter[] = []
    
    for (const adapter of this.adapters.values()) {
      if (adapter.supportsChannel(channel)) {
        adapters.push(adapter)
      }
    }

    return adapters
  }

  /**
   * Check if any adapter supports a channel
   */
  isChannelSupported(channel: string): boolean {
    for (const adapter of this.adapters.values()) {
      if (adapter.supportsChannel(channel)) {
        return true
      }
    }
    return false
  }

  /**
   * Get registry status
   */
  getStatus(): {
    initialized: boolean
    adapterCount: number
    adapters: Array<{
      name: string
      provider: string
      supportedChannels: string[]
      features: string[]
    }>
  } {
    const adapters = Array.from(this.adapters.entries()).map(([name, adapter]) => {
      const info = adapter.getInfo()
      return {
        name,
        provider: info.provider,
        supportedChannels: info.supportedChannels,
        features: info.features
      }
    })

    return {
      initialized: this.initialized,
      adapterCount: this.adapters.size,
      adapters
    }
  }

  /**
   * Reload adapters (useful for configuration changes)
   */
  async reload(): Promise<void> {
    this.adapters.clear()
    this.initialized = false
    await this.initialize()
  }

  /**
   * Health check for all adapters
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const [name, adapter] of this.adapters) {
      try {
        results[name] = await adapter.validateConfig()
      } catch (error) {
        console.error(`Health check failed for adapter ${name}:`, error)
        results[name] = false
      }
    }

    return results
  }
}

// Export singleton instance
export const adapterRegistry = AdapterRegistry.getInstance()