import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.getByText('Sign in')).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check page loads successfully
    await expect(page).toHaveTitle(/.*AI Assistant.*/i);
    await expect(page.getByText('Sign in')).toBeVisible();
  });
});

// Note: These tests will need to be updated based on actual authentication flow
// and will require proper test user setup for authenticated testing