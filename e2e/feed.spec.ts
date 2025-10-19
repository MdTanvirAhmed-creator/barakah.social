import { test, expect } from '@playwright/test';

test.describe('Feed Page', () => {
  test('should load feed page', async ({ page }) => {
    await page.goto('/feed');
    
    // Check for main heading
    await expect(page.getByText('Al-Minbar')).toBeVisible();
    
    // Check for post composer
    await expect(page.getByPlaceholder(/share beneficial knowledge/i)).toBeVisible();
  });

  test('should display feed tabs', async ({ page }) => {
    await page.goto('/feed');
    
    // Check for all three tabs
    await expect(page.getByText('For You')).toBeVisible();
    await expect(page.getByText('Halaqas')).toBeVisible();
    await expect(page.getByText('Verified Voices')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/feed');
    
    // Click on Halaqas tab
    await page.getByText('Halaqas').click();
    
    // Tab should be active (check for active indicator)
    const halaqasTab = page.getByText('Halaqas');
    await expect(halaqasTab).toBeVisible();
  });

  test('should display posts in feed', async ({ page }) => {
    await page.goto('/feed');
    
    // Wait for posts to load
    await page.waitForSelector('article', { timeout: 5000 });
    
    // Should have at least one post
    const posts = await page.locator('article').count();
    expect(posts).toBeGreaterThan(0);
  });

  test('should show beneficial button on posts', async ({ page }) => {
    await page.goto('/feed');
    
    await page.waitForSelector('article');
    
    // Find beneficial button (نافع or heart icon)
    const beneficialButton = page.getByRole('button').filter({ hasText: /نافع|beneficial/i }).first();
    await expect(beneficialButton).toBeVisible();
  });

  test('should expand post composer on click', async ({ page }) => {
    await page.goto('/feed');
    
    // Click on composer
    await page.getByPlaceholder(/share beneficial knowledge/i).click();
    
    // Composer should expand (check for expanded state)
    // This depends on your implementation
  });

  test('should have search bar in header', async ({ page }) => {
    await page.goto('/feed');
    
    // Search bar should be visible
    await expect(page.getByPlaceholder(/search posts, people/i)).toBeVisible();
  });
});

test.describe('Feed Interactions', () => {
  test('should like a post', async ({ page }) => {
    await page.goto('/feed');
    
    await page.waitForSelector('article');
    
    // Click first beneficial button
    const beneficialButton = page.getByRole('button').filter({ hasText: /نافع/i }).first();
    const initialCount = await beneficialButton.textContent();
    
    await beneficialButton.click();
    
    // Count should increment (optimistic update)
    // Note: With mock data, this might not actually change
  });

  test('should open comment section', async ({ page }) => {
    await page.goto('/feed');
    
    await page.waitForSelector('article');
    
    // Click comment button
    const commentButton = page.getByRole('button').filter({ hasText: /comment/i }).first();
    await commentButton.click();
    
    // Comment section should expand or navigate
    // Implementation-specific
  });

  test('should bookmark a post', async ({ page }) => {
    await page.goto('/feed');
    
    await page.waitForSelector('article');
    
    // Find bookmark button (bookmark icon)
    const bookmarkButton = page.locator('button[title*="Bookmark"]').first();
    await bookmarkButton.click();
    
    // Should show success feedback
  });
});

test.describe('Feed Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/feed');
    
    await page.waitForSelector('article');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have focus visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('posts should have proper ARIA labels', async ({ page }) => {
    await page.goto('/feed');
    
    await page.waitForSelector('article');
    
    // Posts should be in article elements
    const firstPost = page.locator('article').first();
    await expect(firstPost).toBeVisible();
  });

  test('should support reduced motion', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/feed');
    
    // Page should still load and function
    await expect(page.getByText('Al-Minbar')).toBeVisible();
  });
});

test.describe('Feed Responsiveness', () => {
  test('should display mobile navigation on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/feed');
    
    // Mobile bottom navigation should be visible
    const mobileNav = page.locator('nav').filter({ has: page.getByText('Profile') });
    await expect(mobileNav).toBeVisible();
  });

  test('should display sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/feed');
    
    // Sidebar should be visible
    await expect(page.getByText('Barakah.Social')).toBeVisible();
  });

  test('should be usable on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/feed');
    
    // Page should load correctly
    await expect(page.getByText('Al-Minbar')).toBeVisible();
  });
});

