import * as Sentry from '@sentry/astro';
import type { APIRoute } from 'astro';
import React from 'react';
import { Resend } from 'resend';
import { ContactEmail } from '@/components/ui/contact-email';
import { checkRateLimit } from '@/lib/rate-limit';
import { formSchema } from '@/lib/schemas';

export const prerender = false;

// Use process.env for runtime environment variables in SSR mode
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
const RESEND_TO_EMAIL = import.meta.env.RESEND_TO_EMAIL || process.env.RESEND_TO_EMAIL;

const resend = new Resend(RESEND_API_KEY);

export const POST: APIRoute = async ({ request, clientAddress }) => {
	// Rate limiting
	const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
	const limit = await checkRateLimit(ip);
	if (!limit.success) {
		return new Response(JSON.stringify({ error: 'Too many requests' }), {
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': '60',
			},
		});
	}

	// Check Content-Type header
	const contentType = request.headers.get('content-type');
	if (!contentType?.includes('application/json')) {
		return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !RESEND_TO_EMAIL) {
		Sentry.captureMessage('Resend env vars missing', 'fatal');
		return new Response(JSON.stringify({ error: 'Server configuration error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Parse and validate JSON input
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Validate input against schema
	const validation = formSchema.safeParse(body);
	if (!validation.success) {
		return new Response(
			JSON.stringify({
				error: 'Invalid input',
				fields: validation.error.issues.map((i) => ({
					path: i.path.join('.'),
					message: i.message,
				})),
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	const { name, email, message } = validation.data;

	try {
		const sendPromise = resend.emails.send({
			from: `Vyas's Website <${RESEND_FROM_EMAIL}>`,
			to: [RESEND_TO_EMAIL],
			subject: 'Email from Contact Form',
			react: React.createElement(ContactEmail, { name, email, message }),
		});

		const timeoutPromise = new Promise<never>((_, reject) => {
			const id = setTimeout(() => {
				clearTimeout(id);
				reject(new Error('Resend request timed out'));
			}, 8000);
		});

		const { error } = (await Promise.race([sendPromise, timeoutPromise])) as Awaited<
			typeof sendPromise
		>;

		if (error) {
			const statusCode = (error as { statusCode?: number }).statusCode;

			if (statusCode === 429) {
				return new Response(JSON.stringify({ error: 'Too many requests' }), {
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': '60',
					},
				});
			}

			if (typeof statusCode === 'number' && statusCode >= 500) {
				Sentry.captureException(error, {
					tags: { route: 'emails', resend_status: statusCode },
				});
				return new Response(JSON.stringify({ error: 'Email service unavailable' }), {
					status: 502,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			Sentry.captureException(error, {
				tags: { route: 'emails', resend_status: statusCode },
			});
			return new Response(JSON.stringify({ error: 'Failed to send email' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (e: unknown) {
		const err = e as { name?: string; code?: string; statusCode?: number } | undefined;
		console.error('emails.handler.error', {
			name: err?.name,
			code: err?.code,
			statusCode: err?.statusCode,
		});
		Sentry.captureException(e, {
			tags: { route: 'emails', resend_status: err?.statusCode },
		});
		return new Response(JSON.stringify({ error: 'Failed to send email' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
