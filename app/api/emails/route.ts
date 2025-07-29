import { ContactEmail } from '@/components/ui/contact-email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
		return new Response('Environment variables not set', { status: 500 });
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
