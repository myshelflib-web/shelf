"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useGoogleClientId } from "@/components/GoogleAuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { resolveGoogleClientId } from "@/lib/publicConfig";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSocialSignInWidth } from "@/hooks/useSocialSignInWidth";

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
  /** Where to go after a successful Google sign-in. */
  redirectTo?: string;
  /** Fired when the Google credential exchange with Shelf is in progress. */
  onSigningInChange?: (signingIn: boolean) => void;
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function isGoogleSignInConfigured(): boolean {
  const clientId = resolveGoogleClientId();
  return Boolean(clientId) && !clientId.includes("your-google-client-id");
}

export function GoogleSignInButton({
  onError,
  redirectTo = "/my-content",
  onSigningInChange,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const { ref: containerRef, width: buttonWidth } = useSocialSignInWidth();
  const [loading, setLoading] = useState(false);
  const clientId = useGoogleClientId();

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.("Google sign-in failed");
      return;
    }

    setLoading(true);
    onSigningInChange?.(true);
    try {
      await loginWithGoogle(response.credential);
      router.push(redirectTo);
    } catch (err) {
      onSigningInChange?.(false);
      onError?.(
        toUserFacingError(
          err instanceof Error ? err.message : "Google sign-in failed",
          "Google sign-in failed"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!clientId || clientId.includes("your-google-client-id")) {
    if (!isDevEnvironment()) return null;
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-not-allowed"
        >
          <GoogleIcon />
          <span className="text-sm font-medium">Continue with Google</span>
        </button>
        <p className="text-xs text-center text-[var(--text-muted)]">
          Set{" "}
          <code className="text-[var(--accent)]">GOOGLE_CLIENT_ID</code> on Vercel
          (or <code className="text-[var(--accent)]">frontend/.env.local</code> locally)
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-10">
      {loading ? (
        <div className="w-full h-10 flex items-center justify-center text-sm text-[var(--text-muted)]">
          Signing in with Google...
        </div>
      ) : buttonWidth > 0 ? (
        <div className="flex w-full h-10 [&>div]:!w-full [&>div>div]:!w-full">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => onError?.("Google sign-in was cancelled or failed")}
            theme="filled_black"
            size="large"
            width={buttonWidth}
            text="continue_with"
            shape="rectangular"
          />
        </div>
      ) : null}
    </div>
  );
}
