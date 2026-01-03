import { prisma } from "../lib/prisma";
import { SocketService } from "../lib/socket";

export const BADGES = {
    FIRST_SNIPPET: {
        id: "first-snippet",
        name: "Novice Coder",
        description: "Created your first snippet",
        icon: "🌱"
    },
    RISING_STAR: {
        id: "rising-star",
        name: "Rising Star",
        description: "Reached 100 Reputation",
        icon: "⭐"
    },
    COMMUNITY_HERO: {
        id: "community-hero",
        name: "Community Hero",
        description: "Reached 1000 Reputation",
        icon: "👑"
    }
};

export class BadgeService {
    static async checkAndAwardBadges(userId: bigint) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: true }
        });

        if (!user) return;

        const existingBadgeIds = new Set(user.badges.map(b => b.badgeId));
        const newBadges: typeof BADGES[keyof typeof BADGES][] = [];

        // Check: First Snippet
        if (!existingBadgeIds.has(BADGES.FIRST_SNIPPET.id)) {
            if (user.snippetCount > 0) {
                newBadges.push(BADGES.FIRST_SNIPPET);
            }
        }

        // Check: Rising Star (100 Rep)
        if (!existingBadgeIds.has(BADGES.RISING_STAR.id)) {
            if (user.reputation >= 100) {
                newBadges.push(BADGES.RISING_STAR);
            }
        }

        // Check: Community Hero (1000 Rep)
        if (!existingBadgeIds.has(BADGES.COMMUNITY_HERO.id)) {
            if (user.reputation >= 1000) {
                newBadges.push(BADGES.COMMUNITY_HERO);
            }
        }

        // Award Badges
        for (const badge of newBadges) {
            // Ensure badge exists in DB
            await prisma.badge.upsert({
                where: { id: badge.id },
                update: {},
                create: badge
            });

            // Grant to user
            await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: badge.id
                }
            });

            // Notify User
            SocketService.getInstance().emitToUser(userId.toString(), "badge_earned", {
                badge,
                message: `You earned the ${badge.name} badge!`
            });
        }
    }
}
