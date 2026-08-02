/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { authService } from "@/app/service/authService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(formData);
      await refreshProfile();
      router.push("/");
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