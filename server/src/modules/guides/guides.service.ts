import { randomUUID } from "node:crypto";
import { z } from "zod";
import { all, get, run, transaction } from "../../lib/db";
import { nowIso, today } from "../../lib/dates";
import { HttpError } from "../../lib/errors";
import { notifyAdmins } from "../../lib/notify";
import { dateString, parse } from "../../lib/validate";

const GUIDE_SELECT = `
  SELECT u.id AS user_id, u.full_name, u.email, u.phone, u.status AS user_status,
         g.bio, g.photo_url, g.languages, g.experience_years, g.specialization, g.location,
         g.price_rwf, g.price_usd, g.services, g.verification_status, g.rejection_reason,
         g.average_rating, g.review_count
  FROM guide_profiles g JOIN users u ON u.id = g.user_id`;

function serializeGuide(r: any, includePrivate = false) {
  return {
    id: r.user_id,
    fullName: r.full_name,
    photoUrl: r.photo_url,
    bio: r.bio,
    languages: JSON.parse(r.languages) as string[],
    experienceYears: r.experience_years,
    specialization: r.specialization,
    location: r.location,
    pricePerDayRwf: r.price_rwf,
    pricePerDayUsd: r.price_usd,
    services: JSON.parse(r.services) as string[],
    verificationStatus: r.verification_status,
    averageRating: r.average_rating,
    reviewCount: r.review_count,
    ...(includePrivate ? { email: r.email, phone: r.phone, rejectionReason: r.rejection_reason } : {}),
  };
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown): number | null => {
  const n = Number(str(v));
  return str(v) !== "" && Number.isFinite(n) ? n : null;
};

/** FR 4 & FR 5 - keyword search and filters. Only Verified, Active guides are public. */
export function searchGuides(query: Record<string, unknown>) {
  const rows = all<any>(`${GUIDE_SELECT} WHERE g.verification_status = 'Verified' AND u.status = 'Active'`);

  const availability = new Map<string, Set<string>>();
  for (const a of all<any>("SELECT guide_id, date FROM availability_dates WHERE date >= ?", today())) {
    if (!availability.has(a.guide_id)) availability.set(a.guide_id, new Set());
    availability.get(a.guide_id)!.add(a.date);
  }
  const confirmed = all<any>("SELECT guide_id, start_date, end_date FROM bookings WHERE status = 'Confirmed'");

  const q = str(query.q).toLowerCase();
  const language = str(query.language).toLowerCase();
  const location = str(query.location).toLowerCase();
  const minPrice = num(query.minPrice);
  const maxPrice = num(query.maxPrice);
  const minRating = num(query.minRating);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(query.date)) ? str(query.date) : "";

  const result = rows
    .map((r) => serializeGuide(r))
    .filter((g) => {
      if (q) {
        const haystack = [g.fullName, g.bio, g.specialization, g.location, ...g.services, ...g.languages].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
      }
      if (language && !g.languages.some((l) => l.toLowerCase() === language)) return false;
      if (location && !g.location.toLowerCase().includes(location)) return false;
      if (minPrice !== null && g.pricePerDayRwf < minPrice) return false;
      if (maxPrice !== null && g.pricePerDayRwf > maxPrice) return false;
      if (minRating !== null && g.averageRating < minRating) return false;
      if (date) {
        if (!availability.get(g.id)?.has(date)) return false;
        if (confirmed.some((b) => b.guide_id === g.id && b.start_date <= date && b.end_date >= date)) return false;
      }
      return true;
    });

  result.sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount || a.fullName.localeCompare(b.fullName));
  return result;
}

/** FR 6 - public profile. Unverified profiles are only visible to their owner and admins. */
export function getGuideProfile(id: string, viewer?: { id: string; role: string }) {
  const r = get<any>(`${GUIDE_SELECT} WHERE g.user_id = ?`, id);
  const canSeeHidden = viewer && (viewer.role === "Admin" || viewer.id === id);
  if (!r || (!canSeeHidden && (r.verification_status !== "Verified" || r.user_status !== "Active"))) {
    throw new HttpError(404, "Guide not found.");
  }
  const availability = all<{ date: string }>("SELECT date FROM availability_dates WHERE guide_id = ? AND date >= ? ORDER BY date", id, today());
  const reviews = all<any>(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS author
     FROM reviews r JOIN users u ON u.id = r.author_id
     WHERE r.guide_id = ? AND r.is_hidden = 0 ORDER BY r.created_at DESC`,
    id,
  ).map((x) => ({ id: x.id, rating: x.rating, comment: x.comment, createdAt: x.created_at, author: x.author }));
  return { ...serializeGuide(r), availabilityDates: availability.map((a) => a.date), reviews };
}

export function getOwnProfile(userId: string) {
  const r = get<any>(`${GUIDE_SELECT} WHERE g.user_id = ?`, userId);
  if (!r) throw new HttpError(404, "Guide profile not found.");
  const availability = all<{ date: string }>("SELECT date FROM availability_dates WHERE guide_id = ? AND date >= ? ORDER BY date", userId, today());
  const documents = all<any>("SELECT id, file_name, uploaded_at FROM verification_documents WHERE guide_id = ? ORDER BY uploaded_at DESC", userId)
    .map((d) => ({ id: d.id, fileName: d.file_name, uploadedAt: d.uploaded_at }));
  return { ...serializeGuide(r, true), availabilityDates: availability.map((a) => a.date), documents };
}

const profileSchema = z.object({
  fullName: z.string({ error: "Please insert your full name." }).trim().min(2, "Please insert your full name."),
  phone: z.string({ error: "Please insert your phone number." }).trim().min(7, "Please insert a valid phone number."),
  bio: z.string({ error: "Please write a short biography." }).trim().min(20, "Your biography must be at least 20 characters long.").max(2000, "Your biography is too long (maximum 2000 characters)."),
  languages: z.array(z.string().trim().min(1)).min(1, "Please select at least one language."),
  experienceYears: z.number({ error: "Please insert your years of experience." }).int("Years of experience must be a whole number.").min(0, "Years of experience cannot be negative.").max(60, "Please insert a realistic number of years."),
  specialization: z.string({ error: "Please insert your specialization." }).trim().min(2, "Please insert your specialization."),
  location: z.string({ error: "Please select your base location." }).trim().min(2, "Please select your base location."),
  pricePerDayRwf: z.number({ error: "Please insert your daily price in RWF." }).int().min(1, "Please insert your daily price in RWF."),
  pricePerDayUsd: z.number({ error: "Please insert your daily price in USD." }).int().min(1, "Please insert your daily price in USD."),
  services: z.array(z.string().trim().min(1)).max(20, "Please list at most 20 services."),
  availabilityDates: z.array(dateString("One of the availability dates is invalid.")).max(366, "Please select at most 366 availability dates."),
});

/** FR 3 - create or edit the guide's own profile. */
export function updateOwnProfile(userId: string, body: unknown) {
  const d = parse(profileSchema, body);
  const unique = (list: string[]) => [...new Set(list)];
  transaction(() => {
    run("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", d.fullName, d.phone, userId);
    run(
      `UPDATE guide_profiles SET bio = ?, languages = ?, experience_years = ?, specialization = ?, location = ?,
         price_rwf = ?, price_usd = ?, services = ? WHERE user_id = ?`,
      d.bio, JSON.stringify(unique(d.languages)), d.experienceYears, d.specialization, d.location,
      d.pricePerDayRwf, d.pricePerDayUsd, JSON.stringify(unique(d.services)), userId,
    );
    run("DELETE FROM availability_dates WHERE guide_id = ?", userId);
    const insert = "INSERT OR IGNORE INTO availability_dates (guide_id, date) VALUES (?, ?)";
    for (const date of unique(d.availabilityDates).filter((x) => x >= today())) run(insert, userId, date);
  });
  return getOwnProfile(userId);
}

export function setPhoto(userId: string, file?: Express.Multer.File) {
  if (!file) throw new HttpError(400, "Please choose a photo to upload.");
  run("UPDATE guide_profiles SET photo_url = ? WHERE user_id = ?", `/uploads/photos/${file.filename}`, userId);
  return getOwnProfile(userId);
}

/** FR 3 - uploading credentials sets the profile back to Pending until an admin reviews it. */
export function addDocuments(userId: string, files?: Express.Multer.File[]) {
  if (!files?.length) throw new HttpError(400, "Please choose at least one document to upload.");
  const me = get<any>("SELECT full_name FROM users WHERE id = ?", userId);
  transaction(() => {
    for (const f of files) {
      run("INSERT INTO verification_documents (id, guide_id, file_name, stored_name, uploaded_at) VALUES (?,?,?,?,?)",
        randomUUID(), userId, f.originalname, f.filename, nowIso());
    }
    run("UPDATE guide_profiles SET verification_status = 'Pending', rejection_reason = NULL WHERE user_id = ?", userId);
  });
  notifyAdmins("VerificationSubmitted", `${me.full_name} submitted verification documents for review.`, "/admin");
  return getOwnProfile(userId);
}

