import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { Resend } from 'resend';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Test configuration
const TEST_VENDOR_PHONE = process.env.TEST_VENDOR_PHONE || '+1234567890';
const TEST_VENDOR_EMAIL = process.env.TEST_VENDOR_EMAIL || 'test@example.com';
const TEST_COUPLE_ID = process.env.TEST_COUPLE_ID;
const TEST_VENDOR_ID = process.env.TEST_VENDOR_ID;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow
  };
  console.log(`${colorMap[type]}${message}${colors.reset}`);
}

async function testSupabase() {
  log('\n📊 Testing Supabase Connection...', 'info');
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name')
      .limit(1);

    if (error) throw error;

    log('✅ Supabase connection successful', 'success');
    
    // Check if test vendor exists
    if (TEST_VENDOR_ID) {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', TEST_VENDOR_ID)
        .single();

      if (vendorError) {
        log(`⚠️  Test vendor not found: ${TEST_VENDOR_ID}`, 'warning');
      } else {
        log(`✅ Test vendor found: ${vendor.name}`, 'success');
      }
    }

    return true;
  } catch (error: any) {
    log(`❌ Supabase test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testTwilio() {
  log('\n📱 Testing Twilio Connection...', 'info');
  
  if (!twilioClient) {
    log('⚠️  Twilio not configured', 'warning');
    return false;
  }

  try {
    // Test account access
    const account = await twilioClient.api.v2010
      .accounts(process.env.TWILIO_ACCOUNT_SID!)
      .fetch();

    log(`✅ Twilio account active: ${account.friendlyName}`, 'success');

    // List phone numbers
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 5 });
    log(`📞 Available phone numbers:`, 'info');
    phoneNumbers.forEach(number => {
      log(`   - ${number.phoneNumber} (SMS: ${number.capabilities.sms ? '✓' : '✗'}, WhatsApp: ${number.phoneNumber.includes('whatsapp') ? '✓' : '✗'})`, 'info');
    });

    // Test sending SMS (commented out to avoid charges)
    // const message = await twilioClient.messages.create({
    //   body: 'Test message from Wedding Planner integration test',
    //   from: process.env.TWILIO_PHONE_NUMBER!,
    //   to: TEST_VENDOR_PHONE
    // });
    // log(`✅ Test SMS sent: ${message.sid}`, 'success');

    return true;
  } catch (error: any) {
    log(`❌ Twilio test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testResend() {
  log('\n📧 Testing Resend Connection...', 'info');
  
  if (!resend) {
    log('⚠️  Resend not configured', 'warning');
    return false;
  }

  try {
    // List domains
    const { data: domains, error } = await resend.domains.list();
    
    if (error) throw new Error(error.message);

    log('✅ Resend connection successful', 'success');
    log('📧 Available domains:', 'info');
    domains?.data.forEach(domain => {
      log(`   - ${domain.name} (${domain.status})`, 'info');
    });

    // Test sending email (commented out to avoid sending)
    // const { data: email, error: emailError } = await resend.emails.send({
    //   from: process.env.RESEND_FROM_EMAIL!,
    //   to: TEST_VENDOR_EMAIL,
    //   subject: 'Test Email from Wedding Planner',
    //   text: 'This is a test email from the Wedding Planner integration test.'
    // });
    // 
    // if (emailError) throw emailError;
    // log(`✅ Test email sent: ${email?.id}`, 'success');

    return true;
  } catch (error: any) {
    log(`❌ Resend test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testWebhooks() {
  log('\n🔗 Testing Webhook Endpoints...', 'info');
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4002';
  
  // Test Twilio webhook
  try {
    const twilioWebhookUrl = `${baseUrl}/api/webhooks/twilio`;
    const twilioResponse = await fetch(twilioWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        MessageSid: 'TEST123',
        AccountSid: process.env.TWILIO_ACCOUNT_SID || 'TEST',
        From: TEST_VENDOR_PHONE,
        To: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        Body: '[#conv123] Test webhook message'
      })
    });

    if (twilioResponse.ok) {
      log(`✅ Twilio webhook endpoint accessible: ${twilioWebhookUrl}`, 'success');
    } else {
      log(`⚠️  Twilio webhook returned ${twilioResponse.status}`, 'warning');
    }
  } catch (error: any) {
    log(`❌ Twilio webhook test failed: ${error.message}`, 'error');
  }

  // Test Resend webhook
  try {
    const resendWebhookUrl = `${baseUrl}/api/webhooks/resend`;
    const resendResponse = await fetch(resendWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'test-123',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'test-signature'
      },
      body: JSON.stringify({
        type: 'email.received',
        data: {
          from: TEST_VENDOR_EMAIL,
          to: [process.env.RESEND_FROM_EMAIL || 'test@example.com'],
          subject: 'Re: [#conv123] Test message',
          text: 'Test reply content'
        }
      })
    });

    if (resendResponse.ok) {
      log(`✅ Resend webhook endpoint accessible: ${resendWebhookUrl}`, 'success');
    } else {
      log(`⚠️  Resend webhook returned ${resendResponse.status}`, 'warning');
    }
  } catch (error: any) {
    log(`❌ Resend webhook test failed: ${error.message}`, 'error');
  }
}

async function testIntegration() {
  log('\n🔄 Testing Full Integration Flow...', 'info');
  
  if (!TEST_COUPLE_ID || !TEST_VENDOR_ID) {
    log('⚠️  TEST_COUPLE_ID and TEST_VENDOR_ID required for integration test', 'warning');
    return false;
  }

  try {
    // Create a test message thread
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .insert({
        couple_id: TEST_COUPLE_ID,
        vendor_id: TEST_VENDOR_ID,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (threadError) throw threadError;

    log(`✅ Created test message thread: ${thread.id}`, 'success');

    // Create a test message
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .insert({
        thread_id: thread.id,
        couple_id: TEST_COUPLE_ID,
        vendor_id: TEST_VENDOR_ID,
        sender_type: 'couple',
        content: 'Test message from integration test',
        metadata: {
          source: 'web_app',
          external_send_results: {
            sms: true,
            whatsapp: false,
            email: true,
            errors: []
          }
        }
      })
      .select()
      .single();

    if (messageError) throw messageError;

    log(`✅ Created test message: ${message.id}`, 'success');

    // Log to outbound message log
    const { error: logError } = await supabase
      .from('outbound_message_log')
      .insert({
        vendor_id: TEST_VENDOR_ID,
        couple_id: TEST_COUPLE_ID,
        conversation_id: thread.id,
        message_content: message.content,
        sms_sent: true,
        email_sent: true,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      log(`⚠️  Failed to log outbound message: ${logError.message}`, 'warning');
    } else {
      log('✅ Logged outbound message', 'success');
    }

    // Clean up test data
    await supabase.from('vendor_messages').delete().eq('id', message.id);
    await supabase.from('message_threads').delete().eq('id', thread.id);
    
    log('✅ Cleaned up test data', 'success');

    return true;
  } catch (error: any) {
    log(`❌ Integration test failed: ${error.message}`, 'error');
    return false;
  }
}

async function runTests() {
  log('🚀 Starting External Messaging Integration Tests', 'info');
  log('================================================\n', 'info');

  const results = {
    supabase: await testSupabase(),
    twilio: await testTwilio(),
    resend: await testResend(),
    webhooks: await testWebhooks(),
    integration: await testIntegration()
  };

  log('\n📊 Test Results Summary', 'info');
  log('======================', 'info');
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`${test.padEnd(15)} ${passed ? '✅ PASSED' : '❌ FAILED'}`, passed ? 'success' : 'error');
  });

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n🎉 All tests passed! External messaging is ready to use.', 'success');
  } else {
    log('\n⚠️  Some tests failed. Please check your configuration.', 'warning');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Unexpected error: ${error}`, 'error');
  process.exit(1);
});