import twilio from 'twilio';
import { getMessagingConfig } from './config';
import type { MessageRecipient, MessageStatus, MessageTemplate } from './types';

class SMSService {
  private client: twilio.Twilio;
  private config: ReturnType<typeof getMessagingConfig>;

  constructor() {
    this.config = getMessagingConfig();
    this.client = twilio(
      this.config.twilio.accountSid,
      this.config.twilio.authToken
    );
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // Assume it already has country code
    return cleaned.startsWith('+') ? phone : `+${cleaned}`;
  }

  async sendSMS(
    to: MessageRecipient | MessageRecipient[],
    body: string,
    variables?: Record<string, string>
  ): Promise<MessageStatus> {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const phoneNumbers = recipients
        .filter(r => r.phone)
        .map(r => this.formatPhoneNumber(r.phone as string));

      if (phoneNumbers.length === 0) {
        throw new Error('No valid phone numbers provided');
      }

      // Replace variables in body
      let processedBody = body;
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedBody = processedBody.replace(regex, value);
        });
      }

      // Send to each recipient (Twilio doesn't support bulk SMS in single call)
      const results = await Promise.all(
        phoneNumbers.map(phone =>
          this.client.messages.create({
            body: processedBody,
            from: this.config.twilio.phoneNumber,
            to: phone,
            ...(this.config.twilio.messagingServiceSid && {
              messagingServiceSid: this.config.twilio.messagingServiceSid,
              from: undefined, // Use messaging service instead of from number
            }),
          })
        )
      );

      // Return status for first message (for single recipient case)
      const firstResult = results[0];
      return {
        id: crypto.randomUUID(),
        status: firstResult.status === 'failed' ? 'failed' : 'sent',
        timestamp: new Date(),
        messageId: firstResult.sid,
        recipient: phoneNumbers.join(', '),
        type: 'sms',
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        id: crypto.randomUUID(),
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: '',
        recipient: Array.isArray(to) ? to.map(r => r.phone).join(', ') : to.phone || '',
        type: 'sms',
      };
    }
  }

  async sendWhatsApp(
    to: MessageRecipient | MessageRecipient[],
    body: string,
    variables?: Record<string, string>,
    mediaUrl?: string
  ): Promise<MessageStatus> {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const phoneNumbers = recipients
        .filter(r => r.phone)
        .map(r => this.formatPhoneNumber(r.phone as string));

      if (phoneNumbers.length === 0) {
        throw new Error('No valid phone numbers provided');
      }

      // Replace variables in body
      let processedBody = body;
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedBody = processedBody.replace(regex, value);
        });
      }

      // Send WhatsApp message to each recipient
      const results = await Promise.all(
        phoneNumbers.map(phone =>
          this.client.messages.create({
            body: processedBody,
            from: `whatsapp:${this.config.twilio.phoneNumber}`,
            to: `whatsapp:${phone}`,
            ...(mediaUrl && { mediaUrl: [mediaUrl] }),
          })
        )
      );

      // Return status for first message
      const firstResult = results[0];
      return {
        id: crypto.randomUUID(),
        status: firstResult.status === 'failed' ? 'failed' : 'sent',
        timestamp: new Date(),
        messageId: firstResult.sid,
        recipient: phoneNumbers.join(', '),
        type: 'whatsapp',
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        id: crypto.randomUUID(),
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: '',
        recipient: Array.isArray(to) ? to.map(r => r.phone).join(', ') : to.phone || '',
        type: 'whatsapp',
      };
    }
  }

  async sendTemplateSMS(
    to: MessageRecipient | MessageRecipient[],
    template: MessageTemplate,
    variables?: Record<string, string>
  ): Promise<MessageStatus> {
    if (template.type !== 'sms' && template.type !== 'whatsapp') {
      throw new Error('Invalid template type for SMS/WhatsApp');
    }

    if (template.type === 'whatsapp') {
      return this.sendWhatsApp(to, template.body, variables);
    }

    return this.sendSMS(to, template.body, variables);
  }

  async sendBulkSMS(
    recipients: MessageRecipient[],
    body: string,
    perRecipientVariables?: Record<string, Record<string, string>>
  ): Promise<MessageStatus[]> {
    const results: MessageStatus[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => {
        const variables = perRecipientVariables?.[recipient.id];
        return this.sendSMS(recipient, body, variables);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Get message status from Twilio
  async getMessageStatus(messageSid: string): Promise<string> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      console.error('Error fetching message status:', error);
      return 'unknown';
    }
  }

  // Webhook handler for Twilio events
  async handleWebhook(payload: any): Promise<void> {
    const { MessageSid, MessageStatus, From, To, ErrorCode, ErrorMessage } = payload;
    
    console.log(`Message ${MessageSid} status: ${MessageStatus}`);
    
    switch (MessageStatus) {
      case 'sent':
        console.log(`Message sent from ${From} to ${To}`);
        // Update message status in database
        break;
      case 'delivered':
        console.log(`Message delivered to ${To}`);
        // Update message status in database
        break;
      case 'failed':
        console.error(`Message failed: ${ErrorCode} - ${ErrorMessage}`);
        // Update message status and error in database
        break;
      case 'undelivered':
        console.error(`Message undelivered to ${To}`);
        // Update message status in database
        break;
      default:
        console.log(`Unknown message status: ${MessageStatus}`);
    }
  }

  // Handle incoming SMS/WhatsApp messages
  async handleIncomingMessage(payload: any): Promise<void> {
    const { From, To, Body, MessageSid, MediaUrl0 } = payload;
    
    console.log(`Incoming message from ${From}: ${Body}`);
    
    // Process incoming message based on content
    // This could trigger automated responses, update RSVP status, etc.
    
    // Example: Check if it's an RSVP response
    const rsvpPattern = /\b(yes|no|maybe|attending|not attending)\b/i;
    const match = Body.match(rsvpPattern);
    
    if (match) {
      const response = match[1].toLowerCase();
      console.log(`RSVP response detected: ${response}`);
      // Update guest RSVP in database
      // Send confirmation message back
    }
  }
}

export const smsService = new SMSService();