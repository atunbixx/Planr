const puppeteer = require('puppeteer');
const fs = require('fs');

async function testDesignSystem() {
    console.log('🚀 Starting Wedding Planner v2 Design System Test...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true,
        defaultViewport: { width: 1440, height: 900 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Browser Error:', msg.text());
            } else if (msg.type() === 'warning') {
                console.log('⚠️ Browser Warning:', msg.text());
            }
        });
        
        // Navigate to home page
        console.log('📍 Testing Home Page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Take screenshot of home page
        await page.screenshot({ path: 'home-page-test.png', fullPage: true });
        console.log('✅ Home page screenshot saved');
        
        // Test 1: Typography - Check if Playfair Display is loaded
        console.log('\n📝 Testing Typography...');
        const headingFont = await page.evaluate(() => {
            const heading = document.querySelector('h1');
            return window.getComputedStyle(heading).fontFamily;
        });
        console.log('Heading font family:', headingFont);
        
        // Test 2: Color System - Check CSS variables
        console.log('\n🎨 Testing Color System...');
        const colorVars = await page.evaluate(() => {
            const rootStyles = window.getComputedStyle(document.documentElement);
            return {
                ink: rootStyles.getPropertyValue('--color-ink').trim(),
                paper: rootStyles.getPropertyValue('--color-paper').trim(),
                accent: rootStyles.getPropertyValue('--color-accent').trim(),
                weddingBlush: rootStyles.getPropertyValue('--color-wedding-blush').trim(),
                weddingSage: rootStyles.getPropertyValue('--color-wedding-sage').trim(),
                weddingGold: rootStyles.getPropertyValue('--color-wedding-gold').trim()
            };
        });
        
        Object.entries(colorVars).forEach(([key, value]) => {
            console.log(`${key}: ${value || 'NOT FOUND'}`);
        });
        
        // Test 3: Button Styles
        console.log('\n🔘 Testing Button Styles...');
        const buttonStyles = await page.evaluate(() => {
            const primaryBtn = document.querySelector('a[href="/auth/signup"]');
            const secondaryBtn = document.querySelector('a[href="/auth/signin"]');
            
            if (primaryBtn && secondaryBtn) {
                return {
                    primary: {
                        backgroundColor: window.getComputedStyle(primaryBtn).backgroundColor,
                        color: window.getComputedStyle(primaryBtn).color,
                        borderRadius: window.getComputedStyle(primaryBtn).borderRadius
                    },
                    secondary: {
                        backgroundColor: window.getComputedStyle(secondaryBtn).backgroundColor,
                        color: window.getComputedStyle(secondaryBtn).color,
                        border: window.getComputedStyle(secondaryBtn).border
                    }
                };
            }
            return null;
        });
        
        if (buttonStyles) {
            console.log('Primary button:', buttonStyles.primary);
            console.log('Secondary button:', buttonStyles.secondary);
        }
        
        // Test 4: Wedding Color Utilities
        console.log('\n💒 Testing Wedding Color Usage...');
        const weddingColorUsage = await page.evaluate(() => {
            const elements = [];
            // Look for elements using wedding colors
            document.querySelectorAll('[class*="wedding-"]').forEach(el => {
                elements.push({
                    tag: el.tagName,
                    classes: Array.from(el.classList).filter(c => c.includes('wedding')),
                    computedBg: window.getComputedStyle(el).backgroundColor
                });
            });
            return elements;
        });
        
        console.log('Elements using wedding colors:');
        weddingColorUsage.forEach((el, i) => {
            console.log(`  ${i + 1}. ${el.tag} - ${el.classes.join(', ')} - ${el.computedBg}`);
        });
        
        // Test 5: Check for hydration errors
        console.log('\n🔄 Checking for Hydration Issues...');
        const hydrationErrors = await page.evaluate(() => {
            const errors = [];
            // Check console for hydration errors (these would have been logged earlier)
            return errors;
        });
        
        // Test 6: Navigate to auth pages and check styling
        console.log('\n🔐 Testing Auth Pages...');
        
        // Test Sign In page
        await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'signin-page-test.png', fullPage: true });
        console.log('✅ Sign In page screenshot saved');
        
        // Test Sign Up page
        await page.goto('http://localhost:3000/auth/signup', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'signup-page-test.png', fullPage: true });
        console.log('✅ Sign Up page screenshot saved');
        
        // Test 7: Mobile Responsive Design
        console.log('\n📱 Testing Mobile Responsive Design...');
        await page.setViewport({ width: 375, height: 667 }); // iPhone SE
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'mobile-home-test.png', fullPage: true });
        console.log('✅ Mobile home page screenshot saved');
        
        // Test 8: Check if the app attempts to load vendor page (this was broken before)
        console.log('\n🏪 Testing Vendor Management Access...');
        
        // Reset to desktop view
        await page.setViewport({ width: 1440, height: 900 });
        
        // Try to access vendor page - this should redirect to signin since we're not authenticated
        try {
            await page.goto('http://localhost:3000/dashboard/vendors', { waitUntil: 'networkidle0' });
            const currentUrl = page.url();
            console.log('Vendor page redirect URL:', currentUrl);
            
            if (currentUrl.includes('/auth/signin')) {
                console.log('✅ Properly redirected to signin (as expected for unauthenticated user)');
            } else {
                console.log('⚠️ Unexpected behavior - should redirect to signin');
            }
        } catch (error) {
            console.log('❌ Error accessing vendor page:', error.message);
        }
        
        console.log('\n📊 Design System Test Complete!');
        console.log('\n📁 Screenshots saved:');
        console.log('  - home-page-test.png');
        console.log('  - signin-page-test.png');
        console.log('  - signup-page-test.png');
        console.log('  - mobile-home-test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testDesignSystem().catch(console.error);