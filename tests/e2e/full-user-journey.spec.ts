import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Test data generation
const generateTestUser = () => ({
  email: faker.internet.email(),
  password: 'TestPassword123!',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  partnerName: faker.person.firstName(),
  weddingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  venue: faker.company.name() + ' Resort',
  location: faker.location.city() + ', ' + faker.location.state(),
  expectedGuests: faker.number.int({ min: 50, max: 200 }),
  totalBudget: faker.number.int({ min: 20000, max: 100000 })
});

const generateGuest = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: faker.location.streetAddress(true),
  relationship: faker.helpers.arrayElement(['Family', 'Friend', 'Colleague', 'Extended Family']),
  side: faker.helpers.arrayElement(['bride', 'groom', 'both']),
  plusOneAllowed: faker.datatype.boolean(),
  dietaryRestrictions: faker.helpers.arrayElement(['', 'Vegetarian', 'Vegan', 'Gluten-free', 'None'])
});

const generateVendor = () => ({
  businessName: faker.company.name(),
  contactName: faker.person.fullName(),
  phone: faker.phone.number(),
  email: faker.internet.email(),
  website: faker.internet.url(),
  address: faker.location.streetAddress(true),
  category: faker.helpers.arrayElement(['Venue', 'Catering', 'Photography', 'Flowers', 'Music/DJ']),
  estimatedCost: faker.number.int({ min: 1000, max: 10000 }),
  notes: faker.lorem.sentence()
});

test.describe('Complete Wedding Planner User Journey', () => {
  let testUser: ReturnType<typeof generateTestUser>;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    testUser = generateTestUser();
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('01. User Registration and Authentication', async () => {
    // Navigate to home page
    await page.goto('/');
    
    // Click sign up button
    await page.click('text=Get Started');
    
    // Fill registration form
    await page.fill('input[name="emailAddress"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Verify email if needed (depends on Supabase settings)
    // In test environment, this might be automatic
    
    // Verify redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
  });

  test('02. Complete Onboarding Process', async () => {
    // Ensure we're on onboarding page
    if (!page.url().includes('/onboarding')) {
      await page.goto('/onboarding');
    }

    // Step 1: About You
    await expect(page.locator('h2:has-text("Tell us about yourself")')).toBeVisible();
    await page.fill('input[name="userName"]', testUser.firstName + ' ' + testUser.lastName);
    await page.fill('input[name="partnerName"]', testUser.partnerName);
    await page.click('button:has-text("Next")');

    // Step 2: Wedding Details
    await expect(page.locator('h2:has-text("Wedding Details")')).toBeVisible();
    await page.fill('input[type="date"]', testUser.weddingDate.toISOString().split('T')[0]);
    await page.fill('input[name="expectedGuests"]', testUser.expectedGuests.toString());
    await page.selectOption('select[name="weddingStyle"]', 'modern');
    await page.click('button:has-text("Next")');

    // Step 3: Venue & Location
    await expect(page.locator('h2:has-text("Venue & Location")')).toBeVisible();
    await page.fill('input[name="venue"]', testUser.venue);
    await page.fill('input[name="location"]', testUser.location);
    await page.click('button:has-text("Next")');

    // Step 4: Planning & Budget
    await expect(page.locator('h2:has-text("Planning & Budget")')).toBeVisible();
    await page.fill('input[name="totalBudget"]', testUser.totalBudget.toString());
    await page.selectOption('select[name="planningStatus"]', 'just_started');
    
    // Complete onboarding
    await page.click('button:has-text("Complete Setup")');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify welcome message or dashboard content
    await expect(page.locator('text=/Days Until/i')).toBeVisible();
  });

  test('03. Dashboard Overview', async () => {
    await page.goto('/dashboard');
    
    // Verify main dashboard elements
    await expect(page.locator('text=/Days Until/i')).toBeVisible();
    await expect(page.locator('text=Guest Progress')).toBeVisible();
    await expect(page.locator('text=Budget Status')).toBeVisible();
    await expect(page.locator('text=Tasks Completed')).toBeVisible();
    
    // Verify navigation menu
    await expect(page.locator('nav >> text=Overview')).toBeVisible();
    await expect(page.locator('nav >> text=Guests')).toBeVisible();
    await expect(page.locator('nav >> text=Budget')).toBeVisible();
    await expect(page.locator('nav >> text=Vendors')).toBeVisible();
    await expect(page.locator('nav >> text=Photos')).toBeVisible();
  });

  test('04. Add and Manage Guests', async () => {
    // Navigate to guests page
    await page.click('nav >> text=Guests');
    await expect(page).toHaveURL('/dashboard/guests');
    
    // Add multiple guests
    for (let i = 0; i < 3; i++) {
      const guest = generateGuest();
      
      // Click add guest button
      await page.click('button:has-text("Add Guest")');
      
      // Fill guest form
      await page.fill('input[id="name"]', `${guest.firstName} ${guest.lastName}`);
      await page.fill('input[id="email"]', guest.email);
      await page.fill('input[id="phone"]', guest.phone);
      await page.fill('textarea[id="address"]', guest.address);
      await page.selectOption('select:near(label:has-text("Relationship"))', guest.relationship);
      await page.selectOption('select:near(label:has-text("Side"))', guest.side);
      
      if (guest.plusOneAllowed) {
        await page.check('input[type="checkbox"]:near(text="Allow plus one")');
      }
      
      if (guest.dietaryRestrictions) {
        await page.fill('input[id="dietaryRestrictions"]', guest.dietaryRestrictions);
      }
      
      // Submit form
      await page.click('button:has-text("Add Guest")');
      
      // Verify guest appears in list
      await expect(page.locator(`text=${guest.firstName} ${guest.lastName}`)).toBeVisible();
    }
    
    // Test search functionality
    const searchName = (await page.locator('table >> tr >> td').first().textContent()) || '';
    await page.fill('input[placeholder="Search guests..."]', searchName);
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1);
    
    // Clear search
    await page.fill('input[placeholder="Search guests..."]', '');
    
    // Test filters
    await page.selectOption('select:has-text("All Status")', 'pending');
    await page.selectOption('select:has-text("All Sides")', 'bride');
  });

  test('05. Add and Manage Vendors', async () => {
    // Navigate to vendors page
    await page.click('nav >> text=Vendors');
    await expect(page).toHaveURL('/dashboard/vendors');
    
    // Add multiple vendors
    const vendorCategories = ['Photography', 'Catering', 'Flowers'];
    
    for (let i = 0; i < vendorCategories.length; i++) {
      const vendor = generateVendor();
      vendor.category = vendorCategories[i];
      
      // Click add vendor button
      await page.click('button:has-text("Add Vendor")');
      
      // Fill vendor form
      await page.fill('input[id="name"]', vendor.businessName);
      await page.fill('input[id="contactName"]', vendor.contactName);
      await page.fill('input[id="phone"]', vendor.phone);
      await page.fill('input[id="email"]', vendor.email);
      await page.fill('input[id="website"]', vendor.website);
      await page.fill('input[id="address"]', vendor.address);
      await page.selectOption('select:near(label:has-text("Category"))', vendor.category);
      await page.selectOption('select:near(label:has-text("Status"))', 'contacted');
      await page.selectOption('select:near(label:has-text("Priority"))', 'high');
      await page.fill('input[id="estimatedCost"]', vendor.estimatedCost.toString());
      await page.fill('textarea[id="notes"]', vendor.notes);
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Add Vendor")');
      
      // Wait for dialog to close and vendor to appear
      await page.waitForTimeout(1000);
      
      // Verify vendor appears in list
      await expect(page.locator(`text=${vendor.businessName}`)).toBeVisible();
    }
    
    // Verify vendor statistics
    await expect(page.locator('text=Total Vendors')).toBeVisible();
    await expect(page.locator('text=Booked')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Estimated Cost')).toBeVisible();
  });

  test('06. Budget Management', async () => {
    // Navigate to budget page
    await page.click('nav >> text=Budget');
    await expect(page).toHaveURL('/dashboard/budget');
    
    // Verify budget overview
    await expect(page.locator('text=Total Budget')).toBeVisible();
    await expect(page.locator('text=Spent')).toBeVisible();
    await expect(page.locator('text=Remaining')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Navigate to categories
    await page.click('text=Manage');
    await expect(page).toHaveURL('/dashboard/budget/categories');
    
    // Add a budget category if needed
    if (await page.locator('text=No categories yet').isVisible()) {
      await page.click('button:has-text("Add Category")');
      await page.fill('input[name="name"]', 'Venue');
      await page.fill('input[name="allocatedAmount"]', '15000');
      await page.selectOption('select[name="priority"]', 'essential');
      await page.click('button:has-text("Save")');
    }
    
    // Navigate to expenses
    await page.goto('/dashboard/budget/expenses');
    
    // Add an expense
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="description"]', 'Venue deposit');
    await page.fill('input[name="amount"]', '5000');
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="categoryId"]', { index: 1 }); // Select first available category
    await page.click('button[type="submit"]:has-text("Add Expense")');
    
    // Verify expense appears
    await expect(page.locator('text=Venue deposit')).toBeVisible();
  });

  test('07. Checklist and Tasks', async () => {
    // Navigate to checklist
    await page.click('nav >> text=Checklist');
    await expect(page).toHaveURL('/dashboard/checklist');
    
    // Verify default tasks are loaded
    await expect(page.locator('text=Wedding Planning Checklist')).toBeVisible();
    
    // Complete a few tasks
    const checkboxes = page.locator('input[type="checkbox"]:not(:checked)');
    const count = await checkboxes.count();
    
    if (count > 0) {
      // Check first 3 unchecked tasks
      for (let i = 0; i < Math.min(3, count); i++) {
        await checkboxes.nth(i).check();
        await page.waitForTimeout(500); // Wait for state update
      }
    }
    
    // Add a custom task
    await page.click('button:has-text("Add Task")');
    await page.fill('input[name="title"]', 'Book honeymoon flights');
    await page.fill('textarea[name="description"]', 'Research and book flights for honeymoon destination');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('input[name="dueDate"]', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Save Task")');
    
    // Verify custom task appears
    await expect(page.locator('text=Book honeymoon flights')).toBeVisible();
  });

  test('08. Photo Gallery', async () => {
    // Navigate to photos
    await page.click('nav >> text=Photos');
    await expect(page).toHaveURL('/dashboard/photos');
    
    // Create an album
    await page.click('button:has-text("Create Album")');
    await page.fill('input[name="name"]', 'Engagement Photos');
    await page.fill('textarea[name="description"]', 'Our engagement photoshoot at the park');
    await page.click('button:has-text("Create")');
    
    // Verify album is created
    await expect(page.locator('text=Engagement Photos')).toBeVisible();
    
    // Note: Actual photo upload would require file fixtures
    // This is a simplified version
    if (await page.locator('button:has-text("Upload Photos")').isVisible()) {
      // Photo upload test would go here with proper file fixtures
    }
  });

  test('09. Messages and Communication', async () => {
    // Navigate to messages
    await page.click('nav >> text=Messages');
    await expect(page).toHaveURL('/dashboard/messages');
    
    // Check for message templates
    await expect(page.locator('text=Message Center')).toBeVisible();
    
    // Test sending a message (if available)
    if (await page.locator('button:has-text("Compose")').isVisible()) {
      await page.click('button:has-text("Compose")');
      
      // Select recipients
      await page.selectOption('select[name="recipientType"]', 'all_guests');
      
      // Fill message details
      await page.fill('input[name="subject"]', 'Save the Date!');
      await page.fill('textarea[name="message"]', `Dear friends and family, please save the date for our wedding on ${testUser.weddingDate.toLocaleDateString()}!`);
      
      // Send message
      await page.click('button:has-text("Send")');
      
      // Verify message is sent
      await expect(page.locator('text=Message sent successfully')).toBeVisible();
    }
  });

  test('10. Settings and Preferences', async () => {
    // Navigate to settings
    await page.click('nav >> text=Settings');
    await expect(page).toHaveURL('/dashboard/settings');
    
    // Update wedding details
    await page.fill('input[id="venue"]', testUser.venue + ' - Grand Ballroom');
    await page.click('button:has-text("Save"):near(text="Wedding Details")');
    
    // Update notification preferences
    await page.check('input[id="email-task-reminders"]');
    await page.check('input[id="email-budget-alerts"]');
    await page.click('button:has-text("Save Email Preferences")');
    
    // Verify settings are saved
    await expect(page.locator('text=saved successfully')).toBeVisible();
  });

  test('11. Export Data', async () => {
    // Stay on settings page
    await page.goto('/dashboard/settings');
    
    // Test data export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('wedding-data-export');
  });

  test('12. Mobile Responsiveness', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Check mobile menu
    const mobileMenuButton = page.locator('button[aria-label="Menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('nav >> text=Guests')).toBeVisible();
    }
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('13. Sign Out and Sign In', async () => {
    // Sign out
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Sign out');
    
    // Verify redirect to home
    await expect(page).toHaveURL('/');
    
    // Sign back in
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=/Days Until/i')).toBeVisible();
  });
});

// Performance tests
test.describe('Performance Tests', () => {
  test('Page Load Times', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/dashboard/guests',
      '/dashboard/vendors',
      '/dashboard/budget',
      '/dashboard/photos',
      '/dashboard/checklist',
      '/dashboard/settings'
    ];

    for (const route of routes) {
      const startTime = Date.now();
      await page.goto(route);
      const loadTime = Date.now() - startTime;
      
      console.log(`${route} loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    }
  });
});

// Accessibility tests
test.describe('Accessibility Tests', () => {
  test('Keyboard Navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('text=Skip to main content');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      const mainContent = await page.evaluate(() => document.activeElement?.id);
      expect(mainContent).toBe('main');
    }
  });

  test('ARIA Labels', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for proper ARIA labels
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have either visible text or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});

// Error Handling tests
test.describe('Error Handling', () => {
  test('404 Page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
  });

  test('Network Error Handling', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    try {
      await page.goto('/dashboard/guests');
      await page.click('button:has-text("Add Guest")');
      
      // Should show error message
      await expect(page.locator('text=/error|failed|offline/i')).toBeVisible();
    } finally {
      await page.context().setOffline(false);
    }
  });
});