import { Router } from "express";
import { all, get, run } from "../../lib/db";
import { requireAuth } from "../../middleware/auth";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", (req, res) => {
  const items = all<any>("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 30", req.user!.id).map((n) => ({
    id: n.id, type: n.type, message: n.message, link: n.link, isRead: !!n.is_read, createdAt: n.created_at,
  }));
  const unread = get<{ n: number }>("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0", req.user!.id)?.n ?? 0;
  res.json({ notifications: items, unreadCount: unread });
});

notificationsRouter.patch("/read-all", (req, res) => {
  run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", req.user!.id);
  res.json({ ok: true });
});

notificationsRouter.patch("/:id/read", (req, res) => {
  run("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", String(req.params.id), req.user!.id);
  res.json({ ok: true });
});
