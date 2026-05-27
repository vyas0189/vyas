import { expect, test } from '@playwright/test';

test.describe('Contact Form', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/contact');
		// Wait for the React island to finish hydrating. Astro removes the `ssr`
		// attribute from <astro-island> once the client component is mounted.
		await page
			.locator('astro-island[component-url*="contact-form"]:not([ssr])')
			.waitFor({ state: 'attached' });
	});

	test('should display contact form', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /get in touch/i })).toBeVisible();

		await expect(page.getByLabel('Name')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel('Message')).toBeVisible();
		await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
	});

	test('email input should have type="email" and email autocomplete', async ({ page }) => {
		const emailInput = page.getByLabel('Email');
		await expect(emailInput).toHaveAttribute('type', 'email');
		await expect(emailInput).toHaveAttribute('autocomplete', 'email');
	});

	test('name input should have name autocomplete', async ({ page }) => {
		await expect(page.getByLabel('Name')).toHaveAttribute('autocomplete', 'name');
	});

	test('should display contact information with mailto link', async ({ page }) => {
		const emailLink = page.getByRole('link', { name: 'vyas0189@gmail.com' });
		await expect(emailLink).toBeVisible();
		await expect(emailLink).toHaveAttribute('href', 'mailto:vyas0189@gmail.com');
		await expect(page.getByText(/houston, texas/i)).toBeVisible();
	});

	test('should validate empty form submission', async ({ page }) => {
		await page.getByRole('button', { name: /send message/i }).click();

		await expect(page.getByText(/at least 2 characters for your name/i)).toBeVisible();
		await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
		await expect(page.getByText(/at least 10 characters for your message/i)).toBeVisible();
	});

	test('should validate name field', async ({ page }) => {
		await page.getByLabel('Name').fill('A');
		await page.getByRole('button', { name: /send message/i }).click();
		await expect(page.getByText(/at least 2 characters for your name/i)).toBeVisible();
	});

	test('should validate email field', async ({ page }) => {
		await page.getByLabel('Email').fill('invalid-email');
		await page.getByRole('button', { name: /send message/i }).click();
		await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
	});

	test('should validate message field', async ({ page }) => {
		await page.getByLabel('Message').fill('Short');
		await page.getByRole('button', { name: /send message/i }).click();
		await expect(page.getByText(/at least 10 characters for your message/i)).toBeVisible();
	});

	test('should submit successfully and show success toast (mocked API)', async ({ page }) => {
		await page.route('**/api/emails', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true }),
			});
		});

		await page.getByLabel('Name').fill('John Doe');
		await page.getByLabel('Email').fill('john@example.com');
		await page
			.getByLabel('Message')
			.fill('This is a test message with enough characters to pass all validation rules.');

		await page.getByRole('button', { name: /send message/i }).click();

		// aria-live status announces the success to screen readers
		await expect(page.getByRole('status')).toContainText(/message sent/i);
		// Sonner toast also surfaces it
		await expect(
			page.locator('[data-sonner-toast]').filter({ hasText: /message sent/i }),
		).toBeVisible();
		// Form resets after success
		await expect(page.getByLabel('Name')).toHaveValue('');
	});

	test('should show rate-limit message on 429 response', async ({ page }) => {
		await page.route('**/api/emails', async (route) => {
			await route.fulfill({
				status: 429,
				contentType: 'application/json',
				headers: { 'Retry-After': '60' },
				body: JSON.stringify({ error: 'Too many requests' }),
			});
		});

		await page.getByLabel('Name').fill('John Doe');
		await page.getByLabel('Email').fill('john@example.com');
		await page.getByLabel('Message').fill('This is a test message with enough characters.');
		await page.getByRole('button', { name: /send message/i }).click();

		await expect(page.getByRole('status')).toContainText(/too many submissions/i);
	});

	test('should show mailto fallback on 5xx response', async ({ page }) => {
		await page.route('**/api/emails', async (route) => {
			await route.fulfill({
				status: 502,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Email service unavailable' }),
			});
		});

		await page.getByLabel('Name').fill('John Doe');
		await page.getByLabel('Email').fill('john@example.com');
		await page.getByLabel('Message').fill('This is a test message with enough characters.');
		await page.getByRole('button', { name: /send message/i }).click();

		const toast = page
			.locator('[data-sonner-toast]')
			.filter({ hasText: /email service is having issues/i });
		await expect(toast).toBeVisible();
		await expect(toast.getByRole('link', { name: 'vyas0189@gmail.com' })).toHaveAttribute(
			'href',
			'mailto:vyas0189@gmail.com',
		);
	});

	test('should show fallback on network failure', async ({ page }) => {
		await page.route('**/api/emails', (route) => route.abort());

		await page.getByLabel('Name').fill('John Doe');
		await page.getByLabel('Email').fill('john@example.com');
		await page.getByLabel('Message').fill('This is a test message with enough characters.');
		await page.getByRole('button', { name: /send message/i }).click();

		await expect(page.getByRole('status')).toContainText(/something went wrong/i);
	});

	test('should have external social links', async ({ page }) => {
		const githubLink = page.getByRole('link', { name: 'GitHub' });
		await expect(githubLink).toBeVisible();
		await expect(githubLink).toHaveAttribute('href', /github\.com\/vyas0189/);
		await expect(githubLink).toHaveAttribute('target', '_blank');

		const linkedinLink = page.getByRole('link', { name: 'LinkedIn' });
		await expect(linkedinLink).toBeVisible();
		await expect(linkedinLink).toHaveAttribute('href', /linkedin\.com\/in\/vyas0189/);
		await expect(linkedinLink).toHaveAttribute('target', '_blank');
	});

	test('should be accessible via keyboard navigation', async ({ page }) => {
		await page.getByLabel('Name').focus();
		await expect(page.getByLabel('Name')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.getByLabel('Email')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.getByLabel('Message')).toBeFocused();

		await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
	});

	test('should be responsive on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/contact');

		await expect(page.getByLabel('Name')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel('Message')).toBeVisible();
		await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
	});
});
