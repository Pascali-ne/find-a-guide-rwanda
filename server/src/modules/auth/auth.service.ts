import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { get, run, transaction } from "../../lib/db";
import { HttpError } from "../../lib/errors";
import { signToken } from "../../lib/jwt";
import { parse } from "../../lib/validate";

const EMAIL_REQUIRED = "Please insert your email.";
const PASSWORD_REQUIRED = "Please insert your password.";

const emailField = z
  .string({ error: EMAIL_REQUIRED })
  .trim()
  .min(1, EMAIL_REQUIRED)
  .email("Please enter a valid email address.");

const registerSchema = z
  .object({
    role: z.enum(["Tourist", "Guide"], { error: "Please select Tourist or Tour Guide." }),
    fullName: z.string({ error: "Please insert your full name." }).trim().min(2, "Please insert your full name."),
    email: emailField,
    phone: z.string({ error: "Please insert your phone number." }).trim().min(7, "Please insert a valid phone number."),
    password: z
      .string({ error: PASSWORD_REQUIRED })
      .min(1, PASSWORD_REQUIRED)
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Za-z]/, "Password must contain at least one letter.")
      .regex(/\d/, "Password must contain at least one number."),
    nationality: z.string().trim().optional(),
    preferredLanguage: z.string().trim().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.role === "Tourist") {
      if (!d.nationality) ctx.addIssue({ code: "custom", path: ["nationality"], message: "Please insert your nationality." });
      if (!d.preferredLanguage)
        ctx.addIssue({ code: "custom", path: ["preferredLanguage"], message: "Please select your preferred language." });
    }
  });

const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: PASSWORD_REQUIRED }).min(1, PASSWORD_REQUIRED),
});

/** The user object returned to the client (never includes the password hash). */
export function getUserPayload(userId: string) {
  const u = get<any>("SELECT * FROM users WHERE id = ?", userId);
  if (!u) throw new HttpError(404, "User not found.");
  const payload: Record<string, unknown> = {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
  };
  if (u.role === "Tourist") {
    const t = get<any>("SELECT * FROM tourist_profiles WHERE user_id = ?", u.id);
    payload.nationality = t?.nationality;
    payload.preferredLanguage = t?.preferred_language;
  } else if (u.role === "Guide") {
    const g = get<any>("SELECT verification_status, rejection_reason FROM guide_profiles WHERE user_id = ?", u.id);
    payload.verificationStatus = g?.verification_status;
    payload.rejectionReason = g?.rejection_reason ?? null;
  } else {
    payload.adminLevel = get<any>("SELECT admin_level FROM admin_profiles WHERE user_id = ?", u.id)?.admin_level;
  }
  return payload;
}

export function register(body: unknown) {
  const d = parse(registerSchema, body);
  const email = d.email.toLowerCase();
  if (get("SELECT 1 FROM users WHERE email = ?", email)) {
    throw new HttpError(409, "An account with this email already exists.", { email: "An account with this email already exists." });
  }
  const id = randomUUID();
  const hash = bcrypt.hashSync(d.password, 10);
  transaction(() => {
    run("INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?,?,?,?,?,?)", id, d.fullName, email, d.phone, hash, d.role);
    if (d.role === "Tourist") {
      run("INSERT INTO tourist_profiles (user_id, nationality, preferred_language) VALUES (?,?,?)", id, d.nationality, d.preferredLanguage);
    } else {
      // Guides start as Pending and stay hidden from public search until an admin verifies them.
      run("INSERT INTO guide_profiles (user_id) VALUES (?)", id);
    }
  });
  return { token: signToken(id), user: getUserPayload(id) };
}

export function login(body: unknown) {
  const d = parse(loginSchema, body);
  const u = get<any>("SELECT id, password_hash, status FROM users WHERE email = ?", d.email.toLowerCase());
  if (!u || !bcrypt.compareSync(d.password, u.password_hash)) throw new HttpError(401, "Incorrect email or password.");
  if (u.status === "Suspended") throw new HttpError(403, "Your account has been suspended. Please contact support.");
  return { token: signToken(u.id), user: getUserPayload(u.id) };
}
