import { CalendarDays, Flag, MapPin, MessageSquare, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, EmptyState, Spinner, StatusBadge, btnDanger, btnPrimary, btnSecondary, card } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { formatDate } from "../../lib/format";
import ReportUserModal from "../admin/ReportUserModal";
import ReviewForm from "../reviews/ReviewForm";
import type { Booking } from "./types";

type Action = "accept" | "reject" | "cancel" | "complete";
const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Closed"] as const;

/** Booking lifecycle UI (FR 7, FR 8, FR 10, FR 13) - one list used by both tourists and guides. */
export default function BookingList({ role }: { role: "Tourist" | "Guide" }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [reporting, setReporting] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setBookings((await api.get<{ bookings: Booking[] }>("/api/bookings/mine")).bookings);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(b: Booking, action: Action) {
    setBusyId(b.id);
    setError("");
    try {
      await api.patch(`/api/bookings/${b.id}/status`, { action });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId("");
    }
  }

  if (!bookings) return error ? <Alert>{error}</Alert> : <Spinner />;

  const shown = bookings.filter((b) =>
    filter === "All" ? true : filter === "Closed" ? ["Declined", "Cancelled"].includes(b.status) : b.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter bookings">
        {FILTERS.map((f) => {
          const count = bookings.filter((b) => (f === "All" ? true : f === "Closed" ? ["Declined", "Cancelled"].includes(b.status) : b.status === f)).length;
          return (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${filter === f ? "bg-forest-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-forest-50"}`}>
              {f} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      {shown.length === 0 ? (
        <EmptyState title={bookings.length === 0 ? (role === "Tourist" ? "You have no bookings yet" : "No booking requests yet") : "Nothing in this view"}>
          {role === "Tourist" && bookings.length === 0 ? <Link to="/guides" className="font-semibold text-forest-700 underline">Find a guide</Link> : "Requests will appear here as soon as they arrive."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {shown.map((b) => {
            const other = role === "Tourist" ? b.guide : b.tourist;
            const busy = busyId === b.id;
            return (
              <li key={b.id} className={`${card} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-forest-900">{role === "Tourist" ? <Link to={`/guides/${other.id}`} className="hover:underline">{other.fullName}</Link> : other.fullName}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-700"><MapPin className="size-4 text-forest-600" /> {b.destination}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-700"><CalendarDays className="size-4 text-forest-600" /> {b.startDate === b.endDate ? formatDate(b.startDate) : `${formatDate(b.startDate)} to ${formatDate(b.endDate)}`}</p>
                    {b.notes && <p className="mt-2 max-w-xl rounded bg-stone-50 px-3 py-2 text-sm text-stone-600">“{b.notes}”</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role === "Guide" && b.status === "Pending" && (<>
                      <button className={btnPrimary} disabled={busy} onClick={() => act(b, "accept")}>Accept</button>
                      <button className={btnDanger} disabled={busy} onClick={() => act(b, "reject")}>Reject</button>
                    </>)}
                    {role === "Guide" && b.status === "Confirmed" && <button className={btnPrimary} disabled={busy} onClick={() => act(b, "complete")}>Mark completed</button>}
                    {role === "Tourist" && b.status === "Pending" && <button className={btnSecondary} disabled={busy} onClick={() => act(b, "cancel")}>Cancel request</button>}
                    {role === "Tourist" && b.status === "Completed" && !b.hasReview && <button className={btnPrimary} onClick={() => setReviewing(b)}><Star className="size-4" /> Leave a review</button>}
                    {role === "Tourist" && b.status === "Completed" && b.hasReview && <span className="self-center text-sm font-medium text-forest-700">Reviewed</span>}
                    <Link to={`/messages/${other.id}`} className={btnSecondary}><MessageSquare className="size-4" /> Message</Link>
                    <button className={btnSecondary} onClick={() => setReporting({ id: other.id, name: other.fullName })} aria-label={`Report ${other.fullName}`}><Flag className="size-4" /></button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reviewing && <ReviewForm bookingId={reviewing.id} guideName={reviewing.guide.fullName} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(); }} />}
      {reporting && <ReportUserModal userId={reporting.id} userName={reporting.name} onClose={() => setReporting(null)} />}
    </div>
  );
}
