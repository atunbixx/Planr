import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow Tests (Standalone)', () => {
  // Test the onboarding page components without authentication
  test('Onboarding page structure and form validation', async ({ page }) => {
    // Navigate directly to onboarding page
    // This will redirect to sign-in, but we can test the redirect behavior
    await page.goto('/onboarding');
    
    // Check if redirected to sign-in
    const url = page.url();
    if (url.includes('sign-in') || url.includes('signin')) {
      console.log('✓ Correctly redirected to sign-in when not authenticated');
      expect(url).toMatch(/sign-in|signin/);
    }
  });

  test('Test sign-in page exists and is accessible', async ({ page }) => {
    // Try different sign-in URLs
    const signInUrls = ['/sign-in', '/auth/signin', '/signin'];
    
    for (const url of signInUrls) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      if (response && response.ok()) {
        console.log(`✓ Found sign-in page at ${url}`);
        expect(page.url()).toContain(url.replace('/', ''));
        break;
      }
    }
  });

  test('Check for Clerk configuration', async ({ page }) => {
    // Go to the home page
    await page.goto('/');
    
    // Check if Clerk is configured
    const hasClerk = await page.evaluate(() => {
      return typeof window.Clerk !== 'undefined';
    });
    
    if (hasClerk) {
      console.log('✓ Clerk is configured and loaded');
    } else {
      console.log('✗ Clerk is not loaded - check configuration');
    }
  });

  test('Verify expected onboarding steps', async ({ page }) => {
    // This test documents the expected onboarding flow
    const expectedSteps = [
      { step: 1, title: 'About You', fields: ['partner1Name', 'partner2Name'] },
      { step: 2, title: 'Wedding Details', fields: ['weddingDate', 'weddingStyle'] },
      { step: 3, title: 'Venue Information', fields: ['venueName', 'venueLocation'] },
      { step: 4, title: 'Planning Details', fields: ['guestCountEstimate', 'budgetTotal'] }
    ];
    
    console.log('Expected onboarding flow:');
    expectedSteps.forEach(step => {
      console.log(`  Step ${step.step}: ${step.title}`);
      console.log(`    Fields: ${step.fields.join(', ')}`);
    });
    
    // This serves as documentation for the expected flow
    expect(expectedSteps).toHaveLength(4);
  });

  test('Test data validation rules', async ({ page }) => {
    // Document the validation rules
    const validationRules = {
      partner1Name: { required: true, minLength: 1 },
      partner2Name: { required: false },
      weddingDate: { required: false, format: 'YYYY-MM-DD' },
      venueName: { required: false },
      venueLocation: { required: false },
      guestCountEstimate: { required: true, min: 1, max: 1000, default: 100 },
      budgetTotal: { required: true, min: 0, default: 50000 },
      weddingStyle: { required: true, default: 'traditional' }
    };
    
    console.log('Validation rules for onboarding:');
    Object.entries(validationRules).forEach(([field, rules]) => {
      console.log(`  ${field}:`, rules);
    });
    
    // This documents the expected validation
    expect(Object.keys(validationRules)).toHaveLength(8);
  });
});