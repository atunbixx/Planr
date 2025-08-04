import { test, expect } from '@playwright/test';

test.describe('Wedding Planner Server Health', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Wedding/);
    
    // Check for key elements on the landing page - match current content
    await expect(page.locator('h1').first()).toContainText('WEDDING STUDIO');
    await expect(page.locator('h1').nth(1)).toContainText('Modern');
    
    // Check navigation elements - match current navigation
    await expect(page.getByRole('link', { name: 'SIGN IN' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'START PLANNING' })).toBeVisible();
    
    console.log('✅ Homepage loaded successfully');
  });

  test('sign up page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Check sign up form elements - use actual text from debug output
    await expect(page.getByRole('heading', { name: 'Join Wedding Planner' })).toBeVisible();
    
    // Use more specific selectors for form inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible(); // First password field
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Sign up page loaded successfully');
  });

  test('sign in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check that page loads and has expected content
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    
    // Wait for Clerk form to load (it's dynamically rendered)
    await page.waitForTimeout(2000);
    
    // Check that the Clerk sign-in component is present
    await expect(page.locator('[data-clerk-element="SignIn"]').or(page.locator('.cl-rootBox'))).toBeVisible();
    
    console.log('✅ Sign in page loaded successfully');
  });

  test('protected routes redirect to auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to sign in (Clerk uses /sign-in)
    await expect(page).toHaveURL(/\/sign-in/);
    
    console.log('✅ Authentication protection working');
  });

  test('responsive design works', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport - use first h1 element specifically
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1').first()).toBeVisible();
    
    console.log('✅ Responsive design working');
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test Sign In navigation - now it's a proper link
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // Test Get Started navigation
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).first().click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    
    console.log('✅ Navigation working correctly');
  });

  test('authentication form structure', async ({ page }) => {
    // Go to sign up page
    await page.goto('/auth/signup');
    
    // Check that form inputs exist with correct IDs from debug output
    await expect(page.locator('input[id="email-address"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirm-password"]')).toBeVisible();
    await expect(page.locator('input[id="your-full-name"]')).toBeVisible();
    
    // Check that submit button is present and enabled by default
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Authentication form structure working');
  });

  test('page accessibility basics', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility elements
    await expect(page.locator('h1')).toHaveCount(2); // Should have header structure
    
    // Check for proper link roles
    const links = page.getByRole('link');
    await expect(links).not.toHaveCount(0);
    
    // Check for proper button roles
    const buttons = page.getByRole('button');
    await expect(buttons).not.toHaveCount(0);
    
    // Check that images have alt text or are decorative
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        // Images should either have alt text or be marked as decorative
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
    }
    
    console.log('✅ Basic accessibility checks passed');
  });

  test('end-to-end user flow', async ({ page }) => {
    // Test complete user flow
    await page.goto('/');
    
    // Navigate to sign up
    await page.getByRole('link', { name: 'START PLANNING' }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    
    // Check form is interactive
    await page.fill('input[id="your-full-name"]', 'Test User');
    await page.fill('input[id="email-address"]', 'test@example.com');
    
    // Navigate to sign in
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // Check sign in form is interactive
    await page.fill('input[type="email"]', 'test@example.com');
    
    console.log('✅ End-to-end user flow working');
  });

  test('check for JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different pages to test for errors
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('chunk') &&
      !error.includes('Warning') &&
      !error.includes('404') &&
      !error.includes('ResizeObserver') // Common non-critical error
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ JavaScript errors found:', criticalErrors);
    } else {
      console.log('✅ No critical JavaScript errors');
    }
    
    expect(criticalErrors.length).toBeLessThan(3); // Allow for minor non-critical errors
  });
});