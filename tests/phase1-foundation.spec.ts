import { test, expect } from '@playwright/test'

test.describe('Phase 1: Foundation Testing', () => {
  test('should load homepage without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Verify no console errors
    expect(errors.filter(e => !e.includes('Download the React DevTools'))).toHaveLength(0)
    
    // Verify page content loads
    await expect(page.locator('h1')).toContainText('Wedding Planner')
    await expect(page.locator('text=Get Started')).toBeVisible()
    await expect(page.locator('text=Sign In')).toBeVisible()
    
    console.log('✅ Homepage loads without errors')
  })

  test('should navigate to sign-in page successfully', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')
    
    // Verify sign-in page loads
    await expect(page.locator('text=Welcome back')).toBeVisible()
    
    // Verify Clerk component loads (should show some form of sign-in UI)
    await expect(page.locator('[data-clerk-component]')).toBeVisible({ timeout: 10000 })
    
    console.log('✅ Sign-in page loads successfully')
  })

  test('should navigate to sign-up page successfully', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForLoadState('networkidle')
    
    // Verify sign-up page loads
    await expect(page.locator('text=Create your account')).toBeVisible()
    
    // Verify Clerk component loads
    await expect(page.locator('[data-clerk-component]')).toBeVisible({ timeout: 10000 })
    
    console.log('✅ Sign-up page loads successfully')
  })

  test('should protect dashboard route (redirect to sign-in)', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')
    
    // Should redirect to sign-in due to protection
    await page.waitForURL(/\/sign-in/, { timeout: 10000 })
    
    expect(page.url()).toContain('/sign-in')
    console.log('✅ Dashboard route is properly protected')
  })

  test('should have working middleware', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // Test various routes to ensure middleware works
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')
    
    // Verify no middleware errors
    const middlewareErrors = errors.filter(e => 
      e.includes('clerkMiddleware') || 
      e.includes('auth.protect') ||
      e.includes('middleware')
    )
    
    expect(middlewareErrors).toHaveLength(0)
    console.log('✅ Middleware working without errors')
  })
})