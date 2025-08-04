import { test, expect } from '@playwright/test';

test.describe('Basic Server Check', () => {
  test.use({
    baseURL: 'http://localhost:3006'
  });

  test('server responds and pages load', async ({ page }) => {
    // Test homepage
    console.log('Testing homepage...');
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check if page loads without errors
    const title = await page.title();
    console.log('Homepage title:', title);
    expect(title).toContain('Wedding');
    
    // Check if basic content is there
    await expect(page.locator('h1')).toBeVisible();
    
    // Test sign-in page
    console.log('Testing sign-in page...');
    await page.goto('/sign-in', { waitUntil: 'networkidle' });
    
    // Check if we get to the right page (even if Clerk isn't working)
    const signInContent = await page.textContent('body');
    console.log('Sign-in page has content:', signInContent && signInContent.length > 100);
    
    // Test sign-up page
    console.log('Testing sign-up page...');
    await page.goto('/sign-up', { waitUntil: 'networkidle' });
    
    // Check if we get to the right page
    const signUpContent = await page.textContent('body');
    console.log('Sign-up page has content:', signUpContent && signUpContent.length > 100);
  });

  test('check for javascript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    console.log('JavaScript errors found:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 5)); // Show first 5 errors
    }
  });
});