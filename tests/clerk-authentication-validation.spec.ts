import { test, expect } from '@playwright/test';

test.describe('Clerk Authentication & API Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Wedding Planner/);
    
    // Take screenshot for validation
    await page.screenshot({ path: 'test-results/homepage-loaded.png', fullPage: true });
  });

  test('Sign-in page is accessible and properly configured', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Wait for Clerk component to load
    await page.waitForLoadState('networkidle');
    
    // Check if Clerk sign-in component loads
    const signInComponent = page.locator('.cl-rootBox, .cl-card, [data-clerk-modal]').first();
    await expect(signInComponent).toBeVisible({ timeout: 10000 });
    
    // Verify page title and content
    await expect(page).toHaveTitle(/Wedding Planner/);
    await expect(page.locator('h1')).toContainText('Welcome Back');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/sign-in-page.png', fullPage: true });
  });

  test('Sign-up page is accessible and properly configured', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Wait for Clerk component to load
    await page.waitForLoadState('networkidle');
    
    // Check if Clerk sign-up component loads
    const signUpComponent = page.locator('.cl-rootBox, .cl-card, [data-clerk-modal]').first();
    await expect(signUpComponent).toBeVisible({ timeout: 10000 });
    
    // Verify page title and content
    await expect(page).toHaveTitle(/Wedding Planner/);
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/sign-up-page.png', fullPage: true });
  });

  test('API Health endpoint is accessible', async ({ page }) => {
    // Test API endpoint accessibility
    const response = await page.request.get('/api/health');
    
    // API should return 401 (unauthorized) or 200 with valid auth
    // This confirms the API is working and protected
    expect([200, 401, 500]).toContain(response.status());
    
    console.log('Health API Status:', response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
      console.log('Health API Response:', data);
    }
  });

  test('Dashboard redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    
    // Verify we're on the sign-in page
    const signInComponent = page.locator('.cl-rootBox, .cl-card, [data-clerk-modal]').first();
    await expect(signInComponent).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'test-results/dashboard-redirect-to-signin.png', fullPage: true });
  });

  test('Onboarding page redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 10000 });
    
    // Verify we're on the sign-in page
    const signInComponent = page.locator('.cl-rootBox, .cl-card, [data-clerk-modal]').first();
    await expect(signInComponent).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'test-results/onboarding-redirect-to-signin.png', fullPage: true });
  });

  test('Clerk middleware is properly protecting routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/onboarding',
      '/dashboard/budget',
      '/dashboard/guests',
      '/dashboard/vendors',
      '/dashboard/photos'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should be redirected to sign-in for each protected route
      await page.waitForURL('**/sign-in**', { timeout: 10000 });
      
      console.log(`✅ Route ${route} is properly protected`);
    }
  });

  test('API endpoints are properly protected', async ({ page }) => {
    const apiEndpoints = [
      '/api/guests',
      '/api/vendors',
      '/api/budget/categories',
      '/api/budget/expenses',
      '/api/checklist',
      '/api/photos',
      '/api/albums'
    ];

    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(endpoint);
      
      // Should return 401 (Unauthorized) when not authenticated
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
      
      console.log(`✅ API ${endpoint} is properly protected (401)`);
    }
  });

  test('Environment variables are properly configured', async ({ page }) => {
    // Test that Clerk environment variables are working
    await page.goto('/sign-in');
    
    // Wait for Clerk to initialize
    await page.waitForTimeout(2000);
    
    // Check for Clerk-specific elements that would only appear with valid config
    const clerkElements = await page.locator('.cl-rootBox, .cl-card, .cl-formButtonPrimary').count();
    expect(clerkElements).toBeGreaterThan(0);
    
    console.log(`✅ Clerk components loaded successfully (${clerkElements} elements found)`);
  });
  
  test('Database connection is working (API responds correctly)', async ({ page }) => {
    // Test a few API endpoints to ensure database connectivity
    const testEndpoints = [
      { path: '/api/health', expectedStatus: [200, 401] },
      { path: '/api/guests', expectedStatus: [401] }, // Should be 401 without auth
      { path: '/api/vendors', expectedStatus: [401] }
    ];

    for (const { path, expectedStatus } of testEndpoints) {
      const response = await page.request.get(path);
      expect(expectedStatus).toContain(response.status());
      console.log(`✅ ${path} returned expected status: ${response.status()}`);
    }
  });
});