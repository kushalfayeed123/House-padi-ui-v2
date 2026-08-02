"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export const Header = () => {
  const { user, signOut } = useAuth();

  const getDashboardLink = (role?: string) => {
    switch (role) {
      case "admin":
        return "/dashboard/admin";
      case "landlord":
        return "/dashboard/landlord";
      case "renter":
        return "/dashboard/renter";
      default:
        return "/";
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-(--ink)/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold text-white">
            House<span className="text-(--amber)">Padi</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href={getDashboardLink(user.role == 'owner' ? 'landlord' : user.role == 'renter' ? 'renter' : '/')}
                className="text-sm text-(--amber) hover:text-(--amber-soft) font-medium transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-sm text-slate-300 hidden sm:inline">
                Hi, {user.first_name?.split(" ")[0]}
              </span>
              <div className="w-10 h-10 rounded-full bg-(--amber)/10 border border-(--amber)/30 flex items-center justify-center font-mono-num font-semibold text-(--amber)">
                {user.first_name?.charAt(0)}
              </div>
              <button
                onClick={signOut}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-(--amber) hover:bg-(--amber-soft) px-4 py-2 rounded-xl text-(--ink) font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};