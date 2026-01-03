import { Hono } from "hono";
import { prisma } from "../lib/prisma";

const app = new Hono();

// GET /api/v1/topics - Get aggregated tags and languages
app.get("/", async (c) => {
    try {
        // Get all unique tags with counts
        const snippets = await prisma.snippet.findMany({
            select: {
                tags: true,
                language: true,
            },
        });

        const tagCounts: Record<string, number> = {};
        const languageCounts: Record<string, number> = {};

        snippets.forEach(snippet => {
            // Count tags
            snippet.tags.forEach((tag: string) => {
                const normalizedTag = tag.toLowerCase();
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            });

            // Count languages
            const normalizedLang = snippet.language.toLowerCase();
            languageCounts[normalizedLang] = (languageCounts[normalizedLang] || 0) + 1;
        });

        // Merge and sort by count
        const allTopics: Record<string, number> = { ...tagCounts };
        Object.entries(languageCounts).forEach(([lang, count]) => {
            allTopics[lang] = (allTopics[lang] || 0) + count;
        });

        const topics = Object.entries(allTopics)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20 topics

        return c.json({ status: "success", data: { topics } });
    } catch (error) {
        console.error("Topics fetch error:", error);
        return c.json({ status: "success", data: { topics: [] } });
    }
});

export default app;
