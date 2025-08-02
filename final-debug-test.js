const { chromium } = require('playwright');

async function finalDebugTest() {
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
  
  try {
    console.log('🔍 Final debug test - checking auth flow step by step...');
    
    // Step 1: Navigate to sign-in
    console.log('\n📍 Step 1: Navigate to sign-in page');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: Fill and submit form
    console.log('\n📝 Step 2: Fill and submit form');
    await page.locator('input[type="email"]').fill('hello@atunbi.net');
    await page.locator('input[type="password"]').fill('Teniola=1');
    await page.locator('button[type="submit"]').click();
    
    // Step 3: Wait for initial redirect
    console.log('\n⏳ Step 3: Wait for initial redirect to dashboard');
    try {
      await page.waitForURL('**/dashboard**', { timeout: 5000 });
      console.log('✅ Successfully redirected to dashboard');
    } catch (e) {
      console.log('❌ Failed to redirect to dashboard within 5 seconds');
      console.log('Current URL:', page.url());
    }
    
    // Step 4: Wait and see if it redirects back
    console.log('\n👀 Step 4: Monitoring for redirect back to sign-in...');
    let redirectCount = 0;
    const startTime = Date.now();
    
    while (Date.now() - startTime < 10000) { // Monitor for 10 seconds
      const currentUrl = page.url();
      
      if (currentUrl.includes('/auth/signin') && redirectCount === 0) {
        redirectCount++;
        console.log('❌ REDIRECT DETECTED! Dashboard redirected back to sign-in');
        console.log('Time elapsed:', Date.now() - startTime, 'ms');
        break;
      } else if (currentUrl.includes('/dashboard')) {
        // Still on dashboard, good
        await page.waitForTimeout(500);
      } else {
        console.log('🤔 Unexpected URL:', currentUrl);
        break;
      }
    }
    
    if (redirectCount === 0) {
      console.log('✅ No redirect detected - stayed on dashboard!');
    }
    
    // Step 5: Final state check
    console.log('\n📊 Step 5: Final state check');
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('🎉 SUCCESS! Login working correctly');
      
      // Check if dashboard content is visible
      const dashboardContent = await page.locator('h1:has-text("Wedding Planner")').isVisible();
      console.log('Dashboard header visible:', dashboardContent);
      
      const sidebarContent = await page.locator('text=Wedding Studio').isVisible();
      console.log('Sidebar content visible:', sidebarContent);
      
    } else if (finalUrl.includes('/auth/signin')) {
      console.log('❌ FAILED! Ended up back on sign-in page');
      
      // Check for error messages
      const errorVisible = await page.locator('.bg-red-50').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('.bg-red-50').textContent();
        console.log('Error message:', errorText);
      } else {
        console.log('No visible error message');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-debug-result.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: final-debug-result.png');
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Keeping browser open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'final-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

finalDebugTest();