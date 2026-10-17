"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { apiClient } from "@/app/lib/api-client";

const errorMessage = (err: unknown): { status?: number; detail?: string } => {
  const response = (err as {
    response?: { status?: number; data?: { detail?: string } };
  })?.response;
  return { status: response?.status, detail: response?.data?.detail };
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const { status, detail } = errorMessage(err);
      if (status === 404 || status === 501) {
        setError(
          "Password reset isn't available yet. Email support@housepadi.com and we'll help you back into your account.",
        );
      } else {
        setError(
          detail || "We couldn't send the reset email right now. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--ink)] p-6">
      <div className="w-full max-w-sm bg-[var(--ink-soft)]/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[var(--amber)]">
              <MailCheck size={22} />
            </div>
            <h1 className="font-display text-xl font-semibold text-white">
              Check your inbox
            </h1>
            <p className="text-sm text-slate-400">
              If an account exists for {email}, we&apos;ve sent a link to reset
              your password. The link expires shortly, so use it soon.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--amber)] hover:underline"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold text-white">
                Reset your password
              </h1>
              <p className="text-slate-400 text-sm">
                Enter the email address you signed up with and we&apos;ll send
                you a reset link.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--amber)] hover:bg-[var(--amber-soft)] py-4 rounded-xl font-semibold text-[var(--ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Send reset link"
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Remembered it?{" "}
              <Link
                href="/login"
                className="text-[var(--amber)] hover:underline font-medium"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
