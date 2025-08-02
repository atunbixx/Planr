const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Wedding Planner v2 Design System...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Loading home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    const results = await page.evaluate(() => {
      return {
        hasSerifHeadings: document.querySelector('.font-serif') !== null,
        headingText: document.querySelector('h1') ? document.querySelector('h1').textContent : 'Not found',
        hasWeddingColors: document.querySelector('[class*="wedding-"]') !== null,
        colorVars: {
          ink: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
          paper: getComputedStyle(document.documentElement).getPropertyValue('--color-paper').trim(),
          accent: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
        },
        buttonCount: document.querySelectorAll('button, .button, [role="button"]').length,
        hasCards: document.querySelector('.card-hover') !== null,
        weddingElementCount: document.querySelectorAll('[class*="wedding-"]').length
      };
    });
    
    console.log('✅ Design System Results:');
    console.log('========================');
    console.log('📝 Typography:');
    console.log(`  - Serif headings: ${results.hasSerifHeadings ? '✅ Yes' : '❌ No'}`);
    console.log(`  - Main heading: "${results.headingText}"`);
    
    console.log('\n🎨 Color System:');
    console.log(`  - Wedding colors in use: ${results.hasWeddingColors ? '✅ Yes' : '❌ No'}`);
    console.log(`  - Wedding elements count: ${results.weddingElementCount}`);
    console.log(`  - Ink color: ${results.colorVars.ink || 'NOT FOUND'}`);
    console.log(`  - Paper color: ${results.colorVars.paper || 'NOT FOUND'}`);
    console.log(`  - Accent color: ${results.colorVars.accent || 'NOT FOUND'}`);
    
    console.log('\n🔘 Interactive Elements:');
    console.log(`  - Button count: ${results.buttonCount}`);
    console.log(`  - Card hover effects: ${results.hasCards ? '✅ Yes' : '❌ No'}`);
    
    // Test auth pages
    console.log('\n🔐 Testing Auth Pages...');
    
    await page.goto('http://localhost:3000/auth/signin');
    const signinTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : 'No title found';
    });
    console.log(`  - Sign In page title: "${signinTitle}"`);
    
    await page.goto('http://localhost:3000/auth/signup');
    const signupTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : 'No title found';
    });
    console.log(`  - Sign Up page title: "${signupTitle}"`);
    
    // Test dashboard redirect
    console.log('\n🏪 Testing Protected Routes...');
    await page.goto('http://localhost:3000/dashboard/vendors');
    const finalUrl = page.url();
    console.log(`  - Vendor page redirect: ${finalUrl.includes('/auth/signin') ? '✅ Redirected to signin' : '❌ No redirect'}`);
    
    console.log('\n🎉 Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();