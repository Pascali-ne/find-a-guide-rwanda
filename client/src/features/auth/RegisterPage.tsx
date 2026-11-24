import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Field, btnPrimary, card, inputClass } from "../../components/ui";
import { ApiError } from "../../lib/api";
import { LANGUAGES } from "../../lib/format";
import { useAuth } from "./AuthContext";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<"Tourist" | "Guide">(params.get("role") === "guide" ? "Guide" : "Tourist");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", nationality: "", preferredLanguage: "English" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Please insert your full name.";
    if (!form.email.trim()) e.email = "Please insert your email.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Please insert your phone number.";
    if (!form.password) e.password = "Please insert your password.";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters long.";
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = "Password must contain letters and numbers.";
    if (role === "Tourist" && !form.nationality.trim()) e.nationality = "Please insert your nationality.";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const u = await register({
        role, fullName: form.fullName, email: form.email, phone: form.phone, password: form.password,
        ...(role === "Tourist" ? { nationality: form.nationality, preferredLanguage: form.preferredLanguage } : {}),
      });
      navigate(u.role === "Guide" ? "/guide/profile" : "/guides", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setFormError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className={`${card} p-6 sm:p-8`}>
        <h1 className="text-3xl font-bold text-forest-900">Create your account</h1>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-stone-700">I am registering as a</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["Tourist", "Guide"] as const).map((r) => (
              <label key={r} className={`cursor-pointer rounded-md border p-3 text-center text-sm font-semibold ${role === r ? "border-forest-600 bg-forest-50 text-forest-800 ring-2 ring-forest-200" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}>
                <input type="radio" name="role" className="sr-only" checked={role === r} onChange={() => setRole(r)} />
                {r === "Tourist" ? "Tourist" : "Tour Guide"}
              </label>
            ))}
          </div>
        </fieldset>

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Full name" error={errors.fullName}><input className={inputClass} autoComplete="name" value={form.fullName} onChange={set("fullName")} /></Field>
          <Field label="Email" error={errors.email}><input type="email" className={inputClass} autoComplete="email" value={form.email} onChange={set("email")} /></Field>
          <Field label="Phone number" error={errors.phone}><input type="tel" className={inputClass} autoComplete="tel" placeholder="+250 7XX XXX XXX" value={form.phone} onChange={set("phone")} /></Field>
          <Field label="Password" error={errors.password} hint="At least 8 characters, with letters and numbers.">
            <input type="password" className={inputClass} autoComplete="new-password" value={form.password} onChange={set("password")} />
          </Field>
          {role === "Tourist" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nationality" error={errors.nationality}><input className={inputClass} value={form.nationality} onChange={set("nationality")} /></Field>
              <Field label="Preferred language" error={errors.preferredLanguage}>
                <select className={inputClass} value={form.preferredLanguage} onChange={set("preferredLanguage")}>
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
            </div>
          )}
          {role === "Guide" && <Alert kind="info">After registering you will complete your profile and upload your credentials. An administrator reviews them before your profile becomes visible to tourists.</Alert>}
          <button className={`${btnPrimary} w-full`} disabled={busy}><UserPlus className="size-4" /> {busy ? "Creating account..." : "Create account"}</button>
        </form>
        <p className="mt-5 text-sm text-stone-600">Already registered? <Link to="/login" className="font-semibold text-forest-700 underline">Log in</Link></p>
      </div>
    </div>
  );
}
