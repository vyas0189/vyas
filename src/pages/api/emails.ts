import type { APIRoute } from 'astro';
import React from 'react';
import { ContactEmail } from '@/components/ui/contact-email';
import { Resend } from 'resend';
import { formSchema } from '@/lib/schemas';

// Use process.env for runtime environment variables in SSR mode
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
const RESEND_TO_EMAIL = import.meta.env.RESEND_TO_EMAIL || process.env.RESEND_TO_EMAIL;

const resend = new Resend(RESEND_API_KEY);

// Best-effort rate limiting (resets on cold start, catches rapid abuse)
const requestLog = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = requestLog.get(ip);

	if (!entry || now > entry.resetTime) {
		requestLog.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
		return false;
	}

	entry.count++;
	return entry.count > RATE_LIMIT;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
	// Rate limiting
	const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
	if (isRateLimited(ip)) {
		return new Response(
			JSON.stringify({ error: 'Too many requests. Please try again later.' }),
			{
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': '60',
				},
			}
		);
	}

	// Check Content-Type header
	const contentType = request.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		return new Response(
			JSON.stringify({ error: 'Content-Type must be application/json' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !RESEND_TO_EMAIL) {
		return new Response(
			JSON.stringify({ error: 'Environment variables not set' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	// Parse and validate JSON input
	let body;
	try {
		body = await request.json();
	} catch (error) {
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
				error: 'Invalid input data',
				details: validation.error.issues,
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	const { name, email, message } = validation.data;

	try {
		const { error } = await resend.emails.send({
			from: `Vyas's Website <${RESEND_FROM_EMAIL}>`,
			to: [RESEND_TO_EMAIL],
			subject: 'Email from Contact Form',
			react: React.createElement(ContactEmail, { name, email, message }),
		});

		if (error) {
			console.error('Resend error:', error.message);
			return new Response(JSON.stringify({ error: 'Failed to send email' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(
			JSON.stringify({ message: 'Email sent successfully' }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (e) {
		console.error('Email sending error:', e);
		return new Response(JSON.stringify({ error: 'Failed to send email' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
