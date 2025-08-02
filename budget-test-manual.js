const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Opening browser for manual budget UI testing...');
    console.log('Please manually login and navigate to the budget page.');
    console.log('Press Ctrl+C when done to close the browser.');
    
    // Navigate to the app
    await page.goto('http://localhost:4002');
    
    // Keep browser open for manual testing
    await new Promise(() => {});
    
  } catch (error) {
    if (error.message.includes('SIGINT')) {
      console.log('\nClosing browser...');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await browser.close();
  }
})();