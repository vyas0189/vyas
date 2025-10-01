import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('should load about page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/about/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should display page content', async ({ page }) => {
    // Check for main heading
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();

    // Check for body content
    await expect(page.locator('body')).toContainText(/.+/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/about');

    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/about');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});
