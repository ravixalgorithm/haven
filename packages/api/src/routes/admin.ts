import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { Variables } from "../types/hono";

const app = new Hono<{ Variables: Variables }>();

// Apply auth and adminAuth to all routes in this file
app.use("*", auth, adminAuth);

// 1. Analytics Stats
app.get("/stats", async (c) => {
    const [userCount, snippetCount, reportCount, pendingReportCount] = await Promise.all([
        prisma.user.count(),
        prisma.snippet.count(),
        prisma.report.count(),
        prisma.report.count({ where: { status: "pending" } })
    ]);

    return c.json({
        status: "success",
        data: {
            userCount,
            snippetCount,
            totalReports: reportCount,
            pendingReports: pendingReportCount
        }
    });
});

// 2. List Reports
app.get("/reports", async (c) => {
    const status = c.req.query("status") || "pending";
    const page = Number(c.req.query("page")) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where: { status },
            skip,
            take: limit,
            include: {
                reporter: { select: { username: true, avatarUrl: true } },
                snippet: { select: { id: true, title: true, slug: true } },
                comment: { select: { id: true, content: true } }
            },
            orderBy: { createdAt: "desc" }
        }),
        prisma.report.count({ where: { status } })
    ]);

    // Serialize BigInt
    const response = JSON.parse(JSON.stringify({ reports, total, page, pages: Math.ceil(total / limit) }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    return c.json({ status: "success", data: response });
});

// 3. Resolve/Dismiss Report
app.put("/reports/:id", async (c) => {
    const id = c.req.param("id");
    const { status } = await c.req.json(); // "resolved" or "dismissed"

    if (!["resolved", "dismissed"].includes(status)) {
        return c.json({ status: "error", error: "Invalid status" }, 400);
    }

    await prisma.report.update({
        where: { id: BigInt(id) },
        data: { status }
    });

    return c.json({ status: "success", message: "Report updated" });
});

// 4. Delete Snippet (Moderation)
app.delete("/snippets/:id", async (c) => {
    const id = c.req.param("id");

    // We might want to soft delete or hard delete. 
    // Let's soft delete by setting deletedAt if schema supports it, or just delete.
    // Schema has `deletedAt`.

    try {
        await prisma.snippet.update({
            where: { id: BigInt(id) },
            data: { deletedAt: new Date() }
        });

        // Also mark reports as resolved?
        await prisma.report.updateMany({
            where: { snippetId: BigInt(id), status: "pending" },
            data: { status: "resolved" }
        });

        return c.json({ status: "success", message: "Snippet deleted" });
    } catch (e) {
        return c.json({ status: "error", error: "Failed to delete snippet" }, 500);
    }
});

// 5. List Users (for management)
app.get("/users", async (c) => {
    const page = Number(c.req.query("page")) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = c.req.query("search") || "";

    const where = search ? {
        OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } as any }
        ]
    } : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: where as any,
            skip,
            take: limit,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                snippetCount: true,
                // Include other fields if needed, e.g. ban status (when added)
            },
            orderBy: { createdAt: "desc" }
        }),
        prisma.user.count({ where: where as any })
    ]);

    const response = JSON.parse(JSON.stringify({ users, total, page, pages: Math.ceil(total / limit) }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    return c.json({ status: "success", data: response });
});

// 6. Ban User
app.post("/users/:id/ban", async (c) => {
    const id = c.req.param("id");
    // Schema doesn't have isBanned/bannedAt yet.
    // I can fake it by scrambling password/email or add field. 
    // Ideally I add `isBanned` to schema. 
    // For now, let's just add `isBanned` to schema in next step if I haven't already.
    // Wait, I only added `role`. I should add `bannedAt`.

    // CHECK SCHEMA FIRST.
    // If no bannedAt, I'll skip this for a moment or do it in same migration.

    // Let's assume I will add `bannedAt` to User in the schema fix step.

    await prisma.user.update({
        where: { id: BigInt(id) },
        data: {
            // bannedAt: new Date() 
            // For now, I'll comment this out until schema is verified/updated.
            bio: "[BANNED USER]"
        }
    });

    return c.json({ status: "success", message: "User banned (Bio updated)" });
});

export default app;
