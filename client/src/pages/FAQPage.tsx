import { ChevronDown, Phone } from "lucide-react";
import { useState } from "react";
import { PageHeader, card } from "../components/ui";
import { EMERGENCY_CONTACTS } from "../lib/format";

const FAQS: { q: string; a: string }[] = [
  { q: "How do I book a guide?", a: "Create a tourist account, open a verified guide's profile, choose your destination and dates, and press Book guide. The guide receives your request and accepts or declines it. You will see the result in your dashboard and in the notification bell." },
  { q: "What does the Verified badge mean?", a: "An administrator has reviewed the guide's uploaded credentials, such as a guide certificate or identification, and approved them. Only verified guides appear in search results." },
  { q: "Can I cancel a booking?", a: "Yes, while the request is still Pending you can cancel it from your dashboard. After a guide has confirmed, please contact them through Messages to agree on changes." },
  { q: "When can I leave a review?", a: "After the guide marks your tour as Completed. You can leave one review per booking, with a rating from 1 to 5 stars and a comment." },
  { q: "How is payment handled?", a: "The platform does not process payments. The price shown is the guide's daily rate; agree on payment details with your guide through Messages before the tour." },
  { q: "How do I become a guide?", a: "Register as a Tour Guide, complete your profile (biography, languages, pricing, services, availability) and upload your credentials. Your profile becomes public once an administrator verifies it." },
  { q: "A guide or tourist behaved badly. What should I do?", a: "Use the Report button on their profile or in your bookings. Administrators review every report and can suspend accounts. If you are in danger, call 112 immediately." },
  { q: "I forgot which dates a guide is free.", a: "Open the guide's profile to see their next open dates, or use the Available on filter while searching." },
];

const GUIDES = [
  { title: "Tourists", steps: ["Register as a Tourist and log in.", "Search guides and apply filters.", "Open a profile, check reviews and availability.", "Send a booking request and track it in My bookings.", "Message your guide with questions.", "After the tour, leave a review."] },
  { title: "Tour guides", steps: ["Register as a Tour Guide.", "Complete your profile and set your open dates.", "Upload your credentials for verification.", "Accept or reject incoming requests on your dashboard.", "Mark tours as Completed so tourists can review you."] },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="Help and FAQ" subtitle="Answers to common questions, a short user guide and safety information for travelling in Rwanda." />

      <section aria-labelledby="faq" className="mb-10">
        <h2 id="faq" className="mb-3 text-2xl font-bold">Frequently asked questions</h2>
        <div className={`${card} divide-y divide-stone-200`}>
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <h3><button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-sans text-base font-semibold hover:bg-stone-50" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{f.q}<ChevronDown className={`size-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} /></button></h3>
              {open === i && <p className="px-5 pb-4 text-stone-700">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-bold">User guide</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {GUIDES.map((g) => (
            <div key={g.title} className={`${card} p-5`}>
              <h3 className="text-lg font-bold text-forest-900">{g.title}</h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-700">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="safety">
        <h2 id="safety" className="mb-3 text-2xl font-bold">Safety and emergency contacts</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-stone-700">
          <li>Share your guide's name and phone number with someone you trust before each tour.</li>
          <li>Only book guides with the Verified badge, and keep communication on the platform until you are comfortable.</li>
          <li>Follow park rules and your guide's safety briefing, especially during gorilla and chimpanzee treks.</li>
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          {EMERGENCY_CONTACTS.map((c) => (
            <a key={c.name} href={`tel:${c.tel}`} className={`${card} flex items-center justify-between gap-3 p-4 hover:bg-red-50`}>
              <span><span className="block font-semibold">{c.name}</span><span className="text-sm text-stone-600">{c.detail}</span></span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 font-bold text-white"><Phone className="size-4" /> {c.value}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
