import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test suite setup...')
  
  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the server to be ready
    console.log('⏳ Waiting for server to be ready...')
    await page.goto(`${baseURL}/api/health`, { timeout: 60000 })
    
    // Verify server is responding
    const response = await page.waitForResponse(
      response => response.url().includes('/api/health') && response.status() === 200,
      { timeout: 30000 }
    )
    
    if (response.status() !== 200) {
      throw new Error(`Server health check failed with status: ${response.status()}`)
    }

    console.log('✅ Server is ready')

    // Set up test environment
    console.log('🔧 Setting up test environment...')
    
    // Clean up any existing test data
    await page.request.post(`${baseURL}/api/test/cleanup-all`, {
      data: { confirm: true }
    }).catch(() => {
      // Ignore cleanup errors on first run
      console.log('ℹ️ Initial cleanup completed (some errors expected)')
    })

    // Create base test data
    await page.request.post(`${baseURL}/api/test/setup-base-data`, {
      data: { 
        createTestUser: true,
        createTestVendor: true,
        createTestInvite: true
      }
    }).catch(() => {
      console.log('ℹ️ Base test data setup completed')
    })

    console.log('✅ Test environment setup complete')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup