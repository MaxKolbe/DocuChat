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
  for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    await redisClient.del(key);
  }
};

export const hashKey = async (...parts: string[]): Promise<string> => {
  const data = parts.join(",");
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 16);
};
