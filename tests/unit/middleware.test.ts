import { beforeEach, describe, expect, it, vi } from 'vitest';

// astro:middleware is a virtual module — mock it for unit testing.
// defineMiddleware is effectively an identity wrapper.
vi.mock('astro:middleware', () => ({
	defineMiddleware: (fn: unknown) => fn,
}));

type OnRequestFn = (
	context: { url: URL; request: Request },
	next: () => Promise<Response>,
) => Promise<Response>;

async function loadOnRequest(): Promise<OnRequestFn> {
	const mod = await import('@/middleware');
	return mod.onRequest as unknown as OnRequestFn;
}

function makeNext(body = 'ok', init?: ResponseInit) {
	return vi.fn(async () => new Response(body, init));
}

describe('middleware onRequest', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('GET request to / passes through untouched', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/'),
				request: new Request('http://localhost:4321/', { method: 'GET' }),
			},
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(response.status).toBe(200);
	});

	it('POST to /api/emails with valid same-origin passes and calls next', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/api/emails'),
				request: new Request('http://localhost:4321/api/emails', {
					method: 'POST',
					headers: {
						origin: 'http://localhost:4321',
						host: 'localhost:4321',
					},
				}),
			},
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(response.status).toBe(200);
	});

	it('POST to /api/emails with no Origin header returns 403', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/api/emails'),
				request: new Request('http://localhost:4321/api/emails', {
					method: 'POST',
					headers: { host: 'localhost:4321' },
				}),
			},
			next,
		);

		expect(next).not.toHaveBeenCalled();
		expect(response.status).toBe(403);
	});

	it('POST to /api/emails with no Host header returns 403', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		// Duck-typed request that only exposes what the middleware reads. We can't
		// use a real Request here because undici always auto-populates `host`.
		const fakeHeaders = new Headers({ origin: 'http://localhost:4321' });
		const fakeRequest = {
			method: 'POST',
			headers: {
				get(name: string) {
					if (name.toLowerCase() === 'host') return null;
					return fakeHeaders.get(name);
				},
			},
		};

		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/api/emails'),
				request: fakeRequest as unknown as Request,
			},
			next,
		);

		expect(next).not.toHaveBeenCalled();
		expect(response.status).toBe(403);
	});

	it('POST to /api/emails with mismatched Origin host vs Host header returns 403', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/api/emails'),
				request: new Request('http://localhost:4321/api/emails', {
					method: 'POST',
					headers: {
						origin: 'http://evil.example.com',
						host: 'localhost:4321',
					},
				}),
			},
			next,
		);

		expect(next).not.toHaveBeenCalled();
		expect(response.status).toBe(403);
	});

	it('POST to /api/emails with malformed Origin returns a JSON 403, not 500', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/api/emails'),
				request: new Request('http://localhost:4321/api/emails', {
					method: 'POST',
					headers: {
						origin: 'not a url',
						host: 'localhost:4321',
					},
				}),
			},
			next,
		);

		expect(next).not.toHaveBeenCalled();
		expect(response.status).toBe(403);
		expect(response.headers.get('Content-Type')).toBe('application/json');
		await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
	});

	it('POST to a non-/api/ path skips CSRF check and passes', async () => {
		const onRequest = await loadOnRequest();
		const next = makeNext();
		const response = await onRequest(
			{
				url: new URL('http://localhost:4321/contact'),
				request: new Request('http://localhost:4321/contact', {
					method: 'POST',
					// No origin/host — should not matter for non-/api routes.
				}),
			},
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(response.status).toBe(200);
	});
});
