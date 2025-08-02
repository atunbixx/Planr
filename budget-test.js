const { chromium } = require('playwright');

async function testBudgetSystem() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting Budget System Test...');
    
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:4000');
    await page.goto('http://localhost:4000');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('🔐 Logging in with provided credentials...');
      await page.fill('input[type="email"]', 'hello@atunbi.net');
      await page.fill('input[type="password"]', 'Teniola=1');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      console.log('✅ Login successful');
    }
    
    // Navigate to budget page
    console.log('📊 Navigating to budget page...');
    await page.goto('http://localhost:4000/dashboard/budget');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'budget-initial.png' });
    console.log('📸 Screenshot taken: budget-initial.png');
    
    // Check if there are existing budget categories
    const categories = await page.locator('[data-testid="budget-category"], .budget-category, .category-item').count();
    console.log(`📋 Found ${categories} existing budget categories`);
    
    // Test Initialize Default Budget Categories if no categories exist
    const initButton = page.locator('button:has-text("Initialize Default Budget Categories"), button:has-text("Add Default Categories"), button:has-text("Initialize")');
    const initButtonVisible = await initButton.isVisible();
    
    if (initButtonVisible) {
      console.log('🔧 Testing Initialize Default Budget Categories...');
      await initButton.click();
      await page.waitForTimeout(2000);
      
      // Check if categories were added
      const newCategories = await page.locator('[data-testid="budget-category"], .budget-category, .category-item').count();
      console.log(`✅ After initialization: ${newCategories} categories found`);
      
      await page.screenshot({ path: 'budget-after-init.png' });
      console.log('📸 Screenshot taken: budget-after-init.png');
    } else {
      console.log('ℹ️  Initialize button not visible - categories may already exist');
    }
    
    // Test adding a new budget category
    console.log('➕ Testing add new budget category...');
    
    // Look for add category form elements
    const addCategoryButton = page.locator('button:has-text("Add Category"), button:has-text("New Category"), .add-category-btn');
    const categoryNameInput = page.locator('input[name="name"], input[placeholder*="category"], input[placeholder*="name"]');
    const categoryBudgetInput = page.locator('input[name="budget"], input[name="amount"], input[type="number"]');
    
    if (await addCategoryButton.isVisible()) {
      await addCategoryButton.click();
      await page.waitForTimeout(1000);
    }
    
    if (await categoryNameInput.isVisible() && await categoryBudgetInput.isVisible()) {
      console.log('📝 Found category form, filling details...');
      await categoryNameInput.fill('Test Flowers');
      await categoryBudgetInput.fill('500');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save"), button:has-text("Create")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Category form submitted');
        
        await page.screenshot({ path: 'budget-after-add-category.png' });
        console.log('📸 Screenshot taken: budget-after-add-category.png');
      }
    } else {
      console.log('⚠️  Category form not found or not visible');
    }
    
    // Test adding an expense to a category
    console.log('💰 Testing add expense to category...');
    
    // Look for expense-related buttons/forms
    const addExpenseButton = page.locator('button:has-text("Add Expense"), .add-expense-btn, button:has-text("Add Cost")');
    const expenseButtons = await addExpenseButton.all();
    
    if (expenseButtons.length > 0) {
      console.log(`Found ${expenseButtons.length} add expense buttons`);
      await expenseButtons[0].click();
      await page.waitForTimeout(1000);
      
      // Fill expense form
      const expenseDescInput = page.locator('input[name="description"], input[placeholder*="description"], input[placeholder*="expense"]');
      const expenseAmountInput = page.locator('input[name="amount"], input[name="cost"], input[type="number"]').last();
      
      if (await expenseDescInput.isVisible() && await expenseAmountInput.isVisible()) {
        console.log('📝 Found expense form, filling details...');
        await expenseDescInput.fill('Test Expense - Rose Bouquet');
        await expenseAmountInput.fill('150');
        
        const expenseSubmitButton = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")').last();
        if (await expenseSubmitButton.isVisible()) {
          await expenseSubmitButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Expense form submitted');
          
          await page.screenshot({ path: 'budget-after-add-expense.png' });
          console.log('📸 Screenshot taken: budget-after-add-expense.png');
        }
      }
    } else {
      console.log('⚠️  Add expense button not found');
    }
    
    // Check budget statistics
    console.log('📊 Checking budget statistics...');
    
    // Look for statistics elements
    const totalBudgetEl = page.locator('[data-testid="total-budget"], .total-budget, .budget-total');
    const totalSpentEl = page.locator('[data-testid="total-spent"], .total-spent, .spent-total');
    const remainingEl = page.locator('[data-testid="remaining"], .remaining, .budget-remaining');
    
    const statistics = {};
    
    if (await totalBudgetEl.isVisible()) {
      statistics.totalBudget = await totalBudgetEl.textContent();
      console.log(`💵 Total Budget: ${statistics.totalBudget}`);
    }
    
    if (await totalSpentEl.isVisible()) {
      statistics.totalSpent = await totalSpentEl.textContent();
      console.log(`💸 Total Spent: ${statistics.totalSpent}`);
    }
    
    if (await remainingEl.isVisible()) {
      statistics.remaining = await remainingEl.textContent();
      console.log(`💰 Remaining: ${statistics.remaining}`);
    }
    
    // Check individual category spent amounts
    console.log('🔍 Checking category spent amounts...');
    const categorySpentElements = await page.locator('.spent-amount, [data-testid*="spent"], .category-spent').all();
    
    for (let i = 0; i < categorySpentElements.length; i++) {
      const spentText = await categorySpentElements[i].textContent();
      console.log(`💳 Category ${i + 1} spent: ${spentText}`);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'budget-final.png' });
    console.log('📸 Final screenshot taken: budget-final.png');
    
    // Check for any visible errors
    console.log('🔍 Checking for errors...');
    const errorElements = await page.locator('.error, .alert-error, [role="alert"]').all();
    
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} error elements:`);
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`   Error ${i + 1}: ${errorText}`);
      }
    } else {
      console.log('✅ No visible errors found');
    }
    
    // Check console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });
    
    if (logs.length > 0) {
      console.log('⚠️  Console errors found:');
      logs.forEach(log => console.log(`   ${log}`));
    }
    
    console.log('✅ Budget system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'budget-error.png' });
    console.log('📸 Error screenshot taken: budget-error.png');
  } finally {
    await browser.close();
  }
}

testBudgetSystem();