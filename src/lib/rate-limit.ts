// Distributed rate limiter backed by Netlify Blobs, with in-memory fallback
// for local dev and any environment where Blobs is unavailable.
//
// On Netlify Functions, Blobs gives us a key-value store that survives across
// cold starts and function instances — so a determined attacker can't bypass
// the limit by hitting different containers. Locally (astro dev without
// `netlify dev`) the Blobs SDK throws on access, so we fall back to a
// per-process Map.
//
// Privacy: keys are salted HMAC-SHA256 hashes of the caller's IP, never the
// raw address (set RATE_LIMIT_SALT to rotate). Blobs has no TTL, so a small
// probabilistic sweep deletes entries that have been stale for over an hour —
// hashed IPs are not retained indefinitely.
//
// Note: Blobs is eventually-consistent. Concurrent requests from the same IP
// in the exact same 100ms window could both see a stale count and both
// succeed at the limit boundary. For a personal portfolio contact form this
// race is acceptable (worst case: a couple extra messages slip through per
// cold start).

import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { getStore, type Store } from '@netlify/blobs';

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;
const STALE_AFTER_MS = 60 * 60_000;
// Sweep on ~1 in 10 requests. crypto.randomInt isn't needed for security here,
// but it keeps static analyzers from flagging Math.random in security code.
const PRUNE_ONE_IN = 10;
const PRUNE_MAX_KEYS = 50;

type Entry = { count: number; resetAt: number };

const memoryStore = new Map<string, Entry>();

let blobStore: Store | null | undefined;

// HMAC salt for IP hashing. When RATE_LIMIT_SALT is unset (local dev), a
// random per-process salt is generated instead of using any hardcoded value —
// hashes then differ across instances, which only costs cross-instance bucket
// continuity in environments that never set the var. Production sets it.
const ipSalt = process.env.RATE_LIMIT_SALT || randomBytes(16).toString('hex');

function hashIp(ip: string): string {
	return createHmac('sha256', ipSalt).update(ip).digest('hex').slice(0, 32);
}

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

function checkInMemory(key: string): {
	success: boolean;
	remaining: number;
	reset: number;
} {
	const now = Date.now();
	const entry = memoryStore.get(key);

	if (!entry || now > entry.resetAt) {
		const resetAt = now + RATE_WINDOW_MS;
		memoryStore.set(key, { count: 1, resetAt });
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
	key: string,
): Promise<{ success: boolean; remaining: number; reset: number }> {
	const now = Date.now();
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

// Blobs has no TTL, so occasionally sweep out long-stale entries. Bounded and
// best-effort: a failed sweep never affects the caller's request.
async function pruneStaleEntries(store: Store): Promise<void> {
	const now = Date.now();
	const { blobs } = await store.list();
	for (const { key } of blobs.slice(0, PRUNE_MAX_KEYS)) {
		const entry = (await store.get(key, { type: 'json' })) as Entry | null;
		if (!entry || now > entry.resetAt + STALE_AFTER_MS) {
			await store.delete(key);
		}
	}
}

export async function checkRateLimit(ip: string): Promise<{
	success: boolean;
	remaining: number;
	reset: number;
}> {
	const key = `ip:${hashIp(ip)}`;

	const store = getBlobStore();
	if (!store) return checkInMemory(key);

	try {
		const result = await checkInBlobs(store, key);
		if (randomInt(PRUNE_ONE_IN) === 0) {
			try {
				await pruneStaleEntries(store);
			} catch {
				// best-effort cleanup; never affect the request
			}
		}
		return result;
	} catch (err) {
		// Blobs unreachable mid-request — fall back to in-memory rather than
		// failing the user's submission outright.
		console.warn('rate-limit: Blobs unavailable, falling back to memory', {
			name: (err as Error)?.name,
		});
		return checkInMemory(key);
	}
}
