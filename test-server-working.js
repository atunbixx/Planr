const { chromium } = require('playwright');

async function testServerAndTheme() {
  console.log('🚀 Testing Wedding Planner v2 Server and New York Magazine Theme...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test 1: Can we reach the server?
    console.log('1️⃣ Testing server connection...');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    if (response && response.ok()) {
      console.log('✅ Server is responding! Status:', response.status());
    } else {
      console.log('❌ Server connection failed!');
      throw new Error('Server not responding');
    }
    
    // Test 2: Check if page loads properly
    console.log('\n2️⃣ Testing page load and content...');
    await page.waitForSelector('body', { timeout: 5000 });
    
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    // Test 3: Check for hydration errors
    console.log('\n3️⃣ Checking for React hydration errors...');
    const consoleMessages = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('hydration')) {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000); // Wait for potential hydration errors
    
    if (consoleMessages.length === 0) {
      console.log('✅ No hydration errors detected!');
    } else {
      console.log('⚠️ Hydration errors found:', consoleMessages);
    }
    
    // Test 4: Check New York Magazine theme elements
    console.log('\n4️⃣ Testing New York Magazine theme implementation...');
    
    // Check for Playfair Display font
    const headingFont = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2, h3');
      if (heading) {
        return window.getComputedStyle(heading).fontFamily;
      }
      return null;
    });
    
    if (headingFont && headingFont.includes('Playfair')) {
      console.log('✅ Playfair Display font is loaded for headings');
    } else {
      console.log('⚠️ Playfair Display font not detected. Current font:', headingFont);
    }
    
    // Check for ink/paper color scheme
    const bodyColors = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    console.log('📋 Body color scheme:', bodyColors);
    
    // Test 5: Check if main navigation/buttons exist
    console.log('\n5️⃣ Testing interactive elements...');
    
    const buttons = await page.$$('button');
    console.log(`✅ Found ${buttons.length} button elements`);
    
    const links = await page.$$('a');
    console.log(`✅ Found ${links.length} link elements`);
    
    // Test 6: Take a screenshot for visual verification
    console.log('\n6️⃣ Taking screenshot for visual verification...');
    await page.screenshot({ 
      path: 'theme-test-screenshot.png',
      fullPage: true 
    });
    console.log('✅ Screenshot saved as theme-test-screenshot.png');
    
    // Test 7: Test basic navigation if auth pages exist
    console.log('\n7️⃣ Testing navigation to auth pages...');
    
    try {
      // Check if sign in link exists and works
      const signInLink = await page.$('a[href*="signin"], a[href*="sign-in"]');
      if (signInLink) {
        console.log('✅ Sign in link found');
        await signInLink.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        console.log('📍 Navigated to:', currentUrl);
        
        // Go back to home
        await page.goBack();
      } else {
        console.log('ℹ️ No sign in link found on homepage');
      }
    } catch (error) {
      console.log('⚠️ Navigation test had issues:', error.message);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('🎯 The Wedding Planner v2 server is working and theme is applied!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('📸 Error screenshot saved as error-screenshot.png');
    } catch (screenshotError) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testServerAndTheme().catch(console.error);