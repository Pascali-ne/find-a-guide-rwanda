import { Phone, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { EMERGENCY_CONTACTS } from "../lib/format";
import { Modal } from "./ui";

/** NFR 6 / Section 2.6 - always visible emergency strip with a full contact list. */
export default function EmergencyBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="bg-red-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 text-sm">
          <span className="flex items-center gap-2"><ShieldAlert className="size-4" /> In an emergency, call <a href="tel:112" className="font-bold underline">112</a> (Rwanda National Police).</span>
          <button onClick={() => setOpen(true)} className="font-semibold underline underline-offset-2 hover:text-red-100">Emergency contacts</button>
        </div>
      </div>
      {open && (
        <Modal title="Emergency contacts in Rwanda" onClose={() => setOpen(false)}>
          <ul className="divide-y divide-stone-200">
            {EMERGENCY_CONTACTS.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-semibold">{c.name}</p><p className="text-sm text-stone-600">{c.detail}</p></div>
                <a href={`tel:${c.tel}`} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 font-bold text-white hover:bg-red-800"><Phone className="size-4" /> {c.value}</a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-600">For tourism information and official advice, visit <a className="font-semibold text-forest-700 underline" href="https://www.visitrwanda.com" target="_blank" rel="noreferrer">visitrwanda.com</a>. Always tell someone you trust where you are going and share your guide's details before a tour.</p>
        </Modal>
      )}
    </>
  );
}
