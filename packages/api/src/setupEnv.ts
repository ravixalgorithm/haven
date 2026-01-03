import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local first
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
// Load .env (defaults)
dotenv.config();

console.log("Environment variables loaded. DATABASE_URL present:", !!process.env.DATABASE_URL);
