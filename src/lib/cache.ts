import { resolve } from "dns";
import redisClient from "../configs/cache.config.js";
import crypto from "crypto";

//TTL in seconds
export const CACHE_TTL = {
  PERMISSIONS: 300, // 5 minutes
  DOCUMENT: 600, // 10 minutes
  CONVERSATION_LIST: 120, // 2 minutes
  EMBEDDING: 604800, // 7 days
  RAG_RESULT: 3600, // 1 hour
} as const;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const raw = await redisClient.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttlseconds: number): Promise<void> => {
  await redisClient.setEx(key, ttlseconds, JSON.stringify(value));
};

export const cacheDel = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  // found this baby on stackoverflow ouuwee
  for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    await redisClient.del(key);
  }
};

export const hashKey = async (...parts: string[]): Promise<string> => {
  const data = parts.join(":");
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 16);
};

export const cacheGetOrSet = async <T>(
  key: string,
  ttlseconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> => {
  // 1. Try cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  //2. Try to acquire lock
  const lockKey = `docuchat:lock:${key}`;
  const acquired = await redisClient.set(lockKey, "1", { EX: 5, condition: "NX" }); // Expires in 5s, set only if not exists

  if (acquired) {
    // We got the lock. fetch and cache
    try {
      const value = await fetchFn();
      await cacheSet(key, value, ttlseconds);
      return value;
    } finally {
      await redisClient.del(lockKey);
    }
  }

  //3. someone else has the lock. Wait briefly, then try cache again
  await new Promise((resolve) => setTimeout(resolve, 100));
  const retried = await cacheGet<T>(key);
  if(retried !== null) return retried

  //4. Lock holder failed or cache still empty. Just fetch directly
  return fetchFn()
};
