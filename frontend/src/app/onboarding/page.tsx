"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ShelfLoading } from "@/components/ShelfLoading";
import {
  OnboardingWizard,
  safeNextPath,
} from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/onboarding";
import { destinationAfterSignIn, navigateAfterAuth } from "@/lib/postAuthNavigation";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigateAfterAuth(
        `/login?next=${encodeURIComponent("/onboarding")}`,
        (h) => router.replace(h)
      );
      return;
    }
    if (!needsOnboarding(user)) {
      void destinationAfterSignIn(nextPath).then((href) => {
        navigateAfterAuth(href, (h) => router.replace(h));
      });
    }
  }, [user, loading, router, nextPath]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ShelfLoading />
      </div>
    );
  }

  if (!needsOnboarding(user)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ShelfLoading label="Opening your library" />
      </div>
    );
  }

  return <OnboardingWizard nextPath={nextPath} />;
}

export default function OnboardingPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden onboarding-page">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <ShelfLoading />
            </div>
          }
        >
          <OnboardingContent />
        </Suspense>
      </main>
    </div>
  );
}
