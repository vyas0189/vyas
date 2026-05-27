import { z } from 'zod';

export const formSchema = z.object({
	name: z
		.string({ error: 'Name is required' })
		.trim()
		.min(2, 'Please enter at least 2 characters for your name')
		.max(100, 'Name must be 100 characters or fewer')
		.regex(/^[^\r\n]+$/, 'Invalid characters'),
	email: z
		.string({ error: 'Email is required' })
		.trim()
		.email('Please enter a valid email address')
		.max(254, 'Email must be 254 characters or fewer'),
	message: z
		.string({ error: 'Message is required' })
		.min(10, 'Please enter at least 10 characters for your message')
		.max(5000, 'Message must be 5000 characters or fewer'),
});
