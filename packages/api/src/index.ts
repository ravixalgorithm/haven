import "./setupEnv"; // Must be first
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/errorHandler";
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
            // Allow all origins in development, or specific origins in production
            const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",");
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

app.get("/health", (c) => c.json({ status: "ok" }));

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
