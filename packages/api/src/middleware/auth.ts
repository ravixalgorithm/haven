import { createMiddleware } from "hono/factory";
import { AuthService } from "../services/AuthService";

export const auth = createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ status: "error", error: "Unauthorized" }, 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = await AuthService.verifyToken(token);

        // Hono JWT verify returns payload as any usually, but we know our structure
        // Ensure we map it correctly to context
        c.set("user", payload);
        c.set("userId", payload.id);

        await next();
    } catch (err) {
        return c.json({ status: "error", error: "Invalid token" }, 401);
    }
});
