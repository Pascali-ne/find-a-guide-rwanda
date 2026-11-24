import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Field, btnPrimary, card, inputClass } from "../../components/ui";
import { ApiError } from "../../lib/api";
import { useAuth } from "./AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Tourist", email: "emma@example.com", password: "Tourist@123" },
  { label: "Tour Guide", email: "jeanclaude@findaguide.rw", password: "Guide@123" },
  { label: "Administrator", email: "admin@findaguide.rw", password: "Admin@123" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from ?? "/dashboard"} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    // Client-side validation mirrors the server messages (FR 2).
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Please insert your email.";
    if (!password) next.password = "Please insert your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setFormError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 md:grid-cols-[1fr_20rem]">
      <div className={`${card} p-6 sm:p-8`}>
        <h1 className="text-3xl font-bold text-forest-900">Log in</h1>
        <p className="mt-1 text-stone-600">Welcome back. Log in to manage your bookings and messages.</p>
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Email" error={errors.email}>
            <input type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button className={`${btnPrimary} w-full`} disabled={busy}>
            <LogIn className="size-4" /> {busy ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="mt-5 text-sm text-stone-600">
          New here? <Link to="/register" className="font-semibold text-forest-700 underline">Create an account</Link>
        </p>
      </div>

      <aside className="rounded-lg border border-sun-300 bg-yellow-50 p-5 text-sm">
        <h2 className="text-lg font-bold text-yellow-950">Demo accounts</h2>
        <p className="mt-1 text-yellow-900">Select an account to fill in the form, then press Log in.</p>
        <ul className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button type="button" onClick={() => { setEmail(a.email); setPassword(a.password); setErrors({}); }}
                className="w-full rounded-md border border-yellow-300 bg-white px-3 py-2 text-left hover:bg-yellow-100">
                <span className="block font-semibold text-stone-900">{a.label}</span>
                <span className="block text-xs text-stone-600">{a.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
