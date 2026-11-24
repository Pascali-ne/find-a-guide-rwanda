import { ArrowLeft, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Avatar, EmptyState, Spinner, btnPrimary, card, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { formatDateTime, timeAgo } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";

interface Conversation { userId: string; fullName: string; role: string; lastMessage: string; lastAt: string; unread: number }
interface Message { id: string; senderId: string; content: string; sentAt: string; isRead: boolean }
interface Thread { with: { id: string; fullName: string; role: string }; messages: Message[] }

/** FR 9 - message threads between a tourist and a guide (refreshes every 5 seconds). */
export default function MessagesPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => api.get<{ conversations: Conversation[] }>("/api/messages/conversations").then((r) => setConversations(r.conversations)).catch((e) => setError(errorMessage(e))), []);
  const loadThread = useCallback(async () => {
    if (!userId) return;
    try { setThread(await api.get<Thread>(`/api/messages/with/${userId}`)); setError(""); } catch (e) { setError(errorMessage(e)); setThread(null); }
  }, [userId]);

  useEffect(() => { loadConversations(); const t = setInterval(loadConversations, 8000); return () => clearInterval(t); }, [loadConversations]);
  useEffect(() => { setThread(null); loadThread().then(loadConversations); const t = setInterval(loadThread, 5000); return () => clearInterval(t); }, [loadThread, loadConversations]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [thread?.messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      await api.post("/api/messages", { receiverId: userId, content: text });
      setText("");
      await loadThread();
      loadConversations();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const showList = !userId;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-forest-900">Messages</h1>
      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <aside className={`${card} ${showList ? "" : "hidden md:block"} overflow-hidden`}>
          {!conversations ? <Spinner /> : conversations.length === 0 ? (
            <div className="p-5 text-sm text-stone-600">No conversations yet. {user?.role === "Tourist" ? <>Open a guide's profile and choose <strong>Message</strong>.</> : "Tourists will appear here once they write to you."}</div>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.userId}>
                  <Link to={`/messages/${c.userId}`} className={`flex items-center gap-3 border-b border-stone-100 px-4 py-3 hover:bg-forest-50 ${c.userId === userId ? "bg-forest-50" : ""}`}>
                    <Avatar name={c.fullName} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{c.fullName}</span><span className="shrink-0 text-xs text-stone-500">{timeAgo(c.lastAt)}</span></span>
                      <span className="block truncate text-sm text-stone-600">{c.lastMessage}</span>
                    </span>
                    {c.unread > 0 && <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{c.unread}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={`${card} ${showList ? "hidden md:flex" : "flex"} min-h-[28rem] flex-col`}>
          {!userId ? (
            <div className="m-auto p-8"><EmptyState title="Select a conversation">Choose a conversation on the left to read and reply.</EmptyState></div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
                <button className="rounded p-1 hover:bg-stone-100 md:hidden" onClick={() => navigate("/messages")} aria-label="Back to conversations"><ArrowLeft className="size-5" /></button>
                {thread && <><Avatar name={thread.with.fullName} size={36} /><div><p className="font-semibold leading-tight">{thread.with.fullName}</p><p className="text-xs text-stone-500">{thread.with.role === "Guide" ? "Tour guide" : "Tourist"}</p></div></>}
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4" style={{ maxHeight: "28rem" }}>
                {error && <Alert>{error}</Alert>}
                {!thread && !error && <Spinner />}
                {thread?.messages.length === 0 && <p className="py-8 text-center text-sm text-stone-500">No messages yet. Say hello to {thread.with.fullName}.</p>}
                {thread?.messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-sm bg-forest-600 text-white" : "rounded-bl-sm bg-stone-100 text-stone-900"}`}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`mt-0.5 text-[11px] ${mine ? "text-forest-100" : "text-stone-500"}`}>{formatDateTime(m.sentAt)}{mine && (m.isRead ? " · Read" : "")}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              {thread && (
                <form onSubmit={send} className="flex gap-2 border-t border-stone-200 p-3">
                  <input className={inputClass} placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Message" />
                  <button className={btnPrimary} disabled={sending || !text.trim()}><Send className="size-4" /> Send</button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
