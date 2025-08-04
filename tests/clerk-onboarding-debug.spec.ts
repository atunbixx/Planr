import { test, expect } from '@playwright/test';

test.describe('Clerk Onboarding Debug', () => {
  test('Debug sign-up page', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', error => console.log(`Page error: ${error.message}`));
    
    console.log('Navigating to /sign-up...');
    await page.goto('/sign-up', { waitUntil: 'networkidle' });
    
    console.log('Current URL:', page.url());
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-signup.png', fullPage: true });
    
    // Get page content
    const content = await page.content();
    console.log('Page content length:', content.length);
    
    // Check for Clerk
    const hasClerk = await page.evaluate(() => {
      return typeof window.Clerk !== 'undefined';
    });
    console.log('Clerk loaded:', hasClerk);
    
    // Look for any visible text
    const bodyText = await page.textContent('body');
    console.log('Body text:', bodyText?.substring(0, 200));
    
    // Check for specific elements
    const h1Elements = await page.$$('h1');
    console.log('H1 elements found:', h1Elements.length);
    
    const h2Elements = await page.$$('h2');
    console.log('H2 elements found:', h2Elements.length);
    
    const h3Elements = await page.$$('h3');
    console.log('H3 elements found:', h3Elements.length);
    
    // Check for Clerk elements
    const clerkElements = await page.$$('.cl-component');
    console.log('Clerk component elements:', clerkElements.length);
    
    const clerkRoot = await page.$$('.cl-rootBox');
    console.log('Clerk rootBox elements:', clerkRoot.length);
    
    // Wait a bit more for dynamic content
    await page.waitForTimeout(3000);
    
    // Check again after waiting
    const clerkRootAfterWait = await page.$$('.cl-rootBox');
    console.log('Clerk rootBox elements after wait:', clerkRootAfterWait.length);
    
    // Get all text content
    const allText = await page.evaluate(() => {
      return document.body.innerText;
    });
    console.log('All visible text:', allText);
  });

  test('Test onboarding with mock authentication', async ({ page }) => {
    // First, let's try to access onboarding directly
    console.log('Navigating to /onboarding...');
    await page.goto('/onboarding');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);
    
    if (currentUrl.includes('sign-in') || currentUrl.includes('signin')) {
      console.log('Redirected to sign-in as expected when not authenticated');
      
      // Take screenshot of sign-in page
      await page.screenshot({ path: 'debug-signin-redirect.png', fullPage: true });
      
      // Check what's on the sign-in page
      const signInText = await page.textContent('body');
      console.log('Sign-in page text:', signInText?.substring(0, 200));
    } else if (currentUrl.includes('onboarding')) {
      console.log('On onboarding page - might be authenticated');
      
      // Check for onboarding content
      const hasWelcomeText = await page.locator('h1').filter({ hasText: /Welcome/i }).count();
      console.log('Welcome heading found:', hasWelcomeText > 0);
      
      // Check for form elements
      const inputElements = await page.$$('input');
      console.log('Input elements found:', inputElements.length);
      
      // Take screenshot
      await page.screenshot({ path: 'debug-onboarding.png', fullPage: true });
    }
  });

  test('Test complete flow with better selectors', async ({ page }) => {
    // Navigate to sign-up
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    
    // Wait for any of these possible scenarios
    const scenarios = await Promise.race([
      // Clerk component
      page.waitForSelector('.cl-component', { timeout: 5000 }).then(() => 'clerk'),
      // Custom form
      page.waitForSelector('form', { timeout: 5000 }).then(() => 'custom'),
      // Redirect
      page.waitForURL(/sign-in|signin/, { timeout: 5000 }).then(() => 'redirect'),
      // Timeout
      new Promise(resolve => setTimeout(() => resolve('timeout'), 5000))
    ]);
    
    console.log('Sign-up page scenario:', scenarios);
    
    if (scenarios === 'clerk') {
      console.log('Found Clerk component');
      
      // Try to interact with Clerk
      const emailInput = await page.$('input[type="email"], input[name="emailAddress"]');
      if (emailInput) {
        console.log('Found email input');
        await emailInput.fill('test@example.com');
      }
    } else if (scenarios === 'custom') {
      console.log('Found custom form');
      
      // Look for form fields
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (emailInput && passwordInput) {
        console.log('Found email and password inputs');
      }
    } else {
      console.log('No form found or timed out');
      
      // Debug what's actually on the page
      const visibleText = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).
          map(el => el.textContent?.trim()).
          filter(text => text && text.length > 0).
          join(' | ');
      });
      console.log('Visible text on page:', visibleText.substring(0, 500));
    }
  });
});