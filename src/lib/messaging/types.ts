// Messaging service types
export interface MessageTemplate {
  id: string;
  name: string;
  subject?: string; // For emails
  body: string;
  type: 'email' | 'sms' | 'whatsapp';
  variables: string[]; // Variables that can be replaced in template
}

export interface MessageRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  preferredChannel: 'email' | 'sms' | 'whatsapp';
}

export interface SendMessageRequest {
  to: MessageRecipient | MessageRecipient[];
  template?: MessageTemplate;
  subject?: string; // For custom emails
  body: string;
  type: 'email' | 'sms' | 'whatsapp';
  variables?: Record<string, string>;
  scheduledFor?: Date;
}

export interface MessageStatus {
  id: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
  timestamp: Date;
  error?: string;
  messageId: string; // External service message ID
  recipient: string;
  type: 'email' | 'sms' | 'whatsapp';
}

export interface WebhookEvent {
  type: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

export interface MessagingConfig {
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    messagingServiceSid?: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
  };
  webhooks: {
    twilioUrl?: string;
    resendUrl?: string;
    secret?: string;
  };
}

export interface BulkMessageRequest {
  recipients: MessageRecipient[];
  template: MessageTemplate;
  variables?: Record<string, Record<string, string>>; // Per-recipient variables
  scheduledFor?: Date;
  batchSize?: number;
}

export interface MessageLog {
  id: string;
  coupleId: string;
  recipient_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  messageType: 'email' | 'sms' | 'whatsapp';
  templateId?: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
  error_message?: string;
  external_id?: string; // Twilio/Resend message ID
  sent_at?: Date;
  delivered_at?: Date;
  opened_at?: Date; // For emails
  clicked_at?: Date; // For emails
  created_at: Date;
  updated_at: Date;
}