import { OGImageRoute } from 'astro-og-canvas';
import { ogPages, type PageMeta } from '@/lib/og-pages';

export const prerender = true;

export const { getStaticPaths, GET } = await OGImageRoute({
	pages: ogPages,
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
