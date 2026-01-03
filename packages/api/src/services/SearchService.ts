import { prisma } from "../lib/prisma";
import { cacheGet, cacheSet } from "../utils/cache";
import { Prisma } from "@prisma/client";

export class SearchService {
    /**
     * Search snippets with full-text search
     */
    static async search(
        query: string,
        language?: string,
        tags?: string[],
        limit = 10,
        page = 1
    ) {
        const cacheKey = `search:${query}:${language}:${tags?.join(',')}:${limit}:${page}`;

        // 1. Try Cache
        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        // 2. Build Query
        const where: Prisma.SnippetWhereInput = {
            deletedAt: null,
        };

        if (query) {
            // Formats query for 'websearch' or similar if needed, 
            // but 'search' works for 'cat & dog' style. 
            // For simple user input, 'search' with plain text or 'contains' is safer/easier.
            // However, "fullTextSearchPostgres" enables usage of `search`.
            // Formatting query to handle spaces as AND/OR might be needed for strict search,
            // but passing raw text usually works for 'websearch' if supported, or we just pass it.
            // Let's use flexible search on title and description.
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (language) {
            where.language = language;
        }

        if (tags && tags.length > 0) {
            where.tags = { hasEvery: tags };
        }

        // 3. Execute Query
        const skip = (page - 1) * limit;

        // Run count and findMany in parallel
        const [total, snippets] = await prisma.$transaction([
            prisma.snippet.count({ where }),
            prisma.snippet.findMany({
                where,
                take: limit,
                skip,
                orderBy: {
                    // Rank by relevance if searching? Prisma doesn't easily expose relevance sort yet without raw.
                    // Fallback to upvotes or createdAt.
                    // User didn't specify sort for generic search, usually relevance is implied but hard with Prisma standard API.
                    // We'll sort by upvotes for now as a proxy for "good results".
                    upvotes: 'desc'
                },
                include: {
                    author: {
                        select: { username: true, avatarUrl: true }
                    }
                }
            })
        ]);

        const result = {
            results: snippets,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };

        // 4. Cache (30 mins)
        // Serialization for BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        await cacheSet(cacheKey, serialized, 1800);

        return result;
    }

    /**
     * Browse snippets by language
     */
    static async searchByLanguage(language: string, limit = 10, page = 1) {
        const cacheKey = `browse:lang:${language}:${limit}:${page}`;

        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        const skip = (page - 1) * limit;
        const where = {
            language,
            deletedAt: null
        };

        const [total, snippets] = await prisma.$transaction([
            prisma.snippet.count({ where }),
            prisma.snippet.findMany({
                where,
                take: limit,
                skip,
                orderBy: { upvotes: 'desc' },
                include: {
                    author: {
                        select: { username: true, avatarUrl: true }
                    }
                }
            })
        ]);

        const result = {
            results: snippets,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };

        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        await cacheSet(cacheKey, serialized, 1800);

        return result;
    }

    /**
     * Get most popular tags
     */
    static async getPopularTags() {
        const cacheKey = 'popular:tags';

        const cached = await cacheGet(cacheKey);
        if (cached) return cached;

        // Unnest tags and count
        // Note: Prisma Raw Query returns "unknown", need casting
        const tags = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT tag, COUNT(*) as count 
      FROM (
        SELECT UNNEST(tags) as tag 
        FROM "Snippet" 
        WHERE "deletedAt" IS NULL
      ) as t 
      GROUP BY tag 
      ORDER BY count DESC 
      LIMIT 20
    `;

        // Convert BigInt count to number
        const formatted = tags.map(t => ({
            tag: t.tag,
            count: Number(t.count)
        }));

        await cacheSet(cacheKey, formatted, 3600); // 1 hour

        return formatted;
    }
}
