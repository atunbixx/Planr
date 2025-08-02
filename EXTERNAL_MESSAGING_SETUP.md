# External Messaging Integration Setup Guide

This guide provides step-by-step instructions for setting up external messaging integration with Twilio (SMS) and Resend (Email) for the Wedding Planner application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables Configuration](#environment-variables-configuration)
  - [Twilio Configuration](#twilio-configuration)
  - [Resend Configuration](#resend-configuration)
  - [Database Configuration](#database-configuration)
- [Webhook Configuration](#webhook-configuration)
  - [Twilio Webhook Setup](#twilio-webhook-setup)
  - [Resend Webhook Setup](#resend-webhook-setup)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

1. A Twilio account with:
   - Account SID
   - Auth Token
   - A verified phone number for sending SMS
   - Twilio Messaging Service (optional but recommended)

2. A Resend account with:
   - API Key
   - Verified domain for sending emails
   - Webhook signing secret

3. A publicly accessible URL for webhooks (use ngrok for local development)

## Environment Variables Configuration

Create or update your `.env.local` file with the following variables:

### Twilio Configuration

```env
# Twilio API Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Phone Numbers
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number (with country code)
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional: For better deliverability

# Twilio Webhook Configuration
TWILIO_WEBHOOK_URL=https://your-domain.com/api/webhooks/twilio
TWILIO_STATUS_CALLBACK_URL=https://your-domain.com/api/webhooks/twilio/status

# Twilio Settings
TWILIO_SMS_FROM_NAME=YourWedding  # Optional: Alphanumeric sender ID (if supported in your region)
TWILIO_MAX_RETRY_ATTEMPTS=3
TWILIO_RETRY_DELAY_MS=5000
```

### Resend Configuration

```env
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Resend Email Settings
RESEND_FROM_EMAIL=notifications@yourdomain.com
RESEND_FROM_NAME=Your Wedding Planner
RESEND_REPLY_TO_EMAIL=support@yourdomain.com

# Resend Webhook Configuration
RESEND_WEBHOOK_URL=https://your-domain.com/api/webhooks/resend

# Resend Settings
RESEND_MAX_RETRY_ATTEMPTS=3
RESEND_RETRY_DELAY_MS=5000
```

### Database Configuration

```env
# Supabase Configuration (for storing message logs)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Settings
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production  # or 'development' for local testing
```

## Webhook Configuration

### Twilio Webhook Setup

1. **Log in to Twilio Console**
   - Navigate to https://console.twilio.com

2. **Configure Phone Number Webhooks**
   - Go to Phone Numbers > Manage > Active Numbers
   - Click on your phone number
   - In the "Messaging" section, configure:
     - **When a message comes in**: `https://your-domain.com/api/webhooks/twilio/incoming`
     - **HTTP Method**: POST
     - **When a message fails**: `https://your-domain.com/api/webhooks/twilio/status`

3. **Configure Messaging Service (if using)**
   - Go to Messaging > Services
   - Select your messaging service
   - Under "Integration", configure:
     - **Incoming Messages**: `https://your-domain.com/api/webhooks/twilio/incoming`
     - **Status Callbacks**: `https://your-domain.com/api/webhooks/twilio/status`

4. **Set up Status Callbacks**
   - In your messaging service or phone number settings
   - Enable status callbacks for:
     - Message Sent
     - Message Delivered
     - Message Failed
     - Message Undelivered

### Resend Webhook Setup

1. **Log in to Resend Dashboard**
   - Navigate to https://resend.com/webhooks

2. **Create a New Webhook**
   - Click "Create Webhook"
   - Configure:
     - **Endpoint URL**: `https://your-domain.com/api/webhooks/resend`
     - **Events to subscribe**:
       - `email.sent`
       - `email.delivered`
       - `email.delivery_delayed`
       - `email.complained`
       - `email.bounced`
       - `email.opened`
       - `email.clicked`

3. **Save Webhook Signing Secret**
   - After creating the webhook, copy the signing secret
   - Add it to your `.env.local` as `RESEND_WEBHOOK_SECRET`

## Testing and Verification

### 1. Environment Variables Test

Create a test script to verify your environment variables:

```javascript
// test-env.js
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('Checking environment variables...\n');

let hasErrors = false;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set (${process.env[varName].substring(0, 10)}...)`);
  } else {
    console.log(`❌ ${varName}: Not set`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.log('\n❌ Some required environment variables are missing!');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
}
```

Run with: `node test-env.js`

### 2. Twilio Connection Test

Create a test script to verify Twilio connection:

```javascript
// test-twilio.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function testTwilioConnection() {
  try {
    // Test authentication
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Twilio authentication successful');
    console.log(`   Account Name: ${account.friendlyName}`);
    console.log(`   Account Status: ${account.status}`);

    // Test phone number
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const numbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });
    
    if (numbers.length > 0) {
      console.log(`✅ Phone number ${phoneNumber} is configured`);
    } else {
      console.log(`❌ Phone number ${phoneNumber} not found in your account`);
    }

    // Send test SMS (optional - uncomment to test)
    /*
    const message = await client.messages.create({
      body: 'Test message from Wedding Planner setup',
      from: phoneNumber,
      to: '+1234567890' // Replace with your phone number
    });
    console.log(`✅ Test SMS sent: ${message.sid}`);
    */

  } catch (error) {
    console.error('❌ Twilio connection failed:', error.message);
  }
}

testTwilioConnection();
```

Run with: `node test-twilio.js`

### 3. Resend Connection Test

Create a test script to verify Resend connection:

```javascript
// test-resend.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendConnection() {
  try {
    // Test API key
    const domains = await resend.domains.list();
    console.log('✅ Resend authentication successful');
    console.log(`   Verified domains: ${domains.data.map(d => d.name).join(', ')}`);

    // Send test email (optional - uncomment to test)
    /*
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'test@example.com', // Replace with your email
      subject: 'Wedding Planner Test Email',
      html: '<p>This is a test email from your Wedding Planner setup.</p>'
    });

    if (error) {
      console.error('❌ Test email failed:', error);
    } else {
      console.log(`✅ Test email sent: ${data.id}`);
    }
    */

  } catch (error) {
    console.error('❌ Resend connection failed:', error.message);
  }
}

testResendConnection();
```

Run with: `node test-resend.js`

### 4. Webhook Testing with ngrok

For local development, use ngrok to expose your local server:

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/download
   ```

2. **Start your Next.js development server**
   ```bash
   npm run dev
   ```

3. **Start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Update webhook URLs**
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Update your Twilio and Resend webhook configurations with this URL
   - Update your `.env.local` with the ngrok URL

### 5. Webhook Endpoint Test

Test your webhook endpoints:

```bash
# Test Twilio webhook
curl -X POST https://your-domain.com/api/webhooks/twilio \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SMtest123&AccountSid=$TWILIO_ACCOUNT_SID&From=+1234567890&To=+0987654321&Body=Test"

# Test Resend webhook
curl -X POST https://your-domain.com/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -H "webhook-signature: test" \
  -d '{"type":"email.sent","data":{"email_id":"test123"}}'
```

### 6. Integration Test Script

Create a comprehensive test script:

```javascript
// test-integration.js
const { testTwilioIntegration } = require('./src/lib/external-messaging/sms');
const { testResendIntegration } = require('./src/lib/external-messaging/email');

async function runIntegrationTests() {
  console.log('🧪 Running External Messaging Integration Tests\n');

  // Test Twilio
  console.log('📱 Testing Twilio SMS Integration...');
  const twilioResult = await testTwilioIntegration();
  console.log(twilioResult.success ? '✅ Twilio test passed' : '❌ Twilio test failed');
  if (!twilioResult.success) {
    console.error('   Error:', twilioResult.error);
  }

  // Test Resend
  console.log('\n📧 Testing Resend Email Integration...');
  const resendResult = await testResendIntegration();
  console.log(resendResult.success ? '✅ Resend test passed' : '❌ Resend test failed');
  if (!resendResult.success) {
    console.error('   Error:', resendResult.error);
  }

  // Test Database
  console.log('\n🗄️ Testing Database Connection...');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('message_logs')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  console.log('\n✨ Integration tests completed!');
}

runIntegrationTests();
```

## Troubleshooting

### Common Issues and Solutions

1. **Webhook URLs not accessible**
   - Ensure your application is deployed or use ngrok for local testing
   - Check firewall settings
   - Verify SSL certificate is valid

2. **Authentication failures**
   - Double-check API keys and credentials
   - Ensure environment variables are loaded correctly
   - Check for extra spaces or quotes in env values

3. **SMS not sending**
   - Verify phone number format (include country code)
   - Check Twilio account balance
   - Ensure phone number is verified in Twilio
   - Check geographic permissions in Twilio

4. **Emails not sending**
   - Verify domain is configured in Resend
   - Check SPF/DKIM records
   - Ensure from email matches verified domain

5. **Webhook signature validation failing**
   - Ensure webhook secret is correct
   - Check for request body parsing issues
   - Verify Content-Type headers

### Debug Mode

Enable debug logging by adding to `.env.local`:

```env
# Debug Settings
DEBUG_EXTERNAL_MESSAGING=true
LOG_WEBHOOK_PAYLOADS=true
```

### Health Check Endpoint

Create a health check endpoint to monitor service status:

```javascript
// pages/api/health/external-messaging.js
export default async function handler(req, res) {
  const status = {
    twilio: { connected: false, error: null },
    resend: { connected: false, error: null },
    database: { connected: false, error: null }
  };

  // Check Twilio
  try {
    const twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    status.twilio.connected = true;
  } catch (error) {
    status.twilio.error = error.message;
  }

  // Check Resend
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.domains.list();
    status.resend.connected = true;
  } catch (error) {
    status.resend.error = error.message;
  }

  // Check Database
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase.from('message_logs').select('count').limit(1);
    if (error) throw error;
    status.database.connected = true;
  } catch (error) {
    status.database.error = error.message;
  }

  const allHealthy = Object.values(status).every(s => s.connected);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    services: status,
    timestamp: new Date().toISOString()
  });
}
```

Access at: `https://your-domain.com/api/health/external-messaging`

## Next Steps

1. **Test in Development**
   - Use ngrok for webhook testing
   - Send test messages
   - Verify webhook payloads

2. **Monitor in Production**
   - Set up error alerting
   - Monitor webhook failures
   - Track delivery rates

3. **Scale Considerations**
   - Implement rate limiting
   - Use message queuing for high volume
   - Set up webhook retry logic

4. **Security Best Practices**
   - Rotate API keys regularly
   - Use webhook signature validation
   - Implement IP whitelisting if possible
   - Monitor for suspicious activity

For additional support:
- Twilio Documentation: https://www.twilio.com/docs
- Resend Documentation: https://resend.com/docs
- Supabase Documentation: https://supabase.com/docs