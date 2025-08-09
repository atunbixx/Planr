import { test, expect } from '@playwright/test';

test.describe('Day-of Wedding Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });
    
    // Navigate to day-of dashboard
    await page.goto('/dashboard/day-of');
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Wedding Day Dashboard');
    
    // Check main sections are visible
    await expect(page.locator('.timeline-section')).toBeVisible();
    await expect(page.locator('.guest-checkin-section')).toBeVisible();
    await expect(page.locator('.vendor-status-section')).toBeVisible();
    await expect(page.locator('.weather-widget')).toBeVisible();
  });

  test('should manage timeline events', async ({ page }) => {
    // Add a timeline event
    await page.click('button:has-text("Add Event")');
    await page.fill('input[name="title"]', 'Ceremony Start');
    await page.fill('input[name="scheduledTime"]', '14:00');
    await page.fill('input[name="duration"]', '30');
    await page.selectOption('select[name="vendorId"]', 'photographer');
    await page.click('button:has-text("Save Event")');
    
    // Verify event appears in timeline
    await expect(page.locator('.timeline-event')).toContainText('Ceremony Start');
    await expect(page.locator('.timeline-event')).toContainText('2:00 PM');
    
    // Update event status
    await page.click('.timeline-event:has-text("Ceremony Start")');
    await page.click('button:has-text("Start Now")');
    
    // Verify status change
    await expect(page.locator('.timeline-event:has-text("Ceremony Start")')).toHaveClass(/in-progress/);
  });

  test('should check in guests with search', async ({ page }) => {
    // Search for a guest
    await page.fill('input[placeholder="Search guest by name, email, or phone..."]', 'John Doe');
    await page.waitForSelector('.guest-search-result');
    
    // Click to check in
    await page.click('.guest-search-result:has-text("John Doe") button:has-text("Check In")');
    
    // Verify check-in confirmation
    await expect(page.locator('.toast')).toContainText('John Doe checked in successfully');
    
    // Verify stats update
    await expect(page.locator('.checkin-stats')).toContainText(/Checked In: \d+/);
  });

  test('should scan QR code for check-in', async ({ page }) => {
    // Click QR scanner button
    await page.click('button:has-text("Scan QR Code")');
    
    // Mock camera permission (in real test would need actual camera mock)
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        return {
          getTracks: () => [],
          getVideoTracks: () => [{ stop: () => {} }],
          getAudioTracks: () => []
        } as any;
      };
    });
    
    // Simulate QR code scan (would need to mock QR scanner library)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('qr-scanned', {
        detail: { data: 'guest:john-doe:event-123' }
      }));
    });
    
    // Verify check-in processed
    await expect(page.locator('.guest-checkin-confirmation')).toBeVisible();
    await expect(page.locator('.guest-checkin-confirmation')).toContainText('John Doe');
    await expect(page.locator('.guest-checkin-confirmation')).toContainText('Table 5');
  });

  test('should track vendor check-ins', async ({ page }) => {
    // View vendor list
    await expect(page.locator('.vendor-checkin-list')).toBeVisible();
    
    // Check in a vendor
    await page.click('.vendor-item:has-text("Photographer") button:has-text("Check In")');
    
    // Add notes
    await page.fill('textarea[name="vendorNotes"]', 'Arrived 10 minutes early, equipment ready');
    await page.click('button:has-text("Confirm Check-In")');
    
    // Verify status update
    await expect(page.locator('.vendor-item:has-text("Photographer")')).toContainText('Arrived');
    await expect(page.locator('.vendor-item:has-text("Photographer")')).toHaveClass(/status-arrived/);
  });

  test('should report and track issues', async ({ page }) => {
    // Report an issue
    await page.click('button:has-text("Report Issue")');
    
    // Fill issue details
    await page.fill('input[name="title"]', 'Sound system feedback');
    await page.fill('textarea[name="description"]', 'Microphone causing feedback during speeches');
    await page.selectOption('select[name="category"]', 'technical');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Submit Issue")');
    
    // Verify issue appears in list
    await expect(page.locator('.issues-list')).toContainText('Sound system feedback');
    await expect(page.locator('.issue-item:has-text("Sound system feedback")')).toHaveClass(/priority-high/);
    
    // Update issue status
    await page.click('.issue-item:has-text("Sound system feedback")');
    await page.click('button:has-text("Mark In Progress")');
    
    // Add resolution notes
    await page.fill('textarea[name="resolutionNotes"]', 'Adjusted microphone placement and levels');
    await page.click('button:has-text("Resolve Issue")');
    
    // Verify status update
    await expect(page.locator('.issue-item:has-text("Sound system feedback")')).toHaveClass(/status-resolved/);
  });

  test('should display weather updates', async ({ page }) => {
    // Check weather widget
    await expect(page.locator('.weather-widget')).toBeVisible();
    await expect(page.locator('.weather-temperature')).toBeVisible();
    await expect(page.locator('.weather-conditions')).toBeVisible();
    
    // For outdoor wedding, check suitability
    await expect(page.locator('.outdoor-suitability')).toBeVisible();
    
    // Refresh weather
    await page.click('button[aria-label="Refresh weather"]');
    await expect(page.locator('.weather-update-time')).toContainText('Updated');
  });

  test('should access emergency contacts', async ({ page }) => {
    // Click emergency contacts
    await page.click('button:has-text("Emergency Contacts")');
    
    // Verify contacts modal
    await expect(page.locator('.emergency-contacts-modal')).toBeVisible();
    await expect(page.locator('.contact-item')).toHaveCount(3); // Assuming 3 contacts
    
    // Quick dial (would open tel: link)
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('.contact-item:first-child button:has-text("Call")')
    ]);
    
    // Verify tel link
    expect(popup.url()).toContain('tel:');
  });

  test('should handle real-time updates', async ({ page, context }) => {
    // Open dashboard in two tabs
    const page2 = await context.newPage();
    await page2.goto('/dashboard/day-of');
    
    // Check in a guest on page 1
    await page.fill('input[placeholder="Search guest by name, email, or phone..."]', 'Jane Smith');
    await page.click('.guest-search-result:has-text("Jane Smith") button:has-text("Check In")');
    
    // Verify update appears on page 2
    await page2.waitForTimeout(1000); // Wait for WebSocket update
    await expect(page2.locator('.recent-checkins')).toContainText('Jane Smith');
    await expect(page2.locator('.checkin-stats')).toContainText(/Checked In: \d+/);
  });

  test('should export day-of reports', async ({ page }) => {
    // Click export button
    await page.click('button:has-text("Export Reports")');
    
    // Select report types
    await page.check('input[name="includeTimeline"]');
    await page.check('input[name="includeGuestList"]');
    await page.check('input[name="includeVendorStatus"]');
    await page.check('input[name="includeIssues"]');
    
    // Generate report
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF Report")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('wedding-day-report');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should work offline with PWA', async ({ page, context }) => {
    // Navigate to dashboard
    await page.goto('/dashboard/day-of');
    
    // Wait for service worker
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to check in a guest (should work with cached data)
    await page.fill('input[placeholder="Search guest by name, email, or phone..."]', 'John');
    
    // Verify offline indicator
    await expect(page.locator('.offline-indicator')).toBeVisible();
    await expect(page.locator('.offline-indicator')).toContainText("You're offline");
    
    // Go back online
    await context.setOffline(false);
    
    // Verify sync happens
    await expect(page.locator('.offline-indicator')).not.toBeVisible();
    await expect(page.locator('.toast')).toContainText('Synced with server');
  });
});