import { CalendarCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert, Field, btnPrimary, card, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { DESTINATIONS, formatRwf, todayStr } from "../../lib/format";

function dayCount(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

/** FR 7 - tourist selects dates and destination; the API checks availability before creating a Pending booking. */
export default function BookingForm({ guideId, defaultDestination, pricePerDayRwf, availableDates }: { guideId: string; defaultDestination: string; pricePerDayRwf: number; availableDates: string[] }) {
  const base = DESTINATIONS.includes(defaultDestination) ? defaultDestination : DESTINATIONS[0]!;
  const [destination, setDestination] = useState(base);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!startDate) return setError("Please select a start date.");
    if (!endDate) return setError("Please select an end date.");
    if (endDate < startDate) return setError("The end date cannot be before the start date.");
    setBusy(true);
    try {
      await api.post("/api/bookings", { guideId, destination, startDate, endDate, notes });
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className={`${card} space-y-3 p-5`}>
        <Alert kind="success">Your request has been sent. The guide will accept or decline it soon, and you will be notified.</Alert>
        <Link to="/dashboard" className={btnPrimary}>View my bookings</Link>
      </div>
    );
  }

  const days = startDate && endDate && endDate >= startDate ? dayCount(startDate, endDate) : 0;
  const first = availableDates[0];
  const last = availableDates[availableDates.length - 1];

  return (
    <form onSubmit={submit} className={`${card} space-y-4 p-5`} noValidate>
      <h2 className="text-xl font-bold text-forest-900">Book this guide</h2>
      {error && <Alert>{error}</Alert>}
      <Field label="Destination">
        <select className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)}>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date"><input type="date" className={inputClass} min={first ?? todayStr()} max={last} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate || endDate < e.target.value) setEndDate(e.target.value); }} /></Field>
        <Field label="End date"><input type="date" className={inputClass} min={startDate || first || todayStr()} max={last} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
      </div>
      <Field label="Notes for the guide (optional)"><textarea rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Group size, interests, pick-up location..." /></Field>
      {days > 0 && <p className="rounded-md bg-forest-50 px-3 py-2 text-sm text-forest-900">Estimated total: <strong>{formatRwf(days * pricePerDayRwf)}</strong> for {days} {days === 1 ? "day" : "days"}. Payment is arranged directly with the guide.</p>}
      <button className={`${btnPrimary} w-full`} disabled={busy}><CalendarCheck className="size-4" /> {busy ? "Sending request..." : "Book guide"}</button>
    </form>
  );
}
