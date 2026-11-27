import { expect, test } from '@playwright/test';

test.describe('Active nav link', () => {
	test('follows client-side navigation', async ({ page }) => {
		await page.goto('/');
		const nav = page.locator('header nav');
		const home = nav.getByRole('link', { name: 'Home', exact: true });
		const about = nav.getByRole('link', { name: 'About', exact: true });

		await expect(home).toHaveAttribute('aria-current', 'page');

		await about.click();
		await expect(page).toHaveURL(/\/about/);
		await expect(about).toHaveAttribute('aria-current', 'page');
		await expect(home).not.toHaveAttribute('aria-current', 'page');
	});
});

test.describe('Theme', () => {
	test('follows a dark OS with no stored choice, and stores nothing', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');

		await expect(page.locator('html')).toHaveClass(/\bdark\b/);
		expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
	});

	test('System on a dark OS renders dark on reload', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');
		await page.evaluate(() => localStorage.setItem('theme', 'system'));
		await page.reload();

		await expect(page.locator('html')).toHaveClass(/\bdark\b/);
	});

	test('keeps the chosen theme across client-side navigation', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');
		await page.getByRole('button', { name: 'Toggle theme' }).click();
		await page.getByRole('menuitemradio', { name: 'Dark' }).click();
		await expect(page.locator('html')).toHaveClass(/\bdark\b/);

		await page.locator('header nav').getByRole('link', { name: 'About', exact: true }).click();
		await expect(page).toHaveURL(/\/about/);
		await expect(page.locator('html')).toHaveClass(/\bdark\b/);
	});

	test('theme menu works from the keyboard', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');
		const toggle = page.getByRole('button', { name: 'Toggle theme' });

		await toggle.focus();
		await page.keyboard.press('ArrowDown');
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await expect(page.getByRole('menuitemradio', { name: 'Light' })).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeFocused();
		await page.keyboard.press('Enter');

		await expect(page.locator('html')).toHaveClass(/\bdark\b/);
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toBeFocused();
		await expect(
			page.getByRole('menuitemradio', { name: 'Dark', includeHidden: true }),
		).toHaveAttribute('aria-checked', 'true');

		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Escape');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toBeFocused();
	});
});
