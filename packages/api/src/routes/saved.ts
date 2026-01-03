import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth } from "../middleware/auth";
import { Variables } from "../types/hono";

const app = new Hono<{ Variables: Variables }>();

// Get user's saved snippets
app.get("/", auth, async (c) => {
    const user = c.get("user");
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const skip = (page - 1) * limit;

    const [savedSnippets, total] = await Promise.all([
        prisma.savedSnippet.findMany({
            where: { userId: BigInt(user.id) },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
            include: {
                snippet: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.savedSnippet.count({ where: { userId: BigInt(user.id) } }),
    ]);

    const snippets = savedSnippets.map((s) => ({
        ...s.snippet,
        id: s.snippet.id.toString(),
        authorId: s.snippet.authorId.toString(),
        author: {
            ...s.snippet.author,
            id: s.snippet.author.id.toString(),
        },
        savedAt: s.createdAt.toISOString(),
    }));

    return c.json({
        status: "success",
        data: {
            snippets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        },
    });
});

// Check if a snippet is saved
app.get("/:snippetId/check", auth, async (c) => {
    const user = c.get("user");
    const snippetId = c.req.param("snippetId");

    const saved = await prisma.savedSnippet.findUnique({
        where: {
            userId_snippetId: {
                userId: BigInt(user.id),
                snippetId: BigInt(snippetId),
            },
        },
    });

    return c.json({ status: "success", data: { saved: !!saved } });
});

// Save a snippet
app.post("/:snippetId", auth, async (c) => {
    const user = c.get("user");
    const snippetId = c.req.param("snippetId");

    try {
        await prisma.savedSnippet.create({
            data: {
                userId: BigInt(user.id),
                snippetId: BigInt(snippetId),
            },
        });

        return c.json({ status: "success", message: "Snippet saved" });
    } catch (err: any) {
        // Already saved (unique constraint)
        if (err.code === "P2002") {
            return c.json({ status: "success", message: "Already saved" });
        }
        throw err;
    }
});

// Unsave a snippet
app.delete("/:snippetId", auth, async (c) => {
    const user = c.get("user");
    const snippetId = c.req.param("snippetId");

    await prisma.savedSnippet.deleteMany({
        where: {
            userId: BigInt(user.id),
            snippetId: BigInt(snippetId),
        },
    });

    return c.json({ status: "success", message: "Snippet unsaved" });
});

export default app;
