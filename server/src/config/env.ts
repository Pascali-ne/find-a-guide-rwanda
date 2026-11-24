import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const resolve = (p: string) => (path.isAbsolute(p) ? p : path.resolve(serverRoot, p));

export const env = {
  serverRoot,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim()),
  dbPath: resolve(process.env.DB_PATH ?? "./data/findaguide.db"),
  uploadDir: resolve(process.env.UPLOAD_DIR ?? "./uploads"),
  autoSeed: (process.env.AUTO_SEED ?? "true") !== "false",
};
