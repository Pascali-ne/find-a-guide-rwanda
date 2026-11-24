import { randomUUID } from "node:crypto";
import { z } from "zod";
import { all, get, run } from "../../lib/db";
import { eachDate, nowIso, today } from "../../lib/dates";
import { HttpError } from "../../lib/errors";
import { notify } from "../../lib/notify";
import { dateString, parse } from "../../lib/validate";
import type { AuthUser } from "../../middleware/auth";

const createSchema = z.object({
  guideId: z.string({ error: "Please select a guide." }).min(1, "Please select a guide."),
  destination: z.string({ error: "Please select a destination." }).trim().min(2, "Please select a destination."),
  startDate: dateString("Please select a start date."),
  endDate: dateString("Please select an end date."),
  notes: z.string().trim().max(1000, "Notes can be at most 1000 characters.").optional(),
});

/** FR 7 - checks that every requested day is open and not already confirmed for someone else. */
function assertGuideAvailable(guideId: string, start: string, end: string, excludeBookingId?: string) {
  const open = new Set(
    all<{ date: string }>("SELECT date FROM availability_dates WHERE guide_id = ? AND date BETWEEN ? AND ?", guideId, start, end).map((r) => r.date),
  );
  const missing = eachDate(start, end).find((d) => !open.has(d));
  if (missing) throw new HttpError(409, `The guide is not available on ${missing}. Please choose different dates.`);

  const clash = get(
    `SELECT 1 FROM bookings WHERE guide_id = ? AND status = 'Confirmed' AND start_date <= ? AND end_date >= ? AND id != ?`,
    guideId, end, start, excludeBookingId ?? "",
  );
  if (clash) throw new HttpError(409, "The guide already has a confirmed booking on these dates. Please choose different dates.");
}

export function createBooking(tourist: AuthUser, body: unknown) {
  const d = parse(createSchema, body);
  if (d.startDate < today()) throw new HttpError(400, "The start date cannot be in the past.", { startDate: "The start date cannot be in the past." });
  if (d.endDate < d.startDate) throw new HttpError(400, "The end date cannot be before the start date.", { endDate: "The end date cannot be before the start date." });

  const guide = get<any>(
    `SELECT u.id, u.full_name FROM users u JOIN guide_profiles g ON g.user_id = u.id
     WHERE u.id = ? AND u.status = 'Active' AND g.verification_status = 'Verified'`,
    d.guideId,
  );
  if (!guide) throw new HttpError(404, "This guide is not available for booking.");
  assertGuideAvailable(d.guideId, d.startDate, d.endDate);

  const id = randomUUID();
  const now = nowIso();
  run(
    `INSERT INTO bookings (id, tourist_id, guide_id, destination, start_date, end_date, notes, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?, 'Pending', ?, ?)`,
    id, tourist.id, d.guideId, d.destination, d.startDate, d.endDate, d.notes || null, now, now,
  );
  notify(d.guideId, "BookingRequest", `New booking request from ${tourist.fullName} for ${d.destination} (${d.startDate} to ${d.endDate}).`, "/dashboard");
  return getBooking(id);
}

function serialize(r: any) {
  return {
    id: r.id,
    destination: r.destination,
    startDate: r.start_date,
    endDate: r.end_date,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at,
    tourist: { id: r.tourist_id, fullName: r.tourist_name },
    guide: { id: r.guide_id, fullName: r.guide_name },
    hasReview: !!r.review_id,
  };
}

const BOOKING_SELECT = `
  SELECT b.*, t.full_name AS tourist_name, g.full_name AS guide_name, r.id AS review_id
  FROM bookings b
  JOIN users t ON t.id = b.tourist_id
  JOIN users g ON g.id = b.guide_id
  LEFT JOIN reviews r ON r.booking_id = b.id`;

function getBooking(id: string) {
  return serialize(get<any>(`${BOOKING_SELECT} WHERE b.id = ?`, id));
}

export function listMyBookings(user: AuthUser) {
  const column = user.role === "Guide" ? "b.guide_id" : "b.tourist_id";
  return all<any>(`${BOOKING_SELECT} WHERE ${column} = ? ORDER BY b.created_at DESC`, user.id).map(serialize);
}

export type BookingAction = "accept" | "reject" | "cancel" | "complete";

/** FR 8 - booking lifecycle: Pending -> Confirmed / Declined / Cancelled, Confirmed -> Completed. */
export function changeBookingStatus(user: AuthUser, bookingId: string, action: unknown) {
  if (!["accept", "reject", "cancel", "complete"].includes(String(action))) {
    throw new HttpError(400, "Unknown booking action.");
  }
  const b = get<any>("SELECT * FROM bookings WHERE id = ?", bookingId);
  if (!b || (b.guide_id !== user.id && b.tourist_id !== user.id)) throw new HttpError(404, "Booking not found.");

  const isGuide = user.id === b.guide_id;
  const touristName = get<any>("SELECT full_name FROM users WHERE id = ?", b.tourist_id)!.full_name;
  const guideName = get<any>("SELECT full_name FROM users WHERE id = ?", b.guide_id)!.full_name;
  const label = `${b.destination} (${b.start_date} to ${b.end_date})`;
  let next: string;

  switch (action as BookingAction) {
    case "accept":
    case "reject": {
      if (!isGuide) throw new HttpError(403, "Only the guide can respond to a booking request.");
      if (b.status !== "Pending") throw new HttpError(409, "Only pending requests can be accepted or rejected.");
      if (action === "accept") {
        assertGuideAvailable(b.guide_id, b.start_date, b.end_date, b.id);
        next = "Confirmed";
        notify(b.tourist_id, "BookingConfirmed", `${guideName} accepted your booking for ${label}.`, "/dashboard");
      } else {
        next = "Declined";
        notify(b.tourist_id, "BookingDeclined", `${guideName} declined your booking for ${label}.`, "/dashboard");
      }
      break;
    }
    case "cancel": {
      if (isGuide) throw new HttpError(403, "Only the tourist can cancel a booking request.");
      if (b.status !== "Pending") throw new HttpError(409, "Only pending bookings can be cancelled.");
      next = "Cancelled";
      notify(b.guide_id, "BookingCancelled", `${touristName} cancelled the booking request for ${label}.`, "/dashboard");
      break;
    }
    case "complete": {
      if (!isGuide) throw new HttpError(403, "Only the guide can mark a booking as completed.");
      if (b.status !== "Confirmed") throw new HttpError(409, "Only confirmed bookings can be completed.");
      next = "Completed";
      notify(b.tourist_id, "BookingCompleted", `Your tour with ${guideName} is complete. You can now leave a review.`, "/dashboard");
      break;
    }
  }
  run("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?", next!, nowIso(), bookingId);
  return getBooking(bookingId);
}
