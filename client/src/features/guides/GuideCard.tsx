import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Stars, VerifiedBadge, card } from "../../components/ui";
import { formatRwf, formatUsd } from "../../lib/format";
import type { GuideSummary } from "./types";

export default function GuideCard({ guide: g }: { guide: GuideSummary }) {
  return (
    <Link to={`/guides/${g.id}`} className={`${card} group flex flex-col p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <Avatar name={g.fullName} url={g.photoUrl} size={64} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-forest-900 group-hover:underline">{g.fullName}</h2>
            {g.verificationStatus === "Verified" && <VerifiedBadge />}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-600"><MapPin className="size-3.5" /> {g.location}</p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <Stars value={g.averageRating} size={14} />
            <span className="text-stone-600">{g.reviewCount > 0 ? `${g.averageRating.toFixed(1)} (${g.reviewCount})` : "No reviews yet"}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-stone-800">{g.specialization}</p>
      <p className="mt-1 line-clamp-2 text-sm text-stone-600">{g.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {g.languages.map((l) => <span key={l} className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">{l}</span>)}
      </div>
      <div className="mt-auto flex items-end justify-between pt-4">
        <span className="text-xs text-stone-500">{g.experienceYears} years of experience</span>
        <span className="text-right"><span className="block font-display text-lg font-bold text-forest-800">{formatRwf(g.pricePerDayRwf)}</span><span className="text-xs text-stone-500">{formatUsd(g.pricePerDayUsd)} per day</span></span>
      </div>
    </Link>
  );
}
