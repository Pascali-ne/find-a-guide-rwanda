import { Compass, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import NotificationBell from "../features/notifications/NotificationBell";
import EmergencyBanner from "./EmergencyBanner";
import { btnPrimary, btnSecondary } from "./ui";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-forest-100 text-forest-900" : "text-stone-700 hover:bg-forest-50"}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = (
    <>
      <NavLink to="/guides" className={navLink} onClick={close}>Find guides</NavLink>
      {user && <NavLink to={user.role === "Admin" ? "/admin" : "/dashboard"} className={navLink} onClick={close}>{user.role === "Admin" ? "Admin" : "Dashboard"}</NavLink>}
      {user && user.role !== "Admin" && <NavLink to="/messages" className={navLink} onClick={close}>Messages</NavLink>}
      <NavLink to="/faq" className={navLink} onClick={close}>Help &amp; FAQ</NavLink>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <EmergencyBanner />
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-forest-900" onClick={close}>
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-forest-600 text-white"><Compass className="size-5" /></span>
            Find a Guide <span className="text-forest-600">Rwanda</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">{links}</nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <span className="hidden text-sm font-medium text-stone-700 lg:block">{user.fullName}</span>
                <button className={`${btnSecondary} hidden sm:inline-flex`} onClick={() => { logout(); navigate("/"); }}><LogOut className="size-4" /> Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${btnSecondary} hidden sm:inline-flex`}>Log in</Link>
                <Link to="/register" className={btnPrimary}>Sign up</Link>
              </>
            )}
            <button className="rounded-md p-2 text-stone-700 hover:bg-stone-100 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-stone-200 px-4 py-3 md:hidden">
            {links}
            {user ? (
              <button className="rounded-md px-3 py-2 text-left text-sm font-semibold text-stone-700 hover:bg-forest-50" onClick={() => { close(); logout(); navigate("/"); }}>Log out</button>
            ) : (
              <NavLink to="/login" className={navLink} onClick={close}>Log in</NavLink>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="mt-16">
        <div className="imigongo" aria-hidden />
        <div className="bg-forest-900 text-forest-100">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
            <p>© {new Date().getFullYear()} Find a Guide Rwanda. Verified local guides for every corner of Rwanda.</p>
            <p className="flex gap-4"><Link to="/faq" className="underline">Help &amp; FAQ</Link><Link to="/register?role=guide" className="underline">Become a guide</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
