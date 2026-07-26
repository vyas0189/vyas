// zod/mini keeps the client bundle small: the contact form imports this schema
// in the browser, and mini's functional API tree-shakes far better than the
// chainable classic API. Server code (api/emails.ts) shares the same schema.
import * as z from 'zod/mini';

export const formSchema = z.object({
	name: z
		.string({ error: 'Name is required' })
		.check(
			z.trim(),
			z.minLength(2, 'Please enter at least 2 characters for your name'),
			z.maxLength(100, 'Name must be 100 characters or fewer'),
			z.regex(/^[^\r\n]+$/, 'Invalid characters'),
		),
	email: z.pipe(
		z.string({ error: 'Email is required' }).check(z.trim()),
		z
			.email({ error: 'Please enter a valid email address' })
			.check(z.maxLength(254, 'Email must be 254 characters or fewer')),
	),
	message: z
		.string({ error: 'Message is required' })
		.check(
			z.minLength(10, 'Please enter at least 10 characters for your message'),
			z.maxLength(5000, 'Message must be 5000 characters or fewer'),
		),
});

export type FormValues = z.infer<typeof formSchema>;
