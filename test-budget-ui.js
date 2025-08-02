const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the login page
    await page.goto('http://localhost:4002/auth/signin');
    
    // Fill in the login form with test credentials
    await page.fill('input[name="email"]', 'demo@weddingplanner.com');
    await page.fill('input[name="password"]', 'demo123456');
    
    // Click the sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    // Navigate to the budget page
    await page.goto('http://localhost:4002/dashboard/budget');
    
    // Wait for the budget page to load
    await page.waitForSelector('h1:has-text("Budget")', { timeout: 10000 });
    
    // Take screenshots of different tabs
    console.log('Taking screenshots of budget UI...');
    
    // Dashboard tab
    await page.screenshot({ path: 'budget-dashboard.png', fullPage: true });
    
    // Click on Categories tab if visible
    const categoriesTab = await page.locator('button:has-text("Categories")');
    if (await categoriesTab.isVisible()) {
      await categoriesTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'budget-categories.png', fullPage: true });
    }
    
    // Click on Expenses tab if visible
    const expensesTab = await page.locator('button:has-text("Expenses")');
    if (await expensesTab.isVisible()) {
      await expensesTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'budget-expenses.png', fullPage: true });
    }
    
    // Click on Analytics tab if visible
    const analyticsTab = await page.locator('button:has-text("Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'budget-analytics.png', fullPage: true });
    }
    
    // Click on Compare tab if visible
    const compareTab = await page.locator('button:has-text("Compare")');
    if (await compareTab.isVisible()) {
      await compareTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'budget-comparison.png', fullPage: true });
    }
    
    console.log('Budget UI test completed successfully!');
    console.log('Screenshots saved: budget-dashboard.png, budget-categories.png, budget-expenses.png, budget-analytics.png, budget-comparison.png');
    
  } catch (error) {
    console.error('Error during budget UI test:', error);
    await page.screenshot({ path: 'budget-error.png' });
  } finally {
    await browser.close();
  }
})();