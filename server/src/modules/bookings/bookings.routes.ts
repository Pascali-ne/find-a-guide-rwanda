import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { changeBookingStatus, createBooking, listMyBookings } from "./bookings.service";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

bookingsRouter.post("/", requireRole("Tourist"), (req, res) => {
  res.status(201).json({ booking: createBooking(req.user!, req.body) });
});

bookingsRouter.get("/mine", requireRole("Tourist", "Guide"), (req, res) => {
  res.json({ bookings: listMyBookings(req.user!) });
});

bookingsRouter.patch("/:id/status", requireRole("Tourist", "Guide"), (req, res) => {
  res.json({ booking: changeBookingStatus(req.user!, String(req.params.id), req.body?.action) });
});
