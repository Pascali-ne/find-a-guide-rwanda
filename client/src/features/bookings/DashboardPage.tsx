import { Clock, ShieldCheck, UserCog, XCircle } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Alert, PageHeader, btnPrimary, btnSecondary } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";
import BookingList from "./BookingList";

/** Role-aware dashboard: Tourist bookings, Guide requests, Admin redirect. */
export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "Admin") return <Navigate to="/admin" replace />;

  if (user.role === "Tourist") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <PageHeader title="My bookings" subtitle={`Welcome back, ${user.fullName.split(" ")[0]}. Track your requests, message guides and review completed tours.`} action={<Link to="/guides" className={btnPrimary}>Find a guide</Link>} />
        <BookingList role="Tourist" />
      </div>
    );
  }

  const status = user.verificationStatus;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="Booking requests" subtitle="Accept or decline requests, and mark tours as completed so tourists can review you." action={<Link to="/guide/profile" className={btnSecondary}><UserCog className="size-4" /> Edit profile</Link>} />
      {status === "Pending" && <div className="mb-6"><Alert kind="warning"><span className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" /> Your profile is awaiting verification. It is not visible to tourists until an administrator approves it. <Link to="/guide/profile" className="font-semibold underline">Complete your profile and documents</Link>.</span></Alert></div>}
      {status === "Rejected" && <div className="mb-6"><Alert kind="error"><span className="flex items-start gap-2"><XCircle className="mt-0.5 size-4 shrink-0" /> Your verification was not approved{user.rejectionReason ? `: ${user.rejectionReason}` : "."} <Link to="/guide/profile" className="font-semibold underline">Update your documents</Link> to submit again.</span></Alert></div>}
      {status === "Verified" && <div className="mb-6"><Alert kind="success"><span className="flex items-center gap-2"><ShieldCheck className="size-4" /> Your profile is verified and visible to tourists.</span></Alert></div>}
      <BookingList role="Guide" />
    </div>
  );
}
