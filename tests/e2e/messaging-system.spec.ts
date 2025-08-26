import { test, expect } from '@playwright/test'
import { randomBytes } from 'crypto'

test.describe('Messaging System E2E Tests', () => {
  let testUserId: string
  let testEmail: string
  let authToken: string

  test.beforeAll(async ({ request }) => {
    // Create test user and get auth token
    const testId = randomBytes(4).toString('hex')
    testEmail = `messaging-test-${testId}@example.com`
    
    const response = await request.post('/api/test/create-user', {
      data: {
        email: testEmail,
        password: 'testpassword123',
        role: 'couple'
      }
    })
    
    const userData = await response.json()
    testUserId = userData.userId
    authToken = userData.token
    
    // Set up initial credit balance
    await request.post('/api/test/setup-credits', {
      data: {
        userId: testUserId,
        credits: 1000
      }
    })
  })

  test('Messaging credit deduction flow', async ({ page }) => {
    // Set auth token
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    // Navigate to messaging dashboard
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Verify initial credit balance
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('1000')
    
    // Navigate to send message form
    await page.click('[data-testid="send-message-button"]')
    
    // Fill out message form
    await page.fill('input[name="to"]', 'recipient@example.com')
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'Test Wedding Invitation')
    await page.fill('textarea[name="content"]', 'You are invited to our wedding!')
    
    // Verify cost calculation
    await expect(page.locator('[data-testid="message-cost"]')).toContainText('5 credits')
    
    // Send message
    await page.click('button[type="submit"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="message-success"]')).toContainText('Message sent successfully')
    
    // Verify credit deduction
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('995')
    
    // Verify message appears in sent messages
    await expect(page.locator('[data-testid="sent-messages"]')).toContainText('Test Wedding Invitation')
    await expect(page.locator('[data-testid="message-status"]')).toContainText('Sent')
  })

  test('Insufficient credits handling', async ({ page }) => {
    // Set up user with low credits
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    // Set credits to 2 (less than message cost)
    await page.request.post('/api/test/set-credits', {
      data: {
        userId: testUserId,
        credits: 2
      }
    })
    
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Verify low credit balance
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('2')
    
    // Try to send message
    await page.click('[data-testid="send-message-button"]')
    
    await page.fill('input[name="to"]', 'recipient@example.com')
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'Test Message')
    await page.fill('textarea[name="content"]', 'Test content')
    
    // Verify cost warning
    await expect(page.locator('[data-testid="insufficient-credits-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="insufficient-credits-warning"]')).toContainText('Insufficient credits')
    
    // Submit button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    
    // Try to submit anyway (should fail)
    await page.click('button[type="submit"]', { force: true })
    
    // Verify error message
    await expect(page.locator('[data-testid="message-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="message-error"]')).toContainText('Insufficient credits')
    
    // Verify credits weren't deducted
    await page.reload()
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('2')
  })

  test('Bulk messaging with credit calculation', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    // Set up sufficient credits
    await page.request.post('/api/test/set-credits', {
      data: {
        userId: testUserId,
        credits: 500
      }
    })
    
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Navigate to bulk messaging
    await page.click('[data-testid="bulk-message-button"]')
    
    // Upload recipient list or add multiple recipients
    await page.fill('textarea[name="recipients"]', 'guest1@example.com\nguest2@example.com\nguest3@example.com')
    
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'Wedding Invitation')
    await page.fill('textarea[name="content"]', 'You are invited to our wedding celebration!')
    
    // Verify bulk cost calculation
    await expect(page.locator('[data-testid="bulk-cost"]')).toContainText('15 credits') // 3 recipients × 5 credits
    await expect(page.locator('[data-testid="recipient-count"]')).toContainText('3 recipients')
    
    // Send bulk message
    await page.click('button[type="submit"]')
    
    // Verify bulk sending progress
    await expect(page.locator('[data-testid="bulk-progress"]')).toBeVisible()
    
    // Wait for completion
    await expect(page.locator('[data-testid="bulk-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-success"]')).toContainText('3 messages sent successfully')
    
    // Verify credit deduction
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('485') // 500 - 15
  })

  test('Message provider failover', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    // Simulate primary provider failure
    await page.request.post('/api/test/simulate-provider-failure', {
      data: {
        provider: 'resend',
        failureType: 'timeout'
      }
    })
    
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Send message (should failover to backup provider)
    await page.click('[data-testid="send-message-button"]')
    
    await page.fill('input[name="to"]', 'failover-test@example.com')
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'Failover Test')
    await page.fill('textarea[name="content"]', 'Testing provider failover')
    
    await page.click('button[type="submit"]')
    
    // Should still succeed with backup provider
    await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
    
    // Verify message was sent via backup provider
    await expect(page.locator('[data-testid="provider-used"]')).toContainText('twilio') // backup provider
    
    // Reset provider failure
    await page.request.post('/api/test/reset-provider-failure', {
      data: {
        provider: 'resend'
      }
    })
  })

  test('Message template system', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Create message template
    await page.click('[data-testid="create-template-button"]')
    
    await page.fill('input[name="templateName"]', 'Wedding Invitation')
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'You\'re Invited: {{coupleName}} Wedding')
    await page.fill('textarea[name="content"]', `
      Dear {{guestName}},
      
      You are cordially invited to the wedding of {{coupleName}}.
      
      Date: {{weddingDate}}
      Venue: {{venue}}
      
      Please RSVP by {{rsvpDeadline}}.
      
      Best regards,
      {{coupleName}}
    `)
    
    await page.click('button[type="submit"]')
    
    // Verify template created
    await expect(page.locator('[data-testid="template-success"]')).toBeVisible()
    
    // Use template to send message
    await page.click('[data-testid="send-message-button"]')
    await page.selectOption('select[name="template"]', 'Wedding Invitation')
    
    // Verify template content is loaded
    await expect(page.locator('input[name="subject"]')).toHaveValue('You\'re Invited: {{coupleName}} Wedding')
    
    // Fill template variables
    await page.fill('input[name="to"]', 'guest@example.com')
    await page.fill('input[name="coupleName"]', 'John & Jane')
    await page.fill('input[name="guestName"]', 'Alice Smith')
    await page.fill('input[name="weddingDate"]', 'June 15, 2024')
    await page.fill('input[name="venue"]', 'Grand Ballroom')
    await page.fill('input[name="rsvpDeadline"]', 'May 15, 2024')
    
    // Preview message
    await page.click('[data-testid="preview-button"]')
    
    // Verify template variables are replaced in preview
    await expect(page.locator('[data-testid="preview-subject"]')).toContainText('You\'re Invited: John & Jane Wedding')
    await expect(page.locator('[data-testid="preview-content"]')).toContainText('Dear Alice Smith')
    await expect(page.locator('[data-testid="preview-content"]')).toContainText('June 15, 2024')
    
    // Send templated message
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
  })

  test('Message delivery tracking', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Send message with tracking
    await page.click('[data-testid="send-message-button"]')
    
    await page.fill('input[name="to"]', 'tracking-test@example.com')
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'Delivery Tracking Test')
    await page.fill('textarea[name="content"]', 'Testing message delivery tracking')
    
    // Enable delivery tracking
    await page.check('input[name="enableTracking"]')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
    
    // Navigate to message history
    await page.click('[data-testid="message-history-tab"]')
    
    // Verify message appears with tracking info
    const messageRow = page.locator('[data-testid="message-row"]').first()
    await expect(messageRow).toContainText('Delivery Tracking Test')
    await expect(messageRow).toContainText('Sent')
    
    // Click to view details
    await messageRow.click()
    
    // Verify delivery details
    await expect(page.locator('[data-testid="delivery-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="sent-timestamp"]')).toBeVisible()
    await expect(page.locator('[data-testid="provider-info"]')).toBeVisible()
  })

  test('Message rate limiting', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth-token', token)
    }, authToken)
    
    await page.goto('/dashboard/messaging')
    await page.waitForLoadState('networkidle')
    
    // Send multiple messages rapidly to trigger rate limiting
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="send-message-button"]')
      
      await page.fill('input[name="to"]', `ratelimit-test-${i}@example.com`)
      await page.selectOption('select[name="channel"]', 'email')
      await page.fill('input[name="subject"]', `Rate Limit Test ${i}`)
      await page.fill('textarea[name="content"]', `Testing rate limiting - message ${i}`)
      
      await page.click('button[type="submit"]')
      
      if (i < 3) {
        // First few should succeed
        await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
      } else {
        // Later ones should be rate limited
        await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible()
        await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('Rate limit exceeded')
        break
      }
      
      // Close success/error message
      await page.click('[data-testid="close-message"]')
    }
    
    // Wait for rate limit to reset
    await page.waitForTimeout(60000) // 1 minute
    
    // Try sending again - should work
    await page.click('[data-testid="send-message-button"]')
    await page.fill('input[name="to"]', 'after-ratelimit@example.com')
    await page.selectOption('select[name="channel"]', 'email')
    await page.fill('input[name="subject"]', 'After Rate Limit')
    await page.fill('textarea[name="content"]', 'This should work after rate limit reset')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
  })

  test.afterAll(async ({ request }) => {
    // Clean up test user and data
    await request.post('/api/test/cleanup-user', {
      data: {
        userId: testUserId
      }
    })
  })
})