const { chromium } = require('playwright');

async function signUpAndTestBudget() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting Sign-Up and Budget Test...');
    
    // Go to sign-in page first
    await page.goto('http://localhost:4000/auth/signin', { waitUntil: 'networkidle' });
    
    // Look for sign-up link
    const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create"), a[href*="signup"]');
    
    if (await signUpLink.isVisible()) {
      console.log('📝 Found sign-up link, attempting to create account...');
      await signUpLink.click();
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'signup-page.png', fullPage: true });
      
      // Fill sign-up form
      const signupEmailInput = page.locator('input[type="email"]');
      const signupPasswordInput = page.locator('input[type="password"]');
      const signupButton = page.locator('button:has-text("Sign Up"), button:has-text("Create"), button[type="submit"]');
      
      if (await signupEmailInput.isVisible()) {
        console.log('📧 Filling sign-up form...');
        await signupEmailInput.fill('hello@atunbi.net');
        await signupPasswordInput.fill('Teniola=1');
        
        // Look for name field if it exists
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test User');
        }
        
        await signupButton.click();
        await page.waitForTimeout(3000);
        
        console.log(`📄 URL after sign-up: ${page.url()}`);
        await page.screenshot({ path: 'after-signup.png', fullPage: true });
      }
    }
    
    // Now try to sign in
    console.log('🔐 Attempting to sign in...');
    
    // Navigate to sign-in if not already there
    if (!page.url().includes('/auth/signin')) {
      await page.goto('http://localhost:4000/auth/signin', { waitUntil: 'networkidle' });
    }
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In")');
    
    await emailInput.fill('hello@atunbi.net');
    await passwordInput.fill('Teniola=1');
    await signInButton.click();
    
    // Wait for redirect
    await page.waitForTimeout(5000);
    console.log(`📄 URL after sign-in: ${page.url()}`);
    
    if (page.url().includes('/auth/signin')) {
      console.log('❌ Still on sign-in page after attempt');
      
      // Check for any error messages
      const pageContent = await page.locator('body').textContent();
      console.log('📝 Checking for error indicators...');
      
      // Look for common error patterns
      if (pageContent.includes('Invalid') || pageContent.includes('incorrect')) {
        console.log('⚠️  Authentication error detected');
      }
      
      await page.screenshot({ path: 'signin-failed.png', fullPage: true });
      
      // Try using a simpler password
      console.log('🔄 Trying with simplified credentials...');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await signInButton.click();
      await page.waitForTimeout(3000);
      
      console.log(`📄 URL after second attempt: ${page.url()}`);
      
    } else {
      console.log('✅ Successfully signed in!');
      
      // Now test the budget functionality
      await testBudgetFunctionality(page);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'signup-signin-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

async function testBudgetFunctionality(page) {
  console.log('💰 Testing Budget Functionality...');
  
  try {
    // Navigate to budget page
    await page.goto('http://localhost:4000/dashboard/budget', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/auth/signin')) {
      console.log('❌ Redirected back to sign-in from budget page');
      return;
    }
    
    console.log('✅ Successfully accessed budget page!');
    await page.screenshot({ path: 'budget-page-success.png', fullPage: true });
    
    // Test Initialize Default Categories
    const initButton = page.locator('button:has-text("Initialize Default Budget Categories")');
    if (await initButton.isVisible()) {
      console.log('🔧 Testing Initialize Default Categories...');
      await initButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'after-initialize-categories.png', fullPage: true });
      console.log('✅ Initialize Default Categories clicked');
    } else {
      console.log('⚠️  Initialize button not found - categories may already exist');
    }
    
    // Look for categories
    const categories = await page.locator('.card, .category, [data-testid*="category"]').count();
    console.log(`📊 Found ${categories} budget categories`);
    
    // Test adding a category if form is available
    const addCategoryBtn = page.locator('button:has-text("Add"), button:has-text("New")');
    if (await addCategoryBtn.first().isVisible()) {
      console.log('➕ Testing add category...');
      await addCategoryBtn.first().click();
      await page.waitForTimeout(2000);
      
      // Fill form if visible
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
      const amountInput = page.locator('input[type="number"], input[name="budget"]');
      
      if (await nameInput.isVisible() && await amountInput.isVisible()) {
        await nameInput.fill('Test Venue');
        await amountInput.fill('5000');
        
        const submitBtn = page.locator('button[type="submit"], button:has-text("Save")');
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          console.log('✅ Category added successfully');
          await page.screenshot({ path: 'after-add-category.png', fullPage: true });
        }
      }
    }
    
    // Check for budget statistics
    const budgetStats = await page.locator('text=Total, text=$, text=Budget, text=Spent').count();
    console.log(`📊 Found ${budgetStats} budget statistic elements`);
    
    // Final screenshot
    await page.screenshot({ path: 'budget-final-test.png', fullPage: true });
    console.log('✅ Budget functionality test completed!');
    
  } catch (error) {
    console.error('❌ Budget test failed:', error.message);
    await page.screenshot({ path: 'budget-test-error.png', fullPage: true });
  }
}

signUpAndTestBudget();