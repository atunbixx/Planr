import { Page, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Sign up a new user and complete onboarding
   */
  async signUpAndOnboard(userData?: {
    email?: string;
    password?: string;
    firstName?: string;
    partnerName?: string;
  }) {
    const user = {
      email: userData?.email || faker.internet.email(),
      password: userData?.password || 'TestPassword123!',
      firstName: userData?.firstName || faker.person.firstName(),
      partnerName: userData?.partnerName || faker.person.firstName(),
      weddingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      venue: faker.company.name() + ' Resort',
      location: faker.location.city() + ', ' + faker.location.state(),
      expectedGuests: faker.number.int({ min: 50, max: 200 }),
      totalBudget: faker.number.int({ min: 20000, max: 100000 })
    };

    // Navigate to sign up
    await this.page.goto('/sign-up');
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for the form to be visible before filling
    await this.page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    // Fill registration form
    await this.page.fill('input[id="email"]', user.email);
    await this.page.fill('input[id="password"]', user.password);
    await this.page.fill('input[id="confirmPassword"]', user.password);
    await this.page.click('button:has-text("Create Account")');
    
    // Wait for navigation with longer timeout
    await this.page.waitForURL(/\/(onboarding|dashboard|sign-in)/, { timeout: 30000 });
    
    // Check if we're on the expected page
    const currentUrl = this.page.url();
    if (currentUrl.includes('/sign-in')) {
      // If redirected to sign-in, that means account was created but needs email verification
      // For testing purposes, we'll sign in directly
      await this.signIn(user.email, user.password);
    }
    
    // Complete onboarding if needed
    if (this.page.url().includes('/onboarding')) {
      await this.completeOnboarding(user);
    }
    
    return user;
  }

  /**
   * Complete the onboarding process
   */
  async completeOnboarding(userData: any) {
    // Step 1: About You
    await this.page.fill('input[id="partner1Name"]', userData.firstName);
    await this.page.fill('input[id="partner2Name"]', userData.partnerName);
    await this.page.click('button:has-text("Next Step")');

    // Step 2: Wedding Details
    await this.page.fill('input[id="weddingDate"]', userData.weddingDate.toISOString().split('T')[0]);
    await this.page.selectOption('select[id="weddingStyle"]', 'modern');
    await this.page.click('button:has-text("Next Step")');

    // Step 3: Venue & Location
    await this.page.fill('input[id="venueName"]', userData.venue);
    await this.page.fill('input[id="venueLocation"]', userData.location);
    await this.page.click('button:has-text("Next Step")');

    // Step 4: Planning & Budget
    await this.page.fill('input[id="guestCountEstimate"]', userData.expectedGuests.toString());
    await this.page.fill('input[id="totalBudget"]', userData.totalBudget.toString());
    await this.page.click('button:has-text("Complete Setup")');
    
    // Wait for navigation to dashboard with longer timeout
    await this.page.waitForURL('/dashboard', { timeout: 30000 });
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    await this.page.goto('/sign-in');
    await this.page.fill('input[id="email"]', email);
    await this.page.fill('input[id="password"]', password);
    await this.page.click('button[type="submit"]');
    await expect(this.page).toHaveURL('/dashboard');
  }

  /**
   * Add a guest to the guest list
   */
  async addGuest(guestData?: any) {
    const guest = guestData || {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      relationship: 'Friend',
      side: 'both'
    };

    await this.page.goto('/dashboard/guests');
    
    // Wait for the guest list to be visible
    await this.page.waitForSelector('h1:has-text("Guest List")', { state: 'visible' });
    await this.page.waitForTimeout(500); // Small delay for permissions
    
    await this.page.click('button:has-text("Add Guest")');
    
    // Wait for dialog to open
    await this.page.waitForSelector('h2:has-text("Add Guest")', { state: 'visible' });
    
    // Fill guest form with separate first and last name fields
    // Use the specific locators suggested by Playwright
    await this.page.locator('div').filter({ hasText: /^First Name \*$/ }).getByRole('textbox').fill(guest.firstName);
    await this.page.locator('div').filter({ hasText: /^Last Name \*$/ }).getByRole('textbox').fill(guest.lastName);
    
    await this.page.fill('input[type="email"]', guest.email);
    await this.page.fill('input[type="tel"]', guest.phone || '');
    
    // Skip relationship field for now - it's optional
    // await this.page.locator('select').first().selectOption(guest.relationship);
    
    // Select side - use the specific selector suggested by Playwright
    const sideSelect = this.page.locator('div').filter({ hasText: /^Side \*Bride's SideGroom's SideBoth$/ }).getByRole('combobox');
    await sideSelect.selectOption(guest.side);
    
    // Before clicking submit, ensure form is filled by scrolling to top
    const firstNameInput = this.page.locator('div').filter({ hasText: /^First Name \*$/ }).getByRole('textbox');
    await firstNameInput.scrollIntoViewIfNeeded();
    
    // Verify the form fields are filled
    const firstNameValue = await firstNameInput.inputValue();
    console.log('First Name value:', firstNameValue);
    
    // Scroll to submit button and click it
    const submitButton = this.page.locator('button[type="submit"]:has-text("Add Guest")');
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();
    
    // Wait for dialog to close OR error to appear
    try {
      await this.page.waitForSelector('h2:has-text("Add Guest")', { state: 'hidden', timeout: 5000 });
    } catch (e) {
      // Check if there's an error message
      const errorElement = this.page.locator('div.bg-red-50.text-red-600');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Failed to add guest: ${errorText}`);
      }
      throw e;
    }
    
    // Wait a bit for the list to refresh
    await this.page.waitForTimeout(1000);
    
    // Check if guest appears in the list
    await expect(this.page.locator(`text=${guest.firstName} ${guest.lastName}`)).toBeVisible({ timeout: 5000 });
    
    return guest;
  }

  /**
   * Add a vendor
   */
  async addVendor(vendorData?: any) {
    const vendor = vendorData || {
      businessName: faker.company.name(),
      contactName: faker.person.fullName(),
      category: 'Photography',
      estimatedCost: faker.number.int({ min: 1000, max: 10000 })
    };

    await this.page.goto('/dashboard/vendors');
    await this.page.click('button:has-text("Add Vendor")');
    
    await this.page.fill('input[id="name"]', vendor.businessName);
    await this.page.fill('input[id="contactName"]', vendor.contactName);
    await this.page.selectOption('select:near(label:has-text("Category"))', vendor.category);
    await this.page.fill('input[id="estimatedCost"]', vendor.estimatedCost.toString());
    
    await this.page.click('button[type="submit"]:has-text("Add Vendor")');
    
    // Wait for vendor to appear
    await this.page.waitForTimeout(1000);
    await expect(this.page.locator(`text=${vendor.businessName}`)).toBeVisible();
    
    return vendor;
  }

  /**
   * Wait for and dismiss any toast notifications
   */
  async dismissToasts() {
    const toasts = this.page.locator('[role="alert"]');
    const count = await toasts.count();
    
    for (let i = 0; i < count; i++) {
      const closeButton = toasts.nth(i).locator('button[aria-label="Close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.page.goto('/dashboard');
      await this.page.waitForLoadState('networkidle');
      return this.page.url().includes('/dashboard');
    } catch {
      return false;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    await this.page.click('button[aria-label="User menu"]');
    await this.page.click('text=Sign out');
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Check accessibility on current page
   */
  async checkAccessibility() {
    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check for form labels
    const inputs = await this.page.locator('input:not([type="hidden"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await this.page.locator(`label[for="${id}"]`).count();
        expect(label).toBeGreaterThan(0);
      }
    }

    // Check for button text or aria-label
    const buttons = await this.page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill a date input with proper format
   */
  async fillDate(selector: string, date: Date) {
    const dateString = date.toISOString().split('T')[0];
    await this.page.fill(selector, dateString);
  }

  /**
   * Generate test data
   */
  generateTestData() {
    return {
      user: {
        email: faker.internet.email(),
        password: 'TestPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      },
      guest: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
      },
      vendor: {
        businessName: faker.company.name(),
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
      }
    };
  }
}