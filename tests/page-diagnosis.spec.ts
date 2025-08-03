import { test, expect } from '@playwright/test'

test.describe('Page Diagnosis', () => {
  test('test basic page rendering', async ({ page }) => {
    // Capture console logs and errors
    const logs: string[] = []
    const errors: string[] = []
    
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    // Test the basic test page
    await page.goto('http://localhost:4002/test-page')
    
    // Wait a bit for any async loading
    await page.waitForTimeout(2000)
    
    // Check if page has any content
    const bodyText = await page.textContent('body')
    console.log('Body text:', bodyText)
    
    // Check for the expected heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 5000 })
    await expect(heading).toContainText('Test Page')
    
    // Check for the button
    const button = page.locator('button')
    await expect(button).toBeVisible()
    
    // Log any console messages
    console.log('Console logs:', logs)
    console.log('Page errors:', errors)
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/test-page.png' })
  })

  test('test super simple signin page', async ({ page }) => {
    const logs: string[] = []
    const errors: string[] = []
    
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto('http://localhost:4002/super-simple-signin')
    await page.waitForTimeout(2000)
    
    // Check if page loads
    const bodyText = await page.textContent('body')
    console.log('Super simple signin body text:', bodyText)
    
    // Look for the heading
    const heading = page.locator('h1')
    if (await heading.isVisible()) {
      await expect(heading).toContainText('Super Simple Sign In')
    } else {
      console.log('Heading not visible')
    }
    
    // Look for the sign-in button
    const signInButton = page.locator('button', { hasText: 'Sign In' })
    if (await signInButton.isVisible()) {
      console.log('Sign in button found')
    } else {
      console.log('Sign in button not found')
    }
    
    console.log('Console logs:', logs)
    console.log('Page errors:', errors)
    
    await page.screenshot({ path: 'test-results/super-simple-signin.png' })
  })

  test('test emergency signin page', async ({ page }) => {
    const logs: string[] = []
    const errors: string[] = []
    
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto('http://localhost:4002/emergency-signin')
    await page.waitForTimeout(3000)
    
    const bodyText = await page.textContent('body')
    console.log('Emergency signin body text:', bodyText)
    
    // Check for emergency signin elements
    const heading = page.locator('h1')
    if (await heading.isVisible()) {
      console.log('Emergency heading visible')
    } else {
      console.log('Emergency heading not visible')
    }
    
    // Check for status display
    const statusDiv = page.locator('div').filter({ hasText: 'Status:' })
    if (await statusDiv.isVisible()) {
      const statusText = await statusDiv.textContent()
      console.log('Status text:', statusText)
    }
    
    console.log('Console logs:', logs)
    console.log('Page errors:', errors)
    
    await page.screenshot({ path: 'test-results/emergency-signin.png' })
  })

  test('test basic signin page', async ({ page }) => {
    const logs: string[] = []
    const errors: string[] = []
    
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto('http://localhost:4002/basic-signin')
    await page.waitForTimeout(3000)
    
    const bodyText = await page.textContent('body')
    console.log('Basic signin body text:', bodyText)
    
    console.log('Console logs:', logs)
    console.log('Page errors:', errors)
    
    await page.screenshot({ path: 'test-results/basic-signin.png' })
  })

  test('check environment variables and network', async ({ page }) => {
    await page.goto('http://localhost:4002/test-page')
    
    // Check environment variables in browser
    const envCheck = await page.evaluate(() => {
      return {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        userAgent: navigator.userAgent,
        location: window.location.href
      }
    })
    
    console.log('Environment check:', envCheck)
  })
})