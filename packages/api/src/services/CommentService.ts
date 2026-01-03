import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class CommentService {

    /**
     * Add a comment to a snippet (supports nesting)
     */
    static async addComment(snippetId: string, userId: bigint, content: string, parentId?: string) {
        const sId = BigInt(snippetId);
        const pId = parentId ? BigInt(parentId) : null;

        const comment = await prisma.comment.create({
            data: {
                snippetId: sId,
                userId,
                content,
                parentId: pId
            },
            include: {
                user: { select: { username: true, avatarUrl: true } }
            }
        });

        return comment;
    }

    /**
     * Get comments for a snippet (flat list, client builds tree)
     * To support efficient threading, we usually fetch all or fetch top-level with infinite scroll.
     * For now, I will increase limit to 100 and sort by date, client reconstructs.
     */
    static async getComments(snippetId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const sId = BigInt(snippetId);

        // Fetch comments with user info
        const [total, comments] = await prisma.$transaction([
            prisma.comment.count({ where: { snippetId: sId, deletedAt: null } }),
            prisma.comment.findMany({
                where: { snippetId: sId, deletedAt: null },
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' }, // Newest first
                include: {
                    user: { select: { username: true, avatarUrl: true } },
                    // votes: { where: { userId: ... } } // Can't easily include specific user vote here without raw query or separate call.
                    // We will fetch user votes separately or just return totals for now.
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

    /**
     * Get user's votes for these comments
     */
    static async getUserVotesForComments(commentIds: bigint[], userId: bigint) {
        const votes = await prisma.commentVote.findMany({
            where: {
                commentId: { in: commentIds },
                userId
            },
            select: { commentId: true, type: true }
        });

        // Return map: { commentId: 'upvote' | 'downvote' }
        return votes.reduce((acc, v) => {
            acc[v.commentId.toString()] = v.type;
            return acc;
        }, {} as Record<string, string>);
    }

    /**
     * Delete comment (Soft delete)
     */
    static async deleteComment(commentId: string, userId: bigint) {
        const cId = BigInt(commentId);
        const comment = await prisma.comment.findUnique({ where: { id: cId } });

        if (!comment) throw new Error("Comment not found");
        if (comment.userId !== userId) throw new Error("Unauthorized");

        return prisma.comment.update({
            where: { id: cId },
            data: { deletedAt: new Date() }
        });
    }

    /**
     * Handle Vote (Up/Down)
     */
    static async vote(commentId: string, userId: bigint, type: "upvote" | "downvote") {
        const cId = BigInt(commentId);

        // Check existing
        const existing = await prisma.commentVote.findUnique({
            where: { commentId_userId: { commentId: cId, userId } }
        });

        if (existing) {
            if (existing.type === type) {
                // Remove vote (Toggle off)
                const [_, updatedComment] = await prisma.$transaction([
                    prisma.commentVote.delete({ where: { id: existing.id } }),
                    prisma.comment.update({
                        where: { id: cId },
                        data: {
                            upvotes: type === "upvote" ? { decrement: 1 } : undefined,
                            downvotes: type === "downvote" ? { decrement: 1 } : undefined
                        }
                    })
                ]);
                return { comment: updatedComment, userVote: null };
            }

            // Switch vote
            const [_, updatedComment] = await prisma.$transaction([
                prisma.commentVote.update({
                    where: { id: existing.id },
                    data: { type }
                }),
                prisma.comment.update({
                    where: { id: cId },
                    data: {
                        upvotes: type === "upvote" ? { increment: 1 } : { decrement: 1 },
                        downvotes: type === "downvote" ? { increment: 1 } : { decrement: 1 }
                    }
                })
            ]);
            return { comment: updatedComment, userVote: type };
        }

        // New vote
        const [_, updatedComment] = await prisma.$transaction([
            prisma.commentVote.create({
                data: { commentId: cId, userId, type }
            }),
            prisma.comment.update({
                where: { id: cId },
                data: {
                    upvotes: type === "upvote" ? { increment: 1 } : undefined,
                    downvotes: type === "downvote" ? { increment: 1 } : undefined
                }
            })
        ]);

        return { comment: updatedComment, userVote: type };
    }
}
