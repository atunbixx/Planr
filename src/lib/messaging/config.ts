import { MessagingConfig } from './types';

// Get messaging configuration from environment variables
export function getMessagingConfig(): MessagingConfig {
  const config: MessagingConfig = {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || '',
      fromEmail: process.env.RESEND_FROM_EMAIL || 'notifications@weddingplanner.com',
      fromName: process.env.RESEND_FROM_NAME || 'Wedding Planner',
      replyTo: process.env.RESEND_REPLY_TO_EMAIL,
    },
    webhooks: {
      twilioUrl: process.env.TWILIO_WEBHOOK_URL,
      resendUrl: process.env.RESEND_WEBHOOK_URL,
      secret: process.env.WEBHOOK_SECRET,
    },
  };

  return config;
}

// Validate that required config is present
export function validateMessagingConfig(config: MessagingConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check Twilio config
  if (!config.twilio.accountSid) {
    errors.push('Missing TWILIO_ACCOUNT_SID');
  }
  if (!config.twilio.authToken) {
    errors.push('Missing TWILIO_AUTH_TOKEN');
  }
  if (!config.twilio.phoneNumber && !config.twilio.messagingServiceSid) {
    errors.push('Missing TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID');
  }

  // Check Resend config
  if (!config.resend.apiKey) {
    errors.push('Missing RESEND_API_KEY');
  }
  if (!config.resend.fromEmail) {
    errors.push('Missing RESEND_FROM_EMAIL');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Message templates
export const DEFAULT_TEMPLATES = {
  // Guest invitation templates
  GUEST_INVITATION_EMAIL: {
    id: 'guest_invitation_email',
    name: 'Guest Invitation Email',
    type: 'email' as const,
    subject: "You're Invited to {{coupleName}}'s Wedding!",
    body: `
      <h2>You're Invited!</h2>
      <p>Dear {{guestName}},</p>
      <p>{{partner1Name}} and {{partner2Name}} request the pleasure of your company at their wedding celebration.</p>
      <p><strong>Date:</strong> {{weddingDate}}</p>
      <p><strong>Time:</strong> {{weddingTime}}</p>
      <p><strong>Venue:</strong> {{venueName}}</p>
      <p><strong>Address:</strong> {{venueAddress}}</p>
      <p>Please RSVP by {{rsvpDeadline}} at: {{rsvpLink}}</p>
      <p>We look forward to celebrating with you!</p>
      <p>With love,<br>{{partner1Name}} & {{partner2Name}}</p>
    `,
    variables: ['guestName', 'coupleName', 'partner1Name', 'partner2Name', 'weddingDate', 'weddingTime', 'venueName', 'venueAddress', 'rsvpDeadline', 'rsvpLink'],
  },

  GUEST_INVITATION_SMS: {
    id: 'guest_invitation_sms',
    name: 'Guest Invitation SMS',
    type: 'sms' as const,
    body: "Hi {{guestName}}! You're invited to {{partner1Name}} & {{partner2Name}}'s wedding on {{weddingDate}}. RSVP: {{rsvpLink}}",
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'rsvpLink'],
  },

  // RSVP reminder templates
  RSVP_REMINDER_EMAIL: {
    id: 'rsvp_reminder_email',
    name: 'RSVP Reminder Email',
    type: 'email' as const,
    subject: 'Reminder: Please RSVP for {{coupleName}}\'s Wedding',
    body: `
      <p>Hi {{guestName}},</p>
      <p>This is a friendly reminder to RSVP for {{partner1Name}} and {{partner2Name}}'s wedding.</p>
      <p>The deadline is {{rsvpDeadline}} - just {{daysLeft}} days away!</p>
      <p>Please confirm your attendance at: {{rsvpLink}}</p>
      <p>Thank you!</p>
    `,
    variables: ['guestName', 'coupleName', 'partner1Name', 'partner2Name', 'rsvpDeadline', 'daysLeft', 'rsvpLink'],
  },

  RSVP_REMINDER_SMS: {
    id: 'rsvp_reminder_sms',
    name: 'RSVP Reminder SMS',
    type: 'sms' as const,
    body: 'Hi {{guestName}}! Please RSVP for {{partner1Name}} & {{partner2Name}}\'s wedding by {{rsvpDeadline}}: {{rsvpLink}}',
    variables: ['guestName', 'partner1Name', 'partner2Name', 'rsvpDeadline', 'rsvpLink'],
  },

  // Vendor communication templates
  VENDOR_CONFIRMATION_EMAIL: {
    id: 'vendor_confirmation_email',
    name: 'Vendor Booking Confirmation',
    type: 'email' as const,
    subject: 'Booking Confirmation - {{coupleName}} Wedding',
    body: `
      <p>Dear {{vendorName}},</p>
      <p>This email confirms your booking for {{partner1Name}} and {{partner2Name}}'s wedding.</p>
      <p><strong>Event Details:</strong></p>
      <ul>
        <li>Date: {{weddingDate}}</li>
        <li>Time: {{serviceTime}}</li>
        <li>Venue: {{venueName}}</li>
        <li>Service: {{serviceType}}</li>
      </ul>
      <p>Please confirm receipt of this email and let us know if you have any questions.</p>
      <p>Best regards,<br>{{partner1Name}} & {{partner2Name}}</p>
    `,
    variables: ['vendorName', 'coupleName', 'partner1Name', 'partner2Name', 'weddingDate', 'serviceTime', 'venueName', 'serviceType'],
  },

  VENDOR_REMINDER_SMS: {
    id: 'vendor_reminder_sms',
    name: 'Vendor Service Reminder',
    type: 'sms' as const,
    body: 'Reminder: {{serviceType}} for {{coupleName}} wedding on {{weddingDate}} at {{serviceTime}}. Venue: {{venueName}}',
    variables: ['serviceType', 'coupleName', 'weddingDate', 'serviceTime', 'venueName'],
  },

  // Wedding day reminders
  WEDDING_DAY_GUEST_SMS: {
    id: 'wedding_day_guest_sms',
    name: 'Wedding Day Guest Reminder',
    type: 'sms' as const,
    body: 'Today\'s the day! {{partner1Name}} & {{partner2Name}}\'s wedding starts at {{weddingTime}}. Venue: {{venueName}}, {{venueAddress}}. See you there!',
    variables: ['partner1Name', 'partner2Name', 'weddingTime', 'venueName', 'venueAddress'],
  },

  // Thank you messages
  THANK_YOU_EMAIL: {
    id: 'thank_you_email',
    name: 'Thank You Email',
    type: 'email' as const,
    subject: 'Thank You from {{partner1Name}} & {{partner2Name}}',
    body: `
      <p>Dear {{guestName}},</p>
      <p>Thank you so much for celebrating our special day with us!</p>
      <p>Your presence made our wedding even more memorable, and we are grateful for your love and support.</p>
      <p>We look forward to many more celebrations together.</p>
      <p>With love and gratitude,<br>{{partner1Name}} & {{partner2Name}}</p>
    `,
    variables: ['guestName', 'partner1Name', 'partner2Name'],
  },
};