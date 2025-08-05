import { test, expect } from '@playwright/test';

test.describe('Simple Server Test', () => {
  // Use external server that should be running
  test.use({ baseURL: 'http://localhost:4000' });
  
  test('Server is responding', async ({ page, request }) => {
    try {
      // Test basic connectivity with request API (doesn't need browser)
      const response = await request.get('/');
      
      console.log('Response status:', response.status());
      console.log('Response headers:', response.headers());
      
      // Any response (even 500) means server is running
      expect(response.status()).toBeGreaterThan(0);
      
    } catch (error) {
      console.log('Server connection error:', error);
      
      // If server is not running, fail with clear message
      throw new Error(`Server is not running on http://localhost:4000. Please start the server with: npm run dev -- --port 4000`);
    }
  });

  test('Homepage loads (if server is running)', async ({ page }) => {
    try {
      await page.goto('/', { timeout: 10000 });
      
      // Check if page loaded at all
      const title = await page.title();
      console.log('Page title:', title);
      
      // Any title means page loaded
      expect(title.length).toBeGreaterThan(0);
      
    } catch (error) {
      console.log('Page load error:', error);
      throw new Error(`Could not load page. Server may not be running or may have build errors.`);
    }
  });
});

test.describe('Server Health Check', () => {
  test('Check if any Next.js server is running', async ({ request }) => {
    const ports = [3000, 3001, 4000, 4001];
    let runningServers: any[] = [];
    
    for (const port of ports) {
      try {
        const response = await request.get(`http://localhost:${port}/`);
        runningServers.push({
          port,
          status: response.status(),
          headers: response.headers()
        });
      } catch (error) {
        // Server not running on this port
      }
    }
    
    console.log('Running servers:', runningServers);
    
    if (runningServers.length === 0) {
      throw new Error('No Next.js servers found running on common ports (3000, 3001, 4000, 4001)');
    }
    
    // At least one server should be running
    expect(runningServers.length).toBeGreaterThan(0);
  });
});