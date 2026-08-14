/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { authService } from "@/app/service/authService";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2 } from "lucide-react";
import { AuthResponse } from "@/app/types/auth";

const isAccessTokenExpired = (token: string | null) => {
  if (!token) return true;

  try {
    const [, payload] = token.split(".");
    if (!payload) return true;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile, user } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedNotice = window.sessionStorage.getItem("auth_redirect_reason");
    if (storedNotice) {
      setNotice(storedNotice);
      window.sessionStorage.removeItem("auth_redirect_reason");
    }
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("access_token");
    if (isAccessTokenExpired(token)) {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
      return;
    }

    if (!user) return;

    const destination = (() => {
      const directReturnUrl = searchParams.get("returnUrl");
      if (directReturnUrl && directReturnUrl.trim()) {
        return directReturnUrl.trim();
      }

      switch (user.role) {
        case "owner":
          return "/dashboard/landlord";
        case "renter":
          return "/dashboard/renter";
        default:
          return "/";
      }
    })();

    if (destination.startsWith("http://") || destination.startsWith("https://")) {
      window.location.assign(destination);
    } else {
      router.replace(destination);
    }
  }, [router, searchParams, user]);

  const resolvePostLoginDestination = (authResponse: AuthResponse) => {
    const directReturnUrl = searchParams.get("returnUrl");
    const fallbackReturnUrl = authResponse.return_url || authResponse.redirect_url;

    const normalizeDestination = (value: string | null | undefined) => {
      if (!value || !value.trim()) return null;

      const trimmedValue = value.trim();
      if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
        return trimmedValue;
      }

      const [pathPart] = trimmedValue.split("?");
      const queryString = trimmedValue.includes("?") ? trimmedValue.substring(trimmedValue.indexOf("?") + 1) : "";
      const queryParams = new URLSearchParams(queryString);
      const nestedReturnUrl = queryParams.get("returnUrl");

      if (nestedReturnUrl && nestedReturnUrl.trim()) {
        return nestedReturnUrl.trim();
      }

      if (pathPart && pathPart !== "/login") {
        return trimmedValue;
      }

      return null;
    };

    const destination = normalizeDestination(directReturnUrl) || normalizeDestination(fallbackReturnUrl);

    if (destination) {
      return destination;
    }

    switch (authResponse.user?.profile?.role) {
      case "owner":
        return "/dashboard/landlord";
      case "renter":
        return "/dashboard/renter";
      default:
        return "/";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await authService.login(formData);
      await refreshProfile();

      const destination = resolvePostLoginDestination(authResponse);
      if (destination.startsWith("http://") || destination.startsWith("https://")) {
        window.location.assign(destination);
      } else {
        router.push(destination);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--ink)] p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-[var(--ink-soft)]/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
      >
        <h1 className="font-display text-2xl font-semibold text-white mb-2">Welcome back</h1>
        <p className="text-slate-400 text-sm mb-8">
          Enter your credentials to access your account
        </p>

        {notice && (
          <div className="bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-[var(--amber)] p-3 rounded-xl text-sm mb-4">
            {notice}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            required
            className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>

        <button
          disabled={isLoading}
          className="w-full mt-8 bg-[var(--amber)] hover:bg-[var(--amber-soft)] py-4 rounded-xl font-semibold text-[var(--ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </main>
  );
}