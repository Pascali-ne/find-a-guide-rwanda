import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createReview } from "./reviews.service";

export const reviewsRouter = Router();

reviewsRouter.post("/", requireAuth, requireRole("Tourist"), (req, res) => {
  res.status(201).json(createReview(req.user!, req.body));
});
