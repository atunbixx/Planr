import { test, expect } from '@playwright/test';

test.describe('Debug Clerk Pages', () => {
  test.use({
    baseURL: 'http://localhost:3006'
  });

  test('debug sign-in page content', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/sign-in-debug.png' });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page content
    const content = await page.textContent('body');
    console.log('Page content preview:', content?.substring(0, 500));
    
    // Check for any error messages
    const errorMessages = await page.locator('text=Error').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Check for Clerk elements with more specific selectors
    const clerkElements = await page.locator('[data-clerk-element], .cl-rootBox, .cl-card, .clerk-loaded').count();
    console.log('Clerk elements found:', clerkElements);
    
    // Check for loading states
    const loadingElements = await page.locator('text=Loading').count();
    console.log('Loading elements found:', loadingElements);
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  test('debug sign-up page content', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/sign-up-debug.png' });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page content
    const content = await page.textContent('body');
    console.log('Page content preview:', content?.substring(0, 500));
    
    // Check for any error messages
    const errorMessages = await page.locator('text=Error').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Check for Clerk elements
    const clerkElements = await page.locator('[data-clerk-element], .cl-rootBox, .cl-card, .clerk-loaded').count();
    console.log('Clerk elements found:', clerkElements);
  });

  test('check homepage works', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage-debug.png' });
    
    // Check that homepage loads
    await expect(page.locator('h1').first()).toContainText('WEDDING STUDIO');
    
    // Check sign-in link
    const signInLink = page.getByRole('link', { name: 'SIGN IN' });
    await expect(signInLink).toBeVisible();
    
    const signInHref = await signInLink.getAttribute('href');
    console.log('Sign-in link href:', signInHref);
    
    // Check sign-up links
    const signUpLinks = page.getByRole('link', { name: /START PLANNING|BEGIN YOUR JOURNEY|Start Your Free Trial/ });
    const signUpCount = await signUpLinks.count();
    console.log('Sign-up links found:', signUpCount);
    
    for (let i = 0; i < signUpCount; i++) {
      const href = await signUpLinks.nth(i).getAttribute('href');
      console.log(`Sign-up link ${i + 1} href:`, href);
    }
  });
});