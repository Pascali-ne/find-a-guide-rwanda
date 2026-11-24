import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { todayStr } from "../../lib/format";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Month grid for selecting many availability dates at once (FR 3). */
export default function DatePicker({ selected, onChange }: { selected: string[]; onChange: (dates: string[]) => void }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const set = new Set(selected);
  const today = todayStr();

  const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const label = new Date(Date.UTC(view.y, view.m, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  const toggle = (d: string) => onChange(set.has(d) ? selected.filter((x) => x !== d) : [...selected, d].sort());
  const shift = (delta: number) => setView(({ y, m }) => { const d = new Date(Date.UTC(y, m + delta, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => iso(view.y, view.m, i + 1)).filter((d) => d >= today);

  return (
    <div className="max-w-sm rounded-lg border border-stone-300 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="rounded p-1 hover:bg-stone-100" aria-label="Previous month"><ChevronLeft className="size-5" /></button>
        <span className="font-display font-bold">{label}</span>
        <button type="button" onClick={() => shift(1)} className="rounded p-1 hover:bg-stone-100" aria-label="Next month"><ChevronRight className="size-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-500">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const d = iso(view.y, view.m, day);
          const past = d < today;
          const on = set.has(d);
          return (
            <button type="button" key={d} disabled={past} onClick={() => toggle(d)} aria-pressed={on}
              className={`aspect-square rounded text-sm ${past ? "text-stone-300" : on ? "bg-forest-600 font-bold text-white" : "hover:bg-forest-100"}`}>{day}</button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button type="button" className="rounded border border-stone-300 px-2 py-1 font-semibold hover:bg-forest-50" onClick={() => onChange([...new Set([...selected, ...monthDates])].sort())}>Select whole month</button>
        <button type="button" className="rounded border border-stone-300 px-2 py-1 font-semibold hover:bg-forest-50" onClick={() => onChange(selected.filter((d) => !monthDates.includes(d)))}>Clear month</button>
      </div>
      <p className="mt-2 text-xs text-stone-500">{selected.length} {selected.length === 1 ? "date" : "dates"} selected</p>
    </div>
  );
}
