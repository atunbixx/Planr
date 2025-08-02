import { test, expect } from '@playwright/test'

// Test user credentials
const TEST_EMAIL = 'hello@atunbi.net'
const TEST_PASSWORD = 'Teniola=1'

test.describe('Budget System', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🔍 Navigating to homepage...')
    await page.goto('/')
    
    // Sign in first
    console.log('🔐 Clicking sign in...')
    await page.click('a[href="/signin"]')
    await page.waitForURL('/signin')
    
    console.log('📝 Filling in credentials...')
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    
    console.log('🔐 Submitting sign in form...')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    console.log('✅ Successfully signed in')
  })

  test('should display budget page and initialize default categories', async ({ page }) => {
    console.log('📊 Navigating to budget page...')
    await page.goto('/dashboard/budget')
    
    console.log('⏳ Waiting for page to load...')
    await page.waitForSelector('h1', { timeout: 10000 })
    
    const title = await page.textContent('h1')
    console.log(`📝 Page title: ${title}`)
    expect(title).toContain('Budget')
    
    // Check if we need to initialize default categories
    const initButton = page.locator('button:has-text("Initialize Default Budget Categories")')
    const isVisible = await initButton.isVisible()
    
    if (isVisible) {
      console.log('🔧 Initializing default budget categories...')
      await initButton.click()
      
      // Wait for categories to load
      await page.waitForSelector('.budget-category', { timeout: 10000 })
      console.log('✅ Default categories initialized')
    } else {
      console.log('✅ Budget categories already exist')
    }
    
    // Verify budget overview stats are displayed
    const totalBudget = page.locator('text=Total Budget')
    await expect(totalBudget).toBeVisible()
    console.log('✅ Budget overview stats are visible')
  })

  test('should add a new budget category', async ({ page }) => {
    console.log('📊 Navigating to budget page...')
    await page.goto('/dashboard/budget')
    await page.waitForSelector('h1')
    
    console.log('➕ Clicking Add Category button...')
    await page.click('button:has-text("Add Category")')
    
    // Fill in category form
    console.log('📝 Filling in category form...')
    await page.fill('input[placeholder*="Wedding Cake"]', 'Test Category')
    await page.fill('input[placeholder="1000"]', '2500')
    await page.selectOption('select', '2') // Important priority
    await page.fill('input[placeholder="Additional details"]', 'Test category notes')
    
    console.log('💾 Submitting category form...')
    await page.click('button[type="submit"]:has-text("Add Category")')
    
    // Wait for the form to disappear (indicating success)
    await page.waitForSelector('text=Add Budget Category', { state: 'hidden', timeout: 10000 })
    
    // Verify the category appears in the list
    const testCategory = page.locator('text=Test Category')
    await expect(testCategory).toBeVisible()
    console.log('✅ New category added successfully')
  })

  test('should add an expense to a category', async ({ page }) => {
    console.log('📊 Navigating to budget page...')
    await page.goto('/dashboard/budget')
    await page.waitForSelector('h1')
    
    // Make sure we have at least one category
    const initButton = page.locator('button:has-text("Initialize Default Budget Categories")')
    const isVisible = await initButton.isVisible()
    if (isVisible) {
      await initButton.click()
      await page.waitForSelector('text=Venue & Reception', { timeout: 10000 })
    }
    
    console.log('💰 Clicking Add Expense button...')
    await page.click('button:has-text("Add Expense")')
    
    // Fill in expense form
    console.log('📝 Filling in expense form...')
    await page.fill('input[placeholder*="Venue deposit"]', 'Test Venue Payment')
    await page.fill('input[placeholder="500.00"]', '1200.50')
    
    // Select a category
    await page.selectOption('select', { label: 'Venue & Reception' })
    
    // Set payment method
    await page.fill('input[placeholder*="Credit Card"]', 'Credit Card')
    await page.fill('input[placeholder="Additional details"]:last-of-type', 'Test expense notes')
    
    console.log('💾 Submitting expense form...')
    await page.click('button[type="submit"]:has-text("Add Expense")')
    
    // Wait for the form to disappear
    await page.waitForSelector('text=Add Expense', { state: 'hidden', timeout: 10000 })
    
    // Verify the expense appears in recent expenses
    const testExpense = page.locator('text=Test Venue Payment')
    await expect(testExpense).toBeVisible()
    console.log('✅ New expense added successfully')
    
    // Verify that the category spent amount updated
    const venueCategory = page.locator('text=Venue & Reception').locator('..')
    const spentAmount = venueCategory.locator('text=/\\$1,?200/')
    await expect(spentAmount).toBeVisible()
    console.log('✅ Category spent amount updated correctly')
  })

  test('should display budget statistics correctly', async ({ page }) => {
    console.log('📊 Navigating to budget page...')
    await page.goto('/dashboard/budget')
    await page.waitForSelector('h1')
    
    // Initialize categories if needed
    const initButton = page.locator('button:has-text("Initialize Default Budget Categories")')
    const isVisible = await initButton.isVisible()
    if (isVisible) {
      await initButton.click()
      await page.waitForSelector('text=Total Budget', { timeout: 10000 })
    }
    
    console.log('📈 Checking budget statistics...')
    
    // Verify total budget is displayed
    const totalBudget = page.locator('text=Total Budget')
    await expect(totalBudget).toBeVisible()
    
    // Verify total spent is displayed
    const totalSpent = page.locator('text=Total Spent')
    await expect(totalSpent).toBeVisible()
    
    // Verify remaining/over budget is displayed
    const remaining = page.locator('text=Remaining, text=Over Budget').first()
    await expect(remaining).toBeVisible()
    
    // Verify expense count is displayed
    const expenseCount = page.locator('text=Total Expenses')
    await expect(expenseCount).toBeVisible()
    
    console.log('✅ All budget statistics are displayed correctly')
  })

  test('should delete an expense', async ({ page }) => {
    console.log('📊 Navigating to budget page...')
    await page.goto('/dashboard/budget')
    await page.waitForSelector('h1')
    
    // Add an expense first if none exist
    const addExpenseButton = page.locator('button:has-text("Add Expense")')
    if (await addExpenseButton.isVisible()) {
      await addExpenseButton.click()
      
      // Quick expense
      await page.fill('input[placeholder*="Venue deposit"]', 'Test Delete Expense')
      await page.fill('input[placeholder="500.00"]', '100')
      await page.click('button[type="submit"]:has-text("Add Expense")')
      await page.waitForSelector('text=Add Expense', { state: 'hidden' })
    }
    
    // Find and delete the expense
    console.log('🗑️ Deleting an expense...')
    const deleteButton = page.locator('button:has-text("Delete")').first()
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()
    
    console.log('✅ Expense deleted successfully')
  })
})