import { randomBytes } from 'crypto'

/**
 * Test utilities for E2E tests
 */
export class TestSetup {
  /**
   * Generate unique test identifiers
   */
  static generateTestId(): string {
    return randomBytes(4).toString('hex')
  }

  /**
   * Generate test email address
   */
  static generateTestEmail(prefix: string = 'test'): string {
    const testId = this.generateTestId()
    return `${prefix}-${testId}@example.com`
  }

  /**
   * Generate test invite token
   */
  static generateInviteToken(): string {
    const testId = this.generateTestId()
    return `invite_${testId}_${Date.now()}`
  }

  /**
   * Generate test vendor slug
   */
  static generateVendorSlug(category: string = 'photographer'): string {
    const testId = this.generateTestId()
    return `test-${category}-${testId}`
  }

  /**
   * Wait for element to be stable (not moving)
   */
  static async waitForStableElement(page: any, selector: string, timeout: number = 5000): Promise<void> {
    let previousPosition: { x: number; y: number } | null = null
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        const element = page.locator(selector)
        const box = await element.boundingBox()
        
        if (box) {
          const currentPosition = { x: box.x, y: box.y }
          
          if (previousPosition && 
              Math.abs(currentPosition.x - previousPosition.x) < 1 &&
              Math.abs(currentPosition.y - previousPosition.y) < 1) {
            return // Element is stable
          }
          
          previousPosition = currentPosition
        }
      } catch (error) {
        // Element might not be visible yet
      }
      
      await page.waitForTimeout(100)
    }
  }

  /**
   * Hide dynamic elements that cause visual test flakiness
   */
  static async hideDynamicElements(page: any): Promise<void> {
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], 
        [data-testid="last-updated"],
        [data-testid="current-time"],
        .loading-spinner,
        .animate-pulse,
        .skeleton,
        .animate-spin,
        .animate-bounce,
        .transition-all,
        .duration-300,
        .duration-500 {
          visibility: hidden !important;
          animation: none !important;
          transition: none !important;
        }
        
        /* Disable all animations for visual tests */
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    })
  }

  /**
   * Wait for all images to load
   */
  static async waitForImages(page: any): Promise<void> {
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('img')
      return Array.from(images).every(img => img.complete && img.naturalHeight !== 0)
    }, { timeout: 10000 })
  }

  /**
   * Set up authenticated session
   */
  static async setupAuthSession(page: any, token: string = 'test-auth-token'): Promise<void> {
    await page.addInitScript((authToken) => {
      localStorage.setItem('auth-token', authToken)
    }, token)
  }

  /**
   * Set up theme
   */
  static async setupTheme(page: any, theme: 'light' | 'dark' = 'light'): Promise<void> {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem('theme', selectedTheme)
    }, theme)
  }

  /**
   * Mock API responses for testing
   */
  static async mockApiResponse(page: any, url: string, response: any): Promise<void> {
    await page.route(url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      })
    })
  }

  /**
   * Mock API error responses
   */
  static async mockApiError(page: any, url: string, status: number = 500, message: string = 'Internal Server Error'): Promise<void> {
    await page.route(url, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: message })
      })
    })
  }

  /**
   * Fill form with test data
   */
  static async fillRSVPForm(page: any, data: {
    email?: string
    status?: 'accepted' | 'declined' | 'pending'
    partySize?: string
    notes?: string
  }): Promise<void> {
    if (data.email) {
      await page.fill('input[name="email"]', data.email)
    }
    if (data.status) {
      await page.selectOption('select[name="status"]', data.status)
    }
    if (data.partySize) {
      await page.fill('input[name="partySize"]', data.partySize)
    }
    if (data.notes) {
      await page.fill('textarea[name="notes"]', data.notes)
    }
  }

  /**
   * Fill contact form with test data
   */
  static async fillContactForm(page: any, data: {
    name?: string
    email?: string
    phone?: string
    message?: string
    eventDate?: string
    budget?: string
  }): Promise<void> {
    if (data.name) {
      await page.fill('input[name="name"]', data.name)
    }
    if (data.email) {
      await page.fill('input[name="email"]', data.email)
    }
    if (data.phone) {
      await page.fill('input[name="phone"]', data.phone)
    }
    if (data.message) {
      await page.fill('textarea[name="message"]', data.message)
    }
    if (data.eventDate) {
      await page.fill('input[name="eventDate"]', data.eventDate)
    }
    if (data.budget) {
      await page.fill('input[name="budget"]', data.budget)
    }
  }

  /**
   * Assert element accessibility
   */
  static async assertAccessibility(page: any, selector: string): Promise<void> {
    const element = page.locator(selector)
    
    // Check if element is focusable
    await element.focus()
    await expect(element).toBeFocused()
    
    // Check for ARIA attributes
    const ariaLabel = await element.getAttribute('aria-label')
    const ariaLabelledBy = await element.getAttribute('aria-labelledby')
    const ariaDescribedBy = await element.getAttribute('aria-describedby')
    
    // Element should have some form of accessible name
    expect(ariaLabel || ariaLabelledBy || ariaDescribedBy).toBeTruthy()
  }

  /**
   * Test keyboard navigation
   */
  static async testKeyboardNavigation(page: any, selectors: string[]): Promise<void> {
    for (let i = 0; i < selectors.length; i++) {
      await page.keyboard.press('Tab')
      await expect(page.locator(selectors[i])).toBeFocused()
    }
  }

  /**
   * Test responsive breakpoints
   */
  static async testResponsiveBreakpoints(page: any, callback: (viewport: { width: number; height: number }) => Promise<void>): Promise<void> {
    const breakpoints = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1024, height: 768 },  // Desktop small
      { width: 1280, height: 800 },  // Desktop medium
      { width: 1920, height: 1080 }  // Desktop large
    ]

    for (const viewport of breakpoints) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500) // Wait for layout to settle
      await callback(viewport)
    }
  }

  /**
   * Measure performance metrics
   */
  static async measurePerformance(page: any): Promise<{
    loadTime: number
    domContentLoaded: number
    firstContentfulPaint: number
  }> {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      }
    })

    return performanceMetrics
  }

  /**
   * Clean up test data
   */
  static async cleanup(page: any, data: {
    inviteTokens?: string[]
    vendorSlugs?: string[]
    userIds?: string[]
  }): Promise<void> {
    if (data.inviteTokens) {
      for (const token of data.inviteTokens) {
        await page.request.post('/api/test/cleanup-invite', {
          data: { token }
        })
      }
    }

    if (data.vendorSlugs) {
      for (const slug of data.vendorSlugs) {
        await page.request.post('/api/test/cleanup-vendor', {
          data: { slug }
        })
      }
    }

    if (data.userIds) {
      for (const userId of data.userIds) {
        await page.request.post('/api/test/cleanup-user', {
          data: { userId }
        })
      }
    }
  }
}