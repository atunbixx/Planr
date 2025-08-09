import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-helpers';

test.describe('Debug Permissions Flow', () => {
  test('should verify user gets correct permissions after onboarding', async ({ page }) => {
    const helpers = new TestHelpers(page);
    
    // Sign up and complete onboarding
    const testUser = await helpers.signUpAndOnboard();
    console.log('Test user created:', testUser.email);
    
    // Wait for dashboard to load
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[role="status"]');
      return loadingElements.length === 0;
    }, { timeout: 30000 });
    
    // Navigate to guests page
    await page.goto('/dashboard/guests');
    
    // Check if Add Guest button is visible
    const addGuestButton = page.locator('button:has-text("Add Guest")');
    const isVisible = await addGuestButton.isVisible();
    console.log('Add Guest button visible:', isVisible);
    
    // Check permissions API directly
    const permissionsResponse = await page.evaluate(async () => {
      const response = await fetch('/api/user/permissions');
      return await response.json();
    });
    
    console.log('Permissions response:', JSON.stringify(permissionsResponse, null, 2));
    
    // Check if user has manage_guests permission
    const hasManageGuests = permissionsResponse.permissions?.includes('manage_guests');
    console.log('Has manage_guests permission:', hasManageGuests);
    
    // If button is not visible, check if PermissionGate is blocking it
    if (!isVisible) {
      // Check if the button exists in DOM but is hidden
      const buttonExists = await addGuestButton.count() > 0;
      console.log('Button exists in DOM:', buttonExists);
      
      // Get the page HTML around the button area - be more specific
      const actionsBar = await page.locator('div.flex.items-center.gap-3').last().innerHTML();
      console.log('Actions bar HTML:', actionsBar);
      
      // Check if permissions are loaded in the client
      const clientPermissions = await page.evaluate(() => {
        // Try to access React component state if possible
        return window.localStorage.getItem('permissions') || 'No permissions in localStorage';
      });
      console.log('Client permissions:', clientPermissions);
    }
    
    expect(hasManageGuests).toBe(true);
    expect(isVisible).toBe(true);
  });
});