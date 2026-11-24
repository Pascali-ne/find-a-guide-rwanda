import { randomUUID } from "node:crypto";
import { z } from "zod";
import { get, run, transaction } from "../../lib/db";
import { nowIso } from "../../lib/dates";
import { HttpError } from "../../lib/errors";
import { notify } from "../../lib/notify";
import { parse } from "../../lib/validate";
import { recalculateGuideRating } from "../../lib/ratings";
import type { AuthUser } from "../../middleware/auth";

const schema = z.object({
  bookingId: z.string({ error: "Please select a booking to review." }).min(1, "Please select a booking to review."),
  rating: z.number({ error: "Please select a rating from 1 to 5 stars." }).int().min(1, "Please select a rating from 1 to 5 stars.").max(5, "Please select a rating from 1 to 5 stars."),
  comment: z.string({ error: "Please write a short comment." }).trim().min(5, "Please write a short comment (at least 5 characters).").max(1500, "Comments can be at most 1500 characters."),
});

/** FR 10 - only the tourist of a Completed booking may review, once per booking. */
export function createReview(tourist: AuthUser, body: unknown) {
  const d = parse(schema, body);
  const booking = get<any>("SELECT * FROM bookings WHERE id = ? AND tourist_id = ?", d.bookingId, tourist.id);
  if (!booking) throw new HttpError(404, "Booking not found.");
  if (booking.status !== "Completed") throw new HttpError(409, "You can only review a booking after it has been completed.");
  if (get("SELECT 1 FROM reviews WHERE booking_id = ?", d.bookingId)) throw new HttpError(409, "You have already reviewed this booking.");

  const id = randomUUID();
  transaction(() => {
    run("INSERT INTO reviews (id, booking_id, author_id, guide_id, rating, comment, created_at) VALUES (?,?,?,?,?,?,?)",
      id, d.bookingId, tourist.id, booking.guide_id, d.rating, d.comment, nowIso());
    recalculateGuideRating(booking.guide_id);
  });
  notify(booking.guide_id, "NewReview", `${tourist.fullName} left you a ${d.rating}-star review.`, `/guides/${booking.guide_id}`);
  return { id };
}
