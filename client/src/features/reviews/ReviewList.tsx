import { Stars, EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/format";
import type { GuideReview } from "../guides/types";

export default function ReviewList({ reviews }: { reviews: GuideReview[] }) {
  if (reviews.length === 0) return <EmptyState title="No reviews yet">Reviews appear here after a tourist completes a tour with this guide.</EmptyState>;
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><Stars value={r.rating} /><span className="text-sm font-semibold">{r.author}</span></div>
            <span className="text-xs text-stone-500">{formatDate(r.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm text-stone-700">{r.comment}</p>
        </li>
      ))}
    </ul>
  );
}
