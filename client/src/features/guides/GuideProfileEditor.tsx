import { Clock, FileText, ImagePlus, Plus, Save, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert, Avatar, Field, PageHeader, Spinner, StatusBadge, btnPrimary, btnSecondary, card, inputClass } from "../../components/ui";
import { ApiError, api, errorMessage } from "../../lib/api";
import { LANGUAGES, LOCATIONS, formatDate } from "../../lib/format";
import { useAuth } from "../auth/AuthContext";
import DatePicker from "./DatePicker";
import type { OwnProfile } from "./types";

const USD_RATE = 1450; // suggested conversion only; both prices stay editable

interface FormState {
  fullName: string; phone: string; bio: string; languages: string[]; experienceYears: string; specialization: string;
  location: string; pricePerDayRwf: string; pricePerDayUsd: string; services: string[]; availabilityDates: string[];
}

const toForm = (p: OwnProfile): FormState => ({
  fullName: p.fullName, phone: p.phone, bio: p.bio, languages: p.languages, experienceYears: String(p.experienceYears),
  specialization: p.specialization, location: p.location || LOCATIONS[0]!,
  pricePerDayRwf: p.pricePerDayRwf ? String(p.pricePerDayRwf) : "", pricePerDayUsd: p.pricePerDayUsd ? String(p.pricePerDayUsd) : "",
  services: p.services, availabilityDates: p.availabilityDates,
});

/** FR 3 - guide profile, pricing, services, availability and verification documents. */
export default function GuideProfileEditor() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<{ profile: OwnProfile }>("/api/guides/me/profile").then((r) => { setProfile(r.profile); setForm(toForm(r.profile)); }).catch((e) => setMessage({ kind: "error", text: errorMessage(e) }));
  }, []);

  if (!profile || !form) return message ? <div className="mx-auto max-w-3xl px-4 py-10"><Alert>{message.text}</Alert></div> : <Spinner />;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => f && { ...f, [k]: v });
  const toggleLanguage = (l: string) => set("languages", form.languages.includes(l) ? form.languages.filter((x) => x !== l) : [...form.languages, l]);
  const addService = () => {
    const s = serviceInput.trim();
    if (s && !form.services.includes(s)) set("services", [...form.services, s]);
    setServiceInput("");
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErrors({});
    const f = form!;
    setBusy("save");
    try {
      const res = await api.put<{ profile: OwnProfile }>("/api/guides/me/profile", {
        ...f,
        experienceYears: Number(f.experienceYears),
        pricePerDayRwf: Number(f.pricePerDayRwf),
        pricePerDayUsd: Number(f.pricePerDayUsd),
      });
      setProfile(res.profile);
      setForm(toForm(res.profile));
      await refresh();
      setMessage({ kind: "success", text: "Your profile has been saved." });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) { setErrors(err.fields); setMessage({ kind: "error", text: "Please correct the highlighted fields." }); }
      else setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy("");
    }
  }

  async function upload(kind: "photo" | "documents", files: FileList | null) {
    if (!files?.length) return;
    const data = new FormData();
    if (kind === "photo") data.append("photo", files[0]!);
    else Array.from(files).forEach((file) => data.append("documents", file));
    setBusy(kind);
    setMessage(null);
    try {
      const res = await api.upload<{ profile: OwnProfile }>(`/api/guides/me/${kind}`, data);
      setProfile(res.profile);
      await refresh();
      setMessage({ kind: "success", text: kind === "photo" ? "Photo updated." : "Documents uploaded. Your profile is now pending administrator review." });
    } catch (err) {
      setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy("");
      if (photoRef.current) photoRef.current.value = "";
      if (docRef.current) docRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="My guide profile" subtitle="Tourists see this information on your public page. Keep it accurate and up to date." action={profile.verificationStatus === "Verified" ? <Link to={`/guides/${profile.id}`} className={btnSecondary}>View public page</Link> : undefined} />

      {message && <div className="mb-5"><Alert kind={message.kind}>{message.text}</Alert></div>}

      <section className={`${card} mb-6 p-5`}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={profile.fullName} url={profile.photoUrl} size={72} />
          <div>
            <p className="font-semibold">Profile photo</p>
            <p className="mb-2 text-xs text-stone-500">JPG, PNG or WebP, up to 3 MB.</p>
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload("photo", e.target.files)} />
            <button type="button" className={btnSecondary} onClick={() => photoRef.current?.click()} disabled={busy === "photo"}><ImagePlus className="size-4" /> {busy === "photo" ? "Uploading..." : profile.photoUrl ? "Change photo" : "Upload photo"}</button>
          </div>
        </div>
      </section>

      <form onSubmit={save} className="space-y-6" noValidate>
        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-xl font-bold">About you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.fullName}><input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
            <Field label="Phone number" error={errors.phone}><input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Specialization" error={errors.specialization}><input className={inputClass} placeholder="e.g. Gorilla trekking & volcano hikes" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} /></Field>
            <Field label="Years of experience" error={errors.experienceYears}><input type="number" min={0} max={60} className={inputClass} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} /></Field>
            <Field label="Base location" error={errors.location}><select className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</select></Field>
          </div>
          <Field label="Biography" error={errors.bio} hint="Describe your experience, the tours you lead and what visitors can expect (at least 20 characters)."><textarea rows={6} className={inputClass} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
        </section>

        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-xl font-bold">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <label key={l} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${form.languages.includes(l) ? "border-forest-600 bg-forest-600 text-white" : "border-stone-300 bg-white hover:bg-forest-50"}`}>
                <input type="checkbox" className="sr-only" checked={form.languages.includes(l)} onChange={() => toggleLanguage(l)} />{l}
              </label>
            ))}
          </div>
          {errors.languages && <p className="text-xs font-medium text-red-600">{errors.languages}</p>}
        </section>

        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-xl font-bold">Pricing per day</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price in RWF" error={errors.pricePerDayRwf}>
              <input type="number" min={0} step={1000} className={inputClass} value={form.pricePerDayRwf}
                onChange={(e) => { const v = e.target.value; set("pricePerDayRwf", v); if (v) set("pricePerDayUsd", String(Math.round(Number(v) / USD_RATE))); }} />
            </Field>
            <Field label="Price in USD" error={errors.pricePerDayUsd} hint={`Filled automatically at about ${USD_RATE.toLocaleString()} RWF per USD. You can edit it.`}>
              <input type="number" min={0} className={inputClass} value={form.pricePerDayUsd} onChange={(e) => set("pricePerDayUsd", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className={`${card} space-y-3 p-5`}>
          <h2 className="text-xl font-bold">Services</h2>
          <div className="flex gap-2">
            <input className={inputClass} placeholder="e.g. Gorilla trekking assistance" value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }} aria-label="New service" />
            <button type="button" className={btnSecondary} onClick={addService}><Plus className="size-4" /> Add</button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {form.services.map((s) => (
              <li key={s} className="inline-flex items-center gap-1 rounded-full bg-forest-100 py-1 pl-3 pr-1 text-sm font-medium text-forest-900">
                {s}<button type="button" className="rounded-full p-1 hover:bg-forest-200" aria-label={`Remove ${s}`} onClick={() => set("services", form.services.filter((x) => x !== s))}><X className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} space-y-3 p-5`}>
          <h2 className="text-xl font-bold">Availability</h2>
          <p className="text-sm text-stone-600">Select the days you are open for tours. Tourists can only book days you mark here.</p>
          <DatePicker selected={form.availabilityDates} onChange={(d) => set("availabilityDates", d)} />
        </section>

        <button className={btnPrimary} disabled={busy === "save"}><Save className="size-4" /> {busy === "save" ? "Saving..." : "Save profile"}</button>
      </form>

      <section className={`${card} mt-8 space-y-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Verification</h2>
          <StatusBadge status={profile.verificationStatus} />
        </div>
        {profile.verificationStatus === "Pending" && <Alert kind="warning"><span className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" /> Awaiting review. Upload your RDB guide certificate or national ID so an administrator can verify you.</span></Alert>}
        {profile.verificationStatus === "Rejected" && <Alert>Not approved: {profile.rejectionReason ?? "no reason given"}. Upload corrected documents to submit again.</Alert>}
        {profile.verificationStatus === "Verified" && <Alert kind="success">You are verified. The Verified badge shows on your public profile.</Alert>}
        <ul className="divide-y divide-stone-200">
          {profile.documents.length === 0 && <li className="py-3 text-sm text-stone-600">No documents uploaded yet.</li>}
          {profile.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <button type="button" className="flex items-center gap-2 font-medium text-forest-800 hover:underline" onClick={() => api.openFile(`/api/documents/${d.id}`).catch((e) => setMessage({ kind: "error", text: errorMessage(e) }))}><FileText className="size-4" /> {d.fileName}</button>
              <span className="text-stone-500">{formatDate(d.uploadedAt)}</span>
            </li>
          ))}
        </ul>
        <input ref={docRef} type="file" multiple accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => upload("documents", e.target.files)} />
        <button type="button" className={btnSecondary} onClick={() => docRef.current?.click()} disabled={busy === "documents"}><Upload className="size-4" /> {busy === "documents" ? "Uploading..." : "Upload documents"}</button>
        <p className="text-xs text-stone-500">PDF, JPG or PNG, up to 5 files of 5 MB each. Only you and administrators can open them.</p>
      </section>
    </div>
  );
}
