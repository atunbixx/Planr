import { test, expect } from '@playwright/test';

test.describe('Debug Navigation and Forms', () => {
  test('debug navigation buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check all buttons and their hrefs/onclick behavior
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    // Check if it's actually a Link or has onclick
    const tagName = await signInButton.evaluate(el => el.tagName);
    const onclick = await signInButton.getAttribute('onclick');
    const href = await signInButton.getAttribute('href');
    
    console.log(`Sign In button - tag: ${tagName}, onclick: ${onclick}, href: ${href}`);
    
    // Check parent element for Link wrapper
    const parent = signInButton.locator('..');
    const parentTag = await parent.evaluate(el => el.tagName);
    const parentHref = await parent.getAttribute('href');
    
    console.log(`Parent - tag: ${parentTag}, href: ${parentHref}`);
  });

  test('debug signup form inputs', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Get all input elements and their attributes
    const inputs = await page.locator('input').all();
    console.log('All input elements on signup page:');
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      
      console.log(`  Input ${i}: type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
    }
  });
});