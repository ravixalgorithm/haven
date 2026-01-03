import { prisma } from "../lib/prisma";
import { cacheGet, cacheSet, cacheDelete } from "../utils/cache";
import { Prisma } from "@prisma/client";

export class SnippetService {
    /**
     * Create a new snippet
     */
    static async createSnippet(data: any, authorId: bigint) {
        const slug = this.generateSlug(data.title);

        // Validate language/tags if needed, for now trusting inputs or Schema validation
        // Assuming tags is array of strings

        // Create snippet
        const snippet = await prisma.snippet.create({
            data: {
                ...data,
                authorId,
                slug,
            },
        });

        return snippet;
    }

    /**
     * Get a single snippet by ID or Slug (with caching)
     */
    static async getSnippet(idOrSlug: string) {
        const cacheKey = `snippet:${idOrSlug}`;

        // 1. Try cache
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        // 2. Fetch from DB
        let snippet;

        // Try as ID first if it looks like a number
        const isNumeric = /^\d+$/.test(idOrSlug);
        if (isNumeric) {
            snippet = await prisma.snippet.findUnique({
                where: { id: BigInt(idOrSlug) },
                include: {
                    author: {
                        select: { username: true, avatarUrl: true, reputation: true }
                    }
                }
            });
        }

        // If not found by ID (or not numeric), try as slug
        if (!snippet) {
            snippet = await prisma.snippet.findUnique({
                where: { slug: idOrSlug },
                include: {
                    author: {
                        select: { username: true, avatarUrl: true, reputation: true }
                    }
                }
            });
        }

        if (!snippet) return null;

        // 3. Cache result (1 hour)
        // Convert BigInts to string for JSON serialization
        const serialized = JSON.parse(JSON.stringify(snippet, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        await cacheSet(cacheKey, serialized, 3600);

        // Also cache by the OTHER identifier to save future lookups
        // e.g. if looked up by slug, cache by ID too, and vice-versa
        const otherKey = isNumeric ? `snippet:${snippet.slug}` : `snippet:${snippet.id}`;
        await cacheSet(otherKey, serialized, 3600);

        // 4. Increment view count (async/fire-and-forget)
        prisma.snippet.update({
            where: { id: snippet.id },
            data: { viewCount: { increment: 1 } }
        }).catch(err => console.error("Failed to increment view count", err));

        return snippet;
    }

    /**
     * Update a snippet
     */
    static async updateSnippet(idOrSlug: string, data: any, authorId: bigint) {
        // 1. Verify ownership and get ID
        const sId = await this.resolveToId(idOrSlug);
        if (!sId) throw new Error("Snippet not found");

        const snippet = await prisma.snippet.findUnique({
            where: { id: sId },
            select: { authorId: true }
        });

        if (!snippet) throw new Error("Snippet not found");
        if (snippet.authorId !== authorId) throw new Error("Unauthorized");

        // 2. Update DB
        const updated = await prisma.snippet.update({
            where: { id: sId },
            data
        });

        // 3. Invalidate cache
        await cacheDelete(`snippet:${idOrSlug}`);
        if (updated.slug) await cacheDelete(`snippet:${updated.slug}`);

        return updated;
    }

    /**
     * Delete a snippet (Soft delete)
     */
    static async deleteSnippet(idOrSlug: string, authorId: bigint) {
        const sId = await this.resolveToId(idOrSlug);
        if (!sId) throw new Error("Snippet not found");

        const snippet = await prisma.snippet.findUnique({
            where: { id: sId },
            select: { authorId: true, slug: true }
        });

        if (!snippet) throw new Error("Snippet not found");
        if (snippet.authorId !== authorId) throw new Error("Unauthorized");

        // Soft delete (Requires deletedAt column in schema)
        // If deletedAt is missing in schema, this will fail type check. 
        // Assuming schema has it or I will add it.
        await prisma.snippet.update({
            where: { id: sId },
            data: { deletedAt: new Date() }
        });

        await cacheDelete(`snippet:${idOrSlug}`);
        if (snippet.slug) await cacheDelete(`snippet:${snippet.slug}`);
        return true;
    }

    /**
     * List snippets with pagination, filtering and sorting
     */
    static async listSnippets(page: number, limit: number, language?: string, sort?: string) {
        // 1. Prepare query
        const skip = (page - 1) * limit;

        const where: Prisma.SnippetWhereInput = {
            deletedAt: null // Only show active snippets
        };

        if (language) {
            where.language = language;
        }

        const orderBy: Prisma.SnippetOrderByWithRelationInput =
            sort === 'popular'
                ? { upvotes: 'desc' }
                : { createdAt: 'desc' };

        // 2. Execute query (in parallel)
        const [total, snippets] = await prisma.$transaction([
            prisma.snippet.count({ where }),
            prisma.snippet.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    author: {
                        select: { username: true, avatarUrl: true }
                    }
                }
            })
        ]);

        return {
            results: snippets,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get trending snippets
     */
    static async getTrendingSnippets(timeRange: 'week' | 'month' | 'all-time' = 'week', limit = 10) {
        const cacheKey = `trending:${timeRange}:${limit}`;

        // 1. Try cache
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        // 2. Calculate date filter
        let dateFilter: Date | undefined;
        const now = new Date();
        if (timeRange === 'week') {
            dateFilter = new Date(now.setDate(now.getDate() - 7));
        } else if (timeRange === 'month') {
            dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        }

        // 3. Fetch from DB
        const where: Prisma.SnippetWhereInput = {
            deletedAt: null
        };

        if (dateFilter) {
            where.createdAt = { gte: dateFilter };
        }

        const snippets = await prisma.snippet.findMany({
            where,
            orderBy: { upvotes: 'desc' },
            take: limit,
            include: {
                author: {
                    select: { username: true, avatarUrl: true }
                }
            }
        });

        // 4. Cache (30 mins)
        const serialized = JSON.parse(JSON.stringify(snippets, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        await cacheSet(cacheKey, serialized, 1800);

        return snippets;
    }

    /**
     * Add a comment to a snippet
     */
    static async addComment(idOrSlug: string, userId: bigint, content: string) {
        const sId = await this.resolveToId(idOrSlug);
        if (!sId) throw new Error("Snippet not found");

        const comment = await prisma.comment.create({
            data: {
                snippetId: sId,
                userId,
                content
            },
            include: {
                user: { select: { username: true, avatarUrl: true } }
            }
        });

        return comment;
    }

    /**
     * Get comments for a snippet
     */
    static async getComments(idOrSlug: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const sId = await this.resolveToId(idOrSlug);
        if (!sId) throw new Error("Snippet not found");

        const [total, comments] = await prisma.$transaction([
            prisma.comment.count({ where: { snippetId: sId, deletedAt: null } }),
            prisma.comment.findMany({
                where: { snippetId: sId, deletedAt: null },
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { username: true, avatarUrl: true } }
                }
            })
        ]);

        return {
            comments,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    public static async resolveToId(idOrSlug: string): Promise<bigint | null> {
        if (/^\d+$/.test(idOrSlug)) {
            return BigInt(idOrSlug);
        }

        // Try cache first for slug->id? (Optimization)
        // For now, DB lookup
        const snippet = await prisma.snippet.findUnique({
            where: { slug: idOrSlug },
            select: { id: true }
        });

        return snippet ? snippet.id : null;
    }

    private static generateSlug(title: string): string {
        const base = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${base}-${random}`;
    }
}
