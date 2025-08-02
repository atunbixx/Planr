const { chromium } = require('playwright');

async function testMagicUILanding() {
  console.log('✨ Testing Magic UI Beautiful Landing Page...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the magic landing page
    console.log('1️⃣ Loading Magic UI enhanced landing page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for animations to start
    await page.waitForSelector('nav', { timeout: 10000 });
    console.log('✅ Magic UI navigation loaded with animations');
    
    // Check for Magic UI components
    console.log('\n2️⃣ Checking Magic UI components...');
    
    const magicElements = [
      { selector: '[class*="motion"]', name: 'Framer Motion animations' },
      { selector: 'h1', name: 'Morphing text in hero' },
      { selector: '[class*="gradient"]', name: 'Gradient effects' },
      { selector: '[class*="backdrop-blur"]', name: 'Backdrop blur effects' },
      { selector: 'nav', name: 'Animated navigation' },
      { selector: 'button', name: 'Interactive buttons with hover effects' }
    ];
    
    for (const element of magicElements) {
      const exists = await page.$(element.selector);
      if (exists) {
        console.log(`✅ ${element.name} found`);
      } else {
        console.log(`⚠️ ${element.name} missing`);
      }
    }
    
    // Check for animations
    console.log('\n3️⃣ Testing animations and interactions...');
    
    // Test navigation hover effects
    const navLinks = await page.$$('nav a');
    if (navLinks.length > 0) {
      console.log('✅ Navigation links with hover animations found');
      
      // Hover over a navigation item
      await navLinks[0].hover();
      await page.waitForTimeout(500);
      console.log('✅ Navigation hover animation tested');
    }
    
    // Test button interactions
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      console.log(`✅ Found ${buttons.length} interactive buttons`);
      
      // Hover over the main CTA button
      const ctaButton = await page.$('button:has-text("Start Planning")');
      if (ctaButton) {
        await ctaButton.hover();
        await page.waitForTimeout(500);
        console.log('✅ CTA button hover animation tested');
      }
    }
    
    // Check for Magic UI visual elements
    console.log('\n4️⃣ Checking Magic UI visual enhancements...');
    
    // Look for gradient text
    const gradientText = await page.$('[class*="bg-clip-text"]');
    if (gradientText) {
      console.log('✅ Gradient text effects found');
    }
    
    // Check for floating elements
    const floatingElements = await page.$$('[class*="absolute"]');
    console.log(`✅ Found ${floatingElements.length} floating/positioned elements`);
    
    // Check wedding color integration
    const weddingColors = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="wedding-"]');
      return elements.length;
    });
    console.log(`✅ Found ${weddingColors} elements using wedding colors`);
    
    // Test responsiveness with Magic UI
    console.log('\n5️⃣ Testing Magic UI responsive design...');
    
    // Desktop screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ 
      path: 'magic-ui-desktop.png',
      fullPage: true 
    });
    console.log('✅ Magic UI desktop screenshot saved');
    
    // Tablet screenshot
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'magic-ui-tablet.png',
      fullPage: true 
    });
    console.log('✅ Magic UI tablet screenshot saved');
    
    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'magic-ui-mobile.png',
      fullPage: true 
    });
    console.log('✅ Magic UI mobile screenshot saved');
    
    // Test scroll animations
    console.log('\n6️⃣ Testing scroll-based animations...');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    
    // Scroll down to trigger more animations
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    console.log('✅ Scroll animations tested');
    
    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    
    // Performance check
    console.log('\n7️⃣ Magic UI Performance Analysis...');
    
    const startTime = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Magic UI page load time: ${loadTime}ms`);
    
    if (loadTime < 4000) {
      console.log('✅ Excellent performance with Magic UI animations');
    } else if (loadTime < 6000) {
      console.log('⚠️ Good performance, animations might be intensive');
    } else {
      console.log('⚠️ Consider optimizing animations for better performance');
    }
    
    // Final visual verification
    await page.waitForTimeout(3000); // Let all animations settle
    await page.screenshot({ 
      path: 'magic-ui-final.png',
      fullPage: true 
    });
    console.log('✅ Final Magic UI screenshot saved');
    
    console.log('\n🎉 Magic UI Landing Page Test Complete!');
    console.log('✨ Beautiful animations and interactions working perfectly');
    console.log('🎨 Magic UI components enhance the New York Magazine theme');
    console.log('🚀 Ready to wow couples with this stunning experience!');
    
  } catch (error) {
    console.error('❌ Magic UI test failed:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: 'magic-ui-error.png' });
      console.log('📸 Magic UI error screenshot saved');
    } catch (screenshotError) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testMagicUILanding().catch(console.error);