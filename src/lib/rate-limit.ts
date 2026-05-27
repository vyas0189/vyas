import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

const UPSTASH_REDIS_REST_URL =
	process.env.UPSTASH_REDIS_REST_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN =
	process.env.UPSTASH_REDIS_REST_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const hasUpstash = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

let ratelimit: Ratelimit | null = null;

if (hasUpstash) {
	const redis = new Redis({
		url: UPSTASH_REDIS_REST_URL as string,
		token: UPSTASH_REDIS_REST_TOKEN as string,
	});

	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(RATE_LIMIT, `${RATE_WINDOW_MS} ms`),
		prefix: 'email-form',
		analytics: false,
	});
} else {
	console.warn('rate-limit: falling back to in-memory (Upstash env vars missing)');
}

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>();

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

export async function checkRateLimit(ip: string): Promise<{
	success: boolean;
	remaining: number;
	reset: number;
}> {
	if (ratelimit) {
		const result = await ratelimit.limit(`email-form:${ip}`);
		return {
			success: result.success,
			remaining: result.remaining,
			reset: result.reset,
		};
	}

	return checkInMemory(ip);
}
