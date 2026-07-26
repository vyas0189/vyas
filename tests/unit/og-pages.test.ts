import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ogPages } from '@/lib/og-pages';

// Layout.astro derives each page's og:image URL from its pathname, so a page
// without an ogPages entry ships a broken og:image that nothing else catches.

function pageSlugs(): string[] {
	const pagesDir = join(process.cwd(), 'src/pages');
	return readdirSync(pagesDir)
		.filter((name) => name.endsWith('.astro'))
		.map((name) => name.replace(/\.astro$/, ''));
}

describe('ogPages map', () => {
	it('has an entry for every top-level .astro page', () => {
		for (const slug of pageSlugs()) {
			expect(ogPages[slug], `src/pages/${slug}.astro has no ogPages entry`).toBeDefined();
		}
	});

	it('has no stale entries for pages that no longer exist', () => {
		const slugs = new Set(pageSlugs());
		for (const key of Object.keys(ogPages)) {
			expect(slugs.has(key), `ogPages entry "${key}" has no matching src/pages/${key}.astro`).toBe(
				true,
			);
		}
	});

	it('every entry has a non-empty title and description', () => {
		for (const [key, meta] of Object.entries(ogPages)) {
			expect(meta.title.length, `${key} title`).toBeGreaterThan(0);
			expect(meta.description.length, `${key} description`).toBeGreaterThan(0);
		}
	});
});
