import { createMiddleware } from "hono/factory";
import { Variables } from "../types/hono";

export const adminAuth = createMiddleware(async (c, next) => {
    // Ensure user is authenticated first (used in conjunction with auth middleware usually, or we verify here)
    // Assuming 'auth' middleware runs BEFORE this and sets c.get('user')
    const user = c.get("user");

    if (!user) {
        return c.json({ status: "error", error: "Unauthorized" }, 401);
    }

    // Check Role
    // The payload from JWT might not have 'role' if token is old.
    // Option A: Trust token if we add role to token?
    // Option B: Fetch user from DB to be sure? (Safer for admin actions)

    // Let's fetch from DB to be safe and ensure real-time revocation
    try {
        // Dynamic import to avoid circular dep if any? No, should be fine.
        const { prisma } = await import("../lib/prisma");

        const dbUser = await prisma.user.findUnique({
            where: { id: BigInt(user.id) },
            select: { role: true }
        });

        if (!dbUser || dbUser.role !== 'ADMIN') {
            return c.json({ status: "error", error: "Forbidden: Admins only" }, 403);
        }

        await next();
    } catch (e) {
        console.error("Admin auth error", e);
        return c.json({ status: "error", error: "Internal Server Error" }, 500);
    }
});
