// Distributed rate limiter backed by Netlify Blobs, with in-memory fallback
// for local dev and any environment where Blobs is unavailable.
//
// On Netlify Functions, Blobs gives us a key-value store that survives across
// cold starts and function instances — so a determined attacker can't bypass
// the limit by hitting different containers. Locally (astro dev without
// `netlify dev`) the Blobs SDK throws on access, so we fall back to a
// per-process Map.
//
// Note: Blobs is eventually-consistent. Concurrent requests from the same IP
// in the exact same 100ms window could both see a stale count and both
// succeed at the limit boundary. For a personal portfolio contact form this
// race is acceptable (worst case: a couple extra messages slip through per
// cold start).

import { getStore, type Store } from '@netlify/blobs';

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

type Entry = { count: number; resetAt: number };

const memoryStore = new Map<string, Entry>();

let blobStore: Store | null | undefined;

function getBlobStore(): Store | null {
	if (blobStore !== undefined) return blobStore;
	try {
		blobStore = getStore({ name: 'rate-limit', consistency: 'strong' });
	} catch {
		// Local dev / non-Netlify environment — Blobs SDK throws without context.
		blobStore = null;
	}
	return blobStore;
}

function checkInMemory(ip: string): {
	success: boolean;
	remaining: number;
	reset: number;
} {
	const now = Date.now();
	const entry = memoryStore.get(ip);

	if (!entry || now > entry.resetAt) {
		const resetAt = now + RATE_WINDOW_MS;
		memoryStore.set(ip, { count: 1, resetAt });
		return { success: true, remaining: RATE_LIMIT - 1, reset: resetAt };
	}

	entry.count++;
	const remaining = Math.max(0, RATE_LIMIT - entry.count);
	return {
		success: entry.count <= RATE_LIMIT,
		remaining,
		reset: entry.resetAt,
	};
}

async function checkInBlobs(
	store: Store,
	ip: string,
): Promise<{ success: boolean; remaining: number; reset: number }> {
	const now = Date.now();
	const key = `ip:${ip}`;
	const existing = (await store.get(key, { type: 'json' })) as Entry | null;

	if (!existing || now > existing.resetAt) {
		const resetAt = now + RATE_WINDOW_MS;
		await store.setJSON(key, { count: 1, resetAt });
		return { success: true, remaining: RATE_LIMIT - 1, reset: resetAt };
	}

	const nextCount = existing.count + 1;
	const remaining = Math.max(0, RATE_LIMIT - nextCount);
	await store.setJSON(key, { count: nextCount, resetAt: existing.resetAt });
	return {
		success: nextCount <= RATE_LIMIT,
		remaining,
		reset: existing.resetAt,
	};
}

export async function checkRateLimit(ip: string): Promise<{
	success: boolean;
	remaining: number;
	reset: number;
}> {
	const store = getBlobStore();
	if (!store) return checkInMemory(ip);

	try {
		return await checkInBlobs(store, ip);
	} catch (err) {
		// Blobs unreachable mid-request — fall back to in-memory rather than
		// failing the user's submission outright.
		console.warn('rate-limit: Blobs unavailable, falling back to memory', {
			name: (err as Error)?.name,
		});
		return checkInMemory(ip);
	}
}
