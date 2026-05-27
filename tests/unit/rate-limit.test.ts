import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
	// Each test gets a fresh in-memory store via module re-import.
	vi.resetModules();
});

describe('checkRateLimit', () => {
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
