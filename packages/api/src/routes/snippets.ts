import { Hono } from "hono";
import { auth } from "../middleware/auth";
import { SnippetService } from "../services/SnippetService";
import { VoteService } from "../services/VoteService";
import { CommentService } from "../services/CommentService";
import { Variables } from "../types/hono";
import { ValidationError, NotFoundError, PermissionError } from "../utils/errors";
import { prisma } from "../lib/prisma";

const app = new Hono<{ Variables: Variables }>();

// List all snippets
app.get("/", async (c) => {
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 10;
    const language = c.req.query("language");
    const sort = c.req.query("sort") === 'popular' ? 'popular' : 'newest';

    const result = await SnippetService.listSnippets(page, limit, language, sort);

    const response = JSON.parse(JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    return c.json({ status: "success", data: response });
});

// Create snippet
app.post("/", auth, async (c) => {
    const user = c.get("user");
    const body = await c.req.json();

    // Basic validation
    if (!body.title || !body.code || !body.language) {
        throw new ValidationError("Missing required fields");
    }

    try {
        const snippet = await SnippetService.createSnippet(body, BigInt(user.id));

        // Serialize BigInt
        const response = JSON.parse(JSON.stringify(snippet, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response }, 201);
    } catch (err: any) {
        throw err;
    }
});

// Get single snippet
app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const snippet = await SnippetService.getSnippet(id);

    if (!snippet) {
        throw new NotFoundError("Snippet not found");
    }

    return c.json({ status: "success", data: snippet });
});

// Edit snippet
app.put("/:id", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();

    try {
        const updated = await SnippetService.updateSnippet(id, body, BigInt(user.id));

        const response = JSON.parse(JSON.stringify(updated, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response });
    } catch (err: any) {
        if (err.message === "Unauthorized") {
            throw new PermissionError("Unauthorized");
        }
        if (err.message === "Snippet not found") {
            throw new NotFoundError("Snippet not found");
        }
        throw err;
    }
});

// Delete snippet
app.delete("/:id", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    try {
        await SnippetService.deleteSnippet(id, BigInt(user.id));
        return c.json({ status: "success", message: "Snippet deleted" });
    } catch (err: any) {
        if (err.message === "Unauthorized") {
            throw new PermissionError("Unauthorized");
        }
        if (err.message === "Snippet not found") {
            throw new NotFoundError("Snippet not found");
        }
        throw err;
    }
});

// Get user vote status
app.get("/:id/vote", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const vote = await VoteService.getUserVoteOnSnippet(id, BigInt(user.id));
    return c.json({ status: "success", data: { vote } });
});

// Upvote snippet
app.post("/:id/upvote", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    try {
        // Get snippet info for notification
        const snippetInfo = await prisma.snippet.findUnique({
            where: { id: BigInt(id) },
            select: { id: true, authorId: true },
        });

        const updatedSnippet = await VoteService.upvote(id, BigInt(user.id));
        const currentVote = await VoteService.getUserVoteOnSnippet(id, BigInt(user.id));

        // Create notification for snippet author (if not self-upvote and is an upvote, not removal)
        if (snippetInfo && Number(snippetInfo.authorId) !== user.id && currentVote === "upvote") {
            const notification = await prisma.notification.create({
                data: {
                    userId: snippetInfo.authorId,
                    type: "upvote",
                    message: "upvoted your snippet",
                    actorId: BigInt(user.id),
                    snippetId: snippetInfo.id,
                },
                include: {
                    actor: {
                        select: { id: true, username: true, avatarUrl: true }
                    },
                    snippet: {
                        select: { id: true, title: true, slug: true }
                    }
                }
            });

            // Emit real-time notification
            const SocketService = (await import("../lib/socket")).SocketService;
            SocketService.getInstance().emitNotification(snippetInfo.authorId.toString(), {
                ...notification,
                id: notification.id.toString(),
                actorId: notification.actorId.toString(),
                userId: notification.userId.toString(),
                snippetId: notification.snippetId?.toString(),
                createdAt: notification.createdAt.toISOString()
            });
        }

        const response = JSON.parse(JSON.stringify(updatedSnippet, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: { ...response, userVote: currentVote } });
    } catch (err: any) {
        throw err;
    }
});

// Downvote snippet
app.post("/:id/downvote", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    try {
        const updatedSnippet = await VoteService.downvote(id, BigInt(user.id));
        const currentVote = await VoteService.getUserVoteOnSnippet(id, BigInt(user.id));

        const response = JSON.parse(JSON.stringify(updatedSnippet, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: { ...response, userVote: currentVote } });
    } catch (err: any) {
        throw err;
    }
});

// Get comments
app.get("/:id/comments", async (c) => {
    const id = c.req.param("id");
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 100; // Increased limit for threading

    try {
        const result = await CommentService.getComments(id, page, limit);

        const response = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response });
    } catch (err: any) {
        throw err;
    }
});

// Add comment
app.post("/:id/comments", auth, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const { content, parentId } = await c.req.json();

    if (!content) {
        throw new ValidationError("Content required");
    }

    try {
        // Get snippet info for notification
        const snippetInfo = await prisma.snippet.findUnique({
            where: { id: BigInt(id) },
            select: { id: true, authorId: true },
        });

        const comment = await CommentService.addComment(id, BigInt(user.id), content, parentId);

        // Create notification for snippet author (if not self-comment)
        if (snippetInfo && Number(snippetInfo.authorId) !== user.id) {
            const notification = await prisma.notification.create({
                data: {
                    userId: snippetInfo.authorId,
                    type: "comment",
                    message: "commented on your snippet",
                    actorId: BigInt(user.id),
                    snippetId: snippetInfo.id,
                },
                include: {
                    actor: {
                        select: { id: true, username: true, avatarUrl: true }
                    },
                    snippet: {
                        select: { id: true, title: true, slug: true }
                    }
                }
            });

            // Emit real-time notification
            const SocketService = (await import("../lib/socket")).SocketService;
            SocketService.getInstance().emitNotification(snippetInfo.authorId.toString(), {
                ...notification,
                id: notification.id.toString(),
                actorId: notification.actorId.toString(),
                userId: notification.userId.toString(),
                snippetId: notification.snippetId?.toString(),
                createdAt: notification.createdAt.toISOString()
            });
        }

        const response = JSON.parse(JSON.stringify(comment, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return c.json({ status: "success", data: response }, 201);
    } catch (err: any) {
        throw err;
    }
});

export default app;
