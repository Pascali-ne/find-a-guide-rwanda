import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env";
import { HttpError } from "../lib/errors";

export const photosDir = path.join(env.uploadDir, "photos");
export const docsDir = path.join(env.uploadDir, "documents");
fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const storage = (dir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  });

export const uploadPhoto = multer({
  storage: storage(photosDir),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, "Photos must be JPG, PNG or WebP images.")),
}).single("photo");

export const uploadDocuments = multer({
  storage: storage(docsDir),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) =>
    /^(application\/pdf|image\/(jpeg|png))$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, "Documents must be PDF, JPG or PNG files.")),
}).array("documents", 5);
