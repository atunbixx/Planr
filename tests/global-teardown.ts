import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test suite teardown...')
  
  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Clean up all test data
    console.log('🗑️ Cleaning up test data...')
    
    await page.request.post(`${baseURL}/api/test/cleanup-all`, {
      data: { confirm: true }
    }).catch((error) => {
      console.log('⚠️ Cleanup warning:', error.message)
    })

    console.log('✅ Test data cleanup complete')

  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close()
  }

  console.log('🏁 E2E test suite teardown complete')
}

export default globalTeardown