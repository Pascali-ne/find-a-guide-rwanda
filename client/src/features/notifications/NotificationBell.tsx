import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { timeAgo } from "../../lib/format";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** FR 11 - in-app notification bell with a dropdown drawer (polls every 15 seconds). */
export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: Notification[]; unreadCount: number }>("/api/notifications");
      setItems(res.notifications);
      setUnread(res.unreadCount);
    } catch {
      /* the bell fails silently; the rest of the page still works */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openItem(n: Notification) {
    setOpen(false);
    if (!n.isRead) await api.patch(`/api/notifications/${n.id}/read`, {}).catch(() => undefined);
    load();
    if (n.link) navigate(n.link);
  }

  async function readAll() {
    await api.patch("/api/notifications/read-all", {}).catch(() => undefined);
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((o) => !o); load(); }} className="relative rounded-md p-2 text-stone-700 hover:bg-stone-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2.5">
            <h2 className="font-display text-base font-bold">Notifications</h2>
            {unread > 0 && <button onClick={readAll} className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:underline"><CheckCheck className="size-3.5" /> Mark all read</button>}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-stone-500">You have no notifications yet.</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => openItem(n)} className={`block w-full border-b border-stone-100 px-4 py-3 text-left hover:bg-stone-50 ${n.isRead ? "" : "bg-forest-50"}`}>
                  <span className="block text-sm text-stone-800">{n.message}</span>
                  <span className="mt-0.5 block text-xs text-stone-500">{timeAgo(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
