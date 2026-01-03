import { createMiddleware } from "hono/factory";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Variables } from "../types/hono";

// Create a new ratelimiter, that allows 100 requests per 15 minutes
const cache = new Map();

const limiter = new Ratelimit({
    redis: new Redis({
        url: process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(100, "15 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
    ephemeralCache: cache,
});

export const rateLimit = createMiddleware<{ Variables: Variables }>(async (c, next) => {
    // 1. Bypass Logic
    if (c.req.method === "GET" && c.req.path.includes("/snippets")) {
        await next();
        return;
    }

    // 2. Identify User
    // Try to get userId from auth middleware (if it ran before this)
    let identifier = "ip";
    try {
        const userId = c.get("userId");
        if (userId) {
            identifier = `user:${userId}`;
        } else {
            // Fallback to IP
            const ip = c.req.header("x-forwarded-for") || "0.0.0.0";
            identifier = `ip:${ip}`;
        }
    } catch (e) {
        // Context might not have userId if auth didn't run or failed
        const ip = c.req.header("x-forwarded-for") || "0.0.0.0";
        identifier = `ip:${ip}`;
    }

    // 3. Check Limit
    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        c.header("X-RateLimit-Limit", limit.toString());
        c.header("X-RateLimit-Remaining", remaining.toString());
        c.header("X-RateLimit-Reset", reset.toString());

        if (!success) {
            return c.json(
                { status: "error", error: "Too Many Requests" },
                429
            );
        }

        await next();
    } catch (err) {
        console.error("Rate limit error:", err);
        // Fail open: Allow request if rate limiter is down
        await next();
    }
});
