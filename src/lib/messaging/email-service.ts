import { Resend } from 'resend';
import { getMessagingConfig } from './config';
import type { MessageRecipient, MessageStatus, MessageTemplate } from './types';

class EmailService {
  private resend: Resend;
  private config: ReturnType<typeof getMessagingConfig>;

  constructor() {
    this.config = getMessagingConfig();
    this.resend = new Resend(this.config.resend.apiKey);
  }

  async sendEmail(
    to: MessageRecipient | MessageRecipient[],
    subject: string,
    body: string,
    variables?: Record<string, string>
  ): Promise<MessageStatus> {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const emailAddresses = recipients
        .filter(r => r.email)
        .map(r => r.email as string);

      if (emailAddresses.length === 0) {
        throw new Error('No valid email addresses provided');
      }

      // Replace variables in subject and body
      let processedSubject = subject;
      let processedBody = body;

      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedSubject = processedSubject.replace(regex, value);
          processedBody = processedBody.replace(regex, value);
        });
      }

      const { data, error } = await this.resend.emails.send({
        from: `${this.config.resend.fromName} <${this.config.resend.fromEmail}>`,
        to: emailAddresses,
        subject: processedSubject,
        html: processedBody,
        replyTo: this.config.resend.replyTo,
      });

      if (error) {
        console.error('Resend error:', error);
        return {
          id: crypto.randomUUID(),
          status: 'failed',
          timestamp: new Date(),
          error: error.message,
          messageId: '',
          recipient: emailAddresses.join(', '),
          type: 'email',
        };
      }

      return {
        id: crypto.randomUUID(),
        status: 'sent',
        timestamp: new Date(),
        messageId: data?.id || '',
        recipient: emailAddresses.join(', '),
        type: 'email',
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        id: crypto.randomUUID(),
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: '',
        recipient: Array.isArray(to) ? to.map(r => r.email).join(', ') : to.email || '',
        type: 'email',
      };
    }
  }

  async sendTemplateEmail(
    to: MessageRecipient | MessageRecipient[],
    template: MessageTemplate,
    variables?: Record<string, string>
  ): Promise<MessageStatus> {
    if (template.type !== 'email') {
      throw new Error('Invalid template type for email');
    }

    return this.sendEmail(
      to,
      template.subject || '',
      template.body,
      variables
    );
  }

  async sendBulkEmails(
    recipients: MessageRecipient[],
    subject: string,
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
        return this.sendEmail(recipient, subject, body, variables);
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

  // Webhook handler for Resend events
  async handleWebhook(payload: any, signature?: string): Promise<void> {
    // Verify webhook signature if provided
    if (signature && this.config.webhooks.secret) {
      // TODO: Implement signature verification
      // const isValid = this.verifyWebhookSignature(payload, signature);
      // if (!isValid) {
      //   throw new Error('Invalid webhook signature');
      // }
    }

    // Process webhook event
    const { type, data } = payload;
    
    switch (type) {
      case 'email.sent':
        console.log('Email sent:', data.email_id);
        // Update message status in database
        break;
      case 'email.delivered':
        console.log('Email delivered:', data.email_id);
        // Update message status in database
        break;
      case 'email.delivery_delayed':
        console.log('Email delivery delayed:', data.email_id);
        // Update message status in database
        break;
      case 'email.complained':
        console.log('Email complained:', data.email_id);
        // Handle complaint (e.g., unsubscribe user)
        break;
      case 'email.bounced':
        console.log('Email bounced:', data.email_id);
        // Handle bounce (e.g., mark email as invalid)
        break;
      case 'email.opened':
        console.log('Email opened:', data.email_id);
        // Track engagement
        break;
      case 'email.clicked':
        console.log('Email link clicked:', data.email_id);
        // Track engagement
        break;
      default:
        console.log('Unknown webhook event:', type);
    }
  }
}

export const emailService = new EmailService();