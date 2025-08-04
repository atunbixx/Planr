import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:4001';

test.describe('Messaging System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);
    
    // Mock authentication if needed
    // You may need to adjust this based on your Clerk setup
    await page.waitForLoadState('networkidle');
  });

  test('should load messaging page', async ({ page }) => {
    // Navigate to messages page
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Check if the page loads properly
    await expect(page.locator('h1')).toContainText('Messages');
    await expect(page.locator('text=Send emails and SMS to your guests and vendors')).toBeVisible();
    
    // Check for main components
    await expect(page.locator('text=Recipients')).toBeVisible();
    await expect(page.locator('text=Compose Message')).toBeVisible();
  });

  test('should switch between guest and vendor tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Test guest tab (should be default)
    await expect(page.locator('[role="tabpanel"] >> text=Guests')).toBeVisible();
    
    // Click vendor tab
    await page.locator('text=Vendors').click();
    await expect(page.locator('[role="tabpanel"] >> text=Vendors')).toBeVisible();
    
    // Switch back to guests
    await page.locator('text=Guests').click();
    await expect(page.locator('[role="tabpanel"] >> text=Guests')).toBeVisible();
  });

  test('should select message type', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Click message type dropdown
    await page.locator('[data-testid="message-type-select"], .message-type-select, [placeholder*="Message Type"], text=Email').first().click();
    
    // Check for email option
    await expect(page.locator('text=Email')).toBeVisible();
    
    // Select SMS
    await page.locator('text=SMS').click();
    
    // Verify SMS is selected
    // The exact assertion will depend on your Select component implementation
  });

  test('should show template selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Look for template dropdown/select
    const templateSelect = page.locator('text=Select a template, [placeholder*="template"], .template-select').first();
    if (await templateSelect.isVisible()) {
      await templateSelect.click();
      
      // Should show template options
      await expect(page.locator('text=Guest Invitation, text=RSVP Reminder').first()).toBeVisible();
    }
  });

  test('should allow composing custom message', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Find and fill subject field (for email)
    const subjectField = page.locator('input[placeholder*="subject"], input[name="subject"], [label*="Subject"] + input').first();
    if (await subjectField.isVisible()) {
      await subjectField.fill('Test Subject');
    }
    
    // Find and fill message body
    const messageBody = page.locator('textarea[placeholder*="message"], textarea[name="body"], textarea').first();
    await messageBody.fill('This is a test message for {{guestName}}');
    
    // Verify content is filled
    await expect(messageBody).toHaveValue('This is a test message for {{guestName}}');
  });

  test('should show send button disabled when no recipients selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Find send button
    const sendButton = page.locator('button:has-text("Send Messages"), button[type="submit"]').first();
    
    // Should be disabled initially
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when recipients and message are provided', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Fill message content
    const messageBody = page.locator('textarea').first();
    await messageBody.fill('Test message content');
    
    // Try to select a recipient (if any exist)
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
      
      // Send button should now be enabled
      const sendButton = page.locator('button:has-text("Send Messages")').first();
      await expect(sendButton).toBeEnabled();
    }
  });

  test('should navigate to message history', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Look for history link/button
    const historyLink = page.locator('text=View History, text=History, a[href*="history"]').first();
    if (await historyLink.isVisible()) {
      await historyLink.click();
      
      // Should navigate to history page
      await expect(page).toHaveURL(/.*messages\/history/);
      await expect(page.locator('h1')).toContainText('Message History');
    }
  });

  test('should display message history table', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages/history`);
    
    // Check for history components
    await expect(page.locator('text=Message History')).toBeVisible();
    
    // Check for table headers
    const expectedHeaders = ['Type', 'Recipient', 'Status', 'Sent'];
    for (const header of expectedHeaders) {
      await expect(page.locator(`th:has-text("${header}"), text=${header}`)).toBeVisible();
    }
  });

  test('should show statistics cards in history', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages/history`);
    
    // Check for stat cards
    const statCards = ['Total Sent', 'Delivery Rate', 'Open Rate', 'Failed'];
    for (const stat of statCards) {
      await expect(page.locator(`text=${stat}`).first()).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Mock API failure
    await page.route('**/api/messages/send', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Try to send a message
    const messageBody = page.locator('textarea').first();
    await messageBody.fill('Test message');
    
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
      
      const sendButton = page.locator('button:has-text("Send Messages")').first();
      await sendButton.click();
      
      // Should show error message
      await expect(page.locator('text=Error, text=Failed').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should refresh message history', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages/history`);
    
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Should trigger a network request
      await page.waitForResponse(response => 
        response.url().includes('/api/messages/logs') && response.status() === 200
      );
    }
  });
});

test.describe('API Endpoints', () => {
  test('should respond to message templates endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/messages/templates`);
    
    // Should return 401 if not authenticated, or 200 if authenticated
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should respond to message logs endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/messages/logs`);
    
    // Should return 401 if not authenticated, or 200 if authenticated
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('should validate send message endpoint', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/messages/send`, {
      data: {
        recipientIds: [],
        recipientType: 'guest',
        messageType: 'email',
        customBody: 'Test message'
      }
    });
    
    // Should return 401 if not authenticated, or 400 for validation error
    expect([400, 401]).toContain(response.status());
  });

  test('should handle test message endpoint', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/messages/test`, {
      data: {
        messageType: 'email',
        testRecipient: 'test@example.com',
        subject: 'Test',
        body: 'Test message'
      }
    });
    
    // Should return 401 if not authenticated
    // If authenticated but no service configured, may return 500
    expect([401, 500]).toContain(response.status());
  });
});

test.describe('Dashboard Integration', () => {
  test('should show messages link on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Look for messages link
    const messagesLink = page.locator('a[href*="messages"], text=Messages').first();
    await expect(messagesLink).toBeVisible();
    
    // Click and navigate
    await messagesLink.click();
    await expect(page).toHaveURL(/.*messages/);
  });

  test('should navigate back from messages to dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Look for navigation back to dashboard
    const dashboardNav = page.locator('a[href="/dashboard"], text=Dashboard, .logo').first();
    if (await dashboardNav.isVisible()) {
      await dashboardNav.click();
      await expect(page).toHaveURL(/.*dashboard$/);
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Page should still load and be functional
    await expect(page.locator('h1')).toContainText('Messages');
    
    // Check if mobile-responsive elements work
    const mobileLayout = page.locator('.grid, .flex, .space-y-4').first();
    await expect(mobileLayout).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/dashboard/messages`);
    
    // Page should load properly
    await expect(page.locator('h1')).toContainText('Messages');
  });
});

test.describe('Performance', () => {
  test('should load messages page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');
    
    // Should not have critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('chunk') &&
      !error.includes('network')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});