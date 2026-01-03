import { Hono } from "hono";
import { AuthService } from "../services/AuthService";
import { auth } from "../middleware/auth";
import { prisma } from "../lib/prisma"; // Needed for GitHub flow specific logic or move to service
import { Variables } from "../types/hono";
import { AppError, ValidationError, AuthError, ServerError, NotFoundError } from "../utils/errors";

const app = new Hono<{ Variables: Variables }>();

// Register
app.post("/register", async (c) => {
    const { email, password, username } = await c.req.json();

    if (!email || !password || !username) {
        throw new ValidationError("Missing required fields");
    }

    try {
        const user = await AuthService.registerWithEmail(email, password, username);
        const token = await AuthService.generateToken(user.id);

        return c.json({
            status: "success",
            data: {
                user: {
                    id: user.id.toString(),
                    email: user.email,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                },
                token,
            },
        }, 201);
    } catch (err: any) {
        if (err.message === "Email already registered" || err.message === "Username already taken") {
            throw new ValidationError(err.message);
        }
        throw err;
    }
});

// Login
app.post("/login", async (c) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        throw new ValidationError("Missing email or password");
    }

    try {
        const user = await AuthService.loginWithEmail(email, password);
        const token = await AuthService.generateToken(user.id);

        return c.json({
            status: "success",
            data: {
                user: {
                    id: user.id.toString(),
                    email: user.email,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                },
                token,
            },
        });
    } catch (err: any) {
        if (err.message === "Invalid credentials") {
            throw new AuthError("Invalid credentials");
        }
        throw err;
    }
});

// GitHub OAuth
app.post("/github", async (c) => {
    const { code } = await c.req.json();
    const isMock = c.req.query("mock") === "true";
    const debugLog: string[] = [];
    const log = (msg: string) => debugLog.push(`${Date.now()}: ${msg}`);

    // Mock Mode for Debugging
    if (isMock) {
        log("Mock Mode Active");
        try {
            const email = "mock_user@example.com";
            const githubId = "mock_12345";

            let user = await prisma.user.findFirst({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        username: "MockUser",
                        githubId,
                        avatarUrl: "https://github.com/ghost.png",
                        bio: "I am a ghost"
                    }
                });
            }

            const token = await AuthService.generateToken(user.id);
            return c.json({
                status: "success",
                data: {
                    user: {
                        id: user.id.toString(),
                        email: user.email,
                        username: user.username,
                        avatarUrl: user.avatarUrl,
                    },
                    token,
                },
            });
        } catch (e: any) {
            return c.json({ status: "error", error: e.message, debugLogs: debugLog }, 500);
        }
    }

    if (!code) throw new ValidationError("Missing code");

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) throw new ServerError("Server configuration error");

    try {
        log("Step 1: Exchange Code");
        const tokenRes = await fetch(`https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`, {
            method: "POST",
            headers: { Accept: "application/json" },
        });
        const tokenData = await tokenRes.json();

        if (tokenData.error || !tokenData.access_token) {
            throw new Error(`GitHub Token Error: ${JSON.stringify(tokenData)}`);
        }
        log("Step 2: Got Token");

        log("Step 3: Fetch User");
        const userRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();
        log("Step 4: Got User Data");

        let email = userData.email;
        if (!email) {
            log("Step 4b: Fetch Email");
            const emailRes = await fetch("https://api.github.com/user/emails", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const emails = await emailRes.json();
            const primary = emails.find((e: any) => e.primary && e.verified);
            email = primary ? primary.email : null;
        }

        if (!email) throw new ValidationError("No verified email found");

        log("Step 5: DB Find User");
        let user = await prisma.user.findFirst({
            where: { OR: [{ githubId: userData.id.toString() }, { email }] }
        });

        if (user) {
            log("Step 6: Update User");
            if (!user.githubId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { githubId: userData.id.toString(), avatarUrl: user.avatarUrl || userData.avatar_url }
                });
            }
        } else {
            log("Step 6: Create User");
            let username = userData.login;
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) username = `${username}-${Math.floor(Math.random() * 1000)}`;

            user = await prisma.user.create({
                data: {
                    email,
                    username,
                    githubId: userData.id.toString(),
                    avatarUrl: userData.avatar_url,
                    bio: userData.bio
                }
            });
        }

        log("Step 7: Generate Token");
        const token = await AuthService.generateToken(user.id);

        log("Step 8: Success");
        return c.json({
            status: "success",
            data: {
                user: {
                    id: user.id.toString(),
                    email: user.email,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                },
                token,
            },
        });

    } catch (error: any) {
        console.error("GitHub Auth Error Logs:", debugLog);
        return c.json({
            status: "error",
            error: error.message,
            debugLogs: debugLog
        }, 500);
    }
});

// Get Current User
app.get("/me", auth, async (c) => {
    const payload = c.get("user");

    try {
        const user = await prisma.user.findUnique({
            where: { id: BigInt(payload.id) },
        });

        if (!user) {
            return c.json({ status: "error", error: "User not found" }, 404);
        }

        return c.json({
            status: "success",
            data: {
                id: user.id.toString(),
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                snippetCount: user.snippetCount,
                followerCount: user.followerCount,
                reputation: user.reputation,
            },
        });
    } catch (err: any) {
        return c.json({ status: "error", error: err.message }, 500);
    }
});

// Logout
app.post("/logout", auth, async (c) => {
    // Stateless JWT -> Client handles removal
    // Optional: Blacklist token in Redis if highly secure
    return c.json({ status: "success", message: "Logged out successfully" });
});

export default app;
