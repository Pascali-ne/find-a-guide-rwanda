import { RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, EmptyState, Field, PageHeader, Spinner, btnSecondary, card, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { LANGUAGES, LOCATIONS, todayStr } from "../../lib/format";
import GuideCard from "./GuideCard";
import type { GuideSummary } from "./types";

const KEYS = ["q", "language", "location", "minPrice", "maxPrice", "date", "minRating"] as const;

/** FR 4 & FR 5 - keyword search with language, location, price, availability and rating filters. */
export default function GuideSearchPage() {
  const [params, setParams] = useSearchParams();
  const [guides, setGuides] = useState<GuideSummary[] | null>(null);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState(params.get("q") ?? "");

  const queryString = KEYS.filter((k) => params.get(k)).map((k) => `${k}=${encodeURIComponent(params.get(k)!)}`).join("&");

  useEffect(() => {
    let cancelled = false;
    setError("");
    const t = setTimeout(() => {
      api.get<{ guides: GuideSummary[] }>(`/api/guides?${queryString}`)
        .then((r) => !cancelled && setGuides(r.guides))
        .catch((e) => !cancelled && setError(errorMessage(e)));
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [queryString]);

  function update(key: (typeof KEYS)[number], value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  const hasFilters = KEYS.some((k) => params.get(k));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Find a guide" subtitle="Every guide listed here has been verified by our team. Combine filters to narrow your search." />

      <form className={`${card} mb-6 p-4`} onSubmit={(e) => { e.preventDefault(); update("q", keyword.trim()); }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search by name, place or activity, e.g. gorilla, birding, Kigali" value={keyword} onChange={(e) => setKeyword(e.target.value)} aria-label="Search guides" />
          </div>
          <button className="rounded-md bg-forest-600 px-5 text-sm font-semibold text-white hover:bg-forest-700">Search</button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Language">
            <select className={inputClass} value={params.get("language") ?? ""} onChange={(e) => update("language", e.target.value)}>
              <option value="">Any</option>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <select className={inputClass} value={params.get("location") ?? ""} onChange={(e) => update("location", e.target.value)}>
              <option value="">Anywhere</option>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Min price (RWF/day)"><input type="number" min={0} step={5000} className={inputClass} value={params.get("minPrice") ?? ""} onChange={(e) => update("minPrice", e.target.value)} /></Field>
          <Field label="Max price (RWF/day)"><input type="number" min={0} step={5000} className={inputClass} value={params.get("maxPrice") ?? ""} onChange={(e) => update("maxPrice", e.target.value)} /></Field>
          <Field label="Available on"><input type="date" min={todayStr()} className={inputClass} value={params.get("date") ?? ""} onChange={(e) => update("date", e.target.value)} /></Field>
          <Field label="Minimum rating">
            <select className={inputClass} value={params.get("minRating") ?? ""} onChange={(e) => update("minRating", e.target.value)}>
              <option value="">Any</option><option value="3">3 stars and up</option><option value="4">4 stars and up</option><option value="4.5">4.5 stars and up</option>
            </select>
          </Field>
        </div>
        {hasFilters && (
          <button type="button" className={`${btnSecondary} mt-3`} onClick={() => { setKeyword(""); setParams({}, { replace: true }); }}><RotateCcw className="size-4" /> Clear all filters</button>
        )}
      </form>

      {error && <Alert>{error}</Alert>}
      {!guides && !error && <Spinner label="Searching guides..." />}
      {guides && (
        <>
          <p className="mb-3 text-sm text-stone-600" aria-live="polite">{guides.length} {guides.length === 1 ? "guide" : "guides"} found</p>
          {guides.length === 0 ? (
            <EmptyState title="No guides match these filters">Try a different date, widen the price range or clear the filters.</EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{guides.map((g) => <GuideCard key={g.id} guide={g} />)}</div>
          )}
        </>
      )}
    </div>
  );
}
