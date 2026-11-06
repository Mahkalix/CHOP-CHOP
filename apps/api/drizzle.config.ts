import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env"); // drizzle-kit does not read .env on its own
} catch {
  // no .env file: rely on variables already in the environment
}

// `||` rather than `??` so an empty DIRECT_URL= line falls back to DATABASE_URL.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (or DIRECT_URL) is not set");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
