const { chromium } = require('playwright');

async function detailedBudgetTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    consoleLogs.push(`Network failed: ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('🚀 Starting Detailed Budget System Test...');
    
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:4000');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    
    // Check current URL and page title
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`📄 Current URL: ${currentUrl}`);
    console.log(`📝 Page Title: ${pageTitle}`);
    
    // Check if we need to login
    const loginEmailInput = page.locator('input[type="email"]');
    const isLoginPage = await loginEmailInput.isVisible();
    
    if (isLoginPage) {
      console.log('🔐 Login page detected, logging in...');
      await loginEmailInput.fill('hello@atunbi.net');
      await page.locator('input[type="password"]').fill('Teniola=1');
      
      // Find and click login button
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      
      console.log(`✅ Login attempt completed. New URL: ${page.url()}`);
    } else {
      console.log('ℹ️  Not on login page, proceeding...');
    }
    
    // Navigate to budget page
    console.log('📊 Navigating to budget page...');
    await page.goto('http://localhost:4000/dashboard/budget', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Extra wait for dynamic content
    
    console.log(`📄 Budget page URL: ${page.url()}`);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'budget-detailed-initial.png', fullPage: true });
    
    // Get page content for analysis
    const pageContent = await page.content();
    console.log(`📄 Page content length: ${pageContent.length} characters`);
    
    // Look for any text related to budget
    const budgetText = await page.locator('body').textContent();
    const hasBudgetKeywords = budgetText.includes('budget') || budgetText.includes('Budget') || 
                              budgetText.includes('category') || budgetText.includes('expense');
    console.log(`💰 Page contains budget-related text: ${hasBudgetKeywords}`);
    
    if (hasBudgetKeywords) {
      console.log('🔍 Found budget-related content, analyzing structure...');
      
      // Look for various budget-related elements with different selectors
      const allButtons = await page.locator('button').all();
      console.log(`🔘 Found ${allButtons.length} buttons on page`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        console.log(`   Button ${i + 1}: "${buttonText.trim()}" (visible: ${isVisible})`);
      }
      
      // Look for input fields
      const allInputs = await page.locator('input').all();
      console.log(`📝 Found ${allInputs.length} input fields`);
      
      for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
        const inputType = await allInputs[i].getAttribute('type');
        const inputName = await allInputs[i].getAttribute('name');
        const inputPlaceholder = await allInputs[i].getAttribute('placeholder');
        const isVisible = await allInputs[i].isVisible();
        console.log(`   Input ${i + 1}: type="${inputType}" name="${inputName}" placeholder="${inputPlaceholder}" (visible: ${isVisible})`);
      }
      
      // Look for forms
      const allForms = await page.locator('form').all();
      console.log(`📋 Found ${allForms.length} forms on page`);
      
      // Check for specific budget-related text patterns
      const specificButtons = await page.locator('button:has-text("Initialize"), button:has-text("Default"), button:has-text("Categories"), button:has-text("Add")').all();
      console.log(`🎯 Found ${specificButtons.length} potentially relevant buttons`);
      
      for (let i = 0; i < specificButtons.length; i++) {
        const buttonText = await specificButtons[i].textContent();
        const isVisible = await specificButtons[i].isVisible();
        console.log(`   Relevant button ${i + 1}: "${buttonText.trim()}" (visible: ${isVisible})`);
      }
      
      // Test Initialize Default Categories if button exists
      const initButtons = await page.locator('button:has-text("Initialize"), button:has-text("Default")').all();
      if (initButtons.length > 0) {
        console.log('🔧 Testing Initialize Default Categories...');
        try {
          await initButtons[0].click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'budget-after-init-attempt.png', fullPage: true });
          console.log('✅ Initialize button clicked');
        } catch (error) {
          console.log(`⚠️  Error clicking initialize button: ${error.message}`);
        }
      }
      
      // Look for any category-related elements after potential initialization
      const categoryElements = await page.locator('[class*="category"], [data-testid*="category"], .budget-item, [class*="budget"]').all();
      console.log(`📊 Found ${categoryElements.length} category-related elements`);
      
      // Try to find and interact with any add category functionality
      const addButtons = await page.locator('button:has-text("Add"), [class*="add"], .add-btn').all();
      console.log(`➕ Found ${addButtons.length} add buttons`);
      
      for (let i = 0; i < Math.min(addButtons.length, 3); i++) {
        const buttonText = await addButtons[i].textContent();
        const isVisible = await addButtons[i].isVisible();
        console.log(`   Add button ${i + 1}: "${buttonText.trim()}" (visible: ${isVisible})`);
        
        if (isVisible && buttonText.toLowerCase().includes('category')) {
          console.log(`🎯 Attempting to click category add button...`);
          try {
            await addButtons[i].click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: `budget-after-add-click-${i}.png`, fullPage: true });
          } catch (error) {
            console.log(`⚠️  Error clicking add button: ${error.message}`);
          }
        }
      }
    } else {
      console.log('❌ No budget-related content found on page');
    }
    
    // Final analysis
    await page.screenshot({ path: 'budget-detailed-final.png', fullPage: true });
    
    // Check for any error messages or alerts
    const errorSelectors = ['.error', '.alert', '[role="alert"]', '.toast', '.notification', '.message'];
    for (const selector of errorSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`⚠️  Found ${elements.length} elements with selector "${selector}"`);
        for (let i = 0; i < elements.length; i++) {
          const text = await elements[i].textContent();
          console.log(`   ${selector} ${i + 1}: "${text.trim()}"`);
        }
      }
    }
    
    // Print console logs
    if (consoleLogs.length > 0) {
      console.log('\n📝 Console logs during test:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
    }
    
    console.log('✅ Detailed budget test completed!');
    
  } catch (error) {
    console.error('❌ Detailed test failed with error:', error.message);
    await page.screenshot({ path: 'budget-detailed-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

detailedBudgetTest();