const { chromium } = require('playwright');

async function formSubmissionDebug() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`🖥️  [${msg.type()}] ${msg.text()}`);
  });
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('supabase') || request.method() === 'POST') {
      console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase') || response.request().method() === 'POST') {
      console.log(`📨 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🔍 Form submission debug test...');
    
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Filling form...');
    await page.locator('input[type="email"]').fill('hello@atunbi.net');
    await page.locator('input[type="password"]').fill('Teniola=1');
    
    console.log('\n🔘 Clicking submit button...');
    
    // Monitor form submission
    const submitButton = page.locator('button[type="submit"]');
    const isButtonVisible = await submitButton.isVisible();
    const isButtonEnabled = await submitButton.isEnabled();
    
    console.log('Submit button visible:', isButtonVisible);
    console.log('Submit button enabled:', isButtonEnabled);
    
    if (isButtonVisible && isButtonEnabled) {
      // Click and wait for any network activity
      await submitButton.click();
      console.log('✅ Submit button clicked');
      
      // Wait for any authentication-related network requests
      await page.waitForTimeout(5000);
      
      // Check if form was cleared (indicates processing)
      const emailValue = await page.locator('input[type="email"]').inputValue();
      const passwordValue = await page.locator('input[type="password"]').inputValue();
      
      console.log('Email field after submit:', emailValue);
      console.log('Password field after submit:', passwordValue);
      
      if (!emailValue && !passwordValue) {
        console.log('✅ Form was cleared - indicates processing occurred');
      } else {
        console.log('❌ Form was not cleared - may indicate no processing');
      }
      
      // Check for loading state
      const loadingButton = page.locator('button:has-text("Signing In")');
      const isLoading = await loadingButton.isVisible();
      console.log('Loading state visible:', isLoading);
      
      // Check for error messages
      const errorElement = page.locator('.bg-red-50');
      const hasError = await errorElement.isVisible();
      if (hasError) {
        const errorText = await errorElement.textContent();
        console.log('Error message:', errorText);
      } else {
        console.log('No error message visible');
      }
      
    } else {
      console.log('❌ Submit button not clickable');
    }
    
    console.log('\nFinal URL:', page.url());
    
    await page.screenshot({ path: 'form-submission-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: form-submission-debug.png');
    
    // Keep browser open
    console.log('\n🔍 Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

formSubmissionDebug();