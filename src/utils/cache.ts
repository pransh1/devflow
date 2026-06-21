// a wrapper around Redis so we never repeat serialize/deserialize logic:
import redis from "../config/redis";

// Default TTLs in seconds
export const TTL = {
  SHORT: 60,          // 1 minute  — rate limits, OTPs
  MEDIUM: 300,        // 5 minutes — issue details, project data
  LONG: 900,          // 15 minutes — workspace list, member list
  HOUR: 3600,         // 1 hour    — rarely changing config
} as const;


// Cache key factory — central place for all key patterns
// Makes invalidation predictable and grep-able
export const CacheKeys = {
  userWorkspaces: (userId: string) => `user:${userId}:workspaces`,
  workspaceProjects: (workspaceId: string) => `workspace:${workspaceId}:projects`,
  issue: (issueId: string) => `issue:${issueId}`,
  workspaceMembers: (workspaceId: string) => `workspace:${workspaceId}:members`,
  rateLimitLogin: (ip: string) => `rate_limit:login:${ip}`,
};

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if(!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    // Cache miss is never fatal — fall through to DB
    return null;
  };
};

export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    // Log but never crash because of cache write failure
    console.error('Cache write failed:', err);
  };
};

export async function deleteCache(key: string):Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Cache delete failed:', err);
  };
};

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    // SCAN is safe for production — never use KEYS in prod
    const keys = await redis.keys(pattern);
    if(keys.length > 0) {
      await redis.del(...keys);
    } 
  } catch (err) {
    console.error('Cache pattern delete failed:', err);
  }
}