import { sign, verify } from "hono/jwt";
import * as bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export class AuthService {
    /**
     * Generate a JWT token for a user
     */
    static async generateToken(userId: bigint): Promise<string> {
        const payload = {
            id: Number(userId),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        };
        return await sign(payload, JWT_SECRET);
    }

    /**
     * Register a new user with email and password
     */
    static async registerWithEmail(email: string, password: string, username: string) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Invalid email format");
        }

        // Check if email or username already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error("Email already registered");
            }
            throw new Error("Username already taken");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        return await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
            },
        });
    }

    /**
     * Login a user with email and password
     */
    static async loginWithEmail(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            throw new Error("Invalid credentials");
        }

        return user;
    }

    /**
     * Verify a JWT token
     */
    static async verifyToken(token: string) {
        try {
            return await verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error("Invalid token");
        }
    }
}
