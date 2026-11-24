import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getThread, listConversations, sendMessage } from "./messaging.service";

export const messagingRouter = Router();
messagingRouter.use(requireAuth, requireRole("Tourist", "Guide"));

messagingRouter.get("/conversations", (req, res) => {
  res.json({ conversations: listConversations(req.user!) });
});
messagingRouter.get("/with/:userId", (req, res) => {
  res.json(getThread(req.user!, String(req.params.userId)));
});
messagingRouter.post("/", (req, res) => {
  res.status(201).json(sendMessage(req.user!, req.body));
});
