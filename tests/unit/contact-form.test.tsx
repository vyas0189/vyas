import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from '@/components/contact-form';

const CONTACT_EMAIL = 'vyas0189@gmail.com';

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
	await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
	await user.type(screen.getByLabelText(/message/i), 'This is a sufficiently long test message.');
}

describe('ContactForm', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders the form with all labels, the submit button, and the contact info mailto link', () => {
		render(<ContactForm />);

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();

		const mailtoLink = screen.getByRole('link', { name: CONTACT_EMAIL });
		expect(mailtoLink).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
	});

	it('email input has type="email" and autocomplete="email"', () => {
		render(<ContactForm />);

		const emailInput = screen.getByLabelText(/email/i);
		expect(emailInput).toHaveAttribute('type', 'email');
		expect(emailInput).toHaveAttribute('autocomplete', 'email');
	});

	it('submitting empty form shows three validation messages', async () => {
		const user = userEvent.setup();
		render(<ContactForm />);

		await user.click(screen.getByRole('button', { name: /send message/i }));

		// All three required-field validation messages render via FormMessage.
		expect(await screen.findByText(/at least 2 characters for your name/i)).toBeInTheDocument();
		expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
		expect(screen.getByText(/at least 10 characters for your message/i)).toBeInTheDocument();
	});

	it('on 200 response calls fetch with /api/emails and resets the form', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
			);
		vi.stubGlobal('fetch', fetchMock);

		const user = userEvent.setup();
		render(<ContactForm />);

		await fillValidForm(user);
		await user.click(screen.getByRole('button', { name: /send message/i }));

		expect(await screen.findByRole('status')).toHaveTextContent(/message sent/i);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/emails');
		expect(init.method).toBe('POST');
		const parsed = JSON.parse(init.body as string);
		expect(parsed).toEqual({
			name: 'Jane Doe',
			email: 'jane@example.com',
			message: 'This is a sufficiently long test message.',
		});

		// Name input reset to empty after success.
		expect(screen.getByLabelText(/name/i)).toHaveValue('');
	});

	it('on 429 response shows "Too many submissions"', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }));
		vi.stubGlobal('fetch', fetchMock);

		const user = userEvent.setup();
		render(<ContactForm />);

		await fillValidForm(user);
		await user.click(screen.getByRole('button', { name: /send message/i }));

		expect(await screen.findByRole('status')).toHaveTextContent(/too many submissions/i);
	});

	it('on 502 response shows "Email service is having issues" with a mailto fallback', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 502 }));
		vi.stubGlobal('fetch', fetchMock);

		const user = userEvent.setup();
		render(<ContactForm />);

		await fillValidForm(user);
		await user.click(screen.getByRole('button', { name: /send message/i }));

		expect(await screen.findByRole('status')).toHaveTextContent(/email service is having issues/i);
		// Plain string does substring match — no regex escaping needed.
		expect(await screen.findByRole('status')).toHaveTextContent(CONTACT_EMAIL);

		// A mailto link exists somewhere in the DOM (either contact info or toast).
		const mailtoLinks = screen
			.getAllByRole('link')
			.filter((l) => l.getAttribute('href') === `mailto:${CONTACT_EMAIL}`);
		expect(mailtoLinks.length).toBeGreaterThanOrEqual(1);
	});

	it('on fetch rejection shows "Something went wrong"', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
		vi.stubGlobal('fetch', fetchMock);

		const user = userEvent.setup();
		render(<ContactForm />);

		await fillValidForm(user);
		await user.click(screen.getByRole('button', { name: /send message/i }));

		expect(await screen.findByRole('status')).toHaveTextContent(/something went wrong/i);
	});
});
