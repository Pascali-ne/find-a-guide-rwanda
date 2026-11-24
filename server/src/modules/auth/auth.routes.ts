import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getUserPayload, login, register } from "./auth.service";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  res.status(201).json(register(req.body));
});

authRouter.post("/login", (req, res) => {
  res.json(login(req.body));
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: getUserPayload(req.user!.id) });
});
