import { test, expect } from '@playwright/test';

test.describe('Complete Onboarding Error Trace', () => {
  test.use({
    baseURL: 'http://localhost:3006'
  });

  test('complete onboarding flow with full error tracing', async ({ page }) => {
    console.log('🔍 Starting complete onboarding flow with comprehensive error tracing...\n');
    
    // Capture ALL messages with stack traces
    const allMessages: { type: string, text: string, location?: string, args?: any[] }[] = [];
    let settingsErrorFound = false;
    
    page.on('console', msg => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        args: msg.args().map(arg => arg.toString())
      };
      allMessages.push(message);
      
      // Log all console messages for debugging
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      
      // Check for the exact error we're looking for
      if (msg.text().includes('Failed to initialize user settings')) {
        settingsErrorFound = true;
        console.log('🎯 FOUND THE SETTINGS ERROR!');
        console.log('Full message:', msg.text());
        console.log('Args:', msg.args().map(arg => arg.toString()));
      }
      
      // Also look for any settings-related errors
      if ((msg.type() === 'error' || msg.type() === 'warn') && 
          (msg.text().includes('settings') || msg.text().includes('initialize'))) {
        console.log('⚠️ Settings-related error/warning found:', msg.text());
      }
    });

    // Capture page errors with full details
    page.on('pageerror', error => {
      allMessages.push({ 
        type: 'pageerror', 
        text: error.message,
        location: error.stack 
      });
      console.log(`❌ Page Error: ${error.message}`);
      if (error.stack) {
        console.log(`Stack trace: ${error.stack}`);
      }
    });

    // Capture network failures
    page.on('requestfinished', request => {
      const response = request.response();
      if (response && response.status >= 400) {
        console.log(`🌐 Network Error: ${request.method()} ${request.url()} - ${response.status}`);
      }
    });

    try {
      // Step 1: Navigate to home page first
      console.log('📍 Step 1: Going to home page...');
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Step 2: Navigate to sign-in
      console.log('📍 Step 2: Going to sign-in page...');
      await page.goto('/sign-in');
      await page.waitForTimeout(3000);
      
      // Check for Clerk sign-in form
      const emailField = page.locator('input[name="identifier"]');
      const passwordField = page.locator('input[name="password"]');
      const continueButton = page.locator('button:has-text("Continue")');
      
      await expect(emailField).toBeVisible({ timeout: 10000 });
      console.log('✅ Email field found');
      
      await expect(passwordField).toBeVisible({ timeout: 5000 });
      console.log('✅ Password field found');
      
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Continue button found');

      // Step 3: Sign in
      console.log('\n📍 Step 3: Signing in...');
      await emailField.fill('hello@atunbi.net');
      await passwordField.fill('Teniola=1');
      await continueButton.click();
      console.log('Sign-in form submitted');
      
      // Wait for navigation - could be to dashboard or onboarding
      await page.waitForTimeout(8000);
      
      const currentUrl = page.url();
      console.log(`Current URL after sign-in: ${currentUrl}`);
      
      // If we're already at dashboard, user has completed onboarding
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ User already completed onboarding, going to onboarding page directly...');
        await page.goto('/onboarding');
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ Redirected back to dashboard - onboarding is complete');
          console.log('🔄 Clearing localStorage to reset onboarding state...');
          
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });
          
          // Force reload and go to onboarding
          await page.reload();
          await page.goto('/onboarding');
          await page.waitForTimeout(3000);
        }
      }
      
      // Now we should be on onboarding page
      const onboardingUrl = page.url();
      console.log(`Onboarding URL: ${onboardingUrl}`);
      
      if (!onboardingUrl.includes('/onboarding')) {
        throw new Error(`Expected to be on onboarding page, but on: ${onboardingUrl}`);
      }

      // Step 4: Complete onboarding step by step
      console.log('\n📍 Step 4: Completing onboarding...');
      
      // Step 1 - About You
      console.log('Filling Step 1 - About You...');
      const nameField = page.locator('input[placeholder*="Enter your full name"]');
      await expect(nameField).toBeVisible({ timeout: 10000 });
      await nameField.fill('Test User');
      
      const partnerField = page.locator('input[placeholder*="Enter partner"]');
      if (await partnerField.isVisible()) {
        await partnerField.fill('Test Partner');
      }
      
      await page.click('button:has-text("Next Step")');
      await page.waitForTimeout(2000);
      
      // Step 2 - Wedding Details
      console.log('Filling Step 2 - Wedding Details...');
      await expect(page.locator('text=Step 2 of 4')).toBeVisible({ timeout: 5000 });
      
      const styleSelect = page.locator('select');
      if (await styleSelect.isVisible()) {
        await styleSelect.selectOption('modern');
      }
      
      await page.click('button:has-text("Next Step")');
      await page.waitForTimeout(2000);
      
      // Step 3 - Venue Information
      console.log('Filling Step 3 - Venue Information...');
      await expect(page.locator('text=Step 3 of 4')).toBeVisible({ timeout: 5000 });
      
      const venueField = page.locator('input[placeholder*="Grand Ballroom"]');
      if (await venueField.isVisible()) {
        await venueField.fill('Test Venue');
      }
      
      const locationField = page.locator('input[placeholder*="San Francisco"]');
      if (await locationField.isVisible()) {
        await locationField.fill('Test City, ST');
      }
      
      await page.click('button:has-text("Next Step")');
      await page.waitForTimeout(2000);
      
      // Step 4 - Planning Details
      console.log('Filling Step 4 - Planning Details...');
      await expect(page.locator('text=Step 4 of 4')).toBeVisible({ timeout: 5000 });
      
      const guestField = page.locator('input[placeholder="100"]');
      if (await guestField.isVisible()) {
        await guestField.clear();
        await guestField.fill('150');
      }
      
      const budgetField = page.locator('input[placeholder="50,000"]');
      if (await budgetField.isVisible()) {
        await budgetField.clear();
        await budgetField.fill('75000');
      }
      
      // This is the critical moment - clicking Complete Setup
      console.log('\n🎯 CRITICAL MOMENT: Clicking "Complete Setup" button...');
      console.log('📋 Messages captured so far:', allMessages.length);
      
      const completeButton = page.locator('button:has-text("Complete Setup")');
      await expect(completeButton).toBeVisible({ timeout: 5000 });
      await completeButton.click();
      
      console.log('✅ Complete Setup button clicked, waiting for processing...');
      
      // Wait longer for the processing to complete
      await page.waitForTimeout(15000);
      
      const finalUrl = page.url();
      console.log(`Final URL after completion: ${finalUrl}`);
      
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Successfully completed onboarding and reached dashboard!');
      } else {
        console.log('⚠️ Did not reach dashboard after completing onboarding');
        console.log('Current page content:');
        const bodyText = await page.locator('body').textContent();
        console.log(bodyText?.substring(0, 500) + '...');
      }

    } catch (error) {
      console.log(`❌ Test execution error: ${error}`);
    }

    // Final analysis of all captured messages
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE MESSAGE ANALYSIS');
    console.log('='.repeat(80));
    
    console.log(`\nTotal messages captured: ${allMessages.length}`);
    
    // Filter for exact error
    const exactErrors = allMessages.filter(msg => 
      msg.text.includes('Failed to initialize user settings')
    );
    
    // Filter for settings-related messages
    const settingsMessages = allMessages.filter(msg =>
      msg.text.toLowerCase().includes('settings') ||
      msg.text.toLowerCase().includes('initialize')
    );
    
    // Filter for error messages
    const errorMessages = allMessages.filter(msg => 
      msg.type === 'error' || msg.type === 'pageerror'
    );
    
    console.log(`\n🎯 EXACT "Failed to initialize user settings" errors: ${exactErrors.length}`);
    exactErrors.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      if (msg.location) {
        console.log(`   Stack: ${msg.location}`);
      }
      if (msg.args && msg.args.length > 0) {
        console.log(`   Args: ${msg.args.join(', ')}`);
      }
    });
    
    console.log(`\n⚙️ Settings-related messages: ${settingsMessages.length}`);
    settingsMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    });
    
    console.log(`\n❌ Error messages: ${errorMessages.length}`);
    errorMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      if (msg.location) {
        console.log(`   Stack: ${msg.location}`);
      }
    });
    
    // Final verdict
    if (settingsErrorFound) {
      console.log('\n🎯 SUCCESS: "Failed to initialize user settings" error WAS reproduced!');
    } else {
      console.log('\n🤔 The specific "Failed to initialize user settings" error was NOT reproduced');
      console.log('This suggests either:');
      console.log('1. The error was already fixed');
      console.log('2. The error occurs under different conditions');
      console.log('3. The error message format has changed');
    }
  });
});