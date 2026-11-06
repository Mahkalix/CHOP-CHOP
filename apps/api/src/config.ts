import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL"),
  SUPABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().default("*"),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = EnvSchema.parse(env);
  const origins = parsed.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return {
    databaseUrl: parsed.DATABASE_URL,
    supabaseUrl: parsed.SUPABASE_URL.replace(/\/+$/, ""),
    port: parsed.PORT,
    trustProxy: parsed.TRUST_PROXY,
    corsOrigin: origins.includes("*") ? true : origins,
  };
}
