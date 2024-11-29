import ContactEmail from '@/components/ui/contact-email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	const { name, email, message } = await request.json();

	try {
		const { error } = await resend.emails.send({
			from: `Vyas's Website<${process.env.RESEND_FROM_EMAIL}>`,
			to: ['vyas0189@gmail.com'],
			subject: 'Email from Contact Form',
			react: ContactEmail({
				name,
				email,
				message,
			}),
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error('Failed to send email');
		}

		return new Response('Email sent successfully', { status: 200 });
	} catch (e) {
		console.error('Email sending error:', e);
		throw new Error('Failed to send email');
	}
}
