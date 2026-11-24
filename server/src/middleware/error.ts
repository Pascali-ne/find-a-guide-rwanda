import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { HttpError } from "../lib/errors";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Resource not found." });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, fields: err.fields });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "The file is too large." : "The file could not be uploaded.";
    res.status(400).json({ message });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Malformed request body." });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
};
