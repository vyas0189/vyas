import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
const checkRateLimit = vi.fn();
const captureException = vi.fn();
const captureMessage = vi.fn();

vi.mock('resend', () => ({
	Resend: class {
		emails = { send };
		// Mirror the real SDK, which throws when constructed without a key.
		constructor(key?: string) {
			if (!key) throw new Error('Missing API key');
		}
	},
}));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }));
vi.mock('@sentry/astro', () => ({ captureException, captureMessage }));
// The real template is JSX; the node test project doesn't transform it, and the
// route only passes it to React.createElement.
vi.mock('@/components/ui/contact-email', () => ({ ContactEmail: () => null }));

type Handler = (ctx: { request: Request; clientAddress?: string }) => Promise<Response>;

const ENV = {
	RESEND_API_KEY: 're_test',
	RESEND_FROM_EMAIL: 'site@example.com',
	RESEND_TO_EMAIL: 'owner@example.com',
};

const valid = {
	name: '  Jane Doe ',
	email: 'jane@example.com',
	message: 'Hello, this is a long enough message.',
};

async function load(env: Partial<typeof ENV> = ENV) {
	vi.resetModules();
	for (const key of Object.keys(ENV)) {
		vi.stubEnv(key, env[key as keyof typeof ENV] ?? '');
	}
	const mod = await import('@/pages/api/emails');
	return { POST: mod.POST as unknown as Handler, ALL: mod.ALL as unknown as Handler };
}

function post(body: unknown, contentType = 'application/json') {
	return new Request('https://vyasr.space/api/emails', {
		method: 'POST',
		headers: { 'content-type': contentType },
		body: typeof body === 'string' ? body : JSON.stringify(body),
	});
}

describe('POST /api/emails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		checkRateLimit.mockResolvedValue({ success: true, remaining: 2, reset: Date.now() + 60_000 });
		send.mockResolvedValue({ data: { id: 'email_1' }, error: null });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.useRealTimers();
	});

	it('sends the email with Reply-To set to the visitor', async () => {
		const { POST } = await load();
		const res = await POST({ request: post(valid), clientAddress: '1.2.3.4' });

		expect(res.status).toBe(200);
		expect(checkRateLimit).toHaveBeenCalledWith('1.2.3.4');
		expect(send).toHaveBeenCalledTimes(1);
		const args = send.mock.calls[0][0];
		expect(args.to).toEqual(['owner@example.com']);
		expect(args.from).toBe("Vyas's Website <site@example.com>");
		expect(args.replyTo).toBe('jane@example.com');
		expect(args.react.props).toEqual({
			name: 'Jane Doe',
			email: 'jane@example.com',
			message: 'Hello, this is a long enough message.',
		});
	});

	it('returns 429 with Retry-After when rate limited', async () => {
		checkRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 30_000 });
		const { POST } = await load();
		const res = await POST({ request: post(valid), clientAddress: '1.2.3.4' });

		expect(res.status).toBe(429);
		expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
		expect(send).not.toHaveBeenCalled();
	});

	it('shares one bucket when the adapter gives no client address', async () => {
		const { POST } = await load();
		await POST({ request: post(valid) });
		expect(checkRateLimit).toHaveBeenCalledWith('unknown');
	});

	it('rejects a non-JSON content type', async () => {
		const { POST } = await load();
		const res = await POST({ request: post('name=x', 'application/x-www-form-urlencoded') });
		expect(res.status).toBe(400);
		expect(send).not.toHaveBeenCalled();
	});

	it('returns 500 and reports to Sentry when env vars are missing', async () => {
		const { POST } = await load({ ...ENV, RESEND_API_KEY: '', RESEND_TO_EMAIL: '' });
		const res = await POST({ request: post(valid) });
		expect(res.status).toBe(500);
		expect(captureMessage).toHaveBeenCalled();
		expect(send).not.toHaveBeenCalled();
	});

	it('rejects malformed JSON', async () => {
		const { POST } = await load();
		const res = await POST({ request: post('{not json') });
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: 'Invalid JSON format' });
	});

	it('rejects invalid input with field errors and no message echo', async () => {
		const { POST } = await load();
		const res = await POST({ request: post({ ...valid, message: '          ' }) });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe('Invalid input');
		expect(body.fields.map((f: { path: string }) => f.path)).toContain('message');
		expect(send).not.toHaveBeenCalled();
	});

	it('passes a Resend 429 through as 429', async () => {
		send.mockResolvedValue({ data: null, error: { statusCode: 429, message: 'rate' } });
		const { POST } = await load();
		const res = await POST({ request: post(valid) });
		expect(res.status).toBe(429);
	});

	it('maps a Resend 5xx to 502', async () => {
		send.mockResolvedValue({ data: null, error: { statusCode: 503, message: 'down' } });
		const { POST } = await load();
		const res = await POST({ request: post(valid) });
		expect(res.status).toBe(502);
		expect(captureException).toHaveBeenCalled();
	});

	it('maps other Resend errors to 500', async () => {
		send.mockResolvedValue({ data: null, error: { statusCode: 422, message: 'bad' } });
		const { POST } = await load();
		const res = await POST({ request: post(valid) });
		expect(res.status).toBe(500);
	});

	it('returns 500 when the SDK throws', async () => {
		send.mockRejectedValue(new Error('network'));
		const { POST } = await load();
		const res = await POST({ request: post(valid) });
		expect(res.status).toBe(500);
		expect(captureException).toHaveBeenCalled();
	});

	it('returns 504 when Resend takes longer than 8 seconds', async () => {
		vi.useFakeTimers();
		send.mockReturnValue(new Promise(() => {}));
		const { POST } = await load();
		const pending = POST({ request: post(valid) });
		await vi.advanceTimersByTimeAsync(8_001);
		const res = await pending;
		expect(res.status).toBe(504);
	});
});

describe('other methods on /api/emails', () => {
	it('return 405 with Allow: POST', async () => {
		const { ALL } = await load();
		const res = await ALL({ request: new Request('https://vyasr.space/api/emails') });
		expect(res.status).toBe(405);
		expect(res.headers.get('Allow')).toBe('POST');
	});
});
