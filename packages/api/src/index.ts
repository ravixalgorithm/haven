import "./setupEnv"; // Must be first
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./lib/prisma";
import authRoutes from './routes/auth';
import snippetRoutes from './routes/snippets';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import searchRoutes from './routes/search';
import topicsRoutes from './routes/topics';
import notificationRoutes from './routes/notifications';
import savedRoutes from './routes/saved';
import reportsRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import { Variables } from "./types/hono";

const app = new Hono<{ Variables: Variables }>().basePath("/api/v1");

// Debug: Log DB Host to verify Render Env Var
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    const host = dbUrl.split('@')[1]?.split(':')[0] || 'unknown';
    console.log(`[DEBUG] Connecting to Database Host: ${host}`);
} else {
    console.error('[DEBUG] DATABASE_URL is NOT defined!');
}

app.onError(errorHandler);

app.use("*", logger());
app.use(
    "*",
    cors({
        origin: (origin, c) => {
            const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",");
            // Allow requests with no origin (like mobile apps or curl) and allowed domains
            if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
                return origin || "*";
            }
            return allowedOrigins[0]; // Fallback
        },
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowHeaders: ["Content-Type", "Authorization", "Cookie"],
        credentials: true,
    })
);

app.get("/health", async (c) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return c.json({ status: "ok", database: "connected" });
    } catch (error: any) {
        console.error("Health Check DB Error:", error);
        return c.json({ status: "error", database: "disconnected", error: error.message }, 500);
    }
});

app.route('/auth', authRoutes);
app.route('/snippets', snippetRoutes);
app.route('/comments', commentRoutes);
app.route('/users', userRoutes);
app.route('/', searchRoutes); // mount at root to match /api/v1/search and /api/v1/trending
app.route('/topics', topicsRoutes);
app.route('/notifications', notificationRoutes);
app.route('/saved', savedRoutes);
app.route('/admin', adminRoutes);
app.route('/reports', reportsRoutes);

// Debug System Endpoint
app.get("/debug-system", async (c) => {
    const results: any = {};

    // 1. Check Outbound Network
    try {
        const start = Date.now();
        const res = await fetch('https://api.github.com/zen', { headers: { 'User-Agent': 'Hono-App' } });
        results.network = {
            status: res.ok ? 'ok' : 'error',
            latency: Date.now() - start,
            message: await res.text()
        };
    } catch (e: any) {
        results.network = { status: 'failed', error: e.message };
    }

    // 2. Check Database Complex Query
    try {
        const start = Date.now();
        const count = await prisma.user.count();
        results.database = {
            status: 'ok',
            latency: Date.now() - start,
            userCount: count
        };
    } catch (e: any) {
        results.database = { status: 'failed', error: e.message };
    }

    return c.json(results);
});

// Export for Vercel
export default app;

// Only run server if called directly (not imported)
if (require.main === module) {
    const port = Number(process.env.PORT) || 3002;
    console.log(`Server is running on port ${port}`);

    const server = serve({
        fetch: app.fetch,
        port
    });

    // Initialize Socket.io (Only for persistent servers)
    import('./lib/socket').then(({ SocketService }) => {
        SocketService.getInstance().init(server as any);
    });
}
