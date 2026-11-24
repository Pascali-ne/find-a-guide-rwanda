import { BadgeCheck, CalendarCheck, MessageSquare, Search, Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { btnPrimary, btnSecondary } from "../components/ui";

const DESTINATIONS = [
  { name: "Volcanoes National Park", note: "Mountain gorillas and golden monkeys in the Virunga range", tone: "from-forest-900 to-forest-600" },
  { name: "Nyungwe National Park", note: "Chimpanzees, canopy walk and 300+ bird species", tone: "from-forest-800 to-forest-400" },
  { name: "Akagera National Park", note: "Lions, rhinos, elephants and boat safaris", tone: "from-yellow-900 to-sun-500" },
  { name: "Lake Kivu", note: "Kayaking, beaches and the Congo Nile Trail", tone: "from-sky-900 to-lake-600" },
  { name: "Kigali", note: "Memorials, markets, food and contemporary art", tone: "from-stone-800 to-forest-600" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const go = (e: FormEvent) => { e.preventDefault(); navigate(`/guides${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); };

  return (
    <>
      <section className="bg-forest-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">Walk Rwanda with someone who knows every trail.</h1>
            <p className="mt-5 max-w-xl text-lg text-forest-100">Book verified local guides for gorilla treks, Kigali city history, Nyungwe rainforest, Lake Kivu and Akagera safaris. Compare languages, prices and reviews, then message your guide directly.</p>
            <form onSubmit={go} className="mt-8 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “gorilla”, “birding” or “Kigali”" aria-label="Search guides" className="w-full rounded-md border-0 bg-white py-3 pl-9 pr-3 text-stone-900 placeholder:text-stone-400" />
              </div>
              <button className="rounded-md bg-sun-400 px-5 font-semibold text-forest-900 hover:bg-sun-300">Search</button>
            </form>
            <p className="mt-4 text-sm text-forest-200">Are you a guide? <Link to="/register?role=guide" className="font-semibold text-sun-300 underline">Create your profile</Link></p>
          </div>
          <ul className="grid content-center gap-3 text-sm">
            {[
              [BadgeCheck, "Verified guides only", "Administrators check every guide's credentials before the Verified badge appears."],
              [Star, "Honest reviews", "Only tourists who finished a tour can leave a rating."],
              [MessageSquare, "Talk before you book", "Ask questions in built-in messaging."],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof BadgeCheck;
              return (
                <li key={title as string} className="flex gap-3 rounded-lg bg-white/10 p-4">
                  <I className="mt-0.5 size-5 shrink-0 text-sun-400" />
                  <span><span className="block font-display text-base font-bold">{title as string}</span><span className="text-forest-100">{text as string}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="imigongo" aria-hidden />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold text-forest-900">Choose your destination</h2>
        <p className="mt-1 text-stone-600">Guides are based in the places they know best.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((d, i) => (
            <Link key={d.name} to={`/guides?location=${encodeURIComponent(d.name)}`} className={`group flex min-h-40 flex-col justify-end rounded-lg bg-gradient-to-br ${d.tone} p-5 text-white ${i === 0 ? "lg:col-span-2" : ""}`}>
              <h3 className="text-xl font-bold group-hover:underline">{d.name}</h3>
              <p className="mt-1 text-sm text-white/85">{d.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl font-bold text-forest-900">How it works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              [Search, "Search and compare", "Filter by language, location, price, availability and rating."],
              [CalendarCheck, "Send a booking request", "Pick your dates. The guide accepts or declines, and you are notified."],
              [Star, "Travel, then review", "After the tour is marked complete, share your rating to help others."],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Search;
              return (
                <li key={i} className="flex gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700"><I className="size-5" /></span>
                  <span><span className="block font-display text-lg font-bold">{title as string}</span><span className="text-stone-600">{text as string}</span></span>
                </li>
              );
            })}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/guides" className={btnPrimary}>Browse guides</Link><Link to="/faq" className={btnSecondary}>Read the FAQ</Link></div>
        </div>
      </section>
    </>
  );
}
