import React from 'react';
import { ContactEmail } from '@/components/ui/contact-email';
import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import { getClientIP } from '@/lib/ip-detection';
import { checkRateLimit } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
	if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
		return new Response('Environment variables not set', { status: 500 });
	}

	// Extract client IP for rate limiting
	const clientIP = getClientIP(request);

	// Check rate limit before processing
	const rateLimitResult = await checkRateLimit(clientIP);

	if (!rateLimitResult.allowed) {
		// Rate limit exceeded - return 429 with proper headers
		const headers = new Headers({
			'Content-Type': 'application/json',
			'Retry-After': rateLimitResult.retryAfter.toString(),
			'X-RateLimit-Limit': '5',
			'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
			'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
		});

		return new Response(
			JSON.stringify({
				error: 'Too Many Requests',
				message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
				retryAfter: rateLimitResult.retryAfter,
			}),
			{
				status: 429,
				headers,
			}
		);
	}

	const { name, email, message } = await request.json();

	try {
		const { error } = await resend.emails.send({
			from: `Vyas's Website <${process.env.RESEND_FROM_EMAIL}>`,
			to: ['vyas0189@gmail.com'],
			subject: 'Email from Contact Form',
			react: React.createElement(ContactEmail, { name, email, message }), // Correct way to render the component
		});

		if (error) {
			console.error('Resend error:', error.message);
			return new Response('Failed to send email', { status: 500 });
		}

		return new Response('Email sent successfully', { status: 200 });
	} catch (e) {
		console.error('Email sending error:', e);
		return new Response('Failed to send email', { status: 500 });
	}
}
