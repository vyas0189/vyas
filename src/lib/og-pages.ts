// Single source of truth for OG image metadata. Layout.astro derives each
// page's og:image URL from its pathname, so every page under src/pages must
// have an entry here or its og:image 404s silently — a unit test
// (tests/unit/og-pages.test.ts) enforces that.

export interface PageMeta {
	title: string;
	description: string;
}

export const ogPages: Record<string, PageMeta> = {
	index: {
		title: 'Vyas Ramankulangara',
		description: 'Software Engineer II — Houston, Texas',
	},
	about: {
		title: 'About',
		description: 'Education, experience, and certifications',
	},
	contact: {
		title: 'Get in Touch',
		description: 'Reach out via the contact form',
	},
	privacy: {
		title: 'Privacy Policy',
		description: 'How this site handles your data',
	},
	'404': {
		title: 'Page not found',
		description: "The page you requested doesn't exist",
	},
};
