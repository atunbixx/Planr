const { chromium } = require('playwright');

async function detailedAuthDebug() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(logEntry);
    console.log(`🖥️  ${logEntry}`);
  });
  
  // Capture network requests
  const networkLogs = [];
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth') || request.url().includes('dashboard')) {
      const logEntry = `REQUEST: ${request.method()} ${request.url()}`;
      networkLogs.push(logEntry);
      console.log(`📡 ${logEntry}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase') || response.url().includes('auth') || response.url().includes('dashboard')) {
      const logEntry = `RESPONSE: ${response.status()} ${response.url()}`;
      networkLogs.push(logEntry);
      console.log(`📨 ${logEntry}`);
    }
  });
  
  try {
    console.log('🔍 Starting detailed authentication debug...');
    
    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('📝 Filling and submitting form...');
    await page.locator('input[type="email"]').fill('hello@atunbi.net');
    await page.locator('input[type="password"]').fill('Teniola=1');
    
    // Click submit and wait for auth state changes
    await page.locator('button[type="submit"]').click();
    
    console.log('⏳ Waiting for authentication to complete...');
    
    // Wait for either redirect to dashboard or error message
    try {
      // Wait for either dashboard redirect or error
      await Promise.race([
        page.waitForURL('**/dashboard**', { timeout: 10000 }),
        page.waitForSelector('.bg-red-50', { timeout: 10000 })
      ]);
    } catch (e) {
      console.log('⏰ Timeout waiting for redirect or error');
    }
    
    const finalUrl = page.url();
    console.log(`📄 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS! Redirected to dashboard');
    } else {
      console.log('❌ Still on sign-in page');
      
      // Look for error messages
      const errorElement = page.locator('.bg-red-50');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`🚨 Error message: "${errorText}"`);
      }
      
      // Check if form was cleared (indicates some processing happened)
      const emailValue = await page.locator('input[type="email"]').inputValue();
      const passwordValue = await page.locator('input[type="password"]').inputValue();
      console.log(`📧 Email field value: "${emailValue}"`);
      console.log(`🔒 Password field value: "${passwordValue}"`);
      
      if (!emailValue && !passwordValue) {
        console.log('💡 Form was cleared - authentication was attempted but failed');
      }
    }
    
    // Wait a bit more to capture any delayed console messages
    await page.waitForTimeout(3000);
    
    console.log('\n📋 SUMMARY:');
    console.log('Console logs:');
    consoleLogs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    
    console.log('\nNetwork logs:');
    networkLogs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    
    await page.screenshot({ path: 'detailed-debug-final.png', fullPage: true });
    console.log('\n📸 Final screenshot: detailed-debug-final.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

detailedAuthDebug();