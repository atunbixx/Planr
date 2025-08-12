#!/usr/bin/env node
import { api } from '../src/lib/api/client'

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
}

// Test results tracking
const testResults: { endpoint: string; status: 'pass' | 'fail'; error?: string }[] = []

async function testEndpoint(name: string, testFn: () => Promise<void>) {
  try {
    await testFn()
    testResults.push({ endpoint: name, status: 'pass' })
    log.success(`${name} - PASSED`)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    testResults.push({ endpoint: name, status: 'fail', error: errorMsg })
    log.error(`${name} - FAILED: ${errorMsg}`)
  }
}

async function runIntegrationTests() {
  log.info('Starting API Integration Tests...\n')

  // Test Dashboard API
  await testEndpoint('Dashboard Stats', async () => {
    const response = await api.dashboard.stats()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch dashboard stats')
    }
    if (!response.data.wedding || !response.data.guests || !response.data.budget) {
      throw new Error('Dashboard stats missing required fields')
    }
  })

  await testEndpoint('Dashboard Activity', async () => {
    const response = await api.dashboard.activity(5)
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch dashboard activity')
    }
  })

  // Test Guest API
  await testEndpoint('Guest List', async () => {
    const response = await api.guests.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch guests')
    }
  })

  await testEndpoint('Guest Create', async () => {
    const response = await api.guests.create({
      firstName: 'Test',
      lastName: 'Guest',
      email: `test${Date.now()}@example.com`,
      rsvpStatus: 'pending'
    })
    if (!response.success || !response.data) {
      throw new Error('Failed to create guest')
    }
    
    // Clean up - delete the test guest
    if (response.data.id) {
      await api.guests.delete(response.data.id)
    }
  })

  // Test Vendor API
  await testEndpoint('Vendor List', async () => {
    const response = await api.vendors.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch vendors')
    }
  })

  await testEndpoint('Vendor Create', async () => {
    const response = await api.vendors.create({
      businessName: 'Test Vendor',
      category: 'photographer',
      status: 'potential'
    })
    if (!response.success || !response.data) {
      throw new Error('Failed to create vendor')
    }
    
    // Clean up - delete the test vendor
    if (response.data.id) {
      await api.vendors.delete(response.data.id)
    }
  })

  // Test Budget API
  await testEndpoint('Budget Summary', async () => {
    const response = await api.budget.summary()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch budget summary')
    }
  })

  await testEndpoint('Budget Categories', async () => {
    const response = await api.budget.categories.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch budget categories')
    }
  })

  // Test Checklist API
  await testEndpoint('Checklist Items', async () => {
    const response = await api.checklist.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch checklist')
    }
  })

  await testEndpoint('Checklist Create', async () => {
    const response = await api.checklist.create({
      title: 'Test Task',
      category: 'planning',
      priority: 'medium',
      completed: false
    })
    if (!response.success || !response.data) {
      throw new Error('Failed to create checklist item')
    }
    
    // Clean up - delete the test item
    if (response.data.id) {
      await api.checklist.delete(response.data.id)
    }
  })

  // Test Photos API
  await testEndpoint('Photos List', async () => {
    const response = await api.photos.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch photos')
    }
  })

  await testEndpoint('Albums List', async () => {
    const response = await api.albums.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch albums')
    }
  })

  // Test Messages API
  await testEndpoint('Message Templates', async () => {
    const response = await api.messages.templates.list()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch message templates')
    }
  })

  await testEndpoint('Message Logs', async () => {
    const response = await api.messages.logs()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch message logs')
    }
  })

  // Test Settings API
  await testEndpoint('User Preferences', async () => {
    const response = await api.settings.preferences.get()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user preferences')
    }
  })

  await testEndpoint('Wedding Details', async () => {
    const response = await api.settings.wedding.get()
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch wedding details')
    }
  })

  // Print summary
  console.log('\n' + '='.repeat(50))
  log.info('Test Summary:')
  const passed = testResults.filter(r => r.status === 'pass').length
  const failed = testResults.filter(r => r.status === 'fail').length
  
  console.log(`Total Tests: ${testResults.length}`)
  log.success(`Passed: ${passed}`)
  if (failed > 0) {
    log.error(`Failed: ${failed}`)
    console.log('\nFailed Tests:')
    testResults.filter(r => r.status === 'fail').forEach(r => {
      log.error(`- ${r.endpoint}: ${r.error}`)
    })
  }
  
  console.log('='.repeat(50))
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runIntegrationTests().catch(error => {
  log.error(`Test runner failed: ${error.message}`)
  process.exit(1)
})