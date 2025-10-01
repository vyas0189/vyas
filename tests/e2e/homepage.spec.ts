import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vyas/);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');

    // Check for main heading with name
    const heading = page.getByRole('heading', { name: /Hi, I'm Vyas Ramankulangara/i });
    await expect(heading).toBeVisible();
  });

  test('should have skills section', async ({ page }) => {
    await page.goto('/');

    // Skills section doesn't have a heading, so check for the card headings
    const fullStackHeading = page.getByRole('heading', { name: 'Full Stack Development' });
    const cloudHeading = page.getByRole('heading', { name: 'Cloud & DevOps' });
    const backendHeading = page.getByRole('heading', { name: 'Backend Development' });

    await expect(fullStackHeading).toBeVisible();
    await expect(cloudHeading).toBeVisible();
    await expect(backendHeading).toBeVisible();
  });

  test('should have social links', async ({ page }) => {
    await page.goto('/');

    // Check for GitHub link using aria-label
    const githubLink = page.getByRole('link', { name: 'GitHub' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com/);

    // Check for LinkedIn link using aria-label
    const linkedinLink = page.getByRole('link', { name: 'LinkedIn' });
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('href', /linkedin\.com/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should load without network errors', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => {
      // Filter out image optimization requests which may fail in some browsers
      const url = request.url();
      if (!url.includes('/_image')) {
        failedRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failedRequests).toHaveLength(0);
  });
});
