import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { Variables } from "../types/hono";

const app = new Hono<{ Variables: Variables }>();

// Get user's notifications
app.get("/", auth, async (c) => {
    const user = c.get("user");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    const notifications = await prisma.notification.findMany({
        where: { userId: BigInt(user.id) },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
            actor: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                },
            },
            snippet: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
        },
    });

    // Convert BigInt to string for JSON serialization
    const serialized = notifications.map((n) => ({
        id: n.id.toString(),
        type: n.type,
        message: n.message,
        actor: {
            id: n.actor.id.toString(),
            username: n.actor.username,
            avatarUrl: n.actor.avatarUrl,
        },
        snippet: n.snippet
            ? {
                id: n.snippet.id.toString(),
                title: n.snippet.title,
                slug: n.snippet.slug,
            }
            : null,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
    }));

    return c.json({ status: "success", data: { notifications: serialized } });
});

// Get unread count
app.get("/unread-count", auth, async (c) => {
    const user = c.get("user");

    const count = await prisma.notification.count({
        where: {
            userId: BigInt(user.id),
            read: false,
        },
    });

    return c.json({ status: "success", data: { count } });
});

// Mark single notification as read
app.put("/:id/read", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const notification = await prisma.notification.findUnique({
        where: { id: BigInt(id) },
    });

    if (!notification) {
        return c.json({ status: "error", error: "Notification not found" }, 404);
    }

    if (Number(notification.userId) !== user.id) {
        return c.json({ status: "error", error: "Unauthorized" }, 403);
    }

    await prisma.notification.update({
        where: { id: BigInt(id) },
        data: { read: true },
    });

    return c.json({ status: "success", message: "Notification marked as read" });
});

// Mark all notifications as read
app.put("/read-all", auth, async (c) => {
    const user = c.get("user");

    await prisma.notification.updateMany({
        where: {
            userId: BigInt(user.id),
            read: false,
        },
        data: { read: true },
    });

    return c.json({ status: "success", message: "All notifications marked as read" });
});

export default app;
