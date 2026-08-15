/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useState } from "react";
import { authService } from "@/app/service/authService";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RegisterData } from "../types/auth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "renter",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(formData);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--ink)] p-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm bg-[var(--ink-soft)]/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
      >
        <h1 className="font-display text-2xl font-semibold text-white mb-2">Create account</h1>
        <p className="text-slate-400 text-sm mb-8">
          Join HousePadi to find your next home
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              required
              placeholder="First Name"
              className="w-1/2 bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <input
              required
              placeholder="Last Name"
              className="w-1/2 bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <input
            required
            placeholder="Phone Number"
            className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "renter" })}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                formData.role === "renter"
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Renter
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "owner" })}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                formData.role === "owner"
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Landlord
            </button>
          </div>

          <input
            type="email"
            required
            placeholder="Email address"
            className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button
          disabled={isLoading}
          className="w-full mt-8 bg-[var(--amber)] hover:bg-[var(--amber-soft)] py-4 rounded-xl font-semibold text-[var(--ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Complete registration"
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--amber)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}