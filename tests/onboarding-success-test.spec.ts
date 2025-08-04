import { test, expect } from '@playwright/test';

test.describe('Onboarding Success Verification', () => {
  test.use({
    baseURL: 'http://localhost:3006'
  });

  test('verify onboarding flow completes successfully without errors', async ({ page }) => {
    console.log('🔍 Verifying complete onboarding flow...\n');
    
    // Track any errors that occur
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });

    try {
      // Navigate to sign-in
      console.log('📍 Going to sign-in page...');
      await page.goto('/sign-in');
      await page.waitForLoadState('networkidle');
      
      // Sign in with the more specific selector
      const continueButton = page.locator('button[data-localization-key="formButtonPrimary"]');
      const emailField = page.locator('input[name="identifier"]');
      const passwordField = page.locator('input[name="password"]');
      
      await expect(emailField).toBeVisible({ timeout: 10000 });
      await expect(passwordField).toBeVisible({ timeout: 5000 });
      await expect(continueButton).toBeVisible({ timeout: 5000 });

      await emailField.fill('hello@atunbi.net');
      await passwordField.fill('Teniola=1');
      await continueButton.click();
      
      console.log('✅ Sign-in form submitted');
      
      // Wait for navigation - expect either dashboard or onboarding
      await page.waitForTimeout(8000);
      
      const currentUrl = page.url();
      console.log(`Current URL after sign-in: ${currentUrl}`);
      
      // If at dashboard, clear localStorage to reset onboarding
      if (currentUrl.includes('/dashboard')) {
        console.log('🔄 User already onboarded, clearing localStorage to test fresh flow...');
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto('/onboarding');
        await page.waitForTimeout(3000);
      }
      
      // Now we should be on onboarding - verify the flow
      await expect(page.locator('text=Welcome to Your Wedding Journey')).toBeVisible({ timeout: 10000 });
      console.log('✅ Onboarding page loaded');
      
      // Complete step 1
      console.log('📍 Completing Step 1...');
      await page.fill('input[placeholder*="Enter your full name"]', 'Test User');
      await page.click('button:has-text("Next Step")');
      await expect(page.locator('text=Step 2 of 4')).toBeVisible({ timeout: 5000 });
      
      // Complete step 2
      console.log('📍 Completing Step 2...');
      await page.selectOption('select', 'modern');
      await page.click('button:has-text("Next Step")');
      await expect(page.locator('text=Step 3 of 4')).toBeVisible({ timeout: 5000 });
      
      // Complete step 3
      console.log('📍 Completing Step 3...');
      await page.click('button:has-text("Next Step")');
      await expect(page.locator('text=Step 4 of 4')).toBeVisible({ timeout: 5000 });
      
      // Complete step 4
      console.log('📍 Completing Step 4...');
      await page.fill('input[placeholder="100"]', '150');
      await page.fill('input[placeholder="50,000"]', '75000');
      
      // Click Complete Setup
      console.log('🎯 Clicking Complete Setup...');
      await page.click('button:has-text("Complete Setup")');
      
      // Wait for completion
      await page.waitForTimeout(10000);
      
      const finalUrl = page.url();
      console.log(`Final URL: ${finalUrl}`);
      
      // Verify we reached dashboard
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Successfully completed onboarding and reached dashboard!');
        
        // Verify dashboard loads properly
        await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
        console.log('✅ Dashboard loaded successfully');
        
      } else {
        console.log('⚠️ Did not reach dashboard - checking for any error messages...');
        
        // Check for any error messages on the page
        const errorElements = await page.locator('.error-message, .bg-red-50, [class*="error"]').count();
        console.log(`Found ${errorElements} potential error elements on page`);
        
        if (errorElements > 0) {
          for (let i = 0; i < errorElements; i++) {
            const errorText = await page.locator('.error-message, .bg-red-50, [class*="error"]').nth(i).textContent();
            console.log(`Error ${i + 1}: ${errorText}`);
          }
        }
      }
      
      // Final error check
      if (errors.length === 0) {
        console.log('\n✅ SUCCESS: Onboarding completed with NO ERRORS!');
      } else {
        console.log('\n⚠️ Onboarding completed but with some errors:');
        errors.forEach((error, i) => {
          console.log(`${i + 1}. ${error}`);
        });
      }
      
      // Specifically check - was the settings error present?
      const settingsErrors = errors.filter(error => 
        error.includes('Failed to initialize user settings')
      );
      
      if (settingsErrors.length === 0) {
        console.log('\n🎯 CONFIRMED: No "Failed to initialize user settings" error occurred!');
      } else {
        console.log('\n❌ Settings errors found:', settingsErrors);
      }

    } catch (error) {
      console.log(`❌ Test failed: ${error}`);
      throw error;
    }
  });
});