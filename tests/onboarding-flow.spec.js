const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Wedding Planner - Signin and Onboarding Flow', () => {
  test('should complete full signin and onboarding flow', async ({ page }) => {
    // Set up console logging to capture any JavaScript errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    // Step 1: Navigate to onboarding and expect redirect to signin
    console.log('Step 1: Navigating to /onboarding');
    await page.goto('http://localhost:3000/onboarding');
    
    // Wait a bit to see if redirect happens
    await page.waitForTimeout(2000);
    
    // Take screenshot of current page
    await page.screenshot({ 
      path: 'test-results/01-initial-navigation.png',
      fullPage: true 
    });
    
    // Check if we're redirected to signin page
    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    // Look for signin form elements or signin-related content
    const hasSigninForm = await page.locator('form').count() > 0;
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').count() > 0;
    
    console.log(`Has signin form: ${hasSigninForm}`);
    console.log(`Has email input: ${hasEmailInput}`);
    console.log(`Has password input: ${hasPasswordInput}`);
    
    if (!hasSigninForm || !hasEmailInput || !hasPasswordInput) {
      console.log('⚠️  Signin form not detected. Checking page content...');
      const pageContent = await page.textContent('body');
      console.log('Page content preview:', pageContent.substring(0, 500));
    }

    // Step 2: Fill out signin form
    console.log('Step 2: Attempting to fill signin form');
    
    try {
      // Try different selectors for email field
      const emailInput = page.locator('input[type="email"]').or(
        page.locator('input[name="email"]')
      ).or(
        page.locator('input[placeholder*="email" i]')
      ).first();
      
      await emailInput.waitFor({ timeout: 5000 });
      await emailInput.fill('hello@atunbi.net');
      console.log('✅ Email field filled');
      
      // Try different selectors for password field
      const passwordInput = page.locator('input[type="password"]').or(
        page.locator('input[name="password"]')
      ).first();
      
      await passwordInput.waitFor({ timeout: 5000 });
      await passwordInput.fill('Teniola=1');
      console.log('✅ Password field filled');
      
      await page.screenshot({ 
        path: 'test-results/02-signin-form-filled.png',
        fullPage: true 
      });
      
      // Find and click submit button
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('button:has-text("Sign")')
      ).or(
        page.locator('button:has-text("Login")')
      ).first();
      
      await submitButton.waitFor({ timeout: 5000 });
      await submitButton.click();
      console.log('✅ Submit button clicked');
      
    } catch (error) {
      console.log(`❌ Error filling signin form: ${error.message}`);
      await page.screenshot({ 
        path: 'test-results/02-signin-error.png',
        fullPage: true 
      });
    }

    // Step 3: Wait for redirect back to onboarding
    console.log('Step 3: Waiting for redirect to onboarding');
    
    // Wait for navigation or URL change
    await page.waitForTimeout(3000);
    
    const postSigninUrl = page.url();
    console.log(`URL after signin: ${postSigninUrl}`);
    
    await page.screenshot({ 
      path: 'test-results/03-post-signin.png',
      fullPage: true 
    });
    
    // Check if we're on onboarding page or if there are loading issues
    const isOnOnboarding = postSigninUrl.includes('/onboarding');
    console.log(`Is on onboarding page: ${isOnOnboarding}`);
    
    // Look for loading indicators or infinite loading
    const hasLoadingSpinner = await page.locator('[class*="loading"], [class*="spinner"], .animate-spin').count() > 0;
    console.log(`Has loading spinner: ${hasLoadingSpinner}`);
    
    if (hasLoadingSpinner) {
      console.log('⚠️  Loading spinner detected. Waiting longer...');
      await page.waitForTimeout(5000);
      
      const stillLoading = await page.locator('[class*="loading"], [class*="spinner"], .animate-spin').count() > 0;
      if (stillLoading) {
        console.log('❌ Page appears to be stuck in loading state');
        await page.screenshot({ 
          path: 'test-results/03-infinite-loading.png',
          fullPage: true 
        });
      }
    }

    // Step 4: Check onboarding form and fill Step 1 (Partner names)
    console.log('Step 4: Looking for onboarding form - Step 1 (Partner names)');
    
    try {
      // Look for name input fields
      const yourNameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
      const partnerNameInput = page.locator('input[name*="partner"], input[placeholder*="partner" i]').or(
        page.locator('input[name*="name"]').nth(1)
      );
      
      // Wait for form to be ready
      await page.waitForTimeout(2000);
      
      if (await yourNameInput.count() > 0) {
        await yourNameInput.fill('Test User');
        console.log('✅ Your name filled');
      }
      
      if (await partnerNameInput.count() > 0) {
        await partnerNameInput.fill('Test Partner');
        console.log('✅ Partner name filled');
      }
      
      await page.screenshot({ 
        path: 'test-results/04-step1-names.png',
        fullPage: true 
      });
      
      // Look for Next button and click it
      const nextButton = page.locator('button:has-text("Next")').or(
        page.locator('button[type="submit"]')
      ).first();
      
      if (await nextButton.count() > 0) {
        await nextButton.click();
        console.log('✅ Step 1 Next button clicked');
        await page.waitForTimeout(1000);
      }
      
    } catch (error) {
      console.log(`❌ Error in Step 1: ${error.message}`);
      await page.screenshot({ 
        path: 'test-results/04-step1-error.png',
        fullPage: true 
      });
    }

    // Step 5: Fill Step 2 (Wedding details)
    console.log('Step 5: Step 2 - Wedding details');
    
    try {
      await page.waitForTimeout(1000);
      
      // Look for date input
      const dateInput = page.locator('input[type="date"], input[name*="date"]').first();
      if (await dateInput.count() > 0) {
        // Set a future date (6 months from now)
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        const dateString = futureDate.toISOString().split('T')[0];
        
        await dateInput.fill(dateString);
        console.log(`✅ Wedding date set to: ${dateString}`);
      }
      
      // Look for wedding style selection
      const styleSelect = page.locator('select[name*="style"], select[name*="theme"]').first();
      const styleModernOption = page.locator('option:has-text("modern"), option[value="modern"]').first();
      const styleRadio = page.locator('input[type="radio"][value="modern"]').first();
      
      if (await styleSelect.count() > 0) {
        await styleSelect.selectOption('modern');
        console.log('✅ Wedding style selected (dropdown)');
      } else if (await styleRadio.count() > 0) {
        await styleRadio.click();
        console.log('✅ Wedding style selected (radio)');
      } else if (await styleModernOption.count() > 0) {
        await styleModernOption.click();
        console.log('✅ Wedding style selected (option)');
      }
      
      await page.screenshot({ 
        path: 'test-results/05-step2-wedding-details.png',
        fullPage: true 
      });
      
      // Click Next
      const nextButton = page.locator('button:has-text("Next")').first();
      if (await nextButton.count() > 0) {
        await nextButton.click();
        console.log('✅ Step 2 Next button clicked');
        await page.waitForTimeout(1000);
      }
      
    } catch (error) {
      console.log(`❌ Error in Step 2: ${error.message}`);
      await page.screenshot({ 
        path: 'test-results/05-step2-error.png',
        fullPage: true 
      });
    }

    // Step 6: Step 3 (Venue info - optional, skip)
    console.log('Step 6: Step 3 - Venue info (skipping)');
    
    try {
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'test-results/06-step3-venue.png',
        fullPage: true 
      });
      
      // Look for Skip or Next button
      const skipButton = page.locator('button:has-text("Skip")').first();
      const nextButton = page.locator('button:has-text("Next")').first();
      
      if (await skipButton.count() > 0) {
        await skipButton.click();
        console.log('✅ Step 3 Skip button clicked');
      } else if (await nextButton.count() > 0) {
        await nextButton.click();
        console.log('✅ Step 3 Next button clicked');
      }
      
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.log(`❌ Error in Step 3: ${error.message}`);
    }

    // Step 7: Step 4 (Planning details)
    console.log('Step 7: Step 4 - Planning details');
    
    try {
      await page.waitForTimeout(1000);
      
      // Guest count
      const guestCountInput = page.locator('input[name*="guest"], input[placeholder*="guest" i]').first();
      if (await guestCountInput.count() > 0) {
        await guestCountInput.fill('100');
        console.log('✅ Guest count filled');
      }
      
      // Budget
      const budgetInput = page.locator('input[name*="budget"], input[placeholder*="budget" i]').first();
      if (await budgetInput.count() > 0) {
        await budgetInput.fill('50000');
        console.log('✅ Budget filled');
      }
      
      await page.screenshot({ 
        path: 'test-results/07-step4-planning.png',
        fullPage: true 
      });
      
      // Final submit
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Complete"), button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        console.log('✅ Final submit button clicked');
        await page.waitForTimeout(3000);
      }
      
    } catch (error) {
      console.log(`❌ Error in Step 4: ${error.message}`);
      await page.screenshot({ 
        path: 'test-results/07-step4-error.png',
        fullPage: true 
      });
    }

    // Step 8: Check final redirect to dashboard
    console.log('Step 8: Checking final redirect to dashboard');
    
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    
    const isOnDashboard = finalUrl.includes('/dashboard') || finalUrl.includes('/app');
    console.log(`Is on dashboard: ${isOnDashboard}`);
    
    await page.screenshot({ 
      path: 'test-results/08-final-result.png',
      fullPage: true 
    });

    // Summary Report
    console.log('\n=== TEST SUMMARY ===');
    console.log(`1. Initial redirect from /onboarding: ${currentUrl.includes('signin') || currentUrl.includes('auth') ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`2. Signin form detection: ${hasSigninForm && hasEmailInput && hasPasswordInput ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`3. Post-signin redirect: ${isOnOnboarding ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`4. Final dashboard redirect: ${isOnDashboard ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`5. JavaScript errors: ${errors.length === 0 ? '✅ NO ERRORS' : `❌ ${errors.length} ERRORS`}`);
    
    if (errors.length > 0) {
      console.log('\n=== JAVASCRIPT ERRORS ===');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.slice(-10).forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
    
    // Create detailed report file
    const report = {
      timestamp: new Date().toISOString(),
      urls: {
        initial: 'http://localhost:3000/onboarding',
        afterInitialNav: currentUrl,
        postSignin: postSigninUrl,
        final: finalUrl
      },
      checks: {
        initialRedirect: currentUrl.includes('signin') || currentUrl.includes('auth'),
        signinFormDetected: hasSigninForm && hasEmailInput && hasPasswordInput,
        postSigninRedirect: isOnOnboarding,
        finalDashboardRedirect: isOnDashboard,
        hasLoadingIssues: hasLoadingSpinner,
        javascriptErrors: errors
      },
      consoleMessages: consoleMessages,
      screenshots: [
        '01-initial-navigation.png',
        '02-signin-form-filled.png',
        '03-post-signin.png',
        '04-step1-names.png',
        '05-step2-wedding-details.png',
        '06-step3-venue.png',
        '07-step4-planning.png',
        '08-final-result.png'
      ]
    };
    
    // Basic assertions for Playwright
    expect(errors.length).toBe(0);
    expect(isOnDashboard).toBe(true);
  });
});