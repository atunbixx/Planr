import { test, expect } from '@playwright/test'

test.describe('Vendor Pages E2E Tests', () => {
  const testVendorSlug = 'test-photographer-studio'
  
  test.beforeAll(async ({ request }) => {
    // Set up test vendor data
    await request.post('/api/test/setup-vendor', {
      data: {
        slug: testVendorSlug,
        name: 'Test Photography Studio',
        category: 'Photography',
        city: 'New York',
        description: 'Professional wedding photography services',
        priceRange: '$2000-$5000',
        rating: 4.8,
        reviewCount: 127,
        photos: [
          '/images/vendor-1.jpg',
          '/images/vendor-2.jpg',
          '/images/vendor-3.jpg'
        ],
        website: 'https://testphotography.com',
        phone: '+1-555-123-4567',
        email: 'info@testphotography.com'
      }
    })
  })

  test('Vendor page SSR content and hydration', async ({ page }) => {
    // Navigate to vendor page
    await page.goto(`/vendors/${testVendorSlug}`)
    
    // Verify SSR content loads immediately (before hydration)
    await expect(page.locator('h1')).toContainText('Test Photography Studio')
    await expect(page.locator('[data-testid="vendor-category"]')).toContainText('Photography')
    await expect(page.locator('[data-testid="vendor-city"]')).toContainText('New York')
    
    // Wait for hydration to complete
    await page.waitForLoadState('networkidle')
    
    // Verify interactive elements work after hydration
    const imageGallery = page.locator('[data-testid="image-gallery"]')
    await expect(imageGallery).toBeVisible()
    
    // Test image gallery navigation (requires hydration)
    const nextButton = page.locator('[data-testid="gallery-next"]')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      // Verify image changed
      await expect(page.locator('[data-testid="gallery-image-1"]')).toBeVisible()
    }
    
    // Test contact form (requires hydration)
    const contactForm = page.locator('[data-testid="contact-form"]')
    await expect(contactForm).toBeVisible()
    
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('textarea[name="message"]', 'Interested in wedding photography')
    
    // Form should be interactive after hydration
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="contact-success"]')).toBeVisible()
  })

  test('Vendor page SEO and meta tags', async ({ page }) => {
    await page.goto(`/vendors/${testVendorSlug}`)
    
    // Verify page title
    await expect(page).toHaveTitle(/Test Photography Studio/)
    
    // Verify meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /Professional wedding photography services/)
    
    // Verify Open Graph tags
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Test Photography Studio/)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', new RegExp(`/vendors/${testVendorSlug}`))
    
    // Verify structured data (JSON-LD)
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent()
    expect(structuredData).toContain('LocalBusiness')
    expect(structuredData).toContain('Test Photography Studio')
  })

  test('Vendor page performance and loading', async ({ page }) => {
    // Start performance monitoring
    const startTime = Date.now()
    
    await page.goto(`/vendors/${testVendorSlug}`)
    
    // Verify critical content loads quickly
    await expect(page.locator('h1')).toBeVisible()
    const criticalLoadTime = Date.now() - startTime
    expect(criticalLoadTime).toBeLessThan(2000) // Critical content should load within 2s
    
    // Wait for full page load
    await page.waitForLoadState('networkidle')
    const fullLoadTime = Date.now() - startTime
    expect(fullLoadTime).toBeLessThan(5000) // Full page should load within 5s
    
    // Verify images are optimized and load properly
    const heroImage = page.locator('[data-testid="vendor-hero-image"]')
    await expect(heroImage).toBeVisible()
    
    // Check that images have proper loading attributes
    await expect(heroImage).toHaveAttribute('loading', 'eager')
    
    const galleryImages = page.locator('[data-testid="gallery-image"]')
    const firstGalleryImage = galleryImages.first()
    if (await firstGalleryImage.isVisible()) {
      await expect(firstGalleryImage).toHaveAttribute('loading', 'lazy')
    }
  })

  test('Vendor page responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`/vendors/${testVendorSlug}`)
    
    // Verify desktop layout
    const sidebar = page.locator('[data-testid="vendor-sidebar"]')
    await expect(sidebar).toBeVisible()
    
    const mainContent = page.locator('[data-testid="vendor-main"]')
    await expect(mainContent).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // Verify tablet layout adjustments
    await expect(page.locator('h1')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible()
    
    // Test mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    }
    
    // Test contact form on mobile
    const contactForm = page.locator('[data-testid="contact-form"]')
    await expect(contactForm).toBeVisible()
    
    // Verify form is properly sized on mobile
    const nameInput = page.locator('input[name="name"]')
    const inputBox = await nameInput.boundingBox()
    expect(inputBox?.width).toBeGreaterThan(200)
  })

  test('Vendor page image gallery functionality', async ({ page }) => {
    await page.goto(`/vendors/${testVendorSlug}`)
    await page.waitForLoadState('networkidle')
    
    const imageGallery = page.locator('[data-testid="image-gallery"]')
    await expect(imageGallery).toBeVisible()
    
    // Test image navigation
    const images = page.locator('[data-testid="gallery-image"]')
    const imageCount = await images.count()
    
    if (imageCount > 1) {
      // Test next button
      const nextButton = page.locator('[data-testid="gallery-next"]')
      await nextButton.click()
      
      // Verify image changed
      await page.waitForTimeout(500) // Wait for transition
      
      // Test previous button
      const prevButton = page.locator('[data-testid="gallery-prev"]')
      await prevButton.click()
      await page.waitForTimeout(500)
      
      // Test thumbnail navigation
      const thumbnails = page.locator('[data-testid="gallery-thumbnail"]')
      if (await thumbnails.count() > 1) {
        await thumbnails.nth(1).click()
        await page.waitForTimeout(500)
      }
    }
    
    // Test image modal/lightbox
    const mainImage = page.locator('[data-testid="gallery-main-image"]')
    await mainImage.click()
    
    const modal = page.locator('[data-testid="image-modal"]')
    if (await modal.isVisible()) {
      // Test modal navigation
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(300)
      
      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(300)
      
      // Close modal
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    }
  })

  test('Vendor contact form functionality', async ({ page }) => {
    await page.goto(`/vendors/${testVendorSlug}`)
    await page.waitForLoadState('networkidle')
    
    const contactForm = page.locator('[data-testid="contact-form"]')
    await expect(contactForm).toBeVisible()
    
    // Test form validation
    await page.click('button[type="submit"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="message-error"]')).toBeVisible()
    
    // Test invalid email
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('textarea[name="message"]', 'Test message')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email')
    
    // Test successful submission
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="phone"]', '+1-555-987-6543')
    await page.fill('input[name="eventDate"]', '2024-06-15')
    await page.fill('input[name="budget"]', '3000')
    
    await page.click('button[type="submit"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="contact-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="contact-success"]')).toContainText('Message sent successfully')
    
    // Verify form is reset or disabled after submission
    await expect(page.locator('input[name="name"]')).toHaveValue('')
  })

  test('Vendor page ISR (Incremental Static Regeneration)', async ({ page, request }) => {
    // First visit - should serve cached version
    await page.goto(`/vendors/${testVendorSlug}`)
    await expect(page.locator('h1')).toContainText('Test Photography Studio')
    
    // Update vendor data
    await request.post('/api/test/update-vendor', {
      data: {
        slug: testVendorSlug,
        name: 'Updated Photography Studio',
        description: 'Updated professional wedding photography services'
      }
    })
    
    // Trigger ISR revalidation
    await request.post(`/api/revalidate?path=/vendors/${testVendorSlug}`)
    
    // Wait for revalidation
    await page.waitForTimeout(2000)
    
    // Visit again - should serve updated content
    await page.goto(`/vendors/${testVendorSlug}`)
    await page.waitForLoadState('networkidle')
    
    // Verify updated content is served
    await expect(page.locator('h1')).toContainText('Updated Photography Studio')
  })

  test('Vendor page error handling', async ({ page }) => {
    // Test 404 for non-existent vendor
    await page.goto('/vendors/non-existent-vendor-slug')
    
    // Verify 404 page
    await expect(page.locator('[data-testid="vendor-not-found"]')).toBeVisible()
    await expect(page.locator('[data-testid="vendor-not-found"]')).toContainText('Vendor not found')
    
    // Verify proper HTTP status
    const response = await page.request.get('/vendors/non-existent-vendor-slug')
    expect(response.status()).toBe(404)
  })

  test('Vendor page accessibility compliance', async ({ page }) => {
    await page.goto(`/vendors/${testVendorSlug}`)
    await page.waitForLoadState('networkidle')
    
    // Check heading hierarchy
    await expect(page.locator('h1')).toBeVisible()
    
    // Check image alt texts
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      await expect(img).toHaveAttribute('alt')
    }
    
    // Check form labels
    await expect(page.locator('label[for="name"]')).toBeVisible()
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="message"]')).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Check focus indicators
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test skip links if present
    const skipLink = page.locator('[data-testid="skip-to-content"]')
    if (await skipLink.isVisible()) {
      await skipLink.click()
      await expect(page.locator('#main-content')).toBeFocused()
    }
  })

  test.afterAll(async ({ request }) => {
    // Clean up test vendor data
    await request.post('/api/test/cleanup-vendor', {
      data: {
        slug: testVendorSlug
      }
    })
  })
})