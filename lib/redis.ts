import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
	if (
		!process.env.UPSTASH_REDIS_REST_URL ||
		!process.env.UPSTASH_REDIS_REST_TOKEN
	) {
		console.warn(
			'Redis configuration missing: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set'
		);
		return null;
	}

	if (!redis) {
		try {
			redis = Redis.fromEnv();
		} catch (error) {
			console.error('Failed to initialize Redis client:', error);
			return null;
		}
	}

	return redis;
}

export async function testRedisConnection(): Promise<boolean> {
	const client = getRedisClient();
	if (!client) {
		return false;
	}

	try {
		const testKey = `test:${Date.now()}`;
		const testValue = 'connection-test';

		await client.set(testKey, testValue, { ex: 10 }); // 10 second expiry
		const result = await client.get(testKey);
		await client.del(testKey);

		return result === testValue;
	} catch (error) {
		console.error('Redis connection test failed:', error);
		return false;
	}
}
