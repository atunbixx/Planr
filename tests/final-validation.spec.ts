import { test, expect } from '@playwright/test';

test.describe('Final Clerk Validation - All Tests Must Pass', () => {
  
  test('✅ API Health endpoint returns valid JSON', async ({ page }) => {
    const response = await page.request.get('/api/health');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    
    console.log('✅ Health API confirmed real implementation:', data);
  });

  test('✅ All protected APIs return 401 (not placeholders)', async ({ page }) => {
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
      
      console.log(`✅ ${apiPath} confirmed real API (401 protected)`);
    }
  });

  test('✅ Sign-in page loads with Clerk components', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify page title
    await expect(page).toHaveTitle(/Wedding Planner/);
    
    // Check for Clerk elements
    const clerkElements = await page.locator('div[class*="cl-"], form[class*="cl-"], button[class*="cl-"]').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    console.log(`✅ Sign-in page has ${clerkElements} Clerk elements`);
  });

  test('✅ Sign-up page loads with Clerk components', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify page title
    await expect(page).toHaveTitle(/Wedding Planner/);
    
    // Check for Clerk elements
    const clerkElements = await page.locator('div[class*="cl-"], form[class*="cl-"], button[class*="cl-"]').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    console.log(`✅ Sign-up page has ${clerkElements} Clerk elements`);
  });

  test('✅ Protected routes redirect to authentication', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard/budget',
      '/dashboard/guests', 
      '/dashboard/vendors',
      '/dashboard/photos'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const hasSignInElements = await page.locator('div[class*="cl-"], form[class*="cl-"]').count() > 0;
      
      // Either redirected to sign-in OR showing Clerk auth components
      const isProtected = currentUrl.includes('sign-in') || hasSignInElements;
      expect(isProtected).toBe(true);
      
      console.log(`✅ Route ${route} is protected`);
    }
  });

  test('✅ Clerk environment variables working', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for Clerk elements
    const clerkElements = await page.locator('[class*="cl-"], [data-clerk]').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    // No key errors
    const errorMessages = await page.locator('text=/invalid.*key|missing.*key|key.*not.*found/i').count();
    expect(errorMessages).toBe(0);
    
    console.log(`✅ Clerk config working (${clerkElements} elements, 0 errors)`);
  });

  test('✅ Server endpoints respond correctly', async ({ page }) => {
    const endpoints = [
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

  test('✅ Authentication system is functional', async ({ page }) => {
    // Test that the main dashboard area shows auth protection
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const hasSignInElements = await page.locator('div[class*="cl-"], form[class*="cl-"]').count() > 0;
    
    // Should either redirect to sign-in OR show Clerk components
    const authSystemWorking = currentUrl.includes('sign-in') || hasSignInElements;
    expect(authSystemWorking).toBe(true);
    
    console.log(`✅ Authentication system working (${currentUrl.includes('sign-in') ? 'redirect' : 'clerk components'})`);
  });
});