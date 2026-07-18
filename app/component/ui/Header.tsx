"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export const Header = () => {
  const { user, signOut } = useAuth();

  const getDashboardLink = (role?: string) => {
    console.log("User role:", role); // Debugging line
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
    <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">
            House<span className="text-teal-500">Padi</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Dashboard link is here */}
              <Link
                href={getDashboardLink(user.role)}
                className="text-sm text-teal-400 hover:text-teal-300 font-medium"
              >
                Dashboard
              </Link>
              <span className="text-sm text-slate-300">
                Hi, {user.full_name?.split(" ")[0]}
              </span>
              <div className="w-10 h-10 rounded-full bg-teal-900 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400">
                {user.full_name?.charAt(0)}
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
                className="text-sm bg-teal-600 px-4 py-2 rounded-xl text-white hover:bg-teal-500 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};