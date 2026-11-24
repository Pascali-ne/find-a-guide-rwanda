import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const signToken = (userId: string): string => jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "7d" });

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return typeof payload === "object" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
