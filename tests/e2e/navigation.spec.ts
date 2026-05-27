import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
	test('should have working navigation links', async ({ page }) => {
		await page.goto('/');

		// Scope to the header nav (the footer also has a <nav> landmark).
		const nav = page.locator('header nav');
		await expect(nav).toBeVisible();

		// Check for navigation links in the header nav (not the hero buttons)
		const homeLink = nav.getByRole('link', { name: 'Home', exact: true });
		const aboutLink = nav.getByRole('link', { name: 'About', exact: true });
		const contactLink = nav.getByRole('link', { name: 'Contact', exact: true });

		await expect(homeLink).toBeVisible();
		await expect(aboutLink).toBeVisible();
		await expect(contactLink).toBeVisible();
	});

	test('should navigate to About page', async ({ page }) => {
		await page.goto('/');

		// Use the nav link, not the hero button
		const aboutLink = page.locator('header nav').getByRole('link', { name: 'About', exact: true });
		await aboutLink.click();

		await expect(page).toHaveURL(/\/about/);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('should navigate to Contact page', async ({ page }) => {
		await page.goto('/');

		// Use the nav link, not the hero button
		const contactLink = page
			.locator('header nav')
			.getByRole('link', { name: 'Contact', exact: true });
		await contactLink.click();

		await expect(page).toHaveURL(/\/contact/);
		await expect(page.getByRole('heading', { name: /get in touch/i })).toBeVisible();
	});

	test('should navigate back to Home page', async ({ page }) => {
		await page.goto('/about');

		const homeLink = page.locator('header nav').getByRole('link', { name: 'Home', exact: true });
		await homeLink.click();

		await expect(page).toHaveURL('/');
	});
});
