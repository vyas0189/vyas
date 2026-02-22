import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	// CSRF protection for state-changing requests
	if (context.request.method === 'POST') {
		const origin = context.request.headers.get('origin');
		const host = context.request.headers.get('host');

		if (!origin || !host) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const originHost = new URL(origin).host;
		if (originHost !== host) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	const response = await next();

	// Security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=()'
	);
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains'
	);
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data:",
			"connect-src 'self' https://*.sentry.io https://*.ingest.us.sentry.io",
			"worker-src 'self' blob:",
			"frame-ancestors 'none'",
		].join('; ')
	);

	return response;
});
