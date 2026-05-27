import { OGImageRoute } from 'astro-og-canvas';

export const prerender = true;

interface PageMeta {
	title: string;
	description: string;
}

const pages: Record<string, PageMeta> = {
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

export const { getStaticPaths, GET } = await OGImageRoute({
	param: 'slug',
	pages,
	getImageOptions: (_slug, page: PageMeta) => ({
		title: page.title,
		description: page.description,
		bgGradient: [
			[24, 24, 27],
			[9, 9, 11],
		],
		border: { color: [161, 161, 170], width: 2 },
		padding: 100,
		font: {
			title: {
				size: 80,
				families: ['Inter'],
				weight: 'Bold',
				color: [255, 255, 255],
			},
			description: {
				size: 36,
				families: ['Inter'],
				weight: 'Normal',
				color: [212, 212, 216],
			},
		},
	}),
});
