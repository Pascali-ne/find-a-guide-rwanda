import { randomUUID } from "node:crypto";
import { z } from "zod";
import { all, get, run } from "../../lib/db";
import { nowIso } from "../../lib/dates";
import { HttpError } from "../../lib/errors";
import { notify } from "../../lib/notify";
import { parse } from "../../lib/validate";
import type { AuthUser } from "../../middleware/auth";

const sendSchema = z.object({
  receiverId: z.string({ error: "Please choose who to message." }).min(1, "Please choose who to message."),
  content: z.string({ error: "Please type a message." }).trim().min(1, "Please type a message.").max(2000, "Messages can be at most 2000 characters."),
});

/** Messaging is only possible between a Tourist and a Tour Guide (FR 9). */
function getCounterpart(me: AuthUser, otherId: string) {
  const other = get<any>("SELECT id, full_name, role, status FROM users WHERE id = ?", otherId);
  const pair = other && ((me.role === "Tourist" && other.role === "Guide") || (me.role === "Guide" && other.role === "Tourist"));
  if (!other || !pair || other.status !== "Active") throw new HttpError(404, "This user cannot be messaged.");
  return { id: other.id as string, fullName: other.full_name as string, role: other.role as string };
}

export function listConversations(me: AuthUser) {
  return all<any>(
    `SELECT u.id, u.full_name, u.role,
       (SELECT content FROM messages m WHERE (m.sender_id = :me AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = :me)
          ORDER BY m.sent_at DESC, m.rowid DESC LIMIT 1) AS last_content,
       (SELECT sent_at FROM messages m WHERE (m.sender_id = :me AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = :me)
          ORDER BY m.sent_at DESC, m.rowid DESC LIMIT 1) AS last_at,
       (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = :me AND m.is_read = 0) AS unread
     FROM users u
     WHERE u.id IN (SELECT receiver_id FROM messages WHERE sender_id = :me UNION SELECT sender_id FROM messages WHERE receiver_id = :me)
     ORDER BY last_at DESC`,
    { me: me.id },
  ).map((r) => ({ userId: r.id, fullName: r.full_name, role: r.role, lastMessage: r.last_content, lastAt: r.last_at, unread: r.unread }));
}

export function getThread(me: AuthUser, otherId: string) {
  const other = getCounterpart(me, otherId);
  run("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0", otherId, me.id);
  run("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'NewMessage' AND link = ?", me.id, `/messages/${otherId}`);
  const messages = all<any>(
    `SELECT id, sender_id, content, sent_at, is_read FROM messages
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY sent_at, rowid`,
    me.id, otherId, otherId, me.id,
  ).map((m) => ({ id: m.id, senderId: m.sender_id, content: m.content, sentAt: m.sent_at, isRead: !!m.is_read }));
  return { with: other, messages };
}

export function sendMessage(me: AuthUser, body: unknown) {
  const d = parse(sendSchema, body);
  const other = getCounterpart(me, d.receiverId);
  if (other.role === "Guide") {
    const g = get<any>("SELECT verification_status FROM guide_profiles WHERE user_id = ?", other.id);
    if (g?.verification_status !== "Verified") throw new HttpError(404, "This user cannot be messaged.");
  }
  const id = randomUUID();
  run("INSERT INTO messages (id, sender_id, receiver_id, content, sent_at) VALUES (?,?,?,?,?)", id, me.id, other.id, d.content, nowIso());
  notify(other.id, "NewMessage", `New message from ${me.fullName}.`, `/messages/${me.id}`);
  return { id };
}
