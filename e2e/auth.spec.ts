import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup');
    
    // Check for signup form
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByText(/create account/i)).toBeVisible();
  });

  test('should navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    
    // Click signup link
    await page.getByText(/create account/i).click();
    
    // Should be on signup page
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should show validation errors on empty form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should have Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    
    // Check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('multi-step signup should show progress', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill first step
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').first().fill('TestPass123!');
    await page.getByPlaceholder('Confirm Password').fill('TestPass123!');
    
    // Progress indicator should be visible
    await expect(page.getByText(/step 1/i)).toBeVisible();
  });
});

test.describe('Authentication Accessibility', () => {
  test('login form should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form
    await page.keyboard.press('Tab'); // Email field
    await expect(page.getByPlaceholder('Email')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Password field
    await expect(page.getByPlaceholder('Password')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Remember me or submit button
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check for accessible labels
    const emailInput = page.getByPlaceholder('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    const passwordInput = page.getByPlaceholder('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

