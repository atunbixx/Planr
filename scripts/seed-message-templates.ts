import { prisma } from '../src/lib/prisma'

const systemTemplates = [
  {
    name: 'Guest Invitation - Email',
    description: 'Formal wedding invitation email',
    type: 'email',
    subject: 'You\'re Invited! {{partner1Name}} & {{partner2Name}}\'s Wedding',
    body: `Dear {{guestName}},

We're thrilled to invite you to celebrate our special day!

{{partner1Name}} & {{partner2Name}}
are getting married on {{weddingDate}}
at {{venueName}}
{{venueAddress}}

Please RSVP by {{rsvpDeadline}} at: {{rsvpLink}}

We can't wait to celebrate with you!

With love,
{{partner1Name}} & {{partner2Name}}`,
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'venueName', 'venueAddress', 'rsvpDeadline', 'rsvpLink'],
    is_system: true,
    category: 'invitation'
  },
  {
    name: 'Guest Invitation - SMS',
    description: 'Wedding invitation text message',
    type: 'sms',
    body: 'Hi {{guestName}}! {{partner1Name}} & {{partner2Name}} are getting married on {{weddingDate}} at {{venueName}}. Please RSVP: {{rsvpLink}}',
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'venueName', 'rsvpLink'],
    is_system: true,
    category: 'invitation'
  },
  {
    name: 'RSVP Reminder - Email',
    description: 'Friendly reminder for guests to RSVP',
    type: 'email',
    subject: 'RSVP Reminder - {{partner1Name}} & {{partner2Name}}\'s Wedding',
    body: `Hi {{guestName}},

We hope you received our wedding invitation! We're excited to celebrate with you on {{weddingDate}}.

We haven't received your RSVP yet and would love to know if you can join us. Please respond by {{rsvpDeadline}}.

RSVP here: {{rsvpLink}}

Thank you!
{{partner1Name}} & {{partner2Name}}`,
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'rsvpDeadline', 'rsvpLink'],
    is_system: true,
    category: 'reminder'
  },
  {
    name: 'RSVP Reminder - SMS',
    description: 'Quick RSVP reminder text',
    type: 'sms',
    body: 'Hi {{guestName}}! Just a friendly reminder to RSVP for {{partner1Name}} & {{partner2Name}}\'s wedding by {{rsvpDeadline}}. Link: {{rsvpLink}}',
    variables: ['guestName', 'partner1Name', 'partner2Name', 'rsvpDeadline', 'rsvpLink'],
    is_system: true,
    category: 'reminder'
  },
  {
    name: 'Vendor Booking Confirmation',
    description: 'Confirmation email for vendor bookings',
    type: 'email',
    subject: 'Wedding Service Confirmed - {{weddingDate}}',
    body: `Dear {{vendorName}},

Thank you for confirming your services for our wedding!

Event Details:
- Date: {{weddingDate}}
- Time: {{serviceTime}}
- Venue: {{venueName}}
- Address: {{venueAddress}}

Service: {{serviceType}}

We'll be in touch closer to the date with any final details.

Best regards,
{{partner1Name}} & {{partner2Name}}`,
    variables: ['vendorName', 'weddingDate', 'serviceTime', 'venueName', 'venueAddress', 'serviceType', 'partner1Name', 'partner2Name'],
    is_system: true,
    category: 'confirmation'
  },
  {
    name: 'Thank You Message',
    description: 'Post-wedding thank you message',
    type: 'email',
    subject: 'Thank You! - {{partner1Name}} & {{partner2Name}}',
    body: `Dear {{guestName}},

Thank you so much for being part of our special day! Your presence made our wedding truly magical.

{{#if gift}}Thank you also for the wonderful {{gift}}. We absolutely love it!{{/if}}

We're so grateful to have friends and family like you.

With all our love,
{{partner1Name}} & {{partner2Name}}`,
    variables: ['guestName', 'partner1Name', 'partner2Name', 'gift'],
    is_system: true,
    category: 'thank_you'
  },
  {
    name: 'Wedding Day Reminder',
    description: 'Day-before reminder for guests',
    type: 'email',
    subject: 'Tomorrow\'s the Day! - {{partner1Name}} & {{partner2Name}}\'s Wedding',
    body: `Hi {{guestName}},

We're so excited - tomorrow is our wedding day!

Quick reminder:
- Date: {{weddingDate}}
- Time: {{ceremonyTime}}
- Location: {{venueName}}
- Address: {{venueAddress}}

{{#if dresscode}}Dress code: {{dresscode}}{{/if}}

We can't wait to celebrate with you!

{{partner1Name}} & {{partner2Name}}`,
    variables: ['guestName', 'weddingDate', 'ceremonyTime', 'venueName', 'venueAddress', 'dresscode', 'partner1Name', 'partner2Name'],
    is_system: true,
    category: 'reminder'
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Seeding message templates...');
    
    for (const template of systemTemplates) {
      await prisma.messageTemplate.upsert({
        where: {
          name: template.name
        },
        update: template,
        create: template
      });
      console.log(`✅ Created/updated template: ${template.name}`);
    }
    
    console.log('🎉 Message templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();