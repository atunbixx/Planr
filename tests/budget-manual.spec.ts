import { test, expect } from '@playwright/test'

test('Manual budget test with auth debug', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()))
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message))
  
  console.log('🔍 Going to signin debug page...')
  await page.goto('/signin-debug')
  
  // Wait for page to load
  await page.waitForSelector('h1', { timeout: 10000 })
  
  // Test environment first
  console.log('🌐 Testing environment...')
  await page.click('button:has-text("Test Environment")')
  
  // Wait a moment for results
  await page.waitForTimeout(3000)
  
  // Check if we see connection success
  const results = await page.textContent('pre')
  console.log('Environment test results:', results)
  
  if (results && results.includes('Connection successful')) {
    console.log('✅ Environment test passed')
    
    // Try sign in test
    console.log('🔐 Testing sign in...')
    await page.click('button:has-text("Test Sign In")')
    
    // Wait for results
    await page.waitForTimeout(5000)
    
    const signInResults = await page.textContent('pre')
    console.log('Sign in test results:', signInResults)
    
    if (signInResults && signInResults.includes('Sign in successful')) {
      console.log('✅ Sign in test passed - now testing budget directly')
      
      // Go directly to budget page
      await page.goto('/dashboard/budget')
      
      try {
        await page.waitForSelector('h1', { timeout: 10000 })
        const title = await page.textContent('h1')
        console.log('📊 Budget page title:', title)
        
        // Check for budget interface elements
        const elements = {
          'Track expenses': await page.locator('text=Track your wedding expenses').isVisible(),
          'Add Category': await page.locator('button:has-text("Add Category")').isVisible(),
          'Add Expense': await page.locator('button:has-text("Add Expense")').isVisible(),
          'Initialize': await page.locator('button:has-text("Initialize Default Budget Categories")').isVisible()
        }
        
        console.log('Budget interface elements:', elements)
        
        // Take a screenshot
        await page.screenshot({ path: 'budget-test.png', fullPage: true })
        console.log('📸 Screenshot saved as budget-test.png')
        
      } catch (budgetError) {
        console.log('❌ Budget page error:', budgetError.message)
        
        // Take screenshot of error state
        await page.screenshot({ path: 'budget-error.png', fullPage: true })
        console.log('📸 Error screenshot saved as budget-error.png')
      }
      
    } else {
      console.log('❌ Sign in test failed')
    }
    
  } else {
    console.log('❌ Environment test failed')
  }
  
  console.log('🏁 Manual test completed')
})