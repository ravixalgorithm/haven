import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL);

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch (err) {
        console.error(`Cache get error for key ${key}:`, err);
        return null;
    }
};

export const cacheSet = async (
    key: string,
    value: any,
    ttlSeconds?: number
): Promise<void> => {
    try {
        const data = JSON.stringify(value);
        if (ttlSeconds) {
            await redis.set(key, data, "EX", ttlSeconds);
        } else {
            await redis.set(key, data);
        }
    } catch (err) {
        console.error(`Cache set error for key ${key}:`, err);
    }
};

export const cacheDelete = async (key: string): Promise<void> => {
    try {
        await redis.del(key);
    } catch (err) {
        console.error(`Cache delete error for key ${key}:`, err);
    }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (err) {
        console.error(`Cache delete pattern error for ${pattern}:`, err);
    }
};
