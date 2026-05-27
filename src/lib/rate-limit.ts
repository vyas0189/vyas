// In-memory sliding-window rate limiter. Per-instance only — on Netlify
// Functions each cold-start gets its own Map, so this is best-effort and
// cosmetic in production. Good enough for a personal portfolio's contact form;
// swap for a distributed limiter (Upstash, Netlify Blobs, etc.) if abuse
// becomes a concern.

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(ip: string): Promise<{
	success: boolean;
	remaining: number;
	reset: number;
}> {
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
