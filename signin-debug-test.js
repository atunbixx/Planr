const { chromium } = require('playwright');

async function debugSignInTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Debugging Sign-In Process...');
    
    // Navigate directly to sign-in page
    console.log('📍 Navigating to http://localhost:4000/auth/signin');
    await page.goto('http://localhost:4000/auth/signin', { waitUntil: 'networkidle' });
    
    await page.screenshot({ path: 'signin-page.png', fullPage: true });
    console.log('📸 Screenshot taken: signin-page.png');
    
    // Examine the sign-in form
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In")');
    
    console.log(`📧 Email input visible: ${await emailInput.isVisible()}`);
    console.log(`🔒 Password input visible: ${await passwordInput.isVisible()}`);
    console.log(`🔘 Sign In button visible: ${await signInButton.isVisible()}`);
    
    // Fill the form
    console.log('📝 Filling sign-in form...');
    await emailInput.fill('hello@atunbi.net');
    await passwordInput.fill('Teniola=1');
    
    await page.screenshot({ path: 'signin-filled.png', fullPage: true });
    console.log('📸 Screenshot after filling form: signin-filled.png');
    
    // Click sign in and wait for response
    console.log('🔘 Clicking Sign In button...');
    
    // Listen for network responses
    const responses = [];
    page.on('response', response => {
      responses.push(`${response.status()} ${response.url()}`);
    });
    
    await signInButton.click();
    
    // Wait and see what happens
    await page.waitForTimeout(5000);
    
    console.log(`📄 URL after sign-in attempt: ${page.url()}`);
    await page.screenshot({ path: 'after-signin-attempt.png', fullPage: true });
    
    // Check for any error messages
    const errorElements = await page.locator('.error, .alert, [role="alert"], .text-red-500, .text-red-600').all();
    if (errorElements.length > 0) {
      console.log('⚠️  Error messages found:');
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        if (errorText.trim()) {
          console.log(`   Error ${i + 1}: ${errorText.trim()}`);
        }
      }
    }
    
    // Print network responses
    console.log('\n🌐 Network responses during sign-in:');
    responses.forEach(response => console.log(`   ${response}`));
    
    // If still on sign-in page, try different credentials or check what's wrong
    if (page.url().includes('/auth/signin')) {
      console.log('🔄 Still on sign-in page, checking page content...');
      const pageText = await page.locator('body').textContent();
      
      // Look for specific error messages or hints
      if (pageText.includes('Invalid') || pageText.includes('incorrect') || pageText.includes('error')) {
        console.log('❌ Authentication appears to have failed');
      } else {
        console.log('🤔 No obvious error message, but still on sign-in page');
      }
      
      // Try to see if there's a sign-up option or different auth method
      const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create")');
      if (await signUpLink.isVisible()) {
        console.log('📝 Sign up option found - account may not exist');
      }
    } else {
      console.log('✅ Successfully navigated away from sign-in page!');
      
      // Try to go to budget page now
      await page.goto('http://localhost:4000/dashboard/budget', { waitUntil: 'networkidle' });
      console.log(`📊 Budget page URL: ${page.url()}`);
      
      if (!page.url().includes('/auth/signin')) {
        console.log('🎉 Successfully accessed budget page!');
        await page.screenshot({ path: 'budget-success.png', fullPage: true });
        
        // Quick check for budget content
        const budgetContent = await page.locator('body').textContent();
        const hasBudgetContent = budgetContent.includes('budget') || budgetContent.includes('Budget') || 
                                budgetContent.includes('category') || budgetContent.includes('expense');
        console.log(`💰 Budget page has relevant content: ${hasBudgetContent}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    await page.screenshot({ path: 'signin-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugSignInTest();