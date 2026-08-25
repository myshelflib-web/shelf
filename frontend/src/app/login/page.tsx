"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ShelfLogo } from "@/components/ShelfLogo";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { api } from "@/lib/api";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/my-content";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const { login, register, user, loading: authLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <ThinkingIndicator label="Loading" />;
  }

  if (user) {
    router.replace(nextPath);
    return null;
  }

  const resetRegisterOtp = () => {
    setOtp("");
    setOtpSent(false);
    setMessage("");
  };

  const handleSendOtp = async () => {
    setError("");
    setMessage("");
    if (!email.trim() || !name.trim() || password.length < 6) {
      setError("Enter name, email, and a password (min 6 characters) first");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.auth.sendRegisterOtp(email.trim(), name.trim());
      setOtpSent(true);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!otpSent) {
          await handleSendOtp();
          return;
        }
        if (!/^\d{6}$/.test(otp.trim())) {
          setError("Enter the 6-digit verification code");
          return;
        }
        await register(email, password, name, otp.trim());
      } else {
        await login(email, password);
      }
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <h1 className="text-2xl font-bold">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {isRegister
            ? otpSent
              ? "Enter the code we sent to your email"
              : "Create your study library"
            : "Sign in to continue learning"}
        </p>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  resetRegisterOtp();
                }}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetRegisterOtp();
              }}
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                resetRegisterOtp();
              }}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {isRegister && otpSent && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                placeholder="000000"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] tracking-[0.35em] font-mono text-center focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="mt-2 text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
              >
                {sendingOtp ? "Sending…" : "Resend code"}
              </button>
            </div>
          )}

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
            disabled={loading || sendingOtp}
            className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
          >
            {loading || sendingOtp
              ? "Please wait..."
              : isRegister
                ? otpSent
                  ? "Verify & Create Account"
                  : "Send verification code"
                : "Sign In"}
          </button>
        </form>

        {!isRegister && (
          <p className="text-center text-sm">
            <a href="/forgot-password" className="text-[var(--accent)] hover:underline">
              Forgot password?
            </a>
          </p>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--bg-secondary)] px-2 text-[var(--text-muted)]">
              or continue with
            </span>
          </div>
        </div>

        <GoogleSignInButton onError={setError} redirectTo={nextPath} />
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
            setMessage("");
            resetRegisterOtp();
          }}
          className="text-[var(--accent)] hover:underline"
        >
          {isRegister ? "Sign In" : "Register"}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <Suspense fallback={<ThinkingIndicator label="Loading" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
