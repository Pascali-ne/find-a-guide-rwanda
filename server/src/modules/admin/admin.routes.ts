import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { get } from "../../lib/db";
import { HttpError } from "../../lib/errors";
import { requireAuth, requireRole } from "../../middleware/auth";
import { docsDir } from "../../middleware/upload";
import {
  approveGuide, createReport, getStats, listAllBookings, listAllReviews, listGuidesForVerification,
  listReports, listUsers, rejectGuide, resolveReport, setReviewHidden, setUserStatus,
} from "./admin.service";

/** Mounted at /api/admin - administrator only. */
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("Admin"));

adminRouter.get("/stats", (_req, res) => res.json({ stats: getStats() }));
adminRouter.get("/guides", (req, res) => res.json({ guides: listGuidesForVerification(String(req.query.status ?? "Pending")) }));
adminRouter.post("/guides/:id/approve", (req, res) => { approveGuide(String(req.params.id)); res.json({ ok: true }); });
adminRouter.post("/guides/:id/reject", (req, res) => { rejectGuide(String(req.params.id), req.body); res.json({ ok: true }); });
adminRouter.get("/users", (_req, res) => res.json({ users: listUsers() }));
adminRouter.patch("/users/:id/status", (req, res) => { setUserStatus(req.user!, String(req.params.id), req.body?.status); res.json({ ok: true }); });
adminRouter.get("/bookings", (_req, res) => res.json({ bookings: listAllBookings() }));
adminRouter.get("/reviews", (_req, res) => res.json({ reviews: listAllReviews() }));
adminRouter.patch("/reviews/:id/hidden", (req, res) => { setReviewHidden(String(req.params.id), req.body?.hidden); res.json({ ok: true }); });
adminRouter.get("/reports", (_req, res) => res.json({ reports: listReports() }));
adminRouter.patch("/reports/:id", (req, res) => { resolveReport(String(req.params.id), req.body); res.json({ ok: true }); });

/** Mounted at /api/reports - any Tourist or Guide can report another user (FR 13). */
export const reportsRouter = Router();
reportsRouter.post("/", requireAuth, requireRole("Tourist", "Guide"), (req, res) => {
  createReport(req.user!, req.body);
  res.status(201).json({ ok: true });
});

/** Mounted at /api/documents - verification files are private to the owning guide and admins. */
export const documentsRouter = Router();
documentsRouter.get("/:id", requireAuth, (req, res) => {
  const doc = get<any>("SELECT * FROM verification_documents WHERE id = ?", String(req.params.id));
  if (!doc || (req.user!.role !== "Admin" && doc.guide_id !== req.user!.id)) throw new HttpError(404, "Document not found.");
  const file = path.join(docsDir, doc.stored_name);
  if (!fs.existsSync(file)) throw new HttpError(404, "The document file is missing from storage.");
  res.download(file, doc.file_name);
});
