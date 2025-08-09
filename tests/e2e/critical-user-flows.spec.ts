import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-helpers';

test.describe('Critical User Flows', () => {
  let helpers: TestHelpers;
  let testUser: any;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('New User Journey', () => {
    test('should complete full registration and onboarding flow', async ({ page }) => {
      // Sign up and complete onboarding
      testUser = await helpers.signUpAndOnboard();
      
      // Wait for dashboard to fully load (wait for loading skeletons to disappear)
      await page.waitForFunction(() => {
        const loadingElements = document.querySelectorAll('[role="status"]');
        return loadingElements.length === 0;
      }, { timeout: 30000 });
      
      // Additional wait for content to render
      await page.waitForTimeout(2000);
      
      // Verify dashboard has loaded by checking for key elements
      // The dashboard might show different content based on data
      await expect(page.locator('main').last()).toContainText(/days|plan|your/i);
      
      // Check that we're on the dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Take screenshot of completed dashboard
      await helpers.screenshot('dashboard-after-onboarding');
    });
  });

  test.describe('Guest Management', () => {
    test.beforeEach(async ({ page }) => {
      // Use existing user or create new one
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should add multiple guests with different attributes', async ({ page }) => {
      await page.goto('/dashboard/guests');
      
      // Add family member
      const familyGuest = await helpers.addGuest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        relationship: 'Family',
        side: 'bride',
        plusOneAllowed: true
      });
      
      // Add friend
      const friendGuest = await helpers.addGuest({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        relationship: 'Friend',
        side: 'groom',
        plusOneAllowed: false
      });
      
      // Verify guest count
      const guestRows = page.locator('table tbody tr');
      await expect(guestRows).toHaveCount(2);
      
      // Test search
      await page.fill('input[placeholder="Search guests..."]', 'John');
      await expect(guestRows).toHaveCount(1);
      
      // Test filters
      await page.fill('input[placeholder="Search guests..."]', '');
      await page.selectOption('select:has-text("All Sides")', 'bride');
      await expect(page.locator('text=John Doe')).toBeVisible();
      await expect(page.locator('text=Jane Smith')).not.toBeVisible();
    });

    test('should handle RSVP updates', async ({ page }) => {
      await page.goto('/dashboard/guests');
      
      // Add a guest if none exist
      if (await page.locator('text=No guests added yet').isVisible()) {
        await helpers.addGuest();
      }
      
      // Click on first guest to edit
      await page.locator('button:has-text("Edit")').first().click();
      
      // Update RSVP status
      await page.selectOption('select[name="rsvpStatus"]', 'confirmed');
      await page.click('button:has-text("Save")');
      
      // Verify update
      await expect(page.locator('text=confirmed').first()).toBeVisible();
    });
  });

  test.describe('Vendor Management', () => {
    test.beforeEach(async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should add vendors across different categories', async ({ page }) => {
      const vendorCategories = [
        { category: 'Photography', name: 'Captured Moments Photography', cost: 3500 },
        { category: 'Catering', name: 'Delicious Bites Catering', cost: 8000 },
        { category: 'Flowers', name: 'Bloom & Blossom Florist', cost: 2500 },
        { category: 'Music/DJ', name: 'Rhythm & Beats DJ Service', cost: 1500 }
      ];

      for (const vendor of vendorCategories) {
        await helpers.addVendor({
          businessName: vendor.name,
          category: vendor.category,
          estimatedCost: vendor.cost,
          status: 'contacted'
        });
      }
      
      // Verify vendor statistics
      await page.goto('/dashboard/vendors');
      await expect(page.locator('text=Total Vendors')).toBeVisible();
      const totalVendorsElement = page.locator('text=Total Vendors').locator('..').locator('p').first();
      await expect(totalVendorsElement).toHaveText('4');
      
      // Verify total estimated cost
      const estimatedCostElement = page.locator('text=Estimated Cost').locator('..').locator('p').first();
      const costText = await estimatedCostElement.textContent();
      expect(costText).toContain('15,500');
    });

    test('should update vendor status through workflow', async ({ page }) => {
      await page.goto('/dashboard/vendors');
      
      // Add a vendor if none exist
      if (await page.locator('text=No vendors yet').isVisible()) {
        await helpers.addVendor();
      }
      
      // Update vendor status
      await page.locator('button:has-text("Edit")').first().click();
      await page.selectOption('select[name="status"]', 'booked');
      await page.check('input[name="contractSigned"]');
      await page.click('button:has-text("Save")');
      
      // Verify status update
      await expect(page.locator('text=booked').first()).toBeVisible();
    });
  });

  test.describe('Budget Management', () => {
    test.beforeEach(async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should create budget categories and track expenses', async ({ page }) => {
      await page.goto('/dashboard/budget/categories');
      
      // Add budget categories
      const categories = [
        { name: 'Venue', allocated: 15000, priority: 'essential' },
        { name: 'Catering', allocated: 10000, priority: 'essential' },
        { name: 'Photography', allocated: 3500, priority: 'important' },
        { name: 'Flowers', allocated: 2500, priority: 'nice_to_have' }
      ];
      
      for (const category of categories) {
        await page.click('button:has-text("Add Category")');
        await page.fill('input[name="name"]', category.name);
        await page.fill('input[name="allocatedAmount"]', category.allocated.toString());
        await page.selectOption('select[name="priority"]', category.priority);
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(500);
      }
      
      // Add expenses
      await page.goto('/dashboard/budget/expenses');
      
      await page.click('button:has-text("Add Expense")');
      await page.fill('input[name="description"]', 'Venue deposit');
      await page.fill('input[name="amount"]', '5000');
      await page.selectOption('select[name="categoryId"]', { index: 1 });
      await page.click('button[type="submit"]:has-text("Add Expense")');
      
      // Verify budget overview
      await page.goto('/dashboard/budget');
      await expect(page.locator('text=Total Budget')).toBeVisible();
      await expect(page.locator('text=Categories')).toBeVisible();
      await expect(page.locator('text=Recent Expenses')).toBeVisible();
    });
  });

  test.describe('Checklist and Timeline', () => {
    test.beforeEach(async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should manage wedding checklist tasks', async ({ page }) => {
      await page.goto('/dashboard/checklist');
      
      // Complete some default tasks
      const uncheckedTasks = page.locator('input[type="checkbox"]:not(:checked)');
      const taskCount = await uncheckedTasks.count();
      
      if (taskCount > 0) {
        // Check first 5 tasks
        for (let i = 0; i < Math.min(5, taskCount); i++) {
          await uncheckedTasks.nth(i).check();
          await page.waitForTimeout(300);
        }
      }
      
      // Add custom task
      await page.click('button:has-text("Add Task")');
      await page.fill('input[name="title"]', 'Send save the dates');
      await page.fill('textarea[name="description"]', 'Design and send save the date cards to all guests');
      await page.selectOption('select[name="priority"]', 'high');
      await page.selectOption('select[name="category"]', 'planning');
      
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 2);
      await helpers.fillDate('input[name="dueDate"]', dueDate);
      
      await page.click('button:has-text("Save Task")');
      
      // Verify task appears
      await expect(page.locator('text=Send save the dates')).toBeVisible();
      
      // Check task completion percentage
      const progressElement = page.locator('[role="progressbar"]');
      if (await progressElement.isVisible()) {
        const progressValue = await progressElement.getAttribute('aria-valuenow');
        expect(Number(progressValue)).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Photo Management', () => {
    test.beforeEach(async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should create photo albums', async ({ page }) => {
      await page.goto('/dashboard/photos');
      
      // Create albums
      const albums = [
        { name: 'Engagement Photos', description: 'Our engagement photoshoot' },
        { name: 'Venue Visit', description: 'Photos from venue tours' },
        { name: 'Inspiration', description: 'Wedding inspiration and ideas' }
      ];
      
      for (const album of albums) {
        await page.click('button:has-text("Create Album")');
        await page.fill('input[name="name"]', album.name);
        await page.fill('textarea[name="description"]', album.description);
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(500);
      }
      
      // Verify albums are created
      for (const album of albums) {
        await expect(page.locator(`text=${album.name}`)).toBeVisible();
      }
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should navigate dashboard on mobile', async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
      
      await page.goto('/dashboard');
      
      // Check mobile menu if present
      const menuButton = page.locator('button[aria-label="Menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        
        // Navigate to different sections
        await page.click('text=Guests');
        await expect(page).toHaveURL('/dashboard/guests');
        
        // Open menu again
        if (await menuButton.isVisible()) {
          await menuButton.click();
        }
        
        await page.click('text=Budget');
        await expect(page).toHaveURL('/dashboard/budget');
      }
      
      // Verify mobile layout
      await helpers.screenshot('mobile-dashboard');
    });
  });

  test.describe('Settings and Preferences', () => {
    test.beforeEach(async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should update user settings', async ({ page }) => {
      await page.goto('/dashboard/settings');
      
      // Update wedding details
      await page.fill('input[id="venue"]', 'Updated Venue Name');
      await page.selectOption('select:near(label:has-text("Wedding Style"))', 'formal');
      await page.click('button:has-text("Save"):near(text="Wedding Details")');
      
      // Update notification preferences
      await page.check('input[id="email-notifications"]');
      await page.check('input[id="email-task-reminders"]');
      await page.uncheck('input[id="email-vendor-updates"]');
      await page.click('button:has-text("Save Email Preferences")');
      
      // Verify settings are saved
      await page.reload();
      await expect(page.locator('input[id="venue"]')).toHaveValue('Updated Venue Name');
      await expect(page.locator('input[id="email-notifications"]')).toBeChecked();
      await expect(page.locator('input[id="email-vendor-updates"]')).not.toBeChecked();
    });
  });

  test.describe('Data Export and Cleanup', () => {
    test.beforeEach(async ({ page }) => {
      if (!testUser) {
        testUser = await helpers.signUpAndOnboard();
      } else {
        await helpers.signIn(testUser.email, testUser.password);
      }
    });

    test('should export user data', async ({ page }) => {
      await page.goto('/dashboard/settings');
      
      // Test data export
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export")');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('wedding-data-export');
      
      // Save file path for verification
      const path = await download.path();
      expect(path).toBeTruthy();
    });
  });
});