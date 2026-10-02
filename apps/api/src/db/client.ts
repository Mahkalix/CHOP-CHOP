import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export function createDb(databaseUrl: string, onError: (err: Error) => void = console.error) {
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl);
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    // Supabase requires TLS. The certificate is not verified (that would need Supabase's CA
    // bundled with the app): traffic is encrypted but the server is not authenticated.
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  });
  // The pooler drops idle connections; without a listener this would crash the process.
  pool.on("error", onError);
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
