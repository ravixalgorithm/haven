import { prisma } from "../lib/prisma";
import { cacheDelete, cacheDeletePattern } from "../utils/cache";
import { SnippetService } from "./SnippetService";
import { BadgeService } from "./BadgeService";

export class VoteService {
    /**
     * Upvote a snippet
     */
    static async upvote(idOrSlug: string, userId: bigint) {
        return await this.handleVote(idOrSlug, userId, "upvote");
    }

    /**
     * Downvote a snippet
     */
    static async downvote(idOrSlug: string, userId: bigint) {
        return await this.handleVote(idOrSlug, userId, "downvote");
    }

    /**
     * Remove a vote
     */
    static async removeVote(idOrSlug: string, userId: bigint) {
        const sId = await SnippetService.resolveToId(idOrSlug);
        if (!sId) throw new Error("Snippet not found");

        const snippet = await prisma.snippet.findUnique({
            where: { id: sId },
            select: { id: true, authorId: true }
        });
        if (!snippet) throw new Error("Snippet not found");

        // Check existing vote
        const existing = await prisma.rating.findUnique({
            where: {
                snippetId_userId: { snippetId: sId, userId },
            },
        });

        if (!existing) {
            // Nothing to remove, return current counts
            const current = await prisma.snippet.findUnique({
                where: { id: sId },
                select: { upvotes: true, downvotes: true }
            });
            return current;
        }

        const UPVOTE_REP = 10;
        const DOWNVOTE_REP = -2;
        // Revert: If was upvote, remove 10. If downvote, remove -2 (add 2).
        const repChange = existing.type === "upvote" ? -UPVOTE_REP : -DOWNVOTE_REP;

        // Transaction: Delete vote, Update counters
        const [_, updatedSnippet] = await prisma.$transaction([
            prisma.rating.delete({
                where: { id: existing.id },
            }),
            prisma.snippet.update({
                where: { id: sId },
                data: {
                    upvotes: existing.type === "upvote" ? { decrement: 1 } : undefined,
                    downvotes: existing.type === "downvote" ? { decrement: 1 } : undefined,
                },
                select: { upvotes: true, downvotes: true },
            }),
            // Revert Reputation
            prisma.user.update({
                where: { id: snippet.authorId },
                data: { reputation: { increment: repChange } }
            })
        ]);

        // Invalidate cache
        await cacheDelete(`snippet:${idOrSlug}`);
        await cacheDeletePattern(`trending:*`);

        await BadgeService.checkAndAwardBadges(snippet.authorId);

        return updatedSnippet;
    }

    /**
     * Get user's vote on a snippet
     */
    static async getUserVoteOnSnippet(idOrSlug: string, userId: bigint) {
        const sId = await SnippetService.resolveToId(idOrSlug);
        if (!sId) return null;

        const rating = await prisma.rating.findUnique({
            where: {
                snippetId_userId: { snippetId: sId, userId },
            },
            select: { type: true },
        });
        return rating?.type || null;
    }

    private static async handleVote(idOrSlug: string, userId: bigint, type: "upvote" | "downvote") {
        const sId = await SnippetService.resolveToId(idOrSlug);
        if (!sId) throw new Error("Snippet not found");

        const snippet = await prisma.snippet.findUnique({
            where: { id: sId },
            select: { id: true, authorId: true }
        });

        if (!snippet) throw new Error("Snippet not found");

        // Check existing vote
        const existing = await prisma.rating.findUnique({
            where: {
                snippetId_userId: { snippetId: sId, userId },
            },
        });

        // Reputation change values
        const UPVOTE_REP = 10;
        const DOWNVOTE_REP = -2;

        if (existing) {
            if (existing.type === type) {
                // Toggle off: Remove vote
                return await this.removeVote(idOrSlug, userId);
            }

            // Switching vote (e.g. upvote -> downvote)
            // Revert old vote effect, apply new vote effect
            // If was upvote (+10), now downvote (-2) -> diff is -12
            // If was downvote (-2), now upvote (+10) -> diff is +12
            const repChange = type === "upvote"
                ? (UPVOTE_REP - DOWNVOTE_REP) // -2 -> +10 = +12
                : (DOWNVOTE_REP - UPVOTE_REP); // +10 -> -2 = -12

            const [_, updatedSnippet] = await prisma.$transaction([
                prisma.rating.update({
                    where: { id: existing.id },
                    data: { type },
                }),
                prisma.snippet.update({
                    where: { id: sId },
                    data: {
                        upvotes: type === "upvote" ? { increment: 1 } : { decrement: 1 },
                        downvotes: type === "downvote" ? { increment: 1 } : { decrement: 1 },
                    },
                }),
                // Update Author Reputation
                prisma.user.update({
                    where: { id: snippet.authorId },
                    data: { reputation: { increment: repChange } }
                })
            ]);

            // Check badges
            await BadgeService.checkAndAwardBadges(snippet.authorId);

            await cacheDelete(`snippet:${idOrSlug}`);
            await cacheDeletePattern(`trending:*`);
            return updatedSnippet;
        }

        // Create new vote
        const repChange = type === "upvote" ? UPVOTE_REP : DOWNVOTE_REP;

        const [_, updatedSnippet] = await prisma.$transaction([
            prisma.rating.create({
                data: {
                    snippetId: sId,
                    userId,
                    type,
                },
            }),
            prisma.snippet.update({
                where: { id: sId },
                data: {
                    upvotes: type === "upvote" ? { increment: 1 } : undefined,
                    downvotes: type === "downvote" ? { increment: 1 } : undefined,
                },
            }),
            // Update Author Reputation
            prisma.user.update({
                where: { id: snippet.authorId },
                data: { reputation: { increment: repChange } }
            })
        ]);

        await BadgeService.checkAndAwardBadges(snippet.authorId);

        await cacheDelete(`snippet:${idOrSlug}`);
        await cacheDeletePattern(`trending:*`);
        return updatedSnippet;
    }
}
