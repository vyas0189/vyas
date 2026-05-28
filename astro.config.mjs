// @ts-check

import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://vyasr.space',
	output: 'static',
	prefetch: {
		prefetchAll: false,
		defaultStrategy: 'viewport',
	},
	adapter: netlify({
		// edgeMiddleware kept off: middleware imports/uses Sentry which depends on
		// Node built-ins (util, worker_threads, etc.) that don't exist on the edge
		// (Deno) runtime. With output: 'static', only /api/emails is SSR anyway.
		edgeMiddleware: false,
	}),
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		sentry({
			sourceMapsUploadOptions: {
				project: 'vyas-profile',
				org: 'vyas-3y',
				authToken: process.env.SENTRY_AUTH_TOKEN,
				filesToDeleteAfterUpload: ['./dist/**/*.map'],
			},
			// TODO: Once @sentry/astro confirms `release.name` support at the integration root,
			// set `release: { name: process.env.COMMIT_REF }` here. Runtime SDKs already tag
			// `release`/`environment` via the client/server configs reading COMMIT_REF / DEPLOY_CONTEXT.
		}),
		react(),
		sitemap({ filter: (page) => !page.includes('/api/') }),
	],
});
