import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "../../components/ui";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

/** Guards a group of routes: requires login and, optionally, one of the given roles. */
export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
