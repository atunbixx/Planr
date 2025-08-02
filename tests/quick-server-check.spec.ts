import { test, expect } from '@playwright/test';

test.describe('Quick Server Check', () => {
  test('verify server is responding', async ({ page }) => {
    console.log('🔄 Testing server connectivity...');
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Check if page loads
      const title = await page.title();
      console.log(`✅ Page title: "${title}"`);
      
      // Check if main content is visible
      const heading = await page.locator('h1').first().textContent();
      console.log(`✅ Main heading: "${heading}"`);
      
      // Take a screenshot to see what's loading
      await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
      console.log('✅ Screenshot saved as debug-homepage.png');
      
      console.log('🎉 Server is working correctly!');
      
    } catch (error) {
      console.error('❌ Server connection failed:', error.message);
      throw error;
    }
  });

  test('test different browsers', async ({ page, browserName }) => {
    console.log(`🔄 Testing on ${browserName}...`);
    
    await page.goto('http://localhost:3000');
    
    const isLoaded = await page.locator('h1').first().isVisible();
    console.log(`✅ ${browserName}: Page loaded = ${isLoaded}`);
    
    expect(isLoaded).toBe(true);
  });
});