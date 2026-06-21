import Redis from "ioredis";
import { config } from "./env";

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true, // don't connect until first command
  retryStrategy(times) {
    // retry with exponential backoff, max 30s
    const delay = Math.min(times * 500, 30000);
    return delay;
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export default redis;