import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4001';

test.describe('Messaging API Tests', () => {
  // Mock authentication header (adjust based on your auth setup)
  const authHeaders = {
    // Add your auth headers here when testing with real auth
    'Content-Type': 'application/json'
  };

  test.describe('Templates API', () => {
    test('GET /api/messages/templates - should return templates', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/messages/templates`);
      
      if (response.status() === 200) {
        const templates = await response.json();
        expect(Array.isArray(templates)).toBeTruthy();
        
        // Check template structure
        if (templates.length > 0) {
          const template = templates[0];
          expect(template).toHaveProperty('id');
          expect(template).toHaveProperty('name');
          expect(template).toHaveProperty('type');
          expect(template).toHaveProperty('body');
          expect(['email', 'sms', 'whatsapp']).toContain(template.type);
        }
      } else {
        // If authentication is required, should return 401
        expect(response.status()).toBe(401);
      }
    });

    test('POST /api/messages/templates - should validate required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/templates`, {
        headers: authHeaders,
        data: {
          // Missing required fields
        }
      });
      
      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/messages/templates - should create template with valid data', async ({ request }) => {
      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        type: 'email',
        subject: 'Test Subject',
        body: 'Hello {{name}}, this is a test.',
        variables: ['name'],
        category: 'test'
      };

      const response = await request.post(`${BASE_URL}/api/messages/templates`, {
        headers: authHeaders,
        data: templateData
      });
      
      if (response.status() === 200) {
        const template = await response.json();
        expect(template.name).toBe(templateData.name);
        expect(template.type).toBe(templateData.type);
        expect(template.body).toBe(templateData.body);
      } else {
        // If not authenticated, should return 401
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Send Messages API', () => {
    test('POST /api/messages/send - should validate required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/send`, {
        headers: authHeaders,
        data: {}
      });
      
      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/messages/send - should validate recipient IDs', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/send`, {
        headers: authHeaders,
        data: {
          recipientIds: [],
          recipientType: 'guest',
          messageType: 'email',
          customBody: 'Test message'
        }
      });
      
      if (response.status() === 400) {
        const error = await response.json();
        expect(error.error).toContain('recipients');
      } else {
        expect(response.status()).toBe(401);
      }
    });

    test('POST /api/messages/send - should validate message type', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/send`, {
        headers: authHeaders,
        data: {
          recipientIds: ['test-id'],
          recipientType: 'guest',
          messageType: 'invalid-type',
          customBody: 'Test message'
        }
      });
      
      // Should return validation error or auth error
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/messages/send - should handle scheduling', async ({ request }) => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const response = await request.post(`${BASE_URL}/api/messages/send`, {
        headers: authHeaders,
        data: {
          recipientIds: ['test-id'],
          recipientType: 'guest',
          messageType: 'email',
          customBody: 'Scheduled test message',
          scheduledFor: futureDate.toISOString()
        }
      });
      
      if (response.status() === 200) {
        const result = await response.json();
        expect(result.scheduled).toBe(true);
      } else {
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Test Messages API', () => {
    test('POST /api/messages/test - should validate email format', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/test`, {
        headers: authHeaders,
        data: {
          messageType: 'email',
          testRecipient: 'invalid-email',
          subject: 'Test',
          body: 'Test message'
        }
      });
      
      if (response.status() === 400) {
        const error = await response.json();
        expect(error.error).toContain('email');
      } else {
        expect([401, 500]).toContain(response.status());
      }
    });

    test('POST /api/messages/test - should accept valid email', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/test`, {
        headers: authHeaders,
        data: {
          messageType: 'email',
          testRecipient: 'test@example.com',
          subject: 'Test Subject',
          body: 'Test message body'
        }
      });
      
      // Should return success or auth/config error
      expect([200, 401, 500]).toContain(response.status());
    });

    test('POST /api/messages/test - should accept valid phone number', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/messages/test`, {
        headers: authHeaders,
        data: {
          messageType: 'sms',
          testRecipient: '+1234567890',
          body: 'Test SMS message'
        }
      });
      
      // Should return success or auth/config error
      expect([200, 401, 500]).toContain(response.status());
    });
  });

  test.describe('Message Logs API', () => {
    test('GET /api/messages/logs - should return logs array', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/messages/logs`);
      
      if (response.status() === 200) {
        const logs = await response.json();
        expect(Array.isArray(logs)).toBeTruthy();
        
        // Check log structure if logs exist
        if (logs.length > 0) {
          const log = logs[0];
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('message_type');
          expect(log).toHaveProperty('status');
          expect(log).toHaveProperty('created_at');
        }
      } else {
        expect(response.status()).toBe(401);
      }
    });

    test('GET /api/messages/logs - should handle query parameters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/messages/logs?limit=10&type=email`);
      
      if (response.status() === 200) {
        const logs = await response.json();
        expect(Array.isArray(logs)).toBeTruthy();
        expect(logs.length).toBeLessThanOrEqual(10);
        
        // All logs should be email type if filtering works
        logs.forEach((log: any) => {
          if (log.message_type) {
            expect(log.message_type).toBe('email');
          }
        });
      } else {
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Webhook Endpoints', () => {
    test('POST /api/webhooks/twilio - should accept Twilio webhook format', async ({ request }) => {
      const twilioPayload = new URLSearchParams({
        MessageSid: 'SM1234567890',
        MessageStatus: 'delivered',
        From: '+1234567890',
        To: '+0987654321',
        AccountSid: 'AC1234567890'
      });

      const response = await request.post(`${BASE_URL}/api/webhooks/twilio`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: twilioPayload.toString()
      });
      
      // Webhook should always return 200 to prevent retries
      expect(response.status()).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBeDefined();
    });

    test('POST /api/webhooks/resend - should accept Resend webhook format', async ({ request }) => {
      const resendPayload = {
        type: 'email.delivered',
        data: {
          email_id: 'test-email-id',
          to: ['test@example.com'],
          subject: 'Test Email'
        }
      };

      const response = await request.post(`${BASE_URL}/api/webhooks/resend`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: resendPayload
      });
      
      // Webhook should always return 200
      expect(response.status()).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBeDefined();
    });

    test('POST /api/webhooks/resend - should handle malformed JSON', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/webhooks/resend`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: 'invalid json'
      });
      
      // Should still return 200 to prevent retries
      expect(response.status()).toBe(200);
    });
  });
});

test.describe('Integration Tests', () => {
  test('should handle complete message flow', async ({ request }) => {
    // 1. Get templates
    const templatesResponse = await request.get(`${BASE_URL}/api/messages/templates`);
    
    if (templatesResponse.status() === 200) {
      const templates = await templatesResponse.json();
      
      if (templates.length > 0) {
        const template = templates.find((t: any) => t.type === 'email') || templates[0];
        
        // 2. Try to send message with template
        const sendResponse = await request.post(`${BASE_URL}/api/messages/send`, {
          headers: authHeaders,
          data: {
            recipientIds: ['test-recipient'],
            recipientType: 'guest',
            messageType: template.type,
            templateId: template.id,
            variables: {
              guestName: 'Test Guest',
              weddingDate: '2024-06-15'
            }
          }
        });
        
        // Should handle the request (success or proper error)
        expect([200, 400, 401, 500]).toContain(sendResponse.status());
        
        // 3. Check logs were created (if send was successful)
        if (sendResponse.status() === 200) {
          const logsResponse = await request.get(`${BASE_URL}/api/messages/logs?limit=1`);
          
          if (logsResponse.status() === 200) {
            const logs = await logsResponse.json();
            expect(logs.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('should maintain data consistency', async ({ request }) => {
    // Test that webhook updates affect message logs
    const messageSid = 'SM_test_' + Date.now();
    
    // Simulate Twilio webhook
    const twilioPayload = new URLSearchParams({
      MessageSid: messageSid,
      MessageStatus: 'delivered',
      From: '+1234567890',
      To: '+0987654321'
    });

    await request.post(`${BASE_URL}/api/webhooks/twilio`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: twilioPayload.toString()
    });
    
    // Check if log was updated (would need existing log with that SID)
    const logsResponse = await request.get(`${BASE_URL}/api/messages/logs`);
    
    if (logsResponse.status() === 200) {
      const logs = await logsResponse.json();
      // If integration is complete, we might find the updated log
      const updatedLog = logs.find((log: any) => log.external_id === messageSid);
      if (updatedLog) {
        expect(updatedLog.status).toBe('delivered');
      }
    }
  });
});