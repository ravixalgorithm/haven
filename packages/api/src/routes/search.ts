import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { Variables } from "../types/hono";

const app = new Hono<{ Variables: Variables }>();

// Search
app.get("/search", async (c) => {
    const q = c.req.query("q") || "";
    const language = c.req.query("language");
    const limit = Number(c.req.query("limit")) || 50;
    const timeRange = c.req.query("timeRange"); // "24h", "7d", "30d", "all"
    const sort = c.req.query("sort"); // "relevance", "new", "top"

    if (!q && !language) {
        return c.json({ status: "error", error: "Query or language required" }, 400);
    }

    // Text Filter - Use Raw SQL for Postgres Full Text Search if query is present
    if (q) {
        // Format query for Postgres websearch (handles "quoted phrases" or logical ops if we want, but plainto_tsquery is safer for general text)
        // using plainto_tsquery to parse natural language

        // Dynamic filters building
        let languageFilter = "";
        if (language && language !== "all") {
            languageFilter = `AND s.language = '${language}'`;
        }

        let timeFilter = "";
        if (timeRange && timeRange !== "all") {
            // Simplified interval logic
            if (timeRange === '24h') timeFilter = "AND s.\"createdAt\" > NOW() - INTERVAL '1 day'";
            else if (timeRange === '7d') timeFilter = "AND s.\"createdAt\" > NOW() - INTERVAL '7 days'";
            else if (timeRange === '30d') timeFilter = "AND s.\"createdAt\" > NOW() - INTERVAL '30 days'";
            else if (timeRange === 'year') timeFilter = "AND s.\"createdAt\" > NOW() - INTERVAL '1 year'";
        }

        // We use $queryRawUnsafe because of dynamic AND clauses. Be very careful with inputs if not using parameterized query for the main part.
        // But for language/time which are Enums or safe strings we can interpolate or better yet, assume sanitized. 
        // Best practice: Use $queryRaw with SQL template literal for strict safety.
        // Let's stick to safe parameterized query for 'q' and just standard Prisma for complex filtering if we can.

        // Actually, mixing Raw and Prisma types is annoying. 
        // Let's use a hybrid approach: Get IDs from Raw Search, then fetch details with Prisma. 
        // This is safe, easy, and preserves relations/types.

        const ids: { id: bigint }[] = await prisma.$queryRaw`
            SELECT id FROM "Snippet"
            WHERE "deletedAt" IS NULL
            AND (
              to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ${q})
              OR ${q} = ANY(tags)
            )
            ORDER BY ts_rank(to_tsvector('english', title || ' ' || coalesce(description, '')), plainto_tsquery('english', ${q})) DESC
            LIMIT ${limit}
        `;

        const idList = ids.map(i => i.id);

        // Fetch full objects with Prisma to handle relations properly
        const snippets = await prisma.snippet.findMany({
            where: {
                id: { in: idList },
                ...(language && language !== "all" ? { language } : {}),
                ...(timeRange && timeRange !== "all" ? {
                    createdAt: {
                        gte: timeRange === '24h' ? new Date(Date.now() - 86400000) :
                            timeRange === '7d' ? new Date(Date.now() - 7 * 86400000) :
                                timeRange === '30d' ? new Date(Date.now() - 30 * 86400000) :
                                    new Date(Date.now() - 365 * 86400000)
                    }
                } : {})
            },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true }
                }
            }
        });

        // Re-sort in memory to match Rank (since Prisma findMany won't preserve "IN" order guaranteed)
        const sortedSnippets = snippets.sort((a, b) => {
            return idList.indexOf(a.id) - idList.indexOf(b.id);
        });

        return c.json({
            status: "success",
            data: {
                query: q,
                results: sortedSnippets.map((s: any) => ({
                    ...s,
                    id: s.id.toString(),
                    authorId: s.authorId.toString(),
                    author: { ...s.author, id: s.author.id.toString() }
                })),
                total: sortedSnippets.length
            }
        });
    }

    // Fallback to standard Prisma if no query (just filtering by language etc)
    const filters: any = { deletedAt: null };
    if (language && language !== "all") filters.language = language;
    if (timeRange && timeRange !== "all") {
        // ... (existing logic)
        const now = new Date();
        let fromDate = new Date();
        if (timeRange === "24h") fromDate.setDate(now.getDate() - 1);
        else if (timeRange === "7d") fromDate.setDate(now.getDate() - 7);
        else if (timeRange === "30d") fromDate.setDate(now.getDate() - 30);
        else if (timeRange === "year") fromDate.setFullYear(now.getFullYear() - 1);
        filters.createdAt = { gte: fromDate };
    }

    // Sorting
    let orderBy: any = { upvotes: "desc" }; // Default relevance/top
    if (sort === "new") {
        orderBy = { createdAt: "desc" };
    } else if (sort === "top") {
        orderBy = { upvotes: "desc" };
    }

    const snippets = await prisma.snippet.findMany({
        where: filters,
        take: limit,
        orderBy,
        include: {
            author: { select: { id: true, username: true, avatarUrl: true } }
        }
    });

    return c.json({
        status: "success",
        data: {
            query: "",
            results: snippets.map((s: any) => ({
                ...s,
                id: s.id.toString(),
                authorId: s.authorId.toString(),
                author: { ...s.author, id: s.author.id.toString() }
            })),
            total: snippets.length
        }
    });
});

// Trending
app.get("/trending", async (c) => {
    const limit = Number(c.req.query("limit")) || 10;
    // timeRange is ignored for MVP, requires created_at filter

    const snippets = await prisma.snippet.findMany({
        take: limit,
        orderBy: { upvotes: "desc" },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                },
            },
        },
    });

    return c.json({
        status: "success",
        data: {
            timeRange: "all",
            snippets: snippets.map((s: any) => ({
                ...s,
                id: s.id.toString(),
                authorId: s.authorId.toString(),
                author: {
                    ...s.author,
                    id: s.author.id.toString()
                }
            }))
        }
    });
});

// Popular - with sorting options
app.get("/popular", async (c) => {
    const sort = c.req.query("sort") || "best"; // best, hot, new
    const limit = Number(c.req.query("limit")) || 20;
    const page = Number(c.req.query("page")) || 1;
    const skip = (page - 1) * limit;

    let orderBy: any = {};
    let where: any = { deletedAt: null };

    switch (sort) {
        case "best":
            // Highest votes and views combined
            orderBy = [{ upvotes: "desc" }, { viewCount: "desc" }];
            break;
        case "hot":
            // Recent snippets with high engagement (last 7 days, sorted by upvotes)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            where.createdAt = { gte: sevenDaysAgo };
            orderBy = [{ upvotes: "desc" }, { viewCount: "desc" }];
            break;
        case "new":
            // Newest first
            orderBy = { createdAt: "desc" };
            break;
        default:
            orderBy = [{ upvotes: "desc" }, { viewCount: "desc" }];
    }

    const [snippets, total] = await Promise.all([
        prisma.snippet.findMany({
            where,
            take: limit,
            skip,
            orderBy,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        }),
        prisma.snippet.count({ where }),
    ]);

    return c.json({
        status: "success",
        data: {
            sort,
            snippets: snippets.map((s: any) => ({
                ...s,
                id: s.id.toString(),
                authorId: s.authorId.toString(),
                author: {
                    ...s.author,
                    id: s.author.id.toString()
                }
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        }
    });
});

export default app;

