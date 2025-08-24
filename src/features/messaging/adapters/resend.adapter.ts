import { BaseMessageAdapter, MessageRequest, MessageResponse, EmailMessageRequest, AdapterConfig } from './base.adapter'

export interface ResendConfig extends AdapterConfig {
  apiKey: string
  fromEmail?: string
  fromName?: string
  baseUrl?: string
}

export class ResendAdapter extends BaseMessageAdapter {
  private readonly defaultFromEmail: string
  private readonly defaultFromName: string
  private readonly baseUrl: string

  constructor(config: ResendConfig) {
    super(config)
    this.defaultFromEmail = config.fromEmail || 'noreply@planr.app'
    this.defaultFromName = config.fromName || 'Planr'
    this.baseUrl = config.baseUrl || 'https://api.resend.com'
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

      const emailRequest = request as EmailMessageRequest

      // Prepare email payload
      const payload = {
        from: this.formatFromAddress(emailRequest.fromEmail, emailRequest.fromName),
        to: [emailRequest.to],
        subject: emailRequest.subject || 'Wedding Invitation',
        html: emailRequest.htmlContent,
        text: emailRequest.textContent,
        tags: [
          { name: 'source', value: 'planr' },
          { name: 'type', value: 'wedding-invite' }
        ]
      }

      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof typeof payload] === undefined) {
          delete payload[key as keyof typeof payload]
        }
      })

      // Send via Resend API
      const response = await this.makeApiCall('/emails', payload)

      const latency = Date.now() - startTime
      this.updateStats(true, latency)

      return this.createSuccessResponse(
        response.id,
        response.id,
        'sent',
        {
          provider: 'resend',
          latency,
          from: payload.from,
          subject: payload.subject
        }
      )

    } catch (error) {
      const latency = Date.now() - startTime
      this.updateStats(false, latency)
      return this.handleHttpError(error, 'send email')
    }
  }

  validateRequest(request: MessageRequest): { valid: boolean; error?: string } {
    // Check common fields
    const commonValidation = this.validateCommonFields(request)
    if (!commonValidation.valid) {
      return commonValidation
    }

    const emailRequest = request as EmailMessageRequest

    // Validate email format
    if (!this.isValidEmail(emailRequest.to)) {
      return { valid: false, error: 'Invalid email address format' }
    }

    // Check that we have content to send
    if (!emailRequest.htmlContent && !emailRequest.textContent && !emailRequest.templateId) {
      return { valid: false, error: 'Email must have HTML content, text content, or template ID' }
    }

    // Validate subject if provided
    if (emailRequest.subject && emailRequest.subject.length > 200) {
      return { valid: false, error: 'Email subject too long (max 200 characters)' }
    }

    return { valid: true }
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.startsWith('re_'))
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a simple API call to get domains
      await this.makeApiCall('/domains', null, 'GET')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Resend connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  getSupportedFeatures(): string[] {
    return [
      'html_content',
      'text_content',
      'custom_from_address',
      'custom_subject',
      'tags',
      'attachments',
      'templates'
    ]
  }

  /**
   * Send email using template
   */
  async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string> = {},
    options: {
      subject?: string
      fromEmail?: string
      fromName?: string
    } = {}
  ): Promise<MessageResponse> {
    return this.send({
      to,
      templateId,
      variables,
      subject: options.subject,
      fromEmail: options.fromEmail,
      fromName: options.fromName
    } as EmailMessageRequest)
  }

  /**
   * Send simple text email
   */
  async sendText(
    to: string,
    subject: string,
    textContent: string,
    options: {
      fromEmail?: string
      fromName?: string
    } = {}
  ): Promise<MessageResponse> {
    return this.send({
      to,
      subject,
      textContent,
      fromEmail: options.fromEmail,
      fromName: options.fromName
    } as EmailMessageRequest)
  }

  /**
   * Send HTML email
   */
  async sendHtml(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string,
    options: {
      fromEmail?: string
      fromName?: string
    } = {}
  ): Promise<MessageResponse> {
    return this.send({
      to,
      subject,
      htmlContent,
      textContent,
      fromEmail: options.fromEmail,
      fromName: options.fromName
    } as EmailMessageRequest)
  }

  /**
   * Make API call to Resend
   */
  private async makeApiCall(endpoint: string, payload: any, method: string = 'POST'): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Planr/1.0'
      }
    }

    if (payload && method !== 'GET') {
      options.body = JSON.stringify(payload)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(`Resend API error: ${response.status} ${response.statusText}`)
      ;(error as any).response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      }
      throw error
    }

    return response.json()
  }

  /**
   * Format from address with name
   */
  private formatFromAddress(email?: string, name?: string): string {
    const fromEmail = email || this.defaultFromEmail
    const fromName = name || this.defaultFromName

    if (fromName) {
      return `${fromName} <${fromEmail}>`
    }

    return fromEmail
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}