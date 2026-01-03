import { createMiddleware } from "hono/factory";

export const cache = createMiddleware(async (c, next) => {
    if (c.req.method !== "GET") {
        c.header("Cache-Control", "no-store, no-cache, must-revalidate");
        c.header("CDN-Cache-Control", "no-store");
        await next();
        return;
    }

    const path = c.req.path;
    let maxAge = 0;

    if (path.includes("/snippets")) {
        maxAge = 300; // 5 minutes
    } else if (path.includes("/trending")) {
        maxAge = 3600; // 1 hour
    } else if (path.includes("/search")) {
        maxAge = 600; // 10 minutes
    } else if (path.includes("/users")) {
        maxAge = 1800; // 30 minutes
    }

    if (maxAge > 0) {
        c.header("Cache-Control", `public, max-age=${maxAge}`);
        c.header("CDN-Cache-Control", `public, max-age=${maxAge}`);
    }

    await next();
});
