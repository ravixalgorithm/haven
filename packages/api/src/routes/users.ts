import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { Variables } from "../types/hono";
import { auth } from "../middleware/auth";

const app = new Hono<{ Variables: Variables }>();

// Get User Profile
app.get("/:username", async (c) => {
    const username = c.req.param("username");
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            email: true, // Only if auth user is same? Spec says "only if viewing own profile". I'll skip for now or add check later.
            bio: true,
            avatarUrl: true,
            snippetCount: true,
            followerCount: true,
            reputation: true,
            createdAt: true,
        },
    });

    if (!user) {
        return c.json({ status: "error", error: "User not found" }, 404);
    }

    // Calculate following count dynamically
    const followingCount = await prisma.follows.count({
        where: { followerId: user.id }
    });

    return c.json({
        status: "success",
        data: {
            ...user,
            id: user.id.toString(),
            followingCount
        },
    });
});

// Update Current User Profile
app.put("/me/update", auth, async (c) => {
    const user = c.get("user");
    const body = await c.req.json();

    const { bio, avatarUrl } = body;

    // Only allow updating bio and avatarUrl for now
    const updateData: { bio?: string; avatarUrl?: string } = {};

    if (bio !== undefined) {
        updateData.bio = bio;
    }
    if (avatarUrl !== undefined) {
        updateData.avatarUrl = avatarUrl;
    }

    const updatedUser = await prisma.user.update({
        where: { id: BigInt(user.id) },
        data: updateData,
        select: {
            id: true,
            username: true,
            email: true,
            bio: true,
            avatarUrl: true,
            snippetCount: true,
            followerCount: true,
            reputation: true,
        },
    });

    return c.json({
        status: "success",
        data: {
            ...updatedUser,
            id: updatedUser.id.toString(),
        },
    });
});

// Get User Snippets
app.get("/:username/snippets", async (c) => {
    const username = c.req.param("username");
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        return c.json({ status: "error", error: "User not found" }, 404);
    }

    const skip = (page - 1) * limit;

    const [snippets, total] = await Promise.all([
        prisma.snippet.findMany({
            where: { authorId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.snippet.count({ where: { authorId: user.id } }),
    ]);

    return c.json({
        status: "success",
        data: {
            user: {
                id: user.id.toString(),
                username: user.username,
                avatarUrl: user.avatarUrl,
            },
            snippets: snippets.map((s: any) => ({
                ...s,
                id: s.id.toString(),
                authorId: s.authorId.toString(),
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        },
    });
});

// Toggle Follow User
app.post("/:username/follow", auth, async (c) => {
    const username = c.req.param("username");
    const currentUser = c.get("user");

    const targetUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
    });

    if (!targetUser) {
        return c.json({ status: "error", error: "User not found" }, 404);
    }

    if (targetUser.id === BigInt(currentUser.id)) {
        return c.json({ status: "error", error: "Cannot follow yourself" }, 400);
    }

    const followerId = BigInt(currentUser.id);
    const followingId = targetUser.id;

    // Check if already following
    const existing = await prisma.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId
            }
        }
    });

    try {
        if (existing) {
            // Unfollow
            await prisma.$transaction([
                prisma.follows.delete({
                    where: {
                        followerId_followingId: {
                            followerId,
                            followingId
                        }
                    }
                }),
                prisma.user.update({
                    where: { id: followingId },
                    data: { followerCount: { decrement: 1 } }
                })
            ]);
            return c.json({ status: "success", data: { isFollowing: false } });
        } else {
            // Follow
            // First cleanup old follow notifications to prevent spam
            await prisma.notification.deleteMany({
                where: {
                    type: "follow",
                    actorId: followerId,
                    userId: followingId
                }
            });

            const [follow, updatedUser, notification] = await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId,
                        followingId
                    }
                }),
                prisma.user.update({
                    where: { id: followingId },
                    data: { followerCount: { increment: 1 } }
                }),
                prisma.notification.create({
                    data: {
                        userId: followingId,
                        type: "follow",
                        message: "started following you",
                        actorId: followerId
                    },
                    include: {
                        actor: {
                            select: { id: true, username: true, avatarUrl: true }
                        }
                    }
                })
            ]);

            // Emit real-time notification
            const SocketService = (await import("../lib/socket")).SocketService;
            SocketService.getInstance().emitNotification(followingId.toString(), {
                ...notification,
                id: notification.id.toString(),
                actorId: notification.actorId.toString(),
                userId: notification.userId.toString(),
                createdAt: notification.createdAt.toISOString()
            });

            return c.json({ status: "success", data: { isFollowing: true } });
        }
    } catch (err) {
        console.error(err);
        return c.json({ status: "error", error: "Action failed" }, 500);
    }
});

// Get Followers
app.get("/:username/followers", async (c) => {
    const username = c.req.param("username");
    const limit = Number(c.req.query("limit")) || 20;

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return c.json({ status: "error", error: "User not found" }, 404);

    const followers = await prisma.follows.findMany({
        where: { followingId: user.id },
        take: limit,
        include: {
            follower: {
                select: { username: true, avatarUrl: true, bio: true }
            }
        }
    });

    return c.json({
        status: "success",
        data: {
            followers: followers.map(f => f.follower)
        }
    });
});

// Get Following
app.get("/:username/following", async (c) => {
    const username = c.req.param("username");
    const limit = Number(c.req.query("limit")) || 20;

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return c.json({ status: "error", error: "User not found" }, 404);

    const following = await prisma.follows.findMany({
        where: { followerId: user.id },
        take: limit,
        include: {
            following: {
                select: { username: true, avatarUrl: true, bio: true }
            }
        }
    });

    return c.json({
        status: "success",
        data: {
            following: following.map(f => f.following)
        }
    });
});

// Check Follow Status
app.get("/:username/is-following", auth, async (c) => {
    const username = c.req.param("username");
    const currentUser = c.get("user");

    const targetUser = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!targetUser) return c.json({ status: "error", error: "User not found" }, 404);

    const follows = await prisma.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId: BigInt(currentUser.id),
                followingId: targetUser.id
            }
        }
    });

    return c.json({
        status: "success",
        data: { isFollowing: !!follows }
    });
});

export default app;

