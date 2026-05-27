import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

beforeEach(() => {
	vi.resetModules();
	vi.doUnmock('@upstash/ratelimit');
	vi.doUnmock('@upstash/redis');
	process.env = { ...originalEnv };
	delete process.env.UPSTASH_REDIS_REST_URL;
	delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
	process.env = originalEnv;
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe('checkRateLimit (in-memory fallback)', () => {
	it('allows the first 3 requests in a window', async () => {
		const { checkRateLimit } = await import('@/lib/rate-limit');
		const r1 = await checkRateLimit('1.2.3.4');
		const r2 = await checkRateLimit('1.2.3.4');
		const r3 = await checkRateLimit('1.2.3.4');
		expect(r1.success).toBe(true);
		expect(r2.success).toBe(true);
		expect(r3.success).toBe(true);
	});

	it('reports decreasing remaining counts within the window', async () => {
		const { checkRateLimit } = await import('@/lib/rate-limit');
		const r1 = await checkRateLimit('remaining-test');
		const r2 = await checkRateLimit('remaining-test');
		const r3 = await checkRateLimit('remaining-test');
		expect(r1.remaining).toBe(2);
		expect(r2.remaining).toBe(1);
		expect(r3.remaining).toBe(0);
	});

	it('blocks the 4th request in a window', async () => {
		const { checkRateLimit } = await import('@/lib/rate-limit');
		await checkRateLimit('5.6.7.8');
		await checkRateLimit('5.6.7.8');
		await checkRateLimit('5.6.7.8');
		const r4 = await checkRateLimit('5.6.7.8');
		expect(r4.success).toBe(false);
		expect(r4.remaining).toBe(0);
	});

	it('isolates by IP', async () => {
		const { checkRateLimit } = await import('@/lib/rate-limit');
		await checkRateLimit('ip-a');
		await checkRateLimit('ip-a');
		await checkRateLimit('ip-a');
		const blockedA = await checkRateLimit('ip-a');
		const freshB = await checkRateLimit('ip-b');
		expect(blockedA.success).toBe(false);
		expect(freshB.success).toBe(true);
	});

	it('returns a future reset timestamp within the 60s window', async () => {
		const { checkRateLimit } = await import('@/lib/rate-limit');
		const before = Date.now();
		const r = await checkRateLimit('reset-test');
		expect(r.reset).toBeGreaterThanOrEqual(before);
		expect(r.reset).toBeLessThanOrEqual(before + 60_500);
	});

	it('resets the counter after the window elapses', async () => {
		vi.useFakeTimers();
		try {
			const { checkRateLimit } = await import('@/lib/rate-limit');
			await checkRateLimit('window-test');
			await checkRateLimit('window-test');
			await checkRateLimit('window-test');
			const blocked = await checkRateLimit('window-test');
			expect(blocked.success).toBe(false);

			// Advance past the 60s window.
			vi.setSystemTime(Date.now() + 61_000);

			const allowed = await checkRateLimit('window-test');
			expect(allowed.success).toBe(true);
			expect(allowed.remaining).toBe(2);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('checkRateLimit (Upstash branch)', () => {
	it('uses Upstash when env vars are set', async () => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

		const limitMock = vi.fn().mockResolvedValue({
			success: true,
			remaining: 2,
			reset: Date.now() + 60_000,
		});
		const redisCtor = vi.fn();
		const ratelimitCtor = vi.fn();

		vi.doMock('@upstash/ratelimit', () => ({
			Ratelimit: class {
				static slidingWindow(..._args: unknown[]) {
					return { type: 'sliding-window' };
				}
				constructor(opts: unknown) {
					ratelimitCtor(opts);
				}
				limit = limitMock;
			},
		}));
		vi.doMock('@upstash/redis', () => ({
			Redis: class {
				constructor(opts: unknown) {
					redisCtor(opts);
				}
			},
		}));

		const { checkRateLimit } = await import('@/lib/rate-limit');
		const r = await checkRateLimit('9.9.9.9');

		expect(r.success).toBe(true);
		expect(r.remaining).toBe(2);
		expect(limitMock).toHaveBeenCalledTimes(1);
		// Module prefixes the key with "email-form:" — confirm IP is in the key.
		expect(limitMock.mock.calls[0][0]).toEqual(expect.stringContaining('9.9.9.9'));
		// Redis was constructed with the env credentials.
		expect(redisCtor).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://example.upstash.io',
				token: 'fake-token',
			}),
		);
		// Ratelimit was constructed with a redis instance and a limiter.
		expect(ratelimitCtor).toHaveBeenCalledTimes(1);
	});

	it('propagates Upstash failure (success: false)', async () => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
		process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

		const resetTs = Date.now() + 60_000;
		const limitMock = vi.fn().mockResolvedValue({
			success: false,
			remaining: 0,
			reset: resetTs,
		});

		vi.doMock('@upstash/ratelimit', () => ({
			Ratelimit: class {
				static slidingWindow(..._args: unknown[]) {
					return {};
				}
				limit = limitMock;
			},
		}));
		vi.doMock('@upstash/redis', () => ({
			Redis: class {},
		}));

		const { checkRateLimit } = await import('@/lib/rate-limit');
		const r = await checkRateLimit('10.0.0.1');

		expect(r.success).toBe(false);
		expect(r.remaining).toBe(0);
		expect(r.reset).toBe(resetTs);
	});

	it('falls back to in-memory when only one Upstash env var is set', async () => {
		process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
		// UPSTASH_REDIS_REST_TOKEN intentionally missing.

		const limitMock = vi.fn();
		vi.doMock('@upstash/ratelimit', () => ({
			Ratelimit: class {
				static slidingWindow() {
					return {};
				}
				limit = limitMock;
			},
		}));
		vi.doMock('@upstash/redis', () => ({
			Redis: class {},
		}));

		const { checkRateLimit } = await import('@/lib/rate-limit');
		const r = await checkRateLimit('partial-env');
		expect(r.success).toBe(true);
		expect(limitMock).not.toHaveBeenCalled();
	});
});
