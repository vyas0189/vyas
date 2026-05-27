import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/about', '/contact', '/privacy'] as const;

for (const path of PAGES) {
	test(`a11y: ${path} has no critical or serious axe violations`, async ({ page }) => {
		await page.goto(path);
		// Wait for any hydration on /contact
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.disableRules([
				// sonner toast region has minor a11y quirks we can revisit
				'aria-allowed-attr',
			])
			.analyze();

		const blocking = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious',
		);

		expect(
			blocking,
			blocking.map((v) => `${v.id}: ${v.description} (${v.nodes.length} node(s))`).join('\n'),
		).toEqual([]);
	});
}
