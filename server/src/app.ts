import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import { photosDir } from "./middleware/upload";
import { adminRouter, documentsRouter, reportsRouter } from "./modules/admin/admin.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { bookingsRouter } from "./modules/bookings/bookings.routes";
import { guidesRouter } from "./modules/guides/guides.routes";
import { messagingRouter } from "./modules/messaging/messaging.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { reviewsRouter } from "./modules/reviews/reviews.routes";

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.clientOrigins, credentials: false }));
  app.use(express.json({ limit: "1mb" }));

  // Guide photos are public; verification documents are served only through /api/documents.
  app.use("/uploads/photos", express.static(photosDir, { maxAge: "1d" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/guides", guidesRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/messages", messagingRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/admin", adminRouter);

  // Production: serve the built React client from the same server, so one public URL runs the whole app.
  const clientDist = path.resolve(env.serverRoot, "../client/dist");
  if (fs.existsSync(path.join(clientDist, "index.html"))) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
        res.sendFile(path.join(clientDist, "index.html"));
      } else next();
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
