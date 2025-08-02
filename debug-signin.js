const { chromium } = require('playwright');

async function debugSignIn() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`🖥️  Browser Console [${msg.type()}]:`, msg.text());
  });
  
  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('supabase')) {
      console.log(`📡 Request: ${request.method()} ${request.url()}`);
    }
  });
  
  // Listen for network responses
  page.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('supabase')) {
      console.log(`📨 Response: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🔍 Starting sign-in debug...');
    
    // Navigate to sign-in page
    console.log('📍 Navigating to sign-in page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-signin-page.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-signin-page.png');
    
    // Check if we're actually on the sign-in page
    const currentUrl = page.url();
    console.log(`📄 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/auth/signin')) {
      console.log('❌ Not on sign-in page, checking where we ended up...');
      const pageTitle = await page.title();
      console.log(`📋 Page title: ${pageTitle}`);
      
      // Check if we're redirected somewhere else
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Already logged in! Redirected to dashboard');
        return;
      }
    }
    
    // Look for form elements
    console.log('🔍 Looking for form elements...');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")');
    
    const emailVisible = await emailInput.isVisible();
    const passwordVisible = await passwordInput.isVisible();
    const buttonVisible = await submitButton.isVisible();
    
    console.log(`📧 Email input visible: ${emailVisible}`);
    console.log(`🔒 Password input visible: ${passwordVisible}`);
    console.log(`🔘 Submit button visible: ${buttonVisible}`);
    
    if (!emailVisible || !passwordVisible || !buttonVisible) {
      console.log('❌ Form elements not found, checking page content...');
      const bodyText = await page.locator('body').textContent();
      console.log('📝 Page contains "sign" or "login":', bodyText.toLowerCase().includes('sign') || bodyText.toLowerCase().includes('login'));
      
      // Check for any error messages
      const errorElements = await page.locator('.error, [role="alert"], .text-red-500').all();
      if (errorElements.length > 0) {
        console.log('⚠️  Found error elements:');
        for (let i = 0; i < errorElements.length; i++) {
          const errorText = await errorElements[i].textContent();
          console.log(`   Error ${i + 1}: ${errorText}`);
        }
      }
      
      return;
    }
    
    // Fill the form
    console.log('📝 Filling sign-in form...');
    await emailInput.fill('hello@atunbi.net');
    await passwordInput.fill('Teniola=1');
    
    // Take screenshot after filling
    await page.screenshot({ path: 'debug-form-filled.png', fullPage: true });
    console.log('📸 Form filled screenshot: debug-form-filled.png');
    
    // Submit the form
    console.log('🔘 Submitting form...');
    await submitButton.click();
    
    // Wait for response
    console.log('⏳ Waiting for authentication response...');
    await page.waitForTimeout(5000);
    
    // Check what happened
    const newUrl = page.url();
    console.log(`📄 URL after submit: ${newUrl}`);
    
    // Take screenshot after submit
    await page.screenshot({ path: 'debug-after-submit.png', fullPage: true });
    console.log('📸 After submit screenshot: debug-after-submit.png');
    
    if (newUrl.includes('/dashboard')) {
      console.log('✅ Successfully signed in! Redirected to dashboard');
    } else if (newUrl.includes('/auth/signin')) {
      console.log('❌ Still on sign-in page, checking for errors...');
      
      // Look for error messages
      const errorElements = await page.locator('.error, [role="alert"], .text-red-500, .text-red-600, .bg-red-50').all();
      if (errorElements.length > 0) {
        console.log('⚠️  Error messages found:');
        for (let i = 0; i < errorElements.length; i++) {
          const errorText = await errorElements[i].textContent();
          if (errorText && errorText.trim()) {
            console.log(`   Error ${i + 1}: ${errorText.trim()}`);
          }
        }
      } else {
        console.log('🤔 No visible error messages found');
      }
      
      // Check if form is still there or if it changed
      const emailStillVisible = await emailInput.isVisible();
      const passwordStillVisible = await passwordInput.isVisible();
      console.log(`📧 Email input still visible: ${emailStillVisible}`);
      console.log(`🔒 Password input still visible: ${passwordStillVisible}`);
      
      // Check current values
      if (emailStillVisible) {
        const emailValue = await emailInput.inputValue();
        console.log(`📧 Email field value: "${emailValue}"`);
      }
      
    } else {
      console.log(`🤔 Redirected to unexpected URL: ${newUrl}`);
    }
    
    // Keep browser open for manual inspection
    console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugSignIn();