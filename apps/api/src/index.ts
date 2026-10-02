import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDb } from "./db/client.js";
import { createScoreRepository } from "./repository.js";

const config = loadConfig();
const { db, close } = createDb(config.databaseUrl, (err) => console.error("pg pool error:", err));

const app = await buildApp({
  repository: createScoreRepository(db),
  corsOrigin: config.corsOrigin,
  trustProxy: config.trustProxy,
  logger: true,
});

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await app.close();
    await close();
    process.exit(0);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
