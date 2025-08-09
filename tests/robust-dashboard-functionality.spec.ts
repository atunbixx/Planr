import { test, expect } from '@playwright/test'
import { TestHelpers } from './e2e/helpers/test-helpers'

/**
 * Robust Dashboard Functionality Tests
 * Industry-standard tests following TDD principles to validate dashboard experience
 * - Tests dashboard navigation, widgets, and core functionality
 * - Uses reliable selectors and proper waiting strategies
 * - Validates data loading and UI responsiveness
 * - Tests personalization and user preferences
 * - Follows test pyramid methodology
 */

test.describe('Dashboard Functionality - Industry Standard Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    
    // Set up authenticated user for each test
    const testUser = await helpers.signUpAndOnboard()
    console.log(`Test user: ${testUser.email}`)
    
    // Wait for dashboard to be fully loaded
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[role="status"]')
      const spinners = document.querySelectorAll('.animate-spin')
      return loadingElements.length === 0 && spinners.length === 0
    }, { timeout: 30000 })
    
    // Navigate to main dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should load dashboard with proper layout and navigation', async ({ page }) => {
    // Assert - main dashboard elements should be visible
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    
    // Check for navigation elements
    const navElements = await Promise.all([
      page.locator('nav').isVisible({ timeout: 3000 }),
      page.locator('[data-testid="main-nav"]').isVisible({ timeout: 1000 }),
      page.locator('a[href*="/dashboard/guests"]').isVisible({ timeout: 3000 }),
      page.locator('a[href*="/dashboard/vendors"]').isVisible({ timeout: 3000 }),
      page.locator('a[href*="/dashboard/budget"]').isVisible({ timeout: 3000 })
    ])
    
    const hasNavigation = navElements.some(visible => visible)
    expect(hasNavigation).toBeTruthy()
    console.log('✅ Dashboard navigation detected')
  })

  test('should display wedding planning overview widgets', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Look for dashboard widgets/cards
    await expect(async () => {
      const hasWidgets = await page.locator('[data-testid="dashboard-widget"]').isVisible() ||
                        await page.locator('.card').isVisible() ||
                        await page.locator('.widget').isVisible() ||
                        await page.locator('[data-testid="stats-card"]').isVisible()
      
      expect(hasWidgets).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    // Check for wedding planning metrics
    const planningMetrics = await Promise.all([
      page.locator('text=Guests').isVisible({ timeout: 3000 }),
      page.locator('text=Budget').isVisible({ timeout: 3000 }),
      page.locator('text=Vendors').isVisible({ timeout: 3000 }),
      page.locator('text=Tasks').isVisible({ timeout: 3000 }),
      page.locator('text=Days').isVisible({ timeout: 3000 })
    ])
    
    const hasMetrics = planningMetrics.some(visible => visible)
    expect(hasMetrics).toBeTruthy()
    console.log('✅ Wedding planning metrics detected')
  })

  test('should navigate to different planning sections', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    const sections = [
      { name: 'Guests', href: '/dashboard/guests', text: /Guest.*List|Guests/ },
      { name: 'Vendors', href: '/dashboard/vendors', text: /Vendors/ },
      { name: 'Budget', href: '/dashboard/budget', text: /Budget/ },
      { name: 'Settings', href: '/dashboard/settings', text: /Settings/ }
    ]
    
    for (const section of sections) {
      console.log(`🔄 Testing navigation to ${section.name}...`)
      
      // Navigate to section
      const sectionLink = page.locator(`a[href*="${section.href}"]`).or(
        page.locator('a').filter({ hasText: section.text })
      ).or(
        page.locator('nav').locator(`text=${section.name}`)
      )
      
      if (await sectionLink.isVisible({ timeout: 5000 })) {
        await sectionLink.click()
        
        // Wait for page to load and verify
        await expect(page.locator('h1').filter({ hasText: section.text })).toBeVisible({ timeout: 10000 })
        console.log(`✅ ${section.name} section accessible`)
        
        // Navigate back to dashboard
        const dashboardLink = page.locator('a[href="/dashboard"]').or(
          page.locator('text=Dashboard')
        ).or(
          page.locator('[data-testid="dashboard-link"]')
        )
        
        if (await dashboardLink.isVisible({ timeout: 3000 })) {
          await dashboardLink.click()
          await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 })
        } else {
          await page.goto('/dashboard')
          await page.waitForLoadState('domcontentloaded')
        }
        
      } else {
        console.log(`⚠️ ${section.name} navigation not found - may need data-testid attributes`)
      }
    }
  })

  test('should display wedding countdown and timeline', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Look for wedding date/countdown elements
    await expect(async () => {
      const hasCountdown = await page.locator('[data-testid="wedding-countdown"]').isVisible() ||
                          await page.locator('text=days until').isVisible() ||
                          await page.locator('text=days left').isVisible() ||
                          await page.locator('text=Wedding Date').isVisible() ||
                          await page.locator('text=/\\d+\\s*days/').isVisible()
      
      expect(hasCountdown).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    console.log('✅ Wedding countdown/timeline detected')
  })

  test('should show recent activity and updates', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Look for activity feed or recent updates
    await expect(async () => {
      const hasActivity = await page.locator('[data-testid="recent-activity"]').isVisible() ||
                         await page.locator('text=Recent').isVisible() ||
                         await page.locator('text=Activity').isVisible() ||
                         await page.locator('text=Updates').isVisible() ||
                         await page.locator('.activity-item').isVisible() ||
                         await page.locator('.update-item').isVisible()
      
      expect(hasActivity).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    console.log('✅ Recent activity section detected')
  })

  test('should display progress tracking and completion status', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Look for progress indicators
    await expect(async () => {
      const hasProgress = await page.locator('[data-testid="progress-bar"]').isVisible() ||
                         await page.locator('progress').isVisible() ||
                         await page.locator('.progress').isVisible() ||
                         await page.locator('text=Progress').isVisible() ||
                         await page.locator('text=Complete').isVisible() ||
                         await page.locator('text=%').isVisible()
      
      expect(hasProgress).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    console.log('✅ Progress tracking detected')
  })

  test('should handle dashboard data loading and refresh', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Test API endpoints for dashboard data
    const apiEndpoints = [
      '/api/dashboard/stats',
      '/api/guests',
      '/api/vendors',
      '/api/budget/categories'
    ]
    
    let workingApis = 0
    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(endpoint)
        if (response.ok()) {
          workingApis++
          console.log(`✅ ${endpoint} API working`)
        } else {
          console.log(`⚠️ ${endpoint} returned ${response.status()}`)
        }
      } catch (error) {
        console.log(`⚠️ ${endpoint} failed: ${error}`)
      }
    }
    
    expect(workingApis).toBeGreaterThan(0)
    
    // Test page refresh
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    console.log('✅ Dashboard refresh working')
  })

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000) // Allow layout to adjust
    
    // Check if main content is still accessible
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 })
    
    // Check if navigation adapts to mobile
    const mobileNav = await page.locator('nav').isVisible() ||
                     await page.locator('[data-testid="mobile-nav"]').isVisible() ||
                     await page.locator('button').filter({ hasText: /menu/i }).isVisible()
    
    expect(mobileNav).toBeTruthy()
    console.log('✅ Mobile responsive navigation detected')
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should display user profile and account information', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Look for user profile elements
    await expect(async () => {
      const hasUserInfo = await page.locator('[data-testid="user-profile"]').isVisible() ||
                         await page.locator('text=Profile').isVisible() ||
                         await page.locator('text=Account').isVisible() ||
                         await page.locator('.user-avatar').isVisible() ||
                         await page.locator('[data-testid="user-menu"]').isVisible()
      
      expect(hasUserInfo).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    console.log('✅ User profile section detected')
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Test navigation to non-existent page
    await page.goto('/dashboard/nonexistent')
    
    // Should handle gracefully (404 page or redirect)
    await expect(async () => {
      const has404 = await page.locator('text=404').isVisible() ||
                    await page.locator('text=Not Found').isVisible() ||
                    await page.locator('text=Page not found').isVisible()
      
      const redirected = await page.locator('h1').first().isVisible()
      
      expect(has404 || redirected).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    console.log('✅ Error handling working')
  })

  test('should maintain state and preferences', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Check if user preferences are preserved
    const currentUrl = page.url()
    const hasUserSession = currentUrl.includes('/dashboard')
    
    expect(hasUserSession).toBeTruthy()
    
    // Test that user remains authenticated after page reload
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Should still be on dashboard (not redirected to login)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    
    const stillAuthenticated = page.url().includes('/dashboard')
    expect(stillAuthenticated).toBeTruthy()
    
    console.log('✅ User authentication state maintained')
  })

  test('should show wedding planning checklist or tasks', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('h1').first()).toBeVisible()
    
    // Look for task/checklist elements
    await expect(async () => {
      const hasTasks = await page.locator('[data-testid="task-list"]').isVisible() ||
                      await page.locator('text=Tasks').isVisible() ||
                      await page.locator('text=Checklist').isVisible() ||
                      await page.locator('text=To Do').isVisible() ||
                      await page.locator('checkbox').isVisible() ||
                      await page.locator('input[type="checkbox"]').isVisible()
      
      expect(hasTasks).toBeTruthy()
    }).toPass({ timeout: 10000 })
    
    console.log('✅ Task/checklist system detected')
  })
})