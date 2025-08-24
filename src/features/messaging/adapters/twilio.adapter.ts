import { BaseMessageAdapter, MessageRequest, MessageResponse, SMSMessageRequest, AdapterConfig } from './base.adapter'

export interface TwilioConfig extends AdapterConfig {
  accountSid: string
  authToken: string
  fromNumber?: string
  baseUrl?: string
}

export class TwilioAdapter extends BaseMessageAdapter {
  private readonly accountSid: string
  private readonly authToken: string
  private readonly defaultFromNumber: string
  private readonly baseUrl: string

  constructor(config: TwilioConfig) {
    super(config)
    this.accountSid = config.accountSid
    this.authToken = config.authToken
    this.defaultFromNumber = config.fromNumber || '+1234567890'
    this.baseUrl = config.baseUrl || 'https://api.twilio.com/2010-04-01'
  }

  async send(request: MessageRequest): Promise<MessageResponse> {
    const startTime = Date.now()

    try {
      // Validate request
      const validation = this.validateRequest(request)
      if (!validation.valid) {
        this.updateStats(false)
        return this.createErrorResponse(validation.error!, 'VALIDATION_ERROR')
      }

      const smsRequest = request as SMSMessageRequest

      // Prepare SMS payload
      const payload = new URLSearchParams({
        To: this.formatPhoneNumber(smsRequest.to),
        From: smsRequest.fromNumber || this.defaultFromNumber,
        Body: smsRequest.message
      })

      // Send via Twilio API
      const response = await this.makeApiCall('/Accounts/' + this.accountSid + '/Messages.json', payload)

      const latency = Date.now() - startTime
      this.updateStats(true, latency)

      return this.createSuccessResponse(
        response.sid,
        response.sid,
        this.mapTwilioStatus(response.status),
        {
          provider: 'twilio',
          latency,
          from: response.from,
          to: response.to,
          status: response.status,
          price: response.price,
          priceUnit: response.price_unit
        }
      )

    } catch (error) {
      const latency = Date.now() - startTime
      this.updateStats(false, latency)
      return this.handleHttpError(error, 'send SMS')
    }
  }

  validateRequest(request: MessageRequest): { valid: boolean; error?: string } {
    // Check common fields
    const commonValidation = this.validateCommonFields(request)
    if (!commonValidation.valid) {
      return commonValidation
    }

    const smsRequest = request as SMSMessageRequest

    // Validate phone number format
    if (!this.isValidPhoneNumber(smsRequest.to)) {
      return { valid: false, error: 'Invalid phone number format (must include country code, e.g., +1234567890)' }
    }

    // Check message content
    if (!smsRequest.message || smsRequest.message.trim().length === 0) {
      return { valid: false, error: 'SMS message content is required' }
    }

    // Check message length (SMS limit is typically 160 characters for single SMS)
    if (smsRequest.message.length > 1600) {
      return { valid: false, error: 'SMS message too long (max 1600 characters)' }
    }

    // Validate from number if provided
    if (smsRequest.fromNumber && !this.isValidPhoneNumber(smsRequest.fromNumber)) {
      return { valid: false, error: 'Invalid from phone number format' }
    }

    return { valid: true }
  }

  isConfigured(): boolean {
    return !!(
      this.accountSid && 
      this.authToken && 
      this.accountSid.startsWith('AC') &&
      this.authToken.length >= 32
    )
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a simple API call to get account info
      await this.makeApiCall('/Accounts/' + this.accountSid + '.json', null, 'GET')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Twilio connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  getSupportedFeatures(): string[] {
    return [
      'sms',
      'mms',
      'delivery_status',
      'custom_from_number',
      'message_status_callback',
      'media_attachments'
    ]
  }

  /**
   * Send SMS with delivery status callback
   */
  async sendWithCallback(
    to: string,
    message: string,
    callbackUrl: string,
    options: {
      fromNumber?: string
    } = {}
  ): Promise<MessageResponse> {
    const payload = new URLSearchParams({
      To: this.formatPhoneNumber(to),
      From: options.fromNumber || this.defaultFromNumber,
      Body: message,
      StatusCallback: callbackUrl
    })

    try {
      const response = await this.makeApiCall('/Accounts/' + this.accountSid + '/Messages.json', payload)
      
      return this.createSuccessResponse(
        response.sid,
        response.sid,
        this.mapTwilioStatus(response.status),
        {
          provider: 'twilio',
          callbackUrl,
          status: response.status
        }
      )
    } catch (error) {
      return this.handleHttpError(error, 'send SMS with callback')
    }
  }

  /**
   * Send MMS with media attachment
   */
  async sendMMS(
    to: string,
    message: string,
    mediaUrl: string,
    options: {
      fromNumber?: string
    } = {}
  ): Promise<MessageResponse> {
    const payload = new URLSearchParams({
      To: this.formatPhoneNumber(to),
      From: options.fromNumber || this.defaultFromNumber,
      Body: message,
      MediaUrl: mediaUrl
    })

    try {
      const response = await this.makeApiCall('/Accounts/' + this.accountSid + '/Messages.json', payload)
      
      return this.createSuccessResponse(
        response.sid,
        response.sid,
        this.mapTwilioStatus(response.status),
        {
          provider: 'twilio',
          mediaUrl,
          status: response.status,
          type: 'mms'
        }
      )
    } catch (error) {
      return this.handleHttpError(error, 'send MMS')
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageSid: string): Promise<{ status: string; error?: string }> {
    try {
      const response = await this.makeApiCall(`/Accounts/${this.accountSid}/Messages/${messageSid}.json`, null, 'GET')
      return { status: response.status }
    } catch (error) {
      return { 
        status: 'unknown', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Make API call to Twilio
   */
  private async makeApiCall(endpoint: string, payload: URLSearchParams | null, method: string = 'POST'): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Create basic auth header
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Planr/1.0'
      }
    }

    if (payload && method !== 'GET') {
      options.body = payload.toString()
    }

    const response = await fetch(url, options)

    const responseData = await response.json()

    if (!response.ok) {
      const error = new Error(`Twilio API error: ${response.status} ${responseData.message || response.statusText}`)
      ;(error as any).response = {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      }
      throw error
    }

    return responseData
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '')
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted
    }

    return formatted
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number] (max 15 digits total)
    const e164Regex = /^\+[1-9]\d{1,14}$/
    const formatted = this.formatPhoneNumber(phoneNumber)
    return e164Regex.test(formatted)
  }

  /**
   * Map Twilio status to our standard status
   */
  private mapTwilioStatus(twilioStatus: string): 'sent' | 'queued' | 'failed' {
    switch (twilioStatus.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return 'sent'
      case 'queued':
      case 'accepted':
        return 'queued'
      case 'failed':
      case 'undelivered':
      default:
        return 'failed'
    }
  }
}