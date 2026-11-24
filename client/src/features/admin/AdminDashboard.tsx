import { Check, Eye, EyeOff, FileText, ShieldOff, UserCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, EmptyState, Field, PageHeader, Spinner, Stars, StatusBadge, btnDanger, btnPrimary, btnSecondary, card, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { formatDate, formatRwf } from "../../lib/format";

type Tab = "overview" | "verification" | "users" | "bookings" | "reviews" | "reports";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" }, { id: "verification", label: "Guide verification" }, { id: "users", label: "Users" },
  { id: "bookings", label: "Bookings" }, { id: "reviews", label: "Reviews" }, { id: "reports", label: "Reports" },
];

/** FR 12 - 14: verification, user management, booking monitoring, review moderation and report handling. */
export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Administration" subtitle="Verify guides, manage accounts, monitor bookings and keep the community safe." />
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t.id ? "bg-forest-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-forest-50"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "verification" && <Verification />}
      {tab === "users" && <Users />}
      {tab === "bookings" && <Bookings />}
      {tab === "reviews" && <Reviews />}
      {tab === "reports" && <Reports />}
    </div>
  );
}

/** Small hook: loads a list from the API and exposes a reload function. */
function useList<T>(url: string, key: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api.get<Record<string, T[]>>(url).then((r) => setData(r[key]!)).catch((e) => setError(errorMessage(e))), [url, key]);
  useEffect(() => { load(); }, [load]);
  return { data, error, load, setError };
}

function Overview() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get<{ stats: Record<string, number> }>("/api/admin/stats").then((r) => setStats(r.stats)).catch((e) => setError(errorMessage(e))); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!stats) return <Spinner />;
  const items = [
    ["Tourists", stats.tourists], ["Tour guides", stats.guides], ["Guides awaiting verification", stats.pendingGuides],
    ["Total bookings", stats.bookings], ["Pending bookings", stats.pendingBookings], ["Open reports", stats.openReports],
  ] as const;
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className={`${card} p-5`}><dt className="text-sm text-stone-600">{label}</dt><dd className="mt-1 font-display text-4xl font-bold text-forest-800">{value}</dd></div>
      ))}
    </dl>
  );
}

interface PendingGuide {
  id: string; fullName: string; email: string; phone: string; bio: string; languages: string[]; experienceYears: number;
  specialization: string; location: string; pricePerDayRwf: number; pricePerDayUsd: number; verificationStatus: string;
  rejectionReason: string | null; documents: { id: string; fileName: string; uploadedAt: string }[];
}

function Verification() {
  const [status, setStatus] = useState("Pending");
  const { data, error, load, setError } = useList<PendingGuide>(`/api/admin/guides?status=${status}`, "guides");
  const [rejecting, setRejecting] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id); setError("");
    try { await fn(); setRejecting(""); setReason(""); await load(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(""); }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["Pending", "Verified", "Rejected"].map((s) => <button key={s} onClick={() => { setStatus(s); }} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${status === s ? "bg-forest-100 text-forest-900" : "text-stone-600 hover:bg-stone-100"}`}>{s}</button>)}
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {!data ? <Spinner /> : data.length === 0 ? <EmptyState title={`No ${status.toLowerCase()} guides`} /> : (
        <ul className="space-y-4">
          {data.map((g) => (
            <li key={g.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold text-forest-900">{g.fullName}</h3><p className="text-sm text-stone-600">{g.email} · {g.phone}</p></div>
                <StatusBadge status={g.verificationStatus} />
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="inline font-medium">Specialization: </dt><dd className="inline text-stone-700">{g.specialization || "-"}</dd></div>
                <div><dt className="inline font-medium">Location: </dt><dd className="inline text-stone-700">{g.location || "-"}</dd></div>
                <div><dt className="inline font-medium">Languages: </dt><dd className="inline text-stone-700">{g.languages.join(", ") || "-"}</dd></div>
                <div><dt className="inline font-medium">Experience: </dt><dd className="inline text-stone-700">{g.experienceYears} years</dd></div>
                <div><dt className="inline font-medium">Price: </dt><dd className="inline text-stone-700">{g.pricePerDayRwf ? `${formatRwf(g.pricePerDayRwf)} ($${g.pricePerDayUsd})` : "-"}</dd></div>
              </dl>
              {g.bio && <p className="mt-3 rounded bg-stone-50 p-3 text-sm text-stone-700">{g.bio}</p>}
              <div className="mt-3">
                <p className="text-sm font-medium">Submitted documents</p>
                {g.documents.length === 0 ? <p className="text-sm text-stone-500">No documents uploaded yet.</p> : (
                  <ul className="mt-1 space-y-1">{g.documents.map((d) => (
                    <li key={d.id}><button className="flex items-center gap-2 text-sm font-medium text-forest-800 hover:underline" onClick={() => api.openFile(`/api/documents/${d.id}`).catch((e) => setError(errorMessage(e)))}><FileText className="size-4" /> {d.fileName} <span className="font-normal text-stone-500">({formatDate(d.uploadedAt)})</span></button></li>
                  ))}</ul>
                )}
              </div>
              {g.rejectionReason && <p className="mt-3 text-sm text-red-700">Previous rejection reason: {g.rejectionReason}</p>}

              {status !== "Verified" && rejecting !== g.id && (
                <div className="mt-4 flex gap-2">
                  <button className={btnPrimary} disabled={busy === g.id} onClick={() => run(g.id, () => api.post(`/api/admin/guides/${g.id}/approve`))}><Check className="size-4" /> Approve</button>
                  {status === "Pending" && <button className={btnDanger} onClick={() => { setRejecting(g.id); setReason(""); }}><X className="size-4" /> Reject</button>}
                </div>
              )}
              {rejecting === g.id && (
                <div className="mt-4 space-y-3">
                  <Field label="Reason for rejection (shown to the guide)"><textarea rows={3} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  <div className="flex gap-2">
                    <button className={btnDanger} disabled={busy === g.id} onClick={() => run(g.id, () => api.post(`/api/admin/guides/${g.id}/reject`, { reason }))}>Confirm rejection</button>
                    <button className={btnSecondary} onClick={() => setRejecting("")}>Cancel</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface AdminUser { id: string; fullName: string; email: string; phone: string; role: string; status: string; createdAt: string; verificationStatus: string | null }

function Users() {
  const { data, error, load, setError } = useList<AdminUser>("/api/admin/users", "users");
  const [filter, setFilter] = useState("");
  async function toggle(u: AdminUser) {
    setError("");
    try { await api.patch(`/api/admin/users/${u.id}/status`, { status: u.status === "Active" ? "Suspended" : "Active" }); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  if (!data) return error ? <Alert>{error}</Alert> : <Spinner />;
  const rows = data.filter((u) => !filter || `${u.fullName} ${u.email} ${u.role}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <input className={`${inputClass} max-w-sm`} placeholder="Filter by name, email or role" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter users" />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600"><tr><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Joined</th><th className="px-4 py-2.5 text-right">Action</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2.5"><span className="block font-medium">{u.fullName}</span><span className="text-xs text-stone-500">{u.email}</span></td>
                <td className="px-4 py-2.5">{u.role}{u.verificationStatus && <span className="ml-2"><StatusBadge status={u.verificationStatus} /></span>}</td>
                <td className="px-4 py-2.5"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-2.5 text-stone-600">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  {u.role !== "Admin" && (u.status === "Active"
                    ? <button className={btnSecondary} onClick={() => toggle(u)}><ShieldOff className="size-4" /> Suspend</button>
                    : <button className={btnPrimary} onClick={() => toggle(u)}><UserCheck className="size-4" /> Activate</button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AdminBooking { id: string; destination: string; startDate: string; endDate: string; status: string; touristName: string; guideName: string }

function Bookings() {
  const { data, error } = useList<AdminBooking>("/api/admin/bookings", "bookings");
  if (!data) return error ? <Alert>{error}</Alert> : <Spinner />;
  if (data.length === 0) return <EmptyState title="No bookings yet" />;
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600"><tr><th className="px-4 py-2.5">Tourist</th><th className="px-4 py-2.5">Guide</th><th className="px-4 py-2.5">Destination</th><th className="px-4 py-2.5">Dates</th><th className="px-4 py-2.5">Status</th></tr></thead>
        <tbody>{data.map((b) => (
          <tr key={b.id} className="border-b border-stone-100 last:border-0">
            <td className="px-4 py-2.5">{b.touristName}</td><td className="px-4 py-2.5">{b.guideName}</td><td className="px-4 py-2.5">{b.destination}</td>
            <td className="px-4 py-2.5 text-stone-600">{formatDate(b.startDate)}{b.endDate !== b.startDate && ` to ${formatDate(b.endDate)}`}</td>
            <td className="px-4 py-2.5"><StatusBadge status={b.status} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

interface AdminReview { id: string; rating: number; comment: string; isHidden: boolean; createdAt: string; authorName: string; guideName: string }

function Reviews() {
  const { data, error, load, setError } = useList<AdminReview>("/api/admin/reviews", "reviews");
  async function toggle(r: AdminReview) {
    setError("");
    try { await api.patch(`/api/admin/reviews/${r.id}/hidden`, { hidden: !r.isHidden }); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  if (!data) return error ? <Alert>{error}</Alert> : <Spinner />;
  if (data.length === 0) return <EmptyState title="No reviews yet" />;
  return (
    <ul className="space-y-3">
      {error && <Alert>{error}</Alert>}
      {data.map((r) => (
        <li key={r.id} className={`${card} flex flex-wrap items-start justify-between gap-4 p-4 ${r.isHidden ? "opacity-60" : ""}`}>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm"><Stars value={r.rating} size={14} /> <span className="font-semibold">{r.authorName}</span> <span className="text-stone-500">about {r.guideName} · {formatDate(r.createdAt)}</span>{r.isHidden && <StatusBadge status="Suspended" />}</p>
            <p className="mt-1 text-sm text-stone-700">{r.comment}</p>
          </div>
          <button className={btnSecondary} onClick={() => toggle(r)}>{r.isHidden ? <><Eye className="size-4" /> Show</> : <><EyeOff className="size-4" /> Hide</>}</button>
        </li>
      ))}
    </ul>
  );
}

interface AdminReport { id: string; reason: string; status: string; resolutionNote: string | null; createdAt: string; reporterName: string; reportedUserId: string; reportedName: string; reportedRole: string; reportedStatus: string }

function Reports() {
  const { data, error, load, setError } = useList<AdminReport>("/api/admin/reports", "reports");
  const [note, setNote] = useState<Record<string, string>>({});
  async function resolve(r: AdminReport, status: "Resolved" | "Dismissed") {
    setError("");
    try { await api.patch(`/api/admin/reports/${r.id}`, { status, resolutionNote: note[r.id] ?? "" }); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  async function suspend(r: AdminReport) {
    setError("");
    try { await api.patch(`/api/admin/users/${r.reportedUserId}/status`, { status: "Suspended" }); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  if (!data) return error ? <Alert>{error}</Alert> : <Spinner />;
  if (data.length === 0) return <EmptyState title="No reports">Reports filed by tourists and guides will appear here.</EmptyState>;
  return (
    <ul className="space-y-3">
      {error && <Alert>{error}</Alert>}
      {data.map((r) => (
        <li key={r.id} className={`${card} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm"><span className="font-semibold">{r.reporterName}</span> reported <span className="font-semibold">{r.reportedName}</span> ({r.reportedRole}) · {formatDate(r.createdAt)}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-2 rounded bg-stone-50 p-3 text-sm text-stone-700">{r.reason}</p>
          {r.status === "Open" ? (
            <div className="mt-3 space-y-2">
              <input className={inputClass} placeholder="Resolution note (optional)" value={note[r.id] ?? ""} onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))} aria-label="Resolution note" />
              <div className="flex flex-wrap gap-2">
                <button className={btnPrimary} onClick={() => resolve(r, "Resolved")}>Mark resolved</button>
                <button className={btnSecondary} onClick={() => resolve(r, "Dismissed")}>Dismiss</button>
                {r.reportedStatus === "Active" && <button className={btnDanger} onClick={() => suspend(r)}><ShieldOff className="size-4" /> Suspend {r.reportedName}</button>}
              </div>
            </div>
          ) : r.resolutionNote && <p className="mt-2 text-sm text-stone-600">Note: {r.resolutionNote}</p>}
        </li>
      ))}
    </ul>
  );
}
