import { randomUUID } from "node:crypto";
import { z } from "zod";
import { all, get, run, transaction } from "../../lib/db";
import { HttpError } from "../../lib/errors";
import { notify } from "../../lib/notify";
import { recalculateGuideRating } from "../../lib/ratings";
import { parse } from "../../lib/validate";
import type { AuthUser } from "../../middleware/auth";

// ───────── FR 12 - guide verification ─────────

export function listGuidesForVerification(status: string) {
  const wanted = ["Pending", "Verified", "Rejected"].includes(status) ? status : "Pending";
  return all<any>(
    `SELECT u.id, u.full_name, u.email, u.phone, g.bio, g.languages, g.experience_years, g.specialization,
            g.location, g.price_rwf, g.price_usd, g.verification_status, g.rejection_reason
     FROM guide_profiles g JOIN users u ON u.id = g.user_id WHERE g.verification_status = ? ORDER BY u.created_at`,
    wanted,
  ).map((g) => ({
    id: g.id,
    fullName: g.full_name,
    email: g.email,
    phone: g.phone,
    bio: g.bio,
    languages: JSON.parse(g.languages) as string[],
    experienceYears: g.experience_years,
    specialization: g.specialization,
    location: g.location,
    pricePerDayRwf: g.price_rwf,
    pricePerDayUsd: g.price_usd,
    verificationStatus: g.verification_status,
    rejectionReason: g.rejection_reason,
    documents: all<any>("SELECT id, file_name, uploaded_at FROM verification_documents WHERE guide_id = ? ORDER BY uploaded_at DESC", g.id)
      .map((d) => ({ id: d.id, fileName: d.file_name, uploadedAt: d.uploaded_at })),
  }));
}

export function approveGuide(guideId: string) {
  const g = get<any>("SELECT verification_status, bio, languages FROM guide_profiles WHERE user_id = ?", guideId);
  if (!g) throw new HttpError(404, "Guide not found.");
  if (!g.bio || JSON.parse(g.languages).length === 0) {
    throw new HttpError(409, "This guide has not completed their profile yet (biography and languages are required).");
  }
  run("UPDATE guide_profiles SET verification_status = 'Verified', rejection_reason = NULL WHERE user_id = ?", guideId);
  notify(guideId, "VerificationApproved", "Congratulations! Your profile has been verified and is now visible to tourists.", "/dashboard");
}

const rejectSchema = z.object({
  reason: z.string({ error: "Please provide a reason for the rejection." }).trim().min(5, "Please provide a reason for the rejection."),
});

export function rejectGuide(guideId: string, body: unknown) {
  const { reason } = parse(rejectSchema, body);
  if (!get("SELECT 1 FROM guide_profiles WHERE user_id = ?", guideId)) throw new HttpError(404, "Guide not found.");
  run("UPDATE guide_profiles SET verification_status = 'Rejected', rejection_reason = ? WHERE user_id = ?", reason, guideId);
  notify(guideId, "VerificationRejected", `Your verification was not approved: ${reason}`, "/guide/profile");
}

// ───────── FR 14 - user management ─────────

export function listUsers() {
  return all<any>(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at, g.verification_status
     FROM users u LEFT JOIN guide_profiles g ON g.user_id = u.id ORDER BY u.created_at DESC`,
  ).map((u) => ({
    id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, role: u.role, status: u.status,
    createdAt: u.created_at, verificationStatus: u.verification_status ?? null,
  }));
}

export function setUserStatus(admin: AuthUser, userId: string, status: unknown) {
  if (status !== "Active" && status !== "Suspended") throw new HttpError(400, "Status must be Active or Suspended.");
  const u = get<any>("SELECT id, role FROM users WHERE id = ?", userId);
  if (!u) throw new HttpError(404, "User not found.");
  if (u.id === admin.id) throw new HttpError(409, "You cannot change the status of your own account.");
  if (u.role === "Admin") throw new HttpError(409, "Administrator accounts cannot be suspended.");
  run("UPDATE users SET status = ? WHERE id = ?", status, userId);
}

export function listAllBookings() {
  return all<any>(
    `SELECT b.id, b.destination, b.start_date, b.end_date, b.status, b.created_at,
            t.full_name AS tourist_name, g.full_name AS guide_name
     FROM bookings b JOIN users t ON t.id = b.tourist_id JOIN users g ON g.id = b.guide_id ORDER BY b.created_at DESC`,
  ).map((b) => ({
    id: b.id, destination: b.destination, startDate: b.start_date, endDate: b.end_date, status: b.status,
    createdAt: b.created_at, touristName: b.tourist_name, guideName: b.guide_name,
  }));
}

export function listAllReviews() {
  return all<any>(
    `SELECT r.id, r.rating, r.comment, r.is_hidden, r.created_at, a.full_name AS author_name, g.full_name AS guide_name
     FROM reviews r JOIN users a ON a.id = r.author_id JOIN users g ON g.id = r.guide_id ORDER BY r.created_at DESC`,
  ).map((r) => ({
    id: r.id, rating: r.rating, comment: r.comment, isHidden: !!r.is_hidden, createdAt: r.created_at,
    authorName: r.author_name, guideName: r.guide_name,
  }));
}

/** Moderation: hidden reviews disappear from public pages and no longer count towards the average. */
export function setReviewHidden(reviewId: string, hidden: unknown) {
  const r = get<any>("SELECT guide_id FROM reviews WHERE id = ?", reviewId);
  if (!r) throw new HttpError(404, "Review not found.");
  transaction(() => {
    run("UPDATE reviews SET is_hidden = ? WHERE id = ?", hidden ? 1 : 0, reviewId);
    recalculateGuideRating(r.guide_id);
  });
}

// ───────── FR 13 - reports ─────────

const reportSchema = z.object({
  reportedUserId: z.string({ error: "Please select the user to report." }).min(1, "Please select the user to report."),
  reason: z.string({ error: "Please describe why you are reporting this user." }).trim().min(10, "Please describe the problem in at least 10 characters.").max(2000, "The description is too long."),
});

export function createReport(reporter: AuthUser, body: unknown) {
  const d = parse(reportSchema, body);
  if (d.reportedUserId === reporter.id) throw new HttpError(400, "You cannot report yourself.");
  const target = get<any>("SELECT id, role FROM users WHERE id = ?", d.reportedUserId);
  if (!target || target.role === "Admin") throw new HttpError(404, "User not found.");
  run("INSERT INTO reports (id, reporter_id, reported_user_id, reason) VALUES (?,?,?,?)", randomUUID(), reporter.id, d.reportedUserId, d.reason);
}

export function listReports() {
  return all<any>(
    `SELECT r.id, r.reason, r.status, r.resolution_note, r.created_at, r.reported_user_id,
            rp.full_name AS reporter_name, ru.full_name AS reported_name, ru.role AS reported_role, ru.status AS reported_status
     FROM reports r JOIN users rp ON rp.id = r.reporter_id JOIN users ru ON ru.id = r.reported_user_id
     ORDER BY CASE r.status WHEN 'Open' THEN 0 ELSE 1 END, r.created_at DESC`,
  ).map((r) => ({
    id: r.id, reason: r.reason, status: r.status, resolutionNote: r.resolution_note, createdAt: r.created_at,
    reporterName: r.reporter_name, reportedUserId: r.reported_user_id, reportedName: r.reported_name,
    reportedRole: r.reported_role, reportedStatus: r.reported_status,
  }));
}

const resolveSchema = z.object({
  status: z.enum(["Resolved", "Dismissed"], { error: "Status must be Resolved or Dismissed." }),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export function resolveReport(reportId: string, body: unknown) {
  const d = parse(resolveSchema, body);
  if (!get("SELECT 1 FROM reports WHERE id = ?", reportId)) throw new HttpError(404, "Report not found.");
  run("UPDATE reports SET status = ?, resolution_note = ? WHERE id = ?", d.status, d.resolutionNote || null, reportId);
}

// ───────── Overview ─────────

export function getStats() {
  const count = (sql: string) => get<{ n: number }>(sql)?.n ?? 0;
  return {
    tourists: count("SELECT COUNT(*) AS n FROM users WHERE role = 'Tourist'"),
    guides: count("SELECT COUNT(*) AS n FROM users WHERE role = 'Guide'"),
    pendingGuides: count("SELECT COUNT(*) AS n FROM guide_profiles WHERE verification_status = 'Pending'"),
    bookings: count("SELECT COUNT(*) AS n FROM bookings"),
    pendingBookings: count("SELECT COUNT(*) AS n FROM bookings WHERE status = 'Pending'"),
    openReports: count("SELECT COUNT(*) AS n FROM reports WHERE status = 'Open'"),
  };
}
