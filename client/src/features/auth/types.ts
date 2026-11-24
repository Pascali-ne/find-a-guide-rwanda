export type Role = "Tourist" | "Guide" | "Admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: "Active" | "Suspended";
  nationality?: string;
  preferredLanguage?: string;
  verificationStatus?: "Pending" | "Verified" | "Rejected";
  rejectionReason?: string | null;
}

export interface RegisterInput {
  role: "Tourist" | "Guide";
  fullName: string;
  email: string;
  phone: string;
  password: string;
  nationality?: string;
  preferredLanguage?: string;
}
