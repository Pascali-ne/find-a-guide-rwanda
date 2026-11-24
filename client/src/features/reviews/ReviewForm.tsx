import { Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, Field, Modal, btnPrimary, btnSecondary, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";

/** FR 10 - the API only accepts this for Completed bookings, once per booking. */
export default function ReviewForm({ bookingId, guideName, onClose, onDone }: { bookingId: string; guideName: string; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Please select a rating from 1 to 5 stars.");
    if (comment.trim().length < 5) return setError("Please write a short comment (at least 5 characters).");
    setBusy(true);
    setError("");
    try {
      await api.post("/api/reviews", { bookingId, rating, comment });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Review ${guideName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div>
          <span className="mb-1 block text-sm font-medium text-stone-700">Your rating</span>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button type="button" key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={rating === i} className="rounded p-0.5">
                <Star className={`size-8 ${i <= (hover || rating) ? "fill-sun-400 text-sun-500" : "text-stone-300"}`} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Your comment"><textarea rows={4} className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your tour? What stood out?" /></Field>
        <div className="flex gap-2"><button className={btnPrimary} disabled={busy}>{busy ? "Submitting..." : "Submit review"}</button><button type="button" className={btnSecondary} onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}
