import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import { uploadDocuments, uploadPhoto } from "../../middleware/upload";
import { addDocuments, getGuideProfile, getOwnProfile, searchGuides, setPhoto, updateOwnProfile } from "./guides.service";

export const guidesRouter = Router();

guidesRouter.get("/", (req, res) => {
  res.json({ guides: searchGuides(req.query) });
});

// The guide's own profile routes must be declared before "/:id".
guidesRouter.get("/me/profile", requireAuth, requireRole("Guide"), (req, res) => {
  res.json({ profile: getOwnProfile(req.user!.id) });
});
guidesRouter.put("/me/profile", requireAuth, requireRole("Guide"), (req, res) => {
  res.json({ profile: updateOwnProfile(req.user!.id, req.body) });
});
guidesRouter.post("/me/photo", requireAuth, requireRole("Guide"), uploadPhoto, (req, res) => {
  res.json({ profile: setPhoto(req.user!.id, req.file) });
});
guidesRouter.post("/me/documents", requireAuth, requireRole("Guide"), uploadDocuments, (req, res) => {
  res.json({ profile: addDocuments(req.user!.id, req.files as Express.Multer.File[] | undefined) });
});

guidesRouter.get("/:id", optionalAuth, (req, res) => {
  res.json({ guide: getGuideProfile(String(req.params.id), req.user) });
});
