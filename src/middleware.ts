import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	// CSRF protection for API POST routes only
	if (context.url.pathname.startsWith('/api/') && context.request.method === 'POST') {
		const origin = context.request.headers.get('origin');
		const host = context.request.headers.get('host');

		if (!origin || !host) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		let originHost: string;
		try {
			originHost = new URL(origin).host;
		} catch {
			return new Response('Forbidden', { status: 403 });
		}

		if (originHost !== host) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	const response = await next();

	// Content-Security-Policy stays in middleware (will need per-route nonces eventually).
	// Other security headers are configured in netlify.toml.
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			// TODO: migrate to nonces
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"font-src 'self'",
			"img-src 'self' data:",
			"connect-src 'self' https://*.sentry.io https://*.ingest.us.sentry.io",
			"worker-src 'self' blob:",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"object-src 'none'",
			'upgrade-insecure-requests',
		].join('; '),
	);

	return response;
});
