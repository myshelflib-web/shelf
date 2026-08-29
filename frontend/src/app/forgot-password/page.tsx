"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ShelfLogo } from "@/components/ShelfLogo";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { api, ApiError } from "@/lib/api";
import { OtpDigitInput } from "@/components/OtpDigitInput";
import { isValidEmailFormat } from "@/lib/email";
import {
  otpResendLabel,
  useOtpResendCooldown,
} from "@/hooks/useOtpResendCooldown";

type Step = "email" | "reset";

function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { remaining, coolingDown, start } = useOtpResendCooldown();

  const sendCode = async () => {
    if (step === "reset" && coolingDown) return;
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    if (!isValidEmailFormat(email)) {
      setError("Enter a valid email address");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.auth.sendPasswordResetOtp(email.trim());
      setMessage(res.message);
      setStep("reset");
      start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
      if (err instanceof ApiError && err.retryAfterSec) {
        start(err.retryAfterSec);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit verification code");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(email.trim(), otp.trim(), newPassword);
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <ShelfLogo size={40} />
        </div>
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {step === "email"
            ? "We'll email you a verification code"
            : "Choose a new password"}
        </p>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
        {step === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
            >
              {sendingOtp ? "Sending…" : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Verification code
              </label>
              <OtpDigitInput
                value={otp}
                onChange={setOtp}
                disabled={loading || sendingOtp}
                autoFocus
              />
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={loading || sendingOtp || coolingDown}
                className="mt-2 text-sm text-[var(--accent)] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {otpResendLabel(sendingOtp, remaining)}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {message && (
              <p className="text-sm text-[var(--accent)] bg-[var(--accent-subtle)] px-3 py-2 rounded-lg">
                {message}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-secondary)]">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-4 py-8">
        <Suspense fallback={<ThinkingIndicator label="Loading" />}>
          <ForgotPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
