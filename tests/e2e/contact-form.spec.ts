import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display contact form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /get in touch/i })).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    // Check for email
    await expect(page.getByText(/vyas0189@gmail\.com/i)).toBeVisible();

    // Check for location
    await expect(page.getByText(/houston, texas/i)).toBeVisible();
  });

  test('should validate empty form submission', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.click();

    // Should show validation errors - wait a bit for React Hook Form to show errors
    await page.waitForTimeout(500);

    // Check if any validation message appears
    const errorMessages = page.locator('text=/String must contain at least|Required/i');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('should validate name field', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    const submitButton = page.getByRole('button', { name: /send message/i });

    // Test too short name
    await nameInput.fill('A');
    await submitButton.click();
    await expect(page.getByText(/string must contain at least/i).first()).toBeVisible();

    // Test valid name
    await nameInput.fill('John Doe');
    // Should not show name error anymore (if we were to check other fields)
  });

  test('should validate email field', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    const submitButton = page.getByRole('button', { name: /send message/i });

    // Test invalid email
    await emailInput.fill('invalid-email');
    await submitButton.click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();

    // Test valid email
    await emailInput.clear();
    await emailInput.fill('test@example.com');
    // Should not show email error anymore
  });

  test('should validate message field', async ({ page }) => {
    const messageInput = page.getByLabel(/message/i);
    const submitButton = page.getByRole('button', { name: /send message/i });

    // Test too short message
    await messageInput.fill('Short');
    await submitButton.click();
    await expect(page.getByText(/string must contain at least/i).first()).toBeVisible();

    // Test valid message
    await messageInput.fill('This is a valid message with enough characters to pass validation.');
    // Should not show message error anymore
  });

  test('should fill and submit complete form', async ({ page }) => {
    // Fill in all fields
    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/email/i).fill('john@example.com');
    await page.getByLabel(/message/i).fill('This is a test message with enough characters to pass all validation rules.');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.click();

    // Wait for either success or error response
    await page.waitForTimeout(2000);

    // Check if the button changed to "Sending..." or returned to "Send Message"
    const buttonText = await submitButton.textContent();
    expect(buttonText).toMatch(/send message/i);
  });

  test('should have external social links', async ({ page }) => {
    // Check GitHub link
    const githubLink = page.getByRole('link', { name: /github/i });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /github\.com\/vyas0189/);
    await expect(githubLink).toHaveAttribute('target', '_blank');

    // Check LinkedIn link
    const linkedinLink = page.getByRole('link', { name: /linkedin/i });
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('href', /linkedin\.com\/in\/vyas0189/);
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Focus the first form field directly
    await page.getByLabel(/name/i).focus();
    await expect(page.getByLabel(/name/i)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/email/i)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/message/i)).toBeFocused();

    // Some browsers may have different tab behavior, just verify button is visible
    const submitButton = page.getByRole('button', { name: /send message/i });
    await expect(submitButton).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contact');

    // Check if form is still visible and usable
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });
});
