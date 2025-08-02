const { chromium } = require('playwright');

async function authenticatedBudgetTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('🚀 Starting Authenticated Budget System Test...');
    
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:4000');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    
    // Check if we're redirected to sign-in
    const currentUrl = page.url();
    console.log(`📄 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth/signin')) {
      console.log('🔐 On sign-in page, proceeding with authentication...');
      
      // Fill in credentials
      await page.locator('input[type="email"]').fill('hello@atunbi.net');
      await page.locator('input[type="password"]').fill('Teniola=1');
      
      // Click Sign In button
      await page.locator('button:has-text("Sign In")').click();
      console.log('✅ Sign In button clicked');
      
      // Wait for redirect after successful login
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      console.log(`🎉 Successfully logged in! New URL: ${page.url()}`);
      
    } else {
      console.log('ℹ️  Not on sign-in page, checking if already authenticated...');
    }
    
    // Now navigate to budget page
    console.log('📊 Navigating to budget page...');
    await page.goto('http://localhost:4000/dashboard/budget', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const budgetUrl = page.url();
    console.log(`📄 Budget page URL: ${budgetUrl}`);
    
    if (budgetUrl.includes('/auth/signin')) {
      console.log('❌ Still being redirected to sign-in, authentication may have failed');
      return;
    }
    
    // Take screenshot of budget page
    await page.screenshot({ path: 'budget-authenticated.png', fullPage: true });
    console.log('📸 Screenshot taken: budget-authenticated.png');
    
    // Check page content
    const budgetPageContent = await page.locator('body').textContent();
    console.log(`📝 Budget page content length: ${budgetPageContent.length} characters`);
    
    // Look for budget-specific elements
    console.log('🔍 Analyzing budget page structure...');
    
    // Check for Initialize Default Categories button
    const initButton = page.locator('button:has-text("Initialize Default Budget Categories")');
    const initButtonVisible = await initButton.isVisible();
    console.log(`🔧 Initialize Default Categories button visible: ${initButtonVisible}`);
    
    if (initButtonVisible) {
      console.log('🎯 Testing Initialize Default Categories...');
      await initButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Initialize button clicked, waiting for categories to load...');
      await page.screenshot({ path: 'budget-after-initialize.png', fullPage: true });
    }
    
    // Look for existing categories
    const categorySelectors = [
      '[data-testid*="category"]',
      '.budget-category',
      '.category-item',
      '[class*="category"]',
      '.card:has-text("$")',
      '[class*="budget"]:has-text("$")'
    ];
    
    let totalCategories = 0;
    for (const selector of categorySelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`📊 Found ${elements.length} elements with selector: ${selector}`);
        totalCategories = Math.max(totalCategories, elements.length);
      }
    }
    
    console.log(`📋 Total budget categories detected: ${totalCategories}`);
    
    // Test adding a new category
    console.log('➕ Looking for add category functionality...');
    
    const addCategorySelectors = [
      'button:has-text("Add Category")',
      'button:has-text("New Category")',
      'button:has-text("Add Budget")',
      '.add-category-btn',
      '[data-testid="add-category"]'
    ];
    
    let addCategoryButton = null;
    for (const selector of addCategorySelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        addCategoryButton = element;
        console.log(`✅ Found add category button with selector: ${selector}`);
        break;
      }
    }
    
    if (addCategoryButton) {
      console.log('🎯 Testing add new category...');
      await addCategoryButton.click();
      await page.waitForTimeout(2000);
      
      // Look for form fields
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="category"]');
      const budgetInput = page.locator('input[name="budget"], input[name="amount"], input[type="number"]');
      
      const nameInputVisible = await nameInput.isVisible();
      const budgetInputVisible = await budgetInput.isVisible();
      
      console.log(`📝 Category name input visible: ${nameInputVisible}`);
      console.log(`💰 Budget amount input visible: ${budgetInputVisible}`);
      
      if (nameInputVisible && budgetInputVisible) {
        await nameInput.fill('Test Photography');
        await budgetInput.fill('1200');
        
        // Find submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save"), button:has-text("Create")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ New category form submitted');
          await page.screenshot({ path: 'budget-after-add-category.png', fullPage: true });
        }
      }
    } else {
      console.log('⚠️  No add category button found');
    }
    
    // Test adding expenses
    console.log('💰 Looking for add expense functionality...');
    
    const addExpenseSelectors = [
      'button:has-text("Add Expense")',
      'button:has-text("Add Cost")',
      '.add-expense-btn',
      '[data-testid="add-expense"]'
    ];
    
    const addExpenseButtons = [];
    for (const selector of addExpenseSelectors) {
      const elements = await page.locator(selector).all();
      addExpenseButtons.push(...elements);
    }
    
    console.log(`💳 Found ${addExpenseButtons.length} add expense buttons`);
    
    if (addExpenseButtons.length > 0) {
      console.log('🎯 Testing add expense...');
      await addExpenseButtons[0].click();
      await page.waitForTimeout(2000);
      
      // Look for expense form
      const expenseDescInput = page.locator('input[name="description"], input[placeholder*="description"]');
      const expenseAmountInput = page.locator('input[name="amount"], input[name="cost"], input[type="number"]').last();
      
      if (await expenseDescInput.isVisible() && await expenseAmountInput.isVisible()) {
        await expenseDescInput.fill('Professional Photography Session');
        await expenseAmountInput.fill('800');
        
        const expenseSubmitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")').last();
        if (await expenseSubmitButton.isVisible()) {
          await expenseSubmitButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ Expense added successfully');
          await page.screenshot({ path: 'budget-after-add-expense.png', fullPage: true });
        }
      }
    }
    
    // Check budget statistics
    console.log('📊 Checking budget statistics...');
    
    const statsSelectors = [
      { name: 'Total Budget', selectors: ['[data-testid="total-budget"]', '.total-budget', ':has-text("Total Budget")'] },
      { name: 'Total Spent', selectors: ['[data-testid="total-spent"]', '.total-spent', ':has-text("Total Spent")'] },
      { name: 'Remaining', selectors: ['[data-testid="remaining"]', '.remaining', ':has-text("Remaining")'] }
    ];
    
    for (const stat of statsSelectors) {
      for (const selector of stat.selectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`💵 ${stat.name}: ${text.trim()}`);
          break;
        }
      }
    }
    
    // Check individual category spending
    console.log('🔍 Checking individual category spending...');
    const spentElements = await page.locator('.spent, [class*="spent"], :has-text("$")').all();
    
    for (let i = 0; i < Math.min(spentElements.length, 10); i++) {
      const spentText = await spentElements[i].textContent();
      if (spentText.includes('$')) {
        console.log(`💳 Spending item ${i + 1}: ${spentText.trim()}`);
      }
    }
    
    // Final comprehensive screenshot
    await page.screenshot({ path: 'budget-final-complete.png', fullPage: true });
    
    // Check for errors
    const errorElements = await page.locator('.error, .alert-error, [role="alert"]').all();
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} error elements:`);
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        if (errorText.trim()) {
          console.log(`   Error ${i + 1}: ${errorText.trim()}`);
        }
      }
    } else {
      console.log('✅ No errors detected');
    }
    
    // Print relevant console logs
    if (consoleLogs.length > 0) {
      console.log('\n📝 Console logs:');
      const relevantLogs = consoleLogs.filter(log => 
        log.includes('error') || log.includes('Error') || log.includes('failed') ||
        log.includes('budget') || log.includes('category') || log.includes('expense')
      );
      relevantLogs.forEach(log => console.log(`   ${log}`));
    }
    
    console.log('✅ Authenticated budget test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'budget-auth-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

authenticatedBudgetTest();