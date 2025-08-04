import { test, expect } from '@playwright/test';

test.describe('Settings Error Debug', () => {
  test.use({
    baseURL: 'http://localhost:3006'
  });

  test('reproduce the settings initialization error', async ({ page }) => {
    console.log('🔍 Attempting to reproduce "Failed to initialize user settings" error...\n');
    
    // Capture ALL console messages and errors
    const allMessages: { type: string, text: string, location?: string }[] = [];
    
    page.on('console', msg => {
      allMessages.push({ type: msg.type(), text: msg.text() });
      
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
        
        // Check if this is the settings error we're looking for
        if (msg.text().includes('Failed to initialize user settings')) {
          console.log('🎯 FOUND THE ERROR!');
          console.log('Error details:', msg.text());
        }
      } else if (msg.text().includes('settings')) {
        console.log(`📝 Settings-related log: [${msg.type()}] ${msg.text()}`);
      }
    });

    // Capture page errors with stack traces
    page.on('pageerror', error => {
      allMessages.push({ 
        type: 'pageerror', 
        text: error.message,
        location: error.stack 
      });
      console.log(`❌ Page Error: ${error.message}`);
      console.log(`Stack trace: ${error.stack}`);
    });

    try {
      // Step 1: Navigate to sign-in
      console.log('📍 Step 1: Going to sign-in page...');
      await page.goto('/sign-in');
      await page.waitForTimeout(3000);
      
      // Check if we have sign-in form elements
      const hasEmailField = await page.locator('input[name="identifier"]').count() > 0;
      const hasPasswordField = await page.locator('input[name="password"]').count() > 0;
      const hasContinueButton = await page.locator('button:has-text("Continue")').count() > 0;
      
      console.log(`Email field available: ${hasEmailField}`);
      console.log(`Password field available: ${hasPasswordField}`);
      console.log(`Continue button available: ${hasContinueButton}`);
      
      if (!hasEmailField || !hasPasswordField || !hasContinueButton) {
        console.log('⚠️ Sign-in form not ready, cannot proceed with test');
        return;
      }

      // Step 2: Attempt to sign in
      console.log('\n📍 Step 2: Attempting to sign in...');
      await page.fill('input[name="identifier"]', 'hello@atunbi.net');
      await page.fill('input[name="password"]', 'Teniola=1');
      await page.click('button:has-text("Continue")');
      
      // Wait for potential redirect
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`Current URL after sign-in attempt: ${currentUrl}`);
      
      // Step 3: If we get to onboarding, try to complete it
      if (currentUrl.includes('/onboarding')) {
        console.log('\n📍 Step 3: Completing onboarding to trigger settings error...');
        
        // Fill out the form quickly
        await page.waitForSelector('input[placeholder*="Enter your full name"]', { timeout: 10000 });
        await page.fill('input[placeholder*="Enter your full name"]', 'Test User');
        await page.click('button:has-text("Next Step")');
        
        // Step 2
        await page.waitForSelector('text=Step 2 of 4', { timeout: 5000 });
        await page.selectOption('select', 'modern');
        await page.click('button:has-text("Next Step")');
        
        // Step 3
        await page.waitForSelector('text=Step 3 of 4', { timeout: 5000 });
        await page.click('button:has-text("Next Step")');
        
        // Step 4
        await page.waitForSelector('text=Step 4 of 4', { timeout: 5000 });
        await page.fill('input[placeholder="100"]', '150');
        await page.fill('input[placeholder="50,000"]', '75000');
        
        // This is where the error should occur
        console.log('\n📍 Step 4: Clicking "Complete Setup" - this should trigger the error...');
        await page.click('button:has-text("Complete Setup")');
        
        // Wait for either success or error
        await page.waitForTimeout(10000);
        
        const finalUrl = page.url();
        console.log(`Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ Successfully reached dashboard - no error occurred');
        } else {
          console.log('⚠️ Did not reach dashboard - error may have occurred');
        }
        
      } else if (currentUrl.includes('google.com')) {
        console.log('🔄 Redirected to Google OAuth - cannot complete automated test');
      } else {
        console.log('⚠️ Unexpected URL after sign-in attempt');
      }

      // Step 5: Analyze all captured messages
      console.log('\n' + '='.repeat(60));
      console.log('📋 ALL CAPTURED MESSAGES:');
      console.log('='.repeat(60));
      
      const settingsErrors = allMessages.filter(msg => 
        msg.text.includes('Failed to initialize user settings') ||
        msg.text.includes('settings') && msg.type === 'error'
      );
      
      const relevantMessages = allMessages.filter(msg =>
        msg.text.includes('settings') ||
        msg.text.includes('initialize') ||
        msg.text.includes('couple') ||
        msg.text.includes('handleFinalSubmit')
      );
      
      console.log(`\nSettings-related errors: ${settingsErrors.length}`);
      settingsErrors.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
        if (msg.location) {
          console.log(`   Stack: ${msg.location}`);
        }
      });
      
      console.log(`\nRelevant messages: ${relevantMessages.length}`);
      relevantMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      });
      
      if (settingsErrors.length > 0) {
        console.log('\n🎯 ERROR REPRODUCED SUCCESSFULLY!');
      } else {
        console.log('\n🤔 Error not reproduced - may need different conditions');
      }

    } catch (error) {
      console.log(`❌ Test failed: ${error}`);
      
      console.log('\n📋 Messages captured before test failed:');
      allMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      });
      
      throw error;
    }
  });
});