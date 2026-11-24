import { BadgeCheck, Loader2, Star, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { assetUrl } from "../lib/api";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} bg-forest-600 text-white hover:bg-forest-700`;
export const btnSecondary = `${btn} border border-stone-300 bg-white text-forest-800 hover:bg-forest-50`;
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;
export const btnGhost = `${btn} text-forest-800 hover:bg-forest-100`;
export const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200";
export const card = "rounded-lg border border-stone-200 bg-white";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-stone-500" role="status">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

const alertStyles = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-forest-200 bg-forest-50 text-forest-800",
  info: "border-lake-100 bg-lake-100/60 text-sky-900",
  warning: "border-sun-300 bg-yellow-50 text-yellow-900",
};
export function Alert({ kind = "error", children }: { kind?: keyof typeof alertStyles; children: ReactNode }) {
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${alertStyles[kind]}`}>
      {children}
    </div>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

const statusStyles: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-900",
  Confirmed: "bg-forest-100 text-forest-800",
  Completed: "bg-lake-100 text-sky-900",
  Declined: "bg-red-100 text-red-800",
  Cancelled: "bg-stone-200 text-stone-700",
  Verified: "bg-forest-100 text-forest-800",
  Rejected: "bg-red-100 text-red-800",
  Active: "bg-forest-100 text-forest-800",
  Suspended: "bg-red-100 text-red-800",
  Open: "bg-yellow-100 text-yellow-900",
  Resolved: "bg-forest-100 text-forest-800",
  Dismissed: "bg-stone-200 text-stone-700",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] ?? "bg-stone-100 text-stone-700"}`}>{status}</span>;
}

/** NFR 5 - shown only for guides whose verification status is Verified. */
export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-forest-600 px-2 py-0.5 text-xs font-semibold text-white" title="Identity and credentials verified by the platform">
      <BadgeCheck className="size-3.5" /> Verified
    </span>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "fill-sun-400 text-sun-500" : "text-stone-300"} />
      ))}
    </span>
  );
}

export function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const src = assetUrl(url);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size, fontSize: size * 0.38 }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-forest-100 font-display font-bold text-forest-700" aria-hidden>
      {initials}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold text-stone-800">{title}</p>
      {children && <div className="mt-2 text-sm text-stone-600">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-stone-500 hover:bg-stone-100" aria-label="Close"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold text-forest-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-stone-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
