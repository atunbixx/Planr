import { test, expect } from '@playwright/test';

test.describe('Server Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('Homepage loads and displays correctly', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/Wedding Planner/i);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Wedding Planner/i })).toBeVisible();
    
    // Check tagline
    await expect(page.getByText(/Plan your perfect wedding with ease/i)).toBeVisible();
    
    // Check sign-in buttons are present
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
    
    // Check feature cards are present
    await expect(page.getByText(/Plan Everything/i)).toBeVisible();
    await expect(page.getByText(/Manage Budget/i)).toBeVisible();
    await expect(page.getByText(/Guest List/i)).toBeVisible();
  });

  test('Sign-in page loads when button is clicked', async ({ page }) => {
    // Click the main Sign In button
    const signInButtons = page.getByRole('button', { name: /Sign In/i });
    await signInButtons.first().click();
    
    // Should navigate to sign-in page
    await expect(page).toHaveURL(/sign-in/);
    
    // Check that sign-in page loads
    await expect(page.getByText(/Welcome Back/i)).toBeVisible();
  });

  test('Sign-up page loads when Get Started is clicked', async ({ page }) => {
    // Click the main Get Started button
    const getStartedButtons = page.getByRole('button', { name: /Get Started/i });
    await getStartedButtons.first().click();
    
    // Should navigate to sign-up page  
    await expect(page).toHaveURL(/sign-up/);
    
    // Check that sign-up page loads
    await expect(page.getByText(/Get Started/i)).toBeVisible();
  });

  test('Dashboard redirects to sign-in when not authenticated', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('API endpoints are accessible', async ({ page }) => {
    // Test that API endpoints return proper responses
    const response = await page.request.get('/api/budget/categories');
    
    // Should return 401 for unauthenticated request
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('Guest management API endpoint', async ({ page }) => {
    const response = await page.request.get('/api/guests');
    
    // Should return 401 for unauthenticated request
    expect(response.status()).toBe(401);
  });

  test('Vendor management API endpoint', async ({ page }) => {
    const response = await page.request.get('/api/vendors');
    
    // Should return 401 for unauthenticated request
    expect(response.status()).toBe(401);
  });

  test('Photos API endpoint', async ({ page }) => {
    const response = await page.request.get('/api/photos');
    
    // Should return 401 for unauthenticated request
    expect(response.status()).toBe(401);
  });

  test('Page performance is acceptable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (generous for testing)
    expect(loadTime).toBeLessThan(5000);
  });

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that mobile layout is working
    await expect(page.getByRole('heading', { name: /Wedding Planner/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('RSVP page loads with valid code format', async ({ page }) => {
    // Test RSVP page with a sample code format
    await page.goto('/rsvp/TESTCODE123');
    
    // Should load RSVP page (even if code is invalid)
    await expect(page).toHaveURL(/\/rsvp\/TESTCODE123/);
    
    // Page should load without crashing
    await page.waitForLoadState('domcontentloaded');
    
    // Should not have any JavaScript errors
    const errors: any[] = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(1000); // Wait for any potential errors
    
    expect(errors.length).toBe(0);
  });

  test('Service worker and PWA manifest are accessible', async ({ page }) => {
    // Check if manifest is accessible
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
  });

  test('Static assets load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for any failed network requests
    const failedRequests: any[] = [];
    
    page.on('requestfailed', request => {
      // Ignore common development-only failures
      if (!request.url().includes('/_next/static/chunks/webpack')) {
        failedRequests.push(request.url());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Should have no critical failed requests
    expect(failedRequests.length).toBe(0);
  });
});

test.describe('Server Health Checks', () => {
  test('Server responds to health checks', async ({ page }) => {
    // Basic connectivity test
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);
    
    // Check response headers
    const headers = response.headers();
    expect(headers['content-type']).toContain('text/html');
  });

  test('Next.js API routes are working', async ({ page }) => {
    // Test various API endpoints for basic connectivity
    const endpoints = [
      '/api/budget/categories',
      '/api/guests', 
      '/api/vendors',
      '/api/photos'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      
      // Should return some response (401 unauthorized is expected)
      expect([200, 401, 405]).toContain(response.status());
    }
  });

  test('Authentication system is functional', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in to test auth system loads
    const signInButton = page.getByRole('button', { name: /Sign In/i }).first();
    await signInButton.click();
    
    // Should navigate to auth page
    await expect(page).toHaveURL(/sign-in/);
    
    // Should not have critical errors
    const errors: any[] = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.message.includes('ResizeObserver') &&
      !error.message.includes('Non-Error promise rejection')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});