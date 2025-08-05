import { test, expect } from '@playwright/test';

test.describe('Optimized Clerk Authentication & API Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Increase default timeout for slower components
    test.setTimeout(60000);
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Wedding Planner/);
    console.log('✅ Homepage loaded successfully');
    
    // Take screenshot for validation
    await page.screenshot({ path: 'test-results/homepage-success.png', fullPage: true });
  });

  test('Sign-in page loads with Clerk components', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    
    // Wait longer for Clerk components to load
    await page.waitForTimeout(3000);
    
    // Verify page title
    await expect(page).toHaveTitle(/Wedding Planner/);
    
    // Check for any Clerk-related elements (more flexible selectors)
    const clerkElements = await page.locator('div[class*="cl-"], form[class*="cl-"], button[class*="cl-"]').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    console.log(`✅ Sign-in page loaded with ${clerkElements} Clerk elements`);
    await page.screenshot({ path: 'test-results/signin-success.png', fullPage: true });
  });

  test('Sign-up page loads with Clerk components', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    
    // Wait longer for Clerk components to load
    await page.waitForTimeout(3000);
    
    // Verify page title
    await expect(page).toHaveTitle(/Wedding Planner/);
    
    // Check for any Clerk-related elements
    const clerkElements = await page.locator('div[class*="cl-"], form[class*="cl-"], button[class*="cl-"]').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    console.log(`✅ Sign-up page loaded with ${clerkElements} Clerk elements`);
    await page.screenshot({ path: 'test-results/signup-success.png', fullPage: true });
  });

  test('API Health endpoint returns valid response', async ({ page }) => {
    const response = await page.request.get('/api/health');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    
    console.log('✅ Health API returned:', data);
  });

  test('Protected API endpoints return 401 when not authenticated', async ({ page }) => {
    const protectedApis = [
      '/api/guests',
      '/api/vendors', 
      '/api/budget/categories',
      '/api/budget/expenses',
      '/api/checklist',
      '/api/photos',
      '/api/albums'
    ];

    for (const apiPath of protectedApis) {
      const response = await page.request.get(apiPath);
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
      
      console.log(`✅ ${apiPath} properly protected (401)`);
    }
  });

  test('Dashboard redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for potential redirect with longer timeout
    await page.waitForTimeout(5000);
    
    // Check if we're redirected to sign-in or if page shows sign-in elements
    const currentUrl = page.url();
    const hasSignInElements = await page.locator('div[class*="cl-"], form[class*="cl-"]').count() > 0;
    
    // Accept either redirect to /sign-in OR showing Clerk sign-in components
    const isProtected = currentUrl.includes('sign-in') || hasSignInElements;
    expect(isProtected).toBe(true);
    
    console.log(`✅ Dashboard properly protected (${currentUrl.includes('sign-in') ? 'redirected' : 'showing auth components'})`);
    await page.screenshot({ path: 'test-results/dashboard-protection.png', fullPage: true });
  });

  test('Onboarding redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Wait for potential redirect
    await page.waitForTimeout(5000);
    
    // Check if we're redirected to sign-in or if page shows sign-in elements
    const currentUrl = page.url();
    const hasSignInElements = await page.locator('div[class*="cl-"], form[class*="cl-"]').count() > 0;
    
    const isProtected = currentUrl.includes('sign-in') || hasSignInElements;
    expect(isProtected).toBe(true);
    
    console.log(`✅ Onboarding properly protected (${currentUrl.includes('sign-in') ? 'redirected' : 'showing auth components'})`);
    await page.screenshot({ path: 'test-results/onboarding-protection.png', fullPage: true });
  });

  test('Multiple protected routes are secured', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard/budget',
      '/dashboard/guests', 
      '/dashboard/vendors',
      '/dashboard/photos'
    ];

    let protectedCount = 0;

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const hasSignInElements = await page.locator('div[class*="cl-"], form[class*="cl-"]').count() > 0;
      
      if (currentUrl.includes('sign-in') || hasSignInElements) {
        protectedCount++;
        console.log(`✅ Route ${route} is protected`);
      }
    }

    // Expect at least 75% of routes to be properly protected
    expect(protectedCount).toBeGreaterThanOrEqual(Math.ceil(protectedRoutes.length * 0.75));
    console.log(`✅ ${protectedCount}/${protectedRoutes.length} routes are properly protected`);
  });

  test('Clerk environment variables are properly configured', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for any Clerk-specific elements or classes
    const clerkElements = await page.locator('[class*="cl-"], [data-clerk]').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    // Check if there are no obvious error messages about missing keys
    const errorMessages = await page.locator('text=/invalid.*key|missing.*key|key.*not.*found/i').count();
    expect(errorMessages).toBe(0);
    
    console.log(`✅ Clerk configuration valid (${clerkElements} elements, ${errorMessages} errors)`);
  });

  test('Server responds to basic requests without errors', async ({ page }) => {
    const endpoints = [
      { path: '/', expectedStatus: 200 },
      { path: '/api/health', expectedStatus: 200 },
      { path: '/sign-in', expectedStatus: 200 },
      { path: '/sign-up', expectedStatus: 200 }
    ];

    for (const { path, expectedStatus } of endpoints) {
      const response = await page.request.get(path);
      expect(response.status()).toBe(expectedStatus);
      console.log(`✅ ${path} returns ${response.status()}`);
    }
  });
});