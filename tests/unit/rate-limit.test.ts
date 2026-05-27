import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
	// Each test gets a fresh module state (fresh in-memory Map + re-evaluated
	// Blobs getStore lookup) via re-import.
	vi.resetModules();
	vi.unstubAllEnvs();
});

// --- helpers ---

function makeBlobMap() {
	const map = new Map<string, unknown>();
	return {
		map,
		store: {
			get: vi.fn(async (key: string, _opts?: unknown) => map.get(key) ?? null),
			setJSON: vi.fn(async (key: string, value: unknown) => {
				map.set(key, value);
			}),
		},
	};
}

/**
 * Mocks @netlify/blobs so the rate-limit module picks up the in-memory fake
 * store instead of attempting to talk to Netlify. Must be called before
 * importing the module under test.
 */
function mockBlobsAvailable(store: unknown) {
	vi.doMock('@netlify/blobs', () => ({
		getStore: vi.fn(() => store),
	}));
}

function mockBlobsUnavailable() {
	vi.doMock('@netlify/blobs', () => ({
		getStore: vi.fn(() => {
			throw new Error('MissingBlobsEnvironmentError');
		}),
	}));
}

// --- Blobs-backed path (primary) ---

describe('checkRateLimit (Netlify Blobs)', () => {
	it('allows the first 3 requests in a window', async () => {
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);
		const { checkRateLimit } = await import('@/lib/rate-limit');

		const r1 = await checkRateLimit('1.2.3.4');
		const r2 = await checkRateLimit('1.2.3.4');
		const r3 = await checkRateLimit('1.2.3.4');

		expect(r1.success).toBe(true);
		expect(r2.success).toBe(true);
		expect(r3.success).toBe(true);
	});

	it('reports decreasing remaining counts within the window', async () => {
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);
		const { checkRateLimit } = await import('@/lib/rate-limit');

		const r1 = await checkRateLimit('remaining-test');
		const r2 = await checkRateLimit('remaining-test');
		const r3 = await checkRateLimit('remaining-test');

		expect(r1.remaining).toBe(2);
		expect(r2.remaining).toBe(1);
		expect(r3.remaining).toBe(0);
	});

	it('blocks the 4th request in a window', async () => {
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);
		const { checkRateLimit } = await import('@/lib/rate-limit');

		await checkRateLimit('5.6.7.8');
		await checkRateLimit('5.6.7.8');
		await checkRateLimit('5.6.7.8');
		const r4 = await checkRateLimit('5.6.7.8');

		expect(r4.success).toBe(false);
		expect(r4.remaining).toBe(0);
	});

	it('isolates by IP', async () => {
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);
		const { checkRateLimit } = await import('@/lib/rate-limit');

		await checkRateLimit('ip-a');
		await checkRateLimit('ip-a');
		await checkRateLimit('ip-a');
		const blockedA = await checkRateLimit('ip-a');
		const freshB = await checkRateLimit('ip-b');

		expect(blockedA.success).toBe(false);
		expect(freshB.success).toBe(true);
	});

	it('persists across module re-imports (simulating cold starts)', async () => {
		// Same fake store, different module instances — what survives is the
		// blob data, which is the whole point of using Blobs.
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);

		const first = await import('@/lib/rate-limit');
		await first.checkRateLimit('persist-test');
		await first.checkRateLimit('persist-test');
		await first.checkRateLimit('persist-test');

		vi.resetModules();
		mockBlobsAvailable(store);
		const second = await import('@/lib/rate-limit');
		const r4 = await second.checkRateLimit('persist-test');

		expect(r4.success).toBe(false);
	});

	it('returns a future reset timestamp within the 60s window', async () => {
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);
		const { checkRateLimit } = await import('@/lib/rate-limit');

		const before = Date.now();
		const r = await checkRateLimit('reset-test');

		expect(r.reset).toBeGreaterThanOrEqual(before);
		expect(r.reset).toBeLessThanOrEqual(before + 60_500);
	});

	it('resets the counter after the window elapses', async () => {
		const { store } = makeBlobMap();
		mockBlobsAvailable(store);
		vi.useFakeTimers();
		try {
			const { checkRateLimit } = await import('@/lib/rate-limit');
			await checkRateLimit('window-test');
			await checkRateLimit('window-test');
			await checkRateLimit('window-test');
			const blocked = await checkRateLimit('window-test');
			expect(blocked.success).toBe(false);

			vi.setSystemTime(Date.now() + 61_000);

			const allowed = await checkRateLimit('window-test');
			expect(allowed.success).toBe(true);
			expect(allowed.remaining).toBe(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it('falls back to in-memory if Blobs throws mid-request', async () => {
		const failingStore = {
			get: vi.fn(async () => {
				throw new Error('blobs network failure');
			}),
			setJSON: vi.fn(),
		};
		mockBlobsAvailable(failingStore);
		const { checkRateLimit } = await import('@/lib/rate-limit');

		// Should not throw — should degrade to in-memory.
		const r = await checkRateLimit('blobs-down');
		expect(r.success).toBe(true);
	});
});

// --- Pure in-memory fallback (Blobs unavailable, e.g. local astro dev) ---

describe('checkRateLimit (in-memory fallback when Blobs is unavailable)', () => {
	it('still rate-limits correctly when Blobs SDK throws on init', async () => {
		mockBlobsUnavailable();
		const { checkRateLimit } = await import('@/lib/rate-limit');

		await checkRateLimit('no-blobs');
		await checkRateLimit('no-blobs');
		await checkRateLimit('no-blobs');
		const blocked = await checkRateLimit('no-blobs');

		expect(blocked.success).toBe(false);
	});
});
