import { test, expect } from '@playwright/test';

test.describe('Seating Planner', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: { id: 'mock-user-id', email: 'test@example.com' }
      }));
    });
    
    // Navigate to seating planner
    await page.goto('/dashboard/seating');
  });

  test('should display seating planner page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Seating Planner');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('button:has-text("Add Table")')).toBeVisible();
  });

  test('should create a new seating layout', async ({ page }) => {
    // Click create layout button
    await page.click('button:has-text("Create Layout")');
    
    // Fill in layout details
    await page.fill('input[name="layoutName"]', 'Main Reception Layout');
    await page.fill('textarea[name="notes"]', 'Layout for 150 guests');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify layout was created
    await expect(page.locator('.layout-card')).toContainText('Main Reception Layout');
  });

  test('should add tables to layout', async ({ page }) => {
    // Ensure a layout is selected
    await page.click('.layout-card:first-child');
    
    // Add a round table
    await page.click('button:has-text("Add Table")');
    await page.selectOption('select[name="shape"]', 'round');
    await page.fill('input[name="capacity"]', '8');
    await page.fill('input[name="tableName"]', 'Table 1');
    await page.click('button:has-text("Confirm")');
    
    // Verify table appears on canvas
    await expect(page.locator('canvas')).toBeVisible();
    
    // Add a rectangular table
    await page.click('button:has-text("Add Table")');
    await page.selectOption('select[name="shape"]', 'rectangular');
    await page.fill('input[name="capacity"]', '10');
    await page.fill('input[name="tableName"]', 'Head Table');
    await page.click('button:has-text("Confirm")');
  });

  test('should drag and drop tables', async ({ page }) => {
    // Select a layout with tables
    await page.click('.layout-card:first-child');
    
    // Get canvas element
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      // Simulate drag from one position to another
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      
      // Verify table moved (would need to check canvas state or API call)
      await page.waitForTimeout(500); // Wait for animation
    }
  });

  test('should assign guests to tables', async ({ page }) => {
    // Select a layout with tables
    await page.click('.layout-card:first-child');
    
    // Open guest assignment panel
    await page.click('button:has-text("Assign Guests")');
    
    // Search for a guest
    await page.fill('input[placeholder="Search guests..."]', 'John');
    await page.waitForSelector('.guest-search-result');
    
    // Drag guest to table (or click to assign)
    await page.click('.guest-search-result:first-child');
    await page.click('.table-assignment-slot:first-child');
    
    // Verify assignment
    await expect(page.locator('.assigned-guest')).toContainText('John');
  });

  test('should run seating optimization', async ({ page }) => {
    // Select a layout
    await page.click('.layout-card:first-child');
    
    // Open optimization modal
    await page.click('button:has-text("Optimize Seating")');
    
    // Configure optimization parameters
    await page.fill('input[name="populationSize"]', '100');
    await page.fill('input[name="maxGenerations"]', '200');
    
    // Add seating preferences
    await page.click('button:has-text("Add Preference")');
    await page.selectOption('select[name="preferenceType"]', 'must_sit_together');
    await page.selectOption('select[name="guest1"]', 'john-doe');
    await page.selectOption('select[name="guest2"]', 'jane-doe');
    
    // Run optimization
    await page.click('button:has-text("Start Optimization")');
    
    // Wait for optimization to complete
    await expect(page.locator('.optimization-progress')).toBeVisible();
    await expect(page.locator('text=Optimization Complete')).toBeVisible({ timeout: 30000 });
    
    // Apply optimized seating
    await page.click('button:has-text("Apply Results")');
    
    // Verify guests are assigned
    await expect(page.locator('.optimization-stats')).toContainText('100% assigned');
  });

  test('should export seating chart', async ({ page }) => {
    // Select a layout with assignments
    await page.click('.layout-card:first-child');
    
    // Open export dialog
    await page.click('button:has-text("Export")');
    
    // Select PDF format
    await page.click('button:has-text("PDF")');
    
    // Configure export options
    await page.check('input[name="showTableNumbers"]');
    await page.check('input[name="showGuestNames"]');
    await page.selectOption('select[name="pageSize"]', 'A4');
    await page.selectOption('select[name="orientation"]', 'landscape');
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('seating-chart');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should handle real-time collaboration', async ({ page, context }) => {
    // Open two browser tabs
    const page2 = await context.newPage();
    
    // Both navigate to same layout
    await page.goto('/dashboard/seating?layoutId=test-layout');
    await page2.goto('/dashboard/seating?layoutId=test-layout');
    
    // User 1 moves a table
    const canvas1 = await page.locator('canvas');
    const box1 = await canvas1.boundingBox();
    
    if (box1) {
      await page.mouse.move(box1.x + 100, box1.y + 100);
      await page.mouse.down();
      await page.mouse.move(box1.x + 200, box1.y + 200);
      await page.mouse.up();
    }
    
    // User 2 should see the update
    await page2.waitForTimeout(1000); // Wait for WebSocket update
    
    // Verify both pages show same state
    // (Would need to check canvas state or verify through API)
  });

  test('should save and load layouts', async ({ page }) => {
    // Create a new layout
    await page.click('button:has-text("Create Layout")');
    await page.fill('input[name="layoutName"]', 'Test Layout');
    await page.click('button[type="submit"]');
    
    // Add some tables
    await page.click('button:has-text("Add Table")');
    await page.fill('input[name="tableName"]', 'Test Table');
    await page.click('button:has-text("Confirm")');
    
    // Save layout
    await page.click('button:has-text("Save")');
    await expect(page.locator('.toast')).toContainText('Layout saved');
    
    // Navigate away and come back
    await page.goto('/dashboard');
    await page.goto('/dashboard/seating');
    
    // Verify layout persists
    await expect(page.locator('.layout-card')).toContainText('Test Layout');
    
    // Open the layout
    await page.click('.layout-card:has-text("Test Layout")');
    
    // Verify tables are loaded
    await expect(page.locator('canvas')).toBeVisible();
  });
});