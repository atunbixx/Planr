const { chromium } = require('playwright');

async function finalBudgetTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('auth') || msg.text().includes('budget')) {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🎯 Final Budget System Test...');
    
    // First, let's check what's actually on the sign-in page
    await page.goto('http://localhost:4000/auth/signin', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'signin-initial.png', fullPage: true });
    
    console.log('🔍 Analyzing sign-in page structure...');
    
    // Get all form elements
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    
    console.log(`📋 Page structure: ${forms} forms, ${inputs} inputs, ${buttons} buttons`);
    
    // Check if there are any demo accounts or test credentials mentioned
    const pageText = await page.locator('body').textContent();
    if (pageText.includes('demo') || pageText.includes('test') || pageText.includes('example')) {
      console.log('💡 Page may contain demo/test account information');
    }
    
    // Try to find any pre-filled values or hints
    const emailValue = await page.locator('input[type="email"]').getAttribute('value');
    const emailPlaceholder = await page.locator('input[type="email"]').getAttribute('placeholder');
    console.log(`📧 Email field - value: "${emailValue}", placeholder: "${emailPlaceholder}"`);
    
    // Check if there's a way to access the budget page without authentication
    console.log('🔄 Trying direct access to budget page...');
    await page.goto('http://localhost:4000/dashboard/budget', { waitUntil: 'networkidle' });
    
    const budgetUrl = page.url();
    console.log(`📄 Budget page URL: ${budgetUrl}`);
    
    if (budgetUrl.includes('/auth/signin')) {
      console.log('🔒 Budget page requires authentication');
      
      // Let's try a fresh sign-in attempt with a reload
      await page.reload({ waitUntil: 'networkidle' });
      
      // Fill credentials carefully
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // Clear and fill
      await emailInput.clear();
      await emailInput.fill('hello@atunbi.net');
      await passwordInput.clear();
      await passwordInput.fill('Teniola=1');
      
      await page.screenshot({ path: 'credentials-filled.png', fullPage: true });
      
      // Try clicking sign in
      await page.locator('button:has-text("Sign In")').click();
      
      // Wait and check for any changes
      await page.waitForTimeout(5000);
      
      const newUrl = page.url();
      console.log(`📄 URL after sign-in: ${newUrl}`);
      
      if (newUrl.includes('/auth/signin')) {
        console.log('❌ Authentication failed - checking for alternatives...');
        
        // Let's see if we can check the database directly or find test accounts
        // Check if there are any other sign-in methods
        const altSignInMethods = await page.locator('button:not(:has-text("Sign In")), a:has-text("Google"), a:has-text("GitHub")').count();
        console.log(`🔗 Alternative sign-in methods found: ${altSignInMethods}`);
        
        // Try to see if there's a bypass or demo mode
        const demoLinks = await page.locator('a:has-text("demo"), a:has-text("test"), button:has-text("demo")').count();
        console.log(`🎭 Demo/test links found: ${demoLinks}`);
        
        console.log('⚠️  Unable to authenticate with provided credentials');
        console.log('💡 Recommendations:');
        console.log('   1. Verify the user account exists in the database');
        console.log('   2. Check if email verification is required');
        console.log('   3. Confirm the password is correct');
        console.log('   4. Consider creating a test account via the sign-up process');
        
      } else {
        console.log('✅ Authentication successful!');
        await testAuthenticatedBudgetFeatures(page);
      }
    } else {
      console.log('🎉 Budget page accessed directly!');
      await testAuthenticatedBudgetFeatures(page);
    }
    
    // Print any relevant console logs
    if (consoleLogs.length > 0) {
      console.log('\n📝 Relevant console logs:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
    }
    
  } catch (error) {
    console.error('❌ Final test failed:', error.message);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

async function testAuthenticatedBudgetFeatures(page) {
  console.log('🎯 Testing Budget Features...');
  
  try {
    await page.screenshot({ path: 'budget-authenticated-page.png', fullPage: true });
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Get page content
    const budgetPageContent = await page.locator('body').textContent();
    console.log(`📄 Budget page content length: ${budgetPageContent.length} characters`);
    
    // Check for key budget elements
    const hasBudgetContent = budgetPageContent.toLowerCase().includes('budget');
    const hasCategoryContent = budgetPageContent.toLowerCase().includes('category');
    const hasExpenseContent = budgetPageContent.toLowerCase().includes('expense');
    
    console.log(`💰 Budget content detected: ${hasBudgetContent}`);
    console.log(`📊 Category content detected: ${hasCategoryContent}`);
    console.log(`💳 Expense content detected: ${hasExpenseContent}`);
    
    // Look for "Initialize Default Budget Categories" button
    const initButton = page.locator('button').filter({ hasText: /initialize.*default.*budget.*categories/i });
    const initButtonVisible = await initButton.isVisible();
    console.log(`🔧 Initialize Default Categories button visible: ${initButtonVisible}`);
    
    if (initButtonVisible) {
      console.log('✅ Testing Initialize Default Categories...');
      await initButton.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'after-initialize-default.png', fullPage: true });
      console.log('✅ Initialize button clicked successfully');
    }
    
    // Count budget categories after potential initialization
    const categoryCards = await page.locator('.card, [class*="category"], [data-testid*="category"]').count();
    console.log(`📊 Budget categories found: ${categoryCards}`);
    
    // Look for add category functionality
    const addButtons = await page.locator('button').filter({ hasText: /add|new|create/i }).count();
    console.log(`➕ Add buttons found: ${addButtons}`);
    
    if (addButtons > 0) {
      const addButton = page.locator('button').filter({ hasText: /add/i }).first();
      const addButtonVisible = await addButton.isVisible();
      
      if (addButtonVisible) {
        console.log('✅ Testing add category functionality...');
        await addButton.click();
        await page.waitForTimeout(2000);
        
        // Look for form inputs
        const inputs = await page.locator('input[type="text"], input[name*="name"], input[name*="budget"], input[type="number"]').count();
        console.log(`📝 Form inputs found after add click: ${inputs}`);
        
        if (inputs >= 2) {
          // Try to fill a simple category
          const nameInput = page.locator('input').first();
          const budgetInput = page.locator('input[type="number"]').first();
          
          await nameInput.fill('Test Catering');
          await budgetInput.fill('3000');
          
          const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|add|create/i }).first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            console.log('✅ Category form submitted');
            await page.screenshot({ path: 'after-add-category.png', fullPage: true });
          }
        }
      }
    }
    
    // Look for expense functionality
    const expenseButtons = await page.locator('button').filter({ hasText: /expense|cost/i }).count();
    console.log(`💰 Expense buttons found: ${expenseButtons}`);
    
    if (expenseButtons > 0) {
      console.log('✅ Testing add expense functionality...');
      const expenseButton = page.locator('button').filter({ hasText: /expense/i }).first();
      if (await expenseButton.isVisible()) {
        await expenseButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'expense-form.png', fullPage: true });
      }
    }
    
    // Check for budget statistics
    const statsElements = await page.locator('text=/total|spent|remaining|budget/i').count();
    console.log(`📊 Budget statistics elements found: ${statsElements}`);
    
    // Look for dollar amounts
    const dollarAmounts = await page.locator('text=/\\$\\d+/').count();
    console.log(`💵 Dollar amounts displayed: ${dollarAmounts}`);
    
    // Final comprehensive screenshot
    await page.screenshot({ path: 'budget-final-comprehensive.png', fullPage: true });
    
    console.log('✅ Budget feature testing completed!');
    
  } catch (error) {
    console.error('❌ Budget feature test failed:', error.message);
    await page.screenshot({ path: 'budget-feature-error.png', fullPage: true });
  }
}

finalBudgetTest();