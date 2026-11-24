import { randomUUID } from "node:crypto";
import { all, run } from "./db";
import { nowIso } from "./dates";

/** Creates an in-app notification (FR 11). */
export function notify(userId: string, type: string, message: string, link?: string): void {
  run(
    "INSERT INTO notifications (id, user_id, type, message, link, created_at) VALUES (?,?,?,?,?,?)",
    randomUUID(), userId, type, message, link ?? null, nowIso(),
  );
}

export function notifyAdmins(type: string, message: string, link?: string): void {
  for (const a of all<{ id: string }>("SELECT id FROM users WHERE role='Admin' AND status='Active'")) {
    notify(a.id, type, message, link);
  }
}
