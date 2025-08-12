import { emailService } from './email-service';
import { smsService } from './sms-service';
import { DEFAULT_TEMPLATES } from './config';
import type { 
  SendMessageRequest, 
  MessageStatus, 
  MessageRecipient, 
  BulkMessageRequest,
  MessageTemplate,
  MessageLog
} from './types';
import { getSupabase } from '@/lib/supabase';

class MessagingService {
  async sendMessage(request: SendMessageRequest): Promise<MessageStatus> {
    const { to, type, subject, body, variables, template } = request;

    // Use template if provided
    const messageBody = template ? template.body : body;
    const messageSubject = template?.subject || subject;

    switch (type) {
      case 'email':
        return emailService.sendEmail(to, messageSubject || '', messageBody, variables);
      
      case 'sms':
        return smsService.sendSMS(to, messageBody, variables);
      
      case 'whatsapp':
        return smsService.sendWhatsApp(to, messageBody, variables);
      
      default:
        throw new Error(`Unsupported message type: ${type}`);
    }
  }

  async sendBulkMessages(request: BulkMessageRequest): Promise<MessageStatus[]> {
    const { recipients, template, variables, batchSize = 10 } = request;
    const results: MessageStatus[] = [];

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => {
        const recipientVariables = variables?.[recipient.id];
        return this.sendMessage({
          to: recipient,
          template,
          type: template.type,
          body: template.body,
          subject: template.subject,
          variables: recipientVariables,
        });
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Send message based on recipient's preferred channel
  async sendToPreferredChannel(
    recipient: MessageRecipient,
    emailTemplate?: MessageTemplate,
    smsTemplate?: MessageTemplate,
    variables?: Record<string, string>
  ): Promise<MessageStatus> {
    const channel = recipient.preferredChannel || 'email';

    switch (channel) {
      case 'email':
        if (!emailTemplate) {
          throw new Error('Email template required for email channel');
        }
        return this.sendMessage({
          to: recipient,
          template: emailTemplate,
          type: 'email',
          body: emailTemplate.body,
          subject: emailTemplate.subject,
          variables,
        });

      case 'sms':
      case 'whatsapp':
        if (!smsTemplate) {
          throw new Error('SMS template required for SMS/WhatsApp channel');
        }
        return this.sendMessage({
          to: recipient,
          template: smsTemplate,
          type: channel,
          body: smsTemplate.body,
          variables,
        });

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  // Log message to database
  async logMessage(
    coupleId: string,
    recipient: MessageRecipient,
    type: 'email' | 'sms' | 'whatsapp',
    subject: string | undefined,
    body: string,
    status: MessageStatus,
    templateId?: string
  ): Promise<void> {
    try {
      const log: Partial<MessageLog> = {
        coupleId: coupleId,
        recipient_id: recipient.id,
        recipient_email: recipient.email,
        recipient_phone: recipient.phone,
        messageType: type,
        templateId: templateId,
        subject,
        body,
        status: status.status,
        error_message: status.error,
        external_id: status.messageId,
        sentAt: status.status === 'sent' ? status.timestamp : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { error } = await getSupabase()
        .from('message_logs')
        .insert(log);

      if (error) {
        console.error('Error logging message:', error);
      }
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  // Get message logs for a couple
  async getMessageLogs(coupleId: string, limit = 50): Promise<MessageLog[]> {
    const { data, error } = await getSupabase()
      .from('message_logs')
      .select('*')
      .eq('couple_id', coupleId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching message logs:', error);
      return [];
    }

    return data || [];
  }

  // Guest-specific messaging methods
  async sendGuestInvitation(
    coupleId: string,
    guest: MessageRecipient,
    weddingDetails: Record<string, string>
  ): Promise<MessageStatus> {
    const variables = {
      guestName: guest.name,
      ...weddingDetails,
    };

    let status: MessageStatus;

    if (guest.preferredChannel === 'email' && guest.email) {
      status = await this.sendMessage({
        to: guest,
        template: DEFAULT_TEMPLATES.GUEST_INVITATION_EMAIL,
        type: 'email',
        body: DEFAULT_TEMPLATES.GUEST_INVITATION_EMAIL.body,
        subject: DEFAULT_TEMPLATES.GUEST_INVITATION_EMAIL.subject,
        variables,
      });
    } else if (guest.phone) {
      status = await this.sendMessage({
        to: guest,
        template: DEFAULT_TEMPLATES.GUEST_INVITATION_SMS,
        type: 'sms',
        body: DEFAULT_TEMPLATES.GUEST_INVITATION_SMS.body,
        variables,
      });
    } else {
      throw new Error('Guest has no valid contact information');
    }

    // Log the message
    await this.logMessage(
      coupleId,
      guest,
      status.type,
      DEFAULT_TEMPLATES.GUEST_INVITATION_EMAIL.subject,
      DEFAULT_TEMPLATES.GUEST_INVITATION_EMAIL.body,
      status,
      guest.preferredChannel === 'email' 
        ? DEFAULT_TEMPLATES.GUEST_INVITATION_EMAIL.id
        : DEFAULT_TEMPLATES.GUEST_INVITATION_SMS.id
    );

    return status;
  }

  async sendRSVPReminder(
    coupleId: string,
    guest: MessageRecipient,
    weddingDetails: Record<string, string>
  ): Promise<MessageStatus> {
    const variables = {
      guestName: guest.name,
      ...weddingDetails,
    };

    let status: MessageStatus;

    if (guest.preferredChannel === 'email' && guest.email) {
      status = await this.sendMessage({
        to: guest,
        template: DEFAULT_TEMPLATES.RSVP_REMINDER_EMAIL,
        type: 'email',
        body: DEFAULT_TEMPLATES.RSVP_REMINDER_EMAIL.body,
        subject: DEFAULT_TEMPLATES.RSVP_REMINDER_EMAIL.subject,
        variables,
      });
    } else if (guest.phone) {
      status = await this.sendMessage({
        to: guest,
        template: DEFAULT_TEMPLATES.RSVP_REMINDER_SMS,
        type: 'sms',
        body: DEFAULT_TEMPLATES.RSVP_REMINDER_SMS.body,
        variables,
      });
    } else {
      throw new Error('Guest has no valid contact information');
    }

    await this.logMessage(
      coupleId,
      guest,
      status.type,
      DEFAULT_TEMPLATES.RSVP_REMINDER_EMAIL.subject,
      DEFAULT_TEMPLATES.RSVP_REMINDER_EMAIL.body,
      status,
      guest.preferredChannel === 'email'
        ? DEFAULT_TEMPLATES.RSVP_REMINDER_EMAIL.id
        : DEFAULT_TEMPLATES.RSVP_REMINDER_SMS.id
    );

    return status;
  }

  // Vendor-specific messaging methods
  async sendVendorConfirmation(
    coupleId: string,
    vendor: MessageRecipient,
    bookingDetails: Record<string, string>
  ): Promise<MessageStatus> {
    const variables = {
      vendorName: vendor.name,
      ...bookingDetails,
    };

    let status: MessageStatus;

    if (vendor.email) {
      status = await this.sendMessage({
        to: vendor,
        template: DEFAULT_TEMPLATES.VENDOR_CONFIRMATION_EMAIL,
        type: 'email',
        body: DEFAULT_TEMPLATES.VENDOR_CONFIRMATION_EMAIL.body,
        subject: DEFAULT_TEMPLATES.VENDOR_CONFIRMATION_EMAIL.subject,
        variables,
      });
    } else if (vendor.phone) {
      status = await this.sendMessage({
        to: vendor,
        template: DEFAULT_TEMPLATES.VENDOR_REMINDER_SMS,
        type: 'sms',
        body: DEFAULT_TEMPLATES.VENDOR_REMINDER_SMS.body,
        variables,
      });
    } else {
      throw new Error('Vendor has no valid contact information');
    }

    await this.logMessage(
      coupleId,
      vendor,
      status.type,
      DEFAULT_TEMPLATES.VENDOR_CONFIRMATION_EMAIL.subject,
      DEFAULT_TEMPLATES.VENDOR_CONFIRMATION_EMAIL.body,
      status,
      vendor.email
        ? DEFAULT_TEMPLATES.VENDOR_CONFIRMATION_EMAIL.id
        : DEFAULT_TEMPLATES.VENDOR_REMINDER_SMS.id
    );

    return status;
  }

  // Send thank you messages after the wedding
  async sendThankYouMessages(
    coupleId: string,
    guests: MessageRecipient[],
    personalizedMessages?: Record<string, string>
  ): Promise<MessageStatus[]> {
    const results: MessageStatus[] = [];

    for (const guest of guests) {
      if (!guest.email) continue;

      const variables = {
        guestName: guest.name,
        partner1Name: 'Partner 1', // These should come from couple data
        partner2Name: 'Partner 2',
        personalMessage: personalizedMessages?.[guest.id] || '',
      };

      const status = await this.sendMessage({
        to: guest,
        template: DEFAULT_TEMPLATES.THANK_YOU_EMAIL,
        type: 'email',
        body: DEFAULT_TEMPLATES.THANK_YOU_EMAIL.body,
        subject: DEFAULT_TEMPLATES.THANK_YOU_EMAIL.subject,
        variables,
      });

      await this.logMessage(
        coupleId,
        guest,
        'email',
        DEFAULT_TEMPLATES.THANK_YOU_EMAIL.subject,
        DEFAULT_TEMPLATES.THANK_YOU_EMAIL.body,
        status,
        DEFAULT_TEMPLATES.THANK_YOU_EMAIL.id
      );

      results.push(status);
    }

    return results;
  }
}

export const messagingService = new MessagingService();