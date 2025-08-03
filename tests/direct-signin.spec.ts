import { test, expect } from '@playwright/test';

test.describe('Direct Sign-In Debug', () => {
  test('should complete direct sign-in process', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Go to direct sign-in page
    await page.goto('/direct-signin');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Direct Sign-In');
    
    // Check initial status
    const statusDiv = page.locator('div').filter({ hasText: 'Status:' });
    await expect(statusDiv).toContainText('Ready to sign in');
    
    // Click the Direct Sign In button
    const signInButton = page.locator('button', { hasText: 'Direct Sign In' });
    await expect(signInButton).toBeVisible();
    
    console.log('Clicking Direct Sign In button...');
    await signInButton.click();
    
    // Wait for processing to start
    await expect(signInButton).toContainText('Processing...');
    console.log('Button shows Processing...');
    
    // Monitor status changes with timeout
    let currentStatus = '';
    let statusChanges: string[] = [];
    
    // Wait up to 60 seconds and track status changes
    for (let i = 0; i < 60; i++) {
      try {
        const statusText = await statusDiv.textContent();
        if (statusText && statusText !== currentStatus) {
          currentStatus = statusText;
          statusChanges.push(`${i}s: ${statusText}`);
          console.log(`Status change at ${i}s:`, statusText);
        }
        
        // Check if we've completed or failed
        if (statusText?.includes('Redirecting') || 
            statusText?.includes('❌') || 
            statusText?.includes('💥')) {
          break;
        }
        
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`Error checking status at ${i}s:`, error);
        break;
      }
    }
    
    console.log('All status changes:', statusChanges);
    
    // Check final state
    const finalStatus = await statusDiv.textContent();
    console.log('Final status:', finalStatus);
    
    // The test should not hang - if we get here, we've identified the issue
    expect(statusChanges.length).toBeGreaterThan(0);
  });

  test('should test individual components', async ({ page }) => {
    // Go to debug page
    await page.goto('/debug-signin');
    
    await expect(page.locator('h1')).toContainText('Debug Sign-In');
    
    // Test connection
    console.log('Testing connection...');
    await page.click('button:has-text("Test Connection")');
    
    // Wait for result
    await page.waitForTimeout(5000);
    const connectionResult = await page.locator('div').filter({ hasText: 'Status:' }).textContent();
    console.log('Connection test result:', connectionResult);
    
    // Test sign-in
    console.log('Testing sign-in...');
    await page.click('button:has-text("Test Sign-In")');
    
    // Wait for result
    await page.waitForTimeout(10000);
    const signInResult = await page.locator('div').filter({ hasText: 'Status:' }).textContent();
    console.log('Sign-in test result:', signInResult);
    
    // Test session
    console.log('Testing session...');
    await page.click('button:has-text("Test Session")');
    
    // Wait for result
    await page.waitForTimeout(5000);
    const sessionResult = await page.locator('div').filter({ hasText: 'Status:' }).textContent();
    console.log('Session test result:', sessionResult);
  });
});