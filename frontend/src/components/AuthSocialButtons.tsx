"use client";

import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/components/GoogleSignInButton";
import { useGoogleClientId } from "@/components/GoogleAuthProvider";
import { TelegramSignInButton } from "@/components/TelegramSignInButton";
import { TermsAcceptClickCatcher } from "@/components/legal/TermsAcceptGate";
import { isDevEnvironment } from "@/lib/userFacingError";

export function AuthSocialButtons({
  gateTerms,
  onBlockedByTerms,
  redirectTo,
  onError,
  onSigningInChange,
}: {
  /** When true, intercept social clicks until terms are accepted. */
  gateTerms: boolean;
  onBlockedByTerms: () => void;
  redirectTo: string;
  onError: (message: string) => void;
  onSigningInChange: (signingIn: boolean) => void;
}) {
  const googleClientId = useGoogleClientId();
  const googleFromServer =
    Boolean(googleClientId) && !googleClientId.includes("your-google-client-id");
  const showGoogleSignIn =
    isGoogleSignInConfigured() || googleFromServer || isDevEnvironment();

  return (
    <div className="flex flex-col gap-3 w-full">
      {showGoogleSignIn ? (
        <div className="relative w-full">
          <GoogleSignInButton
            onError={onError}
            redirectTo={redirectTo}
            onSigningInChange={onSigningInChange}
          />
          <TermsAcceptClickCatcher
            active={gateTerms}
            onBlocked={onBlockedByTerms}
          />
        </div>
      ) : null}
      <div className="relative w-full">
        <TelegramSignInButton
          onError={onError}
          redirectTo={redirectTo}
          onSigningInChange={onSigningInChange}
        />
        <TermsAcceptClickCatcher
          active={gateTerms}
          onBlocked={onBlockedByTerms}
        />
      </div>
    </div>
  );
}
