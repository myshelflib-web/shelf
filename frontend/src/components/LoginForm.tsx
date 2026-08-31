"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/components/GoogleSignInButton";
import { useGoogleClientId } from "@/components/GoogleAuthProvider";
import { TelegramSignInButton } from "@/components/TelegramSignInButton";
import { isDevEnvironment } from "@/lib/userFacingError";
import { ShelfLogo } from "@/components/ShelfLogo";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { api, ApiError } from "@/lib/api";
import { OtpDigitInput } from "@/components/OtpDigitInput";
import { isValidEmailFormat } from "@/lib/email";
import {
  otpResendLabel,
  useOtpResendCooldown,
} from "@/hooks/useOtpResendCooldown";
import { needsOnboarding } from "@/lib/onboarding";
import { destinationAfterSignIn } from "@/lib/postAuthNavigation";

export function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/my-content";
  return raw;
}

export function LoginForm({
  nextPath: nextPathProp,
  embedded = false,
  title,
  subtitle,
}: {
  nextPath?: string;
  /** Overlay on a share link — stay on this URL after sign-in. */
  embedded?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [nextPath, setNextPath] = useState(nextPathProp ?? "/my-content");
  const { login, register, user } = useAuth();
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
  const [socialSigningIn, setSocialSigningIn] = useState(false);
  const [completingSignIn, setCompletingSignIn] = useState(false);
  const { remaining, coolingDown, start, clear } = useOtpResendCooldown();
  const googleClientId = useGoogleClientId();
  const googleFromServer =
    Boolean(googleClientId) && !googleClientId.includes("your-google-client-id");
  const handledAuthRef = useRef(false);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (nextPathProp) {
      setNextPath(safeNextPath(nextPathProp));
    } else {
      setNextPath(safeNextPath(params.get("next")));
    }
    if (params.get("register") === "1" || params.get("mode") === "register") {
      setIsRegister(true);
    }
  }, [nextPathProp]);

  useEffect(() => {
    if (!socialSigningIn && !user) {
      setCompletingSignIn(false);
    }
  }, [socialSigningIn, user]);

  const handleSocialSigningIn = (signingIn: boolean) => {
    setSocialSigningIn(signingIn);
    if (signingIn) setCompletingSignIn(true);
  };

  useEffect(() => {
    if (embedded || !user || handledAuthRef.current) return;
    handledAuthRef.current = true;
    let cancelled = false;
    void destinationAfterSignIn(nextPath).then((href) => {
      if (cancelled) return;
      if (needsOnboarding(user)) {
        router.replace(`/onboarding?next=${encodeURIComponent(href)}`);
        return;
      }
      router.replace(href);
    });
    return () => {
      cancelled = true;
    };
  }, [user, nextPath, router, embedded]);

  const resetRegisterOtp = () => {
    setOtp("");
    setOtpSent(false);
    setMessage("");
    clear();
  };

  const handleSendOtp = async () => {
    if (otpSent && coolingDown) return;
    setError("");
    setMessage("");
    if (!email.trim() || !name.trim() || password.length < 6) {
      setError("Enter name, email, and a password (min 6 characters) first");
      return;
    }
    if (!isValidEmailFormat(email)) {
      setError("Enter a valid email address");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.auth.sendRegisterOtp(email.trim(), name.trim());
      setOtpSent(true);
      setMessage(res.message);
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
        handledAuthRef.current = true;
        await register(email, password, name, otp.trim());
      } else {
        handledAuthRef.current = true;
        await login(email, password);
      }
      const dest = await destinationAfterSignIn(nextPath);
      if (isRegister) {
        router.push(`/onboarding?next=${encodeURIComponent(dest)}`);
        return;
      }
      if (!embedded) router.push(dest);
    } catch (err) {
      handledAuthRef.current = false;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const showGoogleSignIn =
    isGoogleSignInConfigured() || googleFromServer || isDevEnvironment();

  const socialRedirect = embedded
    ? nextPath
    : `/onboarding?next=${encodeURIComponent(nextPath)}`;

  const showSignInLoading =
    socialSigningIn || completingSignIn || (!embedded && Boolean(user));

  if (showSignInLoading) {
    const loadingLabel = socialSigningIn
      ? "Signing in"
      : user
        ? "Opening library"
        : "Loading";
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <ShelfLogo size={40} />
          </div>
          <ThinkingIndicator label={loadingLabel} className="justify-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <ShelfLogo size={40} />
        </div>
        <h1 className="text-2xl font-bold">
          {title ?? (isRegister ? "Create Account" : "Welcome Back")}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {subtitle ??
            (isRegister
              ? otpSent
                ? "Enter the code we sent to your email"
                : "Create your study library"
              : "Sign in to continue learning")}
        </p>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4 shadow-2xl">
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
                onClick={() => void handleSendOtp()}
                disabled={sendingOtp || coolingDown}
                className="mt-2 text-sm text-[var(--accent)] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {otpResendLabel(sendingOtp, remaining)}
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
            <a
              href="/forgot-password"
              className="text-[var(--accent)] hover:underline"
            >
              Forgot password?
            </a>
          </p>
        )}

        <>
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

          <div className="space-y-3 w-full">
            {showGoogleSignIn ? (
              <GoogleSignInButton
                onError={setError}
                redirectTo={socialRedirect}
                onSigningInChange={handleSocialSigningIn}
              />
            ) : null}
            <TelegramSignInButton
              onError={setError}
              redirectTo={socialRedirect}
              onSigningInChange={handleSocialSigningIn}
            />
          </div>
        </>
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
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
