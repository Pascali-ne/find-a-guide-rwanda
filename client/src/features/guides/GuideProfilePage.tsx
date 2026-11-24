import { Briefcase, CalendarDays, Flag, Languages, MapPin, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Avatar, Spinner, Stars, VerifiedBadge, btnPrimary, btnSecondary, card } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { formatDate, formatRwf, formatUsd } from "../../lib/format";
import ReportUserModal from "../admin/ReportUserModal";
import { useAuth } from "../auth/AuthContext";
import BookingForm from "../bookings/BookingForm";
import ReviewList from "../reviews/ReviewList";
import type { GuideDetail } from "./types";

/** FR 6 - public guide profile with booking form and reviews. */
export default function GuideProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setGuide(null);
    api.get<{ guide: GuideDetail }>(`/api/guides/${id}`).then((r) => setGuide(r.guide)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-12"><Alert>{error}</Alert><Link to="/guides" className="mt-4 inline-block font-semibold text-forest-700 underline">Back to all guides</Link></div>;
  if (!guide) return <Spinner />;

  const isOwner = user?.id === guide.id;
  const upcoming = guide.availabilityDates.slice(0, 14);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {guide.verificationStatus !== "Verified" && <div className="mb-6"><Alert kind="warning">This profile is not public yet (status: {guide.verificationStatus}). Only you and administrators can see this page.</Alert></div>}
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section className={`${card} p-6`}>
            <div className="flex flex-wrap items-start gap-5">
              <Avatar name={guide.fullName} url={guide.photoUrl} size={96} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-forest-900">{guide.fullName}</h1>
                  {guide.verificationStatus === "Verified" && <VerifiedBadge />}
                </div>
                <p className="mt-1 text-lg text-stone-700">{guide.specialization}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-stone-600">
                  <span className="flex items-center gap-1"><MapPin className="size-4" /> {guide.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="size-4" /> {guide.experienceYears} years of experience</span>
                  <span className="flex items-center gap-2"><Stars value={guide.averageRating} /> {guide.reviewCount > 0 ? `${guide.averageRating.toFixed(1)} from ${guide.reviewCount} ${guide.reviewCount === 1 ? "review" : "reviews"}` : "No reviews yet"}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 border-t border-stone-200 pt-4">
              <span className="font-display text-2xl font-bold text-forest-800">{formatRwf(guide.pricePerDayRwf)}</span>
              <span className="text-stone-600">({formatUsd(guide.pricePerDayUsd)}) per day</span>
            </div>
          </section>

          <section><h2 className="mb-2 text-xl font-bold">About</h2><p className="max-w-prose whitespace-pre-line leading-relaxed text-stone-700">{guide.bio}</p></section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold"><Languages className="size-5 text-forest-600" /> Languages</h2>
            <div className="flex flex-wrap gap-2">{guide.languages.map((l) => <span key={l} className="rounded-full bg-forest-100 px-3 py-1 text-sm font-semibold text-forest-800">{l}</span>)}</div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">Services</h2>
            {guide.services.length === 0 ? <p className="text-stone-600">No services listed yet.</p> : <ul className="grid gap-2 sm:grid-cols-2">{guide.services.map((s) => <li key={s} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm">{s}</li>)}</ul>}
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold"><CalendarDays className="size-5 text-forest-600" /> Availability</h2>
            {upcoming.length === 0 ? <p className="text-stone-600">No open dates at the moment.</p> : (
              <>
                <p className="mb-2 text-sm text-stone-600">Next open dates ({guide.availabilityDates.length} open days in total):</p>
                <div className="flex flex-wrap gap-2">{upcoming.map((d) => <span key={d} className="rounded bg-white px-2.5 py-1 text-sm ring-1 ring-stone-300">{formatDate(d)}</span>)}</div>
              </>
            )}
          </section>

          <section><h2 className="mb-3 text-xl font-bold">Reviews</h2><ReviewList reviews={guide.reviews} /></section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {guide.verificationStatus === "Verified" && (!user ? (
            <div className={`${card} space-y-3 p-5`}>
              <h2 className="text-xl font-bold text-forest-900">Book this guide</h2>
              <p className="text-sm text-stone-600">Log in or create a tourist account to request a booking.</p>
              <Link to="/login" state={{ from: `/guides/${guide.id}` }} className={`${btnPrimary} w-full`}>Log in to book</Link>
              <Link to="/register" className={`${btnSecondary} w-full`}>Create account</Link>
            </div>
          ) : user.role === "Tourist" ? (
            <BookingForm guideId={guide.id} defaultDestination={guide.location} pricePerDayRwf={guide.pricePerDayRwf} availableDates={guide.availabilityDates} />
          ) : null)}

          {user && user.role !== "Admin" && !isOwner && guide.verificationStatus === "Verified" && (
            <div className="flex gap-2">
              {user.role === "Tourist" && <Link to={`/messages/${guide.id}`} className={`${btnSecondary} flex-1`}><MessageSquare className="size-4" /> Message</Link>}
              <button className={btnSecondary} onClick={() => setReporting(true)}><Flag className="size-4" /> Report</button>
            </div>
          )}
          {isOwner && <Link to="/guide/profile" className={`${btnSecondary} w-full`}>Edit my profile</Link>}
        </aside>
      </div>
      {reporting && <ReportUserModal userId={guide.id} userName={guide.fullName} onClose={() => setReporting(false)} />}
    </div>
  );
}
