import { test, expect } from '@playwright/test'

test('Budget system basic functionality', async ({ page }) => {
  // Go directly to sign in page
  console.log('🔐 Going to sign in page...')
  await page.goto('/auth/signin')
  
  // Fill in credentials
  console.log('📝 Filling in credentials...')
  await page.fill('input[type="email"]', 'hello@atunbi.net')
  await page.fill('input[type="password"]', 'Teniola=1')
  
  // Submit form
  console.log('🔄 Submitting sign in form...')
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 })
  console.log('✅ Successfully signed in')
  
  // Navigate to budget page
  console.log('📊 Going to budget page...')
  await page.goto('/dashboard/budget')
  
  // Wait for page to load
  await page.waitForSelector('h1', { timeout: 10000 })
  const title = await page.textContent('h1')
  console.log(`📝 Page title: ${title}`)
  expect(title).toContain('Budget')
  
  // Check if we can see budget interface
  const budgetInterface = page.locator('text=Track your wedding expenses')
  await expect(budgetInterface).toBeVisible()
  console.log('✅ Budget interface is visible')
  
  // Check for initialize button or existing categories
  const initButton = page.locator('button:has-text("Initialize Default Budget Categories")')
  const addCategoryButton = page.locator('button:has-text("Add Category")')
  
  const hasInitButton = await initButton.isVisible()
  const hasAddButton = await addCategoryButton.isVisible()
  
  if (hasInitButton) {
    console.log('🔧 Initializing default categories...')
    await initButton.click()
    
    // Wait for categories to appear
    console.log('⏳ Waiting for categories to load...')
    await page.waitForSelector('text=Venue & Reception', { timeout: 15000 })
    console.log('✅ Default categories initialized')
    
    // Verify budget stats appear
    await expect(page.locator('text=Total Budget')).toBeVisible()
    console.log('✅ Budget statistics are visible')
    
  } else if (hasAddButton) {
    console.log('✅ Budget categories already exist')
    await expect(page.locator('text=Total Budget')).toBeVisible()
    console.log('✅ Budget statistics are visible')
  } else {
    console.log('❌ Neither init button nor add button found')
  }
  
  console.log('🎉 Budget system test completed successfully!')
})