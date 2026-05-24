import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 2) {
        console.warn('[Redis] Connection failed. Running in standalone mode without Redis.');
        return null; // Stop retrying
      }
      return 1000;
    }
  });

  redisClient.on('error', (err: any) => {
    console.warn(`[Redis] Socket error: ${err.message || err}`);
    isRedisAvailable = false;
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully.');
    isRedisAvailable = true;
  });
} catch (error) {
  console.warn('[Redis] Setup failed. Redis will not be used.', error);
}

export { redisClient, isRedisAvailable };
export default redisClient;
