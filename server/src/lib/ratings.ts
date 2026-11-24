import { get, run } from "./db";

/** Recomputes a guide's averageRating from all non-hidden reviews (FR 10, FR 14). */
export function recalculateGuideRating(guideId: string): void {
  const row = get<{ avg: number | null; n: number }>(
    "SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE guide_id = ? AND is_hidden = 0",
    guideId,
  );
  const avg = row?.avg ? Math.round(row.avg * 10) / 10 : 0;
  run("UPDATE guide_profiles SET average_rating = ?, review_count = ? WHERE user_id = ?", avg, row?.n ?? 0, guideId);
}
