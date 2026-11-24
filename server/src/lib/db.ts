import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env";

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

export const db = new DatabaseSync(env.dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const here = path.dirname(fileURLToPath(import.meta.url));

/** Creates all tables if they do not exist yet. */
export function migrate(): void {
  db.exec(fs.readFileSync(path.resolve(here, "../../db/schema.sql"), "utf8"));
}

function normalize(params: any[]): any[] {
  return params.map((p) => {
    if (typeof p === "boolean") return p ? 1 : 0;
    if (p === undefined) return null;
    return p;
  });
}

// Small typed helpers around prepared statements.
export function get<T = any>(sql: string, ...params: any[]): T | undefined {
  return db.prepare(sql).get(...normalize(params)) as T | undefined;
}
export function all<T = any>(sql: string, ...params: any[]): T[] {
  return db.prepare(sql).all(...normalize(params)) as T[];
}
export function run(sql: string, ...params: any[]) {
  return db.prepare(sql).run(...normalize(params));
}
export function transaction<T>(fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
