import type { APIRoute } from 'astro';
import React from 'react';
import { ContactEmail } from '@/components/ui/contact-email';
import { Resend } from 'resend';
import { formSchema } from '@/lib/schemas';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
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

	if (!import.meta.env.RESEND_API_KEY || !import.meta.env.RESEND_FROM_EMAIL) {
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
			from: `Vyas's Website <${import.meta.env.RESEND_FROM_EMAIL}>`,
			to: ['vyas0189@gmail.com'],
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
