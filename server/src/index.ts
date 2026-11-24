import { createApp } from "./app";
import { env } from "./config/env";
import { get, migrate } from "./lib/db";
import { seedDatabase } from "./seed/seed";

migrate();
if (env.autoSeed && (get<{ n: number }>("SELECT COUNT(*) AS n FROM users")?.n ?? 0) === 0) {
  seedDatabase();
  console.log("Empty database detected - demo data has been seeded.");
}

createApp().listen(env.port, () => {
  console.log(`Find a Guide Rwanda API listening on http://localhost:${env.port}`);
});
