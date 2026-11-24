import { Link } from "react-router-dom";
import { btnPrimary } from "../components/ui";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-forest-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">This page does not exist</h1>
      <p className="mt-2 text-stone-600">The link may be broken or the page may have moved.</p>
      <Link to="/" className={`${btnPrimary} mt-6`}>Back to the home page</Link>
    </div>
  );
}
