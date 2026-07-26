import { defineMiddleware } from 'astro:middleware';

// CSRF origin check for API POST routes. This intentionally also covers
// application/json bodies, which Astro's built-in `security.checkOrigin`
// skips. Requiring the Origin header to be present means non-browser clients
// are rejected — that's fine, the API only serves this site's contact form.
//
// Note: with `output: 'static'`, this middleware only runs for on-demand
// routes (/api/*). Site-wide security headers live in netlify.toml, and the
// Content-Security-Policy is generated post-build into dist/_headers by
// scripts/generate-headers.mjs (its inline-script hashes change every build).

const forbidden = () =>
	new Response(JSON.stringify({ error: 'Forbidden' }), {
		status: 403,
		headers: { 'Content-Type': 'application/json' },
	});

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname.startsWith('/api/') && context.request.method === 'POST') {
		const origin = context.request.headers.get('origin');
		const host = context.request.headers.get('host');

		if (!origin || !host) return forbidden();

		let originHost: string;
		try {
			originHost = new URL(origin).host;
		} catch {
			return forbidden();
		}

		if (originHost !== host) return forbidden();
	}

	return next();
});
