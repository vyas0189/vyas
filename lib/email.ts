import { ContactEmail } from '@/components/ui/contact-email';
import { Resend } from 'resend';
import { z } from 'zod';
import { formSchema } from './schemas';

const resend = new Resend(process.env.RESEND_API_KEY);

export const send = async (emailFormData: z.infer<typeof formSchema>) => {
	try {
		const { error } = await resend.emails.send({
			from: `Vyas's Website<${process.env.RESEND_FROM_EMAIL}>`,
			to: ['vyas0189@gmail.com'],
			subject: 'Email from Contact Form',
			react: ContactEmail({
				name: emailFormData.name,
				email: emailFormData.email,
				message: emailFormData.message,
			}),
		});

		if (error) {
			console.error('Resend error:', error);
			throw new Error('Failed to send email');
		}

		return { success: true };
	} catch (e) {
		console.error('Email sending error:', e);
		throw new Error('Failed to send email');
	}
};
