const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Wedding Planner v2 - Comprehensive Design System Test Report\n');
  console.log('================================================================\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Test home page
    console.log('📍 Testing Home Page (http://localhost:3001)...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    const homePageResults = await page.evaluate(() => {
      return {
        title: document.title,
        hasSerifHeadings: document.querySelector('.font-serif') !== null,
        headingText: document.querySelector('h1') ? document.querySelector('h1').textContent : 'Not found',
        hasWeddingColors: document.querySelector('[class*="wedding-"]') !== null,
        weddingElementCount: document.querySelectorAll('[class*="wedding-"]').length,
        colorVars: {
          ink: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
          paper: getComputedStyle(document.documentElement).getPropertyValue('--color-paper').trim(),
          accent: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
          weddingBlush: getComputedStyle(document.documentElement).getPropertyValue('--color-wedding-blush').trim(),
          weddingSage: getComputedStyle(document.documentElement).getPropertyValue('--color-wedding-sage').trim(),
          weddingGold: getComputedStyle(document.documentElement).getPropertyValue('--color-wedding-gold').trim()
        },
        buttonCount: document.querySelectorAll('button, .button, [role="button"]').length,
        hasCards: document.querySelector('.card-hover') !== null,
        hasContentWrapper: document.querySelector('.content-wrapper') !== null,
        hasPlayfairFont: document.querySelector('link[href*="Playfair"]') !== null || document.querySelector('style').textContent.includes('Playfair'),
        gradientBackground: document.querySelector('.bg-gradient-to-br') !== null
      };
    });
    
    console.log('✅ HOME PAGE RESULTS:');
    console.log('  📝 Typography & Fonts:');
    console.log(`     - Page title: "${homePageResults.title}"`);
    console.log(`     - Main heading: "${homePageResults.headingText}"`);
    console.log(`     - Serif headings (.font-serif): ${homePageResults.hasSerifHeadings ? '✅ Found' : '❌ Missing'}`);
    console.log(`     - Playfair Display loaded: ${homePageResults.hasPlayfairFont ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n  🎨 Color System:');
    console.log(`     - Wedding colors in use: ${homePageResults.hasWeddingColors ? '✅ Yes' : '❌ No'}`);
    console.log(`     - Wedding elements count: ${homePageResults.weddingElementCount}`);
    console.log(`     - Gradient background: ${homePageResults.gradientBackground ? '✅ Yes' : '❌ No'}`);
    console.log('     - CSS Variables:');
    Object.entries(homePageResults.colorVars).forEach(([key, value]) => {
      console.log(`       • ${key}: ${value || 'NOT FOUND'}`);
    });
    
    console.log('\n  🔘 Components & Layout:');
    console.log(`     - Buttons found: ${homePageResults.buttonCount}`);
    console.log(`     - Card hover effects: ${homePageResults.hasCards ? '✅ Yes' : '❌ No'}`);
    console.log(`     - Content wrapper: ${homePageResults.hasContentWrapper ? '✅ Yes' : '❌ No'}`);
    
    // Test auth pages
    console.log('\n🔐 Testing Authentication Pages...');
    
    // Sign In page
    await page.goto('http://localhost:3001/auth/signin');
    const signinResults = await page.evaluate(() => {
      return {
        title: document.title,
        heading: document.querySelector('h1') ? document.querySelector('h1').textContent : 'Not found',
        hasForm: document.querySelector('form') !== null,
        hasInputs: document.querySelectorAll('input').length,
        hasDesignSystem: document.querySelector('.font-serif, .text-ink, .bg-paper') !== null
      };
    });
    
    console.log('  📝 Sign In Page:');
    console.log(`     - Title: "${signinResults.title}"`);
    console.log(`     - Heading: "${signinResults.heading}"`);
    console.log(`     - Has form: ${signinResults.hasForm ? '✅ Yes' : '❌ No'}`);
    console.log(`     - Input count: ${signinResults.hasInputs}`);
    console.log(`     - Design system applied: ${signinResults.hasDesignSystem ? '✅ Yes' : '❌ No'}`);
    
    // Sign Up page
    await page.goto('http://localhost:3001/auth/signup');
    const signupResults = await page.evaluate(() => {
      return {
        title: document.title,
        heading: document.querySelector('h1') ? document.querySelector('h1').textContent : 'Not found',
        hasForm: document.querySelector('form') !== null,
        hasInputs: document.querySelectorAll('input').length
      };
    });
    
    console.log('\n  📝 Sign Up Page:');
    console.log(`     - Title: "${signupResults.title}"`);
    console.log(`     - Heading: "${signupResults.heading}"`);
    console.log(`     - Has form: ${signupResults.hasForm ? '✅ Yes' : '❌ No'}`);
    console.log(`     - Input count: ${signupResults.hasInputs}`);
    
    // Test protected routes
    console.log('\n🏪 Testing Protected Routes...');
    await page.goto('http://localhost:3001/dashboard/vendors');
    const vendorRedirect = page.url();
    console.log(`  - Vendor page redirect: ${vendorRedirect.includes('/auth/signin') ? '✅ Redirected to signin' : '❌ No redirect'}`);
    console.log(`  - Final URL: ${vendorRedirect}`);
    
    // Test responsive design
    console.log('\n📱 Testing Responsive Design...');
    await page.setViewport({ width: 375, height: 667 }); // Mobile
    await page.goto('http://localhost:3001');
    
    const mobileResults = await page.evaluate(() => {
      const header = document.querySelector('header');
      const navigation = document.querySelector('nav');
      return {
        headerExists: !!header,
        navigationExists: !!navigation,
        contentWidth: document.querySelector('.content-wrapper') ? 
          window.getComputedStyle(document.querySelector('.content-wrapper')).maxWidth : 'Not found'
      };
    });
    
    console.log('  📱 Mobile Layout:');
    console.log(`     - Header responsive: ${mobileResults.headerExists ? '✅ Yes' : '❌ No'}`);
    console.log(`     - Content wrapper max-width: ${mobileResults.contentWidth}`);
    
    console.log('\n🎉 Test Complete!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();