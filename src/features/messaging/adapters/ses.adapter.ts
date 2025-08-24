import { BaseMessageAdapter, MessageRequest, MessageResult, AdapterInfo } from './base.adapter'

/**
 * Amazon SES adapter (stub implementation)
 * This is a placeholder for future SES integration
 */
export class SESAdapter extends BaseMessageAdapter {
  private region: string
  private accessKeyId: string
  private secretAccessKey: string
  private fromEmail: string
  private fromName: string

  constructor(config: Record<string, string>) {
    super(config)
    
    this.region = config.region || process.env.AWS_SES_REGION || 'us-east-1'
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || ''
    this.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || ''
    this.fromEmail = config.fromEmail || 'noreply@planr.app'
    this.fromName = config.fromName || 'Planr'
  }

  async send(request: MessageRequest): Promise<MessageResult> {
    const messageId = this.generateMessageId()

    // Stub implementation - always returns success for now
    console.warn('SES adapter is not fully implemented - using stub')
    
    return this.createSuccessResult(messageId, `ses_${Date.now()}`, 'sent')
  }

  async validateConfig(): Promise<boolean> {
    // Basic validation - check if required config is present
    return !!(this.accessKeyId && this.secretAccessKey && this.fromEmail)
  }

  getInfo(): AdapterInfo {
    return {
      name: 'Amazon SES',
      provider: 'ses',
      version: '1.0.0-stub',
      supportedChannels: ['email'],
      features: [
        'html_email',
        'text_email',
        'bounce_handling',
        'complaint_handling',
        'delivery_notifications'
      ],
      rateLimit: {
        requests: 200,
        period: '1s'
      }
    }
  }

  supportsChannel(channel: string): boolean {
    return channel === 'email'
  }
}