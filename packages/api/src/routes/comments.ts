import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { Variables } from "../types/hono";

const app = new Hono<{ Variables: Variables }>();

// Update Comment
app.put("/:id", auth, async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const { content } = await c.req.json();

    if (!content) {
        return c.json({ status: "error", error: "Content required" }, 400);
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: BigInt(id) },
        });

        if (!comment) {
            return c.json({ status: "error", error: "Comment not found" }, 404);
        }

        if (Number(comment.userId) !== user.id) {
            return c.json(
                { status: "error", error: "Only author can edit comment" },
                403
            );
        }

        const updated = await prisma.comment.update({
            where: { id: BigInt(id) },
            data: { content },
            include: { user: { select: { username: true, avatarUrl: true } } }
        });

        const response = JSON.parse(JSON.stringify(updated, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response });
    } catch (err: any) {
        return c.json({ status: "error", error: err.message }, 500);
    }
});

// Delete Comment
app.delete("/:id", auth, async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");

    const comment = await prisma.comment.findUnique({
        where: { id: BigInt(id) },
    });

    if (!comment) {
        return c.json({ status: "error", error: "Comment not found" }, 404);
    }

    if (Number(comment.userId) !== user.id) {
        return c.json(
            { status: "error", error: "Only author can delete comment" },
            403
        );
    }

    await prisma.comment.delete({
        where: { id: BigInt(id) },
    });

    return c.json({ status: "success", message: "Comment deleted" });
});

import { CommentService } from "../services/CommentService";

// ... previous code ...

// Upvote comment
app.post("/:id/upvote", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    try {
        const result = await CommentService.vote(id, BigInt(user.id), "upvote");

        const response = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response });
    } catch (err: any) {
        return c.json({ status: "error", error: err.message }, 500);
    }
});

// Downvote comment
app.post("/:id/downvote", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    try {
        const result = await CommentService.vote(id, BigInt(user.id), "downvote");

        const response = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response });
    } catch (err: any) {
        return c.json({ status: "error", error: err.message }, 500);
    }
});

export default app;
