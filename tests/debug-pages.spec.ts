import { test, expect } from '@playwright/test';

test.describe('Debug Page Structure', () => {
  test('inspect homepage structure', async ({ page }) => {
    await page.goto('/');
    
    // Get all h1 elements and their text
    const h1Elements = await page.locator('h1').all();
    console.log('H1 elements found:');
    for (const h1 of h1Elements) {
      const text = await h1.textContent();
      console.log(`  - "${text}"`);
    }
    
    // Get all buttons with "Get Started" text
    const getStartedButtons = await page.locator('button:has-text("Get Started")').all();
    console.log('Get Started buttons found:');
    for (const button of getStartedButtons) {
      const text = await button.textContent();
      console.log(`  - "${text}"`);
    }
    
    // Get Sign In links/buttons
    const signInElements = await page.locator(':has-text("Sign In")').all();
    console.log('Sign In elements found:');
    for (const element of signInElements) {
      const text = await element.textContent();
      const tagName = await element.evaluate(el => el.tagName);
      console.log(`  - <${tagName}> "${text}"`);
    }
  });

  test('inspect signup page structure', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Get all h1 elements
    const h1Elements = await page.locator('h1').all();
    console.log('Sign up page H1 elements:');
    for (const h1 of h1Elements) {
      const text = await h1.textContent();
      console.log(`  - "${text}"`);
    }
    
    // Get all input elements
    const inputs = await page.locator('input').all();
    console.log('Input elements found:');
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`  - type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
    }
  });

  test('inspect signin page structure', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Get all h1 elements
    const h1Elements = await page.locator('h1').all();
    console.log('Sign in page H1 elements:');
    for (const h1 of h1Elements) {
      const text = await h1.textContent();
      console.log(`  - "${text}"`);
    }
  });
});