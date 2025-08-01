import { getRedisClient } from './redis';

// TypeScript interfaces for rate limiting
export interface RateLimitData {
	ip: string;
	count: number;
	windowStart: number;
	lastRequest: number;
}

export interface RateLimitResult {
	allowed: boolean;
	count: number;
	resetTime: number;
	retryAfter: number;
	remaining: number;
}

export interface RateLimitConfig {
	limit: number;
	windowMs: number;
	keyPrefix: string;
}

export class RateLimitError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
		this.name = 'RateLimitError';
	}
}

// Default configuration: 5 requests per hour
const DEFAULT_CONFIG: RateLimitConfig = {
	limit: 5,
	windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
	keyPrefix: 'rate_limit:',
};

/**
 * Sliding window rate limiting implementation using Redis
 */
export async function checkRateLimit(
	ip: string,
	config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
	const { limit, windowMs, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
	const redis = getRedisClient();

	// If Redis is unavailable, allow the request (fail open)
	if (!redis) {
		console.warn('Redis unavailable - allowing request (fail open)');
		return {
			allowed: true,
			count: 0,
			resetTime: Date.now() + windowMs,
			retryAfter: 0,
			remaining: limit,
		};
	}

	const now = Date.now();
	const windowStart = now - windowMs;
	const key = `${keyPrefix}${ip}`;

	try {
		// Use Redis sorted set for sliding window
		// Remove expired entries
		await redis.zremrangebyscore(key, 0, windowStart);

		// Count current requests in window
		const count = await redis.zcard(key);

		if (count >= limit) {
			// Rate limit exceeded
			const oldestRequest = await redis.zrange(key, 0, 0, { withScores: true });
			const resetTime =
				oldestRequest.length > 0
					? (oldestRequest[1] as number) + windowMs
					: now + windowMs;

			return {
				allowed: false,
				count,
				resetTime,
				retryAfter: Math.ceil((resetTime - now) / 1000),
				remaining: 0,
			};
		}

		// Add current request to the window
		await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

		// Set expiry on the key (cleanup)
		await redis.expire(key, Math.ceil(windowMs / 1000));

		const remaining = limit - count - 1;
		const resetTime = now + windowMs;

		return {
			allowed: true,
			count: count + 1,
			resetTime,
			retryAfter: 0,
			remaining,
		};
	} catch (error) {
		console.error('Rate limit check failed:', error);
		// Fail open - allow the request if Redis fails
		return {
			allowed: true,
			count: 0,
			resetTime: now + windowMs,
			retryAfter: 0,
			remaining: limit,
		};
	}
}

/**
 * Update rate limit for an IP (used after successful request processing)
 */
export async function updateRateLimit(
	ip: string,
	config: Partial<RateLimitConfig> = {}
): Promise<void> {
	// This is already handled in checkRateLimit, but can be used for manual updates
	await checkRateLimit(ip, config);
}

/**
 * Get current rate limit status for an IP without updating it
 */
export async function getRateLimitStatus(
	ip: string,
	config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
	const { limit, windowMs, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
	const redis = getRedisClient();

	if (!redis) {
		return {
			allowed: true,
			count: 0,
			resetTime: Date.now() + windowMs,
			retryAfter: 0,
			remaining: limit,
		};
	}

	const now = Date.now();
	const windowStart = now - windowMs;
	const key = `${keyPrefix}${ip}`;

	try {
		// Clean up expired entries (read-only check)
		const count = await redis.zcount(key, windowStart, '+inf');

		if (count >= limit) {
			const oldestRequest = await redis.zrange(key, 0, 0, { withScores: true });
			const resetTime =
				oldestRequest.length > 0
					? (oldestRequest[1] as number) + windowMs
					: now + windowMs;

			return {
				allowed: false,
				count,
				resetTime,
				retryAfter: Math.ceil((resetTime - now) / 1000),
				remaining: 0,
			};
		}

		return {
			allowed: true,
			count,
			resetTime: now + windowMs,
			retryAfter: 0,
			remaining: limit - count,
		};
	} catch (error) {
		console.error('Rate limit status check failed:', error);
		return {
			allowed: true,
			count: 0,
			resetTime: now + windowMs,
			retryAfter: 0,
			remaining: limit,
		};
	}
}
