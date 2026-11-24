import type { NextFunction, Request, RequestHandler, Response } from "express";
import { get } from "../lib/db";
import { HttpError } from "../lib/errors";
import { verifyToken } from "../lib/jwt";

export type Role = "Tourist" | "Guide" | "Admin";
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: "Active" | "Suspended";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function loadUser(req: Request): AuthUser | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const id = verifyToken(header.slice(7));
  if (!id) return null;
  const row = get<any>("SELECT id, full_name, email, role, status FROM users WHERE id = ?", id);
  if (!row) return null;
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role, status: row.status };
}

/** Requires a valid JWT for an Active account. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const user = loadUser(req);
  if (!user) throw new HttpError(401, "Please log in to continue.");
  if (user.status === "Suspended") throw new HttpError(403, "Your account has been suspended. Please contact support.");
  req.user = user;
  next();
};

/** Attaches the user when a valid token is present, but never rejects. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const user = loadUser(req);
  if (user && user.status === "Active") req.user = user;
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, "You do not have permission to perform this action.");
    }
    next();
  };
