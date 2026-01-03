import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { Variables } from "../types/hono";
import { ValidationError } from "../utils/errors";

const app = new Hono<{ Variables: Variables }>();

// Create a report
app.post("/", auth, async (c) => {
    const user = c.get("user");
    const { type, id, reason } = await c.req.json();

    if (!type || !id || !reason) {
        throw new ValidationError("Missing required fields");
    }

    if (!['snippet', 'comment'].includes(type)) {
        throw new ValidationError("Invalid report type");
    }

    const reportData: any = {
        reporterId: BigInt(user.id),
        reason,
        status: 'pending',
    };

    if (type === 'snippet') {
        // Check if id is a valid BigInt string (numeric)
        if (/^\d+$/.test(id)) {
            reportData.snippetId = BigInt(id);
        } else {
            // Assume it's a slug
            const snippet = await prisma.snippet.findUnique({
                where: { slug: id },
                select: { id: true }
            });

            if (!snippet) {
                throw new ValidationError("Invalid snippet ID or slug");
            }
            reportData.snippetId = snippet.id;
        }
    } else if (type === 'comment') {
        reportData.commentId = BigInt(id);
    }

    await prisma.report.create({
        data: reportData,
    });

    // Notify admin (ravixalgorithm)
    try {
        const reporter = await prisma.user.findUnique({
            where: { id: BigInt(user.id) },
            select: { username: true }
        });

        const admin = await prisma.user.findUnique({
            where: { username: 'ravixalgorithm' }
        });

        if (admin && reporter) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    type: 'report',
                    message: `New report from ${reporter.username}: ${reason.substring(0, 30)}...`,
                    actorId: BigInt(user.id),
                    // We can link snippetId if it exists, otherwise null
                    snippetId: type === 'snippet' ? BigInt(id) : undefined
                }
            });
        }
    } catch (e) {
        console.error('Failed to notify admin', e);
    }

    return c.json({ status: "success", message: "Report submitted" }, 201);
});

export default app;
